package controller

import (
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/labstack/echo/v4"
	"gorm.io/gorm"
	. "server/app/helpers"
	"server/app/model"
	"server/connection"
)

// generate unique invoice code
func generateInvoiceCode() string {
	dateStr := time.Now().Format("20060102")
	bytes := make([]byte, 3) // 6 hex characters
	if _, err := rand.Read(bytes); err != nil {
		panic(err)
	}
	return fmt.Sprintf("INV/%s/%s", dateStr, strings.ToUpper(hex.EncodeToString(bytes)))
}

// Checkout godoc
// @Summary      Process Checkout
// @Description  Create a transaction for a package, handle vouchers and zero payment automatically
// @Tags         Checkout
// @Accept       json
// @Produce      json
// @Security     ApiKeyAuth
// @Param secret-to-apps header string true "API secret key" default(Z9ToSwagger1413999)
// @Router       /api/checkout [post]
func Checkout(c echo.Context) error {
	type CheckoutRequest struct {
		UserID      uint   `json:"user_id"`
		PackageSlug string `json:"package_slug"` // optional
		VoucherCode string `json:"voucher_code"` // optional
	}

	req := new(CheckoutRequest)
	if err := c.Bind(req); err != nil {
		return c.JSON(http.StatusBadRequest, Response{Status: false, Message: "Format data tidak valid"})
	}

	// Get Package
	var pkg model.Package
	if err := connection.DB.Where("slug = ?", req.PackageSlug).First(&pkg).Error; err != nil {
		return c.JSON(http.StatusNotFound, Response{Status: false, Message: "Paket tidak ditemukan"})
	}

	amount := pkg.Price

	// Check voucher
	var voucher *model.Voucher
	var discount float64 = 0
	if req.VoucherCode != "" {
		var v model.Voucher
		if err := connection.DB.Where("code = ?", req.VoucherCode).First(&v).Error; err == nil {
			if v.Status == "active" && v.Used < v.Limit {
				// Check usage
				var usage model.VoucherUsage
				if err := connection.DB.Where("voucher_id = ? AND user_id = ?", v.ID, req.UserID).First(&usage).Error; err != nil { 
					// record not found means not used yet
					voucher = &v
					if v.Type == "percentage" {
						discount = amount * (v.Value / 100.0)
					} else {
						discount = v.Value
					}
				}
			}
		}
	}

	finalAmount := amount - discount
	if finalAmount < 0 {
		finalAmount = 0
	}
	
	// Add tax 11%
	finalAmount = finalAmount + (finalAmount * 0.11)

	tx := connection.DB.Begin()

	var invoiceCode string
	for {
		invoiceCode = generateInvoiceCode()
		var count int64
		tx.Model(&model.Transaction{}).Where("invoice_code = ?", invoiceCode).Count(&count)
		if count == 0 {
			break
		}
	}

	dateStr := time.Now().Format("20060102")
	randomBytes := make([]byte, 2)
	rand.Read(randomBytes)
	orderID := fmt.Sprintf("KTN-%s-%s", dateStr, strings.ToUpper(hex.EncodeToString(randomBytes)))

	status := "pending payment"
	if finalAmount == 0 {
		status = "active"
	}
	
	var activeUntil *time.Time
	if status == "active" {
		t := time.Now().Add(time.Duration(pkg.Duration) * 24 * time.Hour)
		activeUntil = &t
	}

	var vId *uint
	if voucher != nil {
		vId = &voucher.ID
	}

	transaction := model.Transaction{
		InvoiceCode:   invoiceCode,
		OrderID:       orderID,
		UserID:        req.UserID,
		PackageID:     pkg.ID,
		VoucherID:     vId,
		Amount:        finalAmount,
		PaymentMethod: "qris",
		Status:        status,
		ActiveUntil:   activeUntil,
	}

	if err := tx.Create(&transaction).Error; err != nil {
		tx.Rollback()
		return c.JSON(http.StatusInternalServerError, Response{Status: false, Message: "Gagal membuat transaksi"})
	}

	if finalAmount == 0 && voucher != nil {
		usage := model.VoucherUsage{
			VoucherID: voucher.ID,
			OrderID:   orderID,
			UserID:    req.UserID,
			PackageID: pkg.ID,
			Amount:    discount,
			Date:      time.Now().Format("2006-01-02 15:04:05"),
		}
		if err := tx.Create(&usage).Error; err != nil {
			tx.Rollback()
			return c.JSON(http.StatusInternalServerError, Response{Status: false, Message: "Gagal mencatat pemakaian voucher"})
		}
		if err := tx.Model(&model.Voucher{}).Where("id = ?", voucher.ID).UpdateColumn("used", gorm.Expr("used + ?", 1)).Error; err != nil {
			tx.Rollback()
			return c.JSON(http.StatusInternalServerError, Response{Status: false, Message: "Gagal mengupdate kuota voucher"})
		}
		if voucher.Used + 1 >= voucher.Limit {
			tx.Model(&model.Voucher{}).Where("id = ?", voucher.ID).Update("status", "finished")
		}
	}

	tx.Commit()

	return c.JSON(http.StatusOK, Response{Status: true, Message: "Checkout berhasil diproses", Data: transaction})
}
