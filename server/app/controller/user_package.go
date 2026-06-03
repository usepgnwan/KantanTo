package controller

import (
	"net/http"

	"github.com/labstack/echo/v4"
	. "server/app/helpers"
	"server/app/model"
	"server/connection"
)

// GetMyPackages godoc
// @Summary      Get user's packages
// @Description  Get all active packages for the authenticated user, including materials
// @Tags         User Package
// @Accept       json
// @Produce      json
// @Security     ApiKeyAuth
// @Param secret-to-apps header string true "API secret key" default(Z9ToSwagger1413999)
// @Router       /api/user/packages [get]
func GetMyPackages(c echo.Context) error {
	userID := c.QueryParam("user_id")
	if userID == "" {
		return c.JSON(http.StatusBadRequest, Response{Status: false, Message: "user_id tidak ditemukan"})
	}

	var transactions []model.Transaction
	
	// Query active transactions for the user
	if err := connection.DB.
		Preload("Package").
		Preload("Package.Materials").
		Where("user_id = ? AND status = ?", userID, "active").
		Find(&transactions).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, Response{Status: false, Message: "Gagal memuat paket saya"})
	}

	// Calculate progress for each transaction
	for i, tx := range transactions {
		totalMaterials := len(tx.Package.Materials)
		if totalMaterials == 0 {
			transactions[i].Progress = 0
			continue
		}

		var readCount int64
		connection.DB.Model(&model.UserMaterialProgress{}).
			Where("user_id = ? AND package_id = ?", userID, tx.PackageID).
			Count(&readCount)

		transactions[i].Progress = float64(readCount) / float64(totalMaterials) * 100
	}

	return c.JSON(http.StatusOK, Response{Status: true, Message: "Berhasil memuat paket saya", Data: transactions})
}
