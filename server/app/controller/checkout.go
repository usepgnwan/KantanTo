package controller

import (
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"net/http"
	"os"
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

	// Check if user already has an active and valid transaction for this package
	var existingCount int64
	connection.DB.Model(&model.Transaction{}).
		Where("user_id = ? AND package_id = ? AND status = ?", req.UserID, pkg.ID, "active").
		Where("(is_lifetime = ? OR active_until > ?)", true, time.Now()).
		Where("(max_exam_attempts = 0 OR used_exam_attempts < max_exam_attempts)").
		Count(&existingCount)

	if existingCount > 0 {
		return c.JSON(http.StatusBadRequest, Response{Status: false, Message: "Anda sudah memiliki paket aktif ini. Silakan langsung belajar."})
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

	// Get Setting for PPN
	var setting model.Setting
	connection.DB.First(&setting)
	ppn := setting.Ppn

	finalAmount := amount - discount
	if finalAmount < 0 {
		finalAmount = 0
	}
	
	// Add PPN
	var ppnAmount float64 = 0
	if ppn > 0 {
		ppnAmount = finalAmount * (ppn / 100.0)
		finalAmount = finalAmount + ppnAmount
	}

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
		if !pkg.IsLifetime {
			durationDays := 30
			if pkg.ValidityDays > 0 {
				durationDays = pkg.ValidityDays
			}
			t := time.Now().AddDate(0, 0, durationDays)
			activeUntil = &t
		}
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
		IsLifetime:    pkg.IsLifetime,
		MaxExamAttempts: pkg.MaxExamAttempts,
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

	// Send email notification to Admin asynchronously
	go func() {
		receiver := os.Getenv("MAIL_RECEIVER")
		if receiver != "" {
			var user model.User
			if err := connection.DB.Where("id = ?", req.UserID).First(&user).Error; err == nil {
				subject := fmt.Sprintf("Pesanan Baru: %s", pkg.Title)
				voucherText := "-"
				if discount > 0 {
					voucherText = fmt.Sprintf("Rp %.0f", discount)
				}
				
				ppnText := ""
				if ppnAmount > 0 {
					ppnText = fmt.Sprintf("<li><b>PPN (%.0f%%):</b> Rp %.0f</li>", ppn, ppnAmount)
				}

				body := fmt.Sprintf(`
					<html>
					<body>
						<h2>Halo Admin, ada pesanan baru masuk!</h2>
						<p><b>Informasi Pesanan:</b></p>
						<ul>
							<li><b>Nama Pembeli:</b> %s</li>
							<li><b>Email Pembeli:</b> %s</li>
							<li><b>Paket Dibeli:</b> %s</li>
							<li><b>Harga Paket:</b> Rp %.0f</li>
							<li><b>Diskon Voucher:</b> %s</li>
							%s
							<li><b>Total Dibayar:</b> Rp %.0f</li>
							<li><b>Tanggal Pembelian:</b> %s</li>
						</ul>
						<p>Silakan periksa dashboard untuk detail lebih lanjut.</p>
					</body>
					</html>
				`, user.Name, user.Email, pkg.Title, amount, voucherText, ppnText, finalAmount, time.Now().Format("02 Jan 2006 15:04:05"))
				
				_ = SendEmail(receiver, subject, body)
			}
		}
	}()

	return c.JSON(http.StatusOK, Response{Status: true, Message: "Checkout berhasil diproses", Data: transaction})
}
