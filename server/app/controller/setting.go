package controller

import (
	"net/http"
	. "server/app/helpers"
	"server/app/model"
	"server/connection"

	"github.com/labstack/echo/v4"
)

// GetSetting godoc
// @Summary      Get Application Setting
// @Description  Get setting configuration. If not exist, generates a default.
// @Tags         Setting
// @Accept       json
// @Produce      json
// @Security     ApiKeyAuth
// @Success      200  {object}  Response
// @Failure      500  {object}  Response
// @Param secret-to-apps header string true "API secret key" default(Z9ToSwagger1413999)
// @Router       /api/setting [get]
func GetSetting(c echo.Context) error {
	var setting model.Setting
	if err := connection.DB.First(&setting).Error; err != nil {
		// Jika belum ada row setting, mari kita inisiasi default setting
		setting = model.Setting{
			NamaAplikasi: "Kantan Tryout",
			Deskripsi:    "Platform tryout SNBT pilihan nomor satu untuk pejuang PTN.",
			NoWa:         "081234567890",
			Email:        "halo@kantan.id",
			Alamat:       "Jl. Pendidikan No. 123, Jakarta Selatan, DKI Jakarta",
		}
		if createErr := connection.DB.Create(&setting).Error; createErr != nil {
			return c.JSON(http.StatusInternalServerError, Response{Status: false, Message: "Gagal membuat default setting"})
		}
	}
	return c.JSON(http.StatusOK, Response{Status: true, Message: "Success", Data: setting})
}

// UpdateSetting godoc
// @Summary      Update Application Setting
// @Description  Update the first and only row of application setting
// @Tags         Setting
// @Accept       json
// @Produce      json
// @Security     ApiKeyAuth
// @Param        request body model.Setting true "Setting Payload"
// @Success      200  {object}  Response
// @Failure      400  {object}  Response
// @Failure      404  {object}  Response
// @Param secret-to-apps header string true "API secret key" default(Z9ToSwagger1413999)
// @Router       /api/setting [put]
func UpdateSetting(c echo.Context) error {
	var setting model.Setting
	if err := connection.DB.First(&setting).Error; err != nil {
		return c.JSON(http.StatusNotFound, Response{Status: false, Message: "Konfigurasi sistem belum dibuat"})
	}

	if err := c.Bind(&setting); err != nil {
		return c.JSON(http.StatusBadRequest, Response{Status: false, Message: err.Error()})
	}

	if err := connection.DB.Save(&setting).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, Response{Status: false, Message: "Gagal menyimpan perubahan"})
	}

	return c.JSON(http.StatusOK, Response{Status: true, Message: "Updated successfully", Data: setting})
}
