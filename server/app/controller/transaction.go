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
		Status   string `json:"status"` // 'active', 'pending payment', 'cancelled', 'expired'
		AllGroup *bool  `json:"all_group"` // optional, default true if in same invoice_group
	}

	req := new(StatusRequest)
	if err := c.Bind(req); err != nil {
		return c.JSON(http.StatusBadRequest, Response{Status: false, Message: "Format data tidak valid"})
	}

	var transaction model.Transaction
	if err := connection.DB.Preload("Package").First(&transaction, id).Error; err != nil {
		return c.JSON(http.StatusNotFound, Response{Status: false, Message: "Transaksi tidak ditemukan"})
	}

	updateAll := true
	if req.AllGroup != nil {
		updateAll = *req.AllGroup
	}

	var transactionsToUpdate []model.Transaction
	if updateAll {
		if transaction.InvoiceGroup != "" {
			connection.DB.Preload("Package").Where("invoice_group = ?", transaction.InvoiceGroup).Find(&transactionsToUpdate)
		} else if transaction.OrderID != "" {
			connection.DB.Preload("Package").Where("order_id = ?", transaction.OrderID).Find(&transactionsToUpdate)
		}
	}
	if len(transactionsToUpdate) == 0 {
		transactionsToUpdate = append(transactionsToUpdate, transaction)
	}

	for _, tx := range transactionsToUpdate {
		tx.Status = req.Status
		if req.Status == "active" {
			if tx.IsLifetime {
				tx.ActiveUntil = nil
			} else {
				durationDays := 30
				if tx.Package.ValidityDays > 0 {
					durationDays = tx.Package.ValidityDays
				}
				t := time.Now().AddDate(0, 0, durationDays)
				tx.ActiveUntil = &t
			}
		} else {
			tx.ActiveUntil = nil
		}
		_ = connection.DB.Save(&tx)
	}

	return c.JSON(http.StatusOK, Response{Status: true, Message: "Status transaksi berhasil diperbarui", Data: transaction})
}

