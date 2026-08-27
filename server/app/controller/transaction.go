package controller

import (
	"net/http"
	"time"
	"server/app/model"
	"server/connection"
	. "server/app/helpers"

	"github.com/labstack/echo/v4"
)

// GetAllTransactions
// @Summary Get all transactions
// @Description Get all transactions for admin
// @Tags Transaction
// @Produce json
// @Security ApiKeyAuth
// @Param secret-to-apps header string true "API secret key" default(Z9ToSwagger1413999)
// @Success 200 {object} Response
// @Router /api/admin/transactions [get]
func GetAllTransactions(c echo.Context) error {
	var transactions []model.Transaction
	if err := connection.DB.Preload("Package").Preload("User").Preload("Voucher").Order("created_at desc").Find(&transactions).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, Response{Status: false, Message: "Gagal memuat transaksi"})
	}

	return c.JSON(http.StatusOK, Response{Status: true, Message: "Berhasil memuat transaksi", Data: transactions})
}

// UpdateTransactionStatus
// @Summary Update transaction status
// @Description Update transaction status for admin
// @Tags Transaction
// @Accept json
// @Produce json
// @Security ApiKeyAuth
// @Param id path string true "Transaction ID"
// @Success 200 {object} Response
// @Router /api/admin/transactions/{id}/status [put]
func UpdateTransactionStatus(c echo.Context) error {
	id := c.Param("id")

	type StatusRequest struct {
		Status string `json:"status"` // 'active', 'pending payment', 'expired'
	}

	req := new(StatusRequest)
	if err := c.Bind(req); err != nil {
		return c.JSON(http.StatusBadRequest, Response{Status: false, Message: "Format data tidak valid"})
	}

	var transaction model.Transaction
	if err := connection.DB.Preload("Package").First(&transaction, id).Error; err != nil {
		return c.JSON(http.StatusNotFound, Response{Status: false, Message: "Transaksi tidak ditemukan"})
	}

	transaction.Status = req.Status
	if req.Status == "active" {
		if transaction.IsLifetime {
			transaction.ActiveUntil = nil
		} else {
			// Jika paket terbatas waktu, set ActiveUntil
			durationDays := 30 // Default fallback
			if transaction.Package.ValidityDays > 0 {
				durationDays = transaction.Package.ValidityDays
			}
			t := time.Now().AddDate(0, 0, durationDays)
			transaction.ActiveUntil = &t
		}
	} else if req.Status == "pending payment" {
		transaction.ActiveUntil = nil
	}

	if err := connection.DB.Save(&transaction).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, Response{Status: false, Message: "Gagal me-update status transaksi"})
	}

	return c.JSON(http.StatusOK, Response{Status: true, Message: "Status transaksi berhasil diperbarui", Data: transaction})
}

