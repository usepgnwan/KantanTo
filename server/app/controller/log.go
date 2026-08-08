package controller

import (
	"net/http"
	"server/app/model"
	"server/connection"

	"github.com/labstack/echo/v4"
)

type RecordLogRequest struct {
	Path   string `json:"path"`
	Label  string `json:"label"`
	Device string `json:"device"`
	UserID *uint  `json:"user_id"`
}

// RecordMenuLog godoc
// @Summary      Record Menu Log
// @Description  Record a click on the menu/navbar
// @Tags         Log
// @Accept       json
// @Produce      json
// @Security     ApiKeyAuth
// @Param        body body RecordLogRequest true "Log Data"
// @Param secret-to-apps header string true "API secret key" default(Z9ToSwagger1413999)
// @Router       /api/logs/menu [post]
func RecordMenuLog(c echo.Context) error {
	req := new(RecordLogRequest)
	if err := c.Bind(req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]interface{}{"status": false, "message": "Invalid request format"})
	}

	log := model.MenuLog{
		Path:   req.Path,
		Label:  req.Label,
		Device: req.Device,
		UserID: req.UserID,
	}

	if err := connection.DB.Create(&log).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]interface{}{"status": false, "message": "Failed to record log"})
	}

	return c.JSON(http.StatusCreated, map[string]interface{}{"status": true, "message": "Log recorded"})
}

// GetMenuLogs godoc
// @Summary      Get Menu Logs
// @Description  Get all menu click logs
// @Tags         Log
// @Accept       json
// @Produce      json
// @Security     ApiKeyAuth
// @Param secret-to-apps header string true "API secret key" default(Z9ToSwagger1413999)
// @Router       /api/logs/menu [get]
func GetMenuLogs(c echo.Context) error {
	var logs []model.MenuLog
	if err := connection.DB.Preload("User").Order("created_at desc").Find(&logs).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]interface{}{"status": false, "message": "Failed to fetch logs"})
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"status": true,
		"data":   logs,
	})
}
