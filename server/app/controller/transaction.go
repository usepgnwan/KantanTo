package controller

import (
	"net/http"
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
