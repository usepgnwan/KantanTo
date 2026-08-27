package controller

import (
	"net/http"
	"time"

	"github.com/labstack/echo/v4"
	. "server/app/helpers"
	"server/app/model"
	"server/connection"
)

// GetSchedules godoc
// @Summary      Get user schedules
// @Description  Get all schedules for user
// @Tags         Schedule
// @Accept       json
// @Produce      json
// @Security     ApiKeyAuth
// @Param secret-to-apps header string true "API secret key" default(Z9ToSwagger1413999)
// @Router       /api/user/schedules [get]
func GetSchedules(c echo.Context) error {
	userID := c.QueryParam("user_id")
	if userID == "" {
		return c.JSON(http.StatusBadRequest, Response{Status: false, Message: "user_id tidak ditemukan"})
	}

	var schedules []model.StudySchedule
	if err := connection.DB.Preload("Package").Where("user_id = ?", userID).Order("date ASC").Find(&schedules).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, Response{Status: false, Message: "Gagal memuat jadwal"})
	}

	return c.JSON(http.StatusOK, Response{Status: true, Message: "Berhasil memuat jadwal", Data: schedules})
}

// CreateSchedule godoc
// @Summary      Create schedule
// @Description  Create new study schedule
// @Tags         Schedule
// @Accept       json
// @Produce      json
// @Security     ApiKeyAuth
// @Param secret-to-apps header string true "API secret key" default(Z9ToSwagger1413999)
// @Router       /api/user/schedules [post]
func CreateSchedule(c echo.Context) error {
	type Request struct {
		UserID       uint   `json:"user_id"`
		Date         string `json:"date"` // YYYY-MM-DD
		Type         string `json:"type"` // latihan, reminder
		PackageID    *uint  `json:"package_id"`
		ReminderText string `json:"reminder_text"`
	}

	req := new(Request)
	if err := c.Bind(req); err != nil {
		return c.JSON(http.StatusBadRequest, Response{Status: false, Message: "Data tidak valid"})
	}

	if req.Type == "reminder" && len(req.ReminderText) > 300 {
		return c.JSON(http.StatusBadRequest, Response{Status: false, Message: "Reminder maksimal 300 karakter"})
	}

	parsedDate, err := time.Parse("2006-01-02", req.Date)
	if err != nil {
		return c.JSON(http.StatusBadRequest, Response{Status: false, Message: "Format tanggal tidak valid"})
	}

	schedule := model.StudySchedule{
		UserID:       req.UserID,
		Date:         parsedDate,
		Type:         req.Type,
		PackageID:    req.PackageID,
		ReminderText: req.ReminderText,
	}

	if err := connection.DB.Create(&schedule).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, Response{Status: false, Message: "Gagal membuat jadwal"})
	}
	
	if schedule.PackageID != nil {
		connection.DB.First(&schedule.Package, schedule.PackageID)
	}

	return c.JSON(http.StatusOK, Response{Status: true, Message: "Jadwal berhasil ditambahkan", Data: schedule})
}

// DeleteSchedule godoc
// @Summary      Delete schedule
// @Description  Delete study schedule
// @Tags         Schedule
// @Accept       json
// @Produce      json
// @Security     ApiKeyAuth
// @Param secret-to-apps header string true "API secret key" default(Z9ToSwagger1413999)
// @Param        id   path      string  true  "Schedule ID"
// @Router       /api/user/schedules/{id} [delete]
func DeleteSchedule(c echo.Context) error {
	id := c.Param("id")
	if err := connection.DB.Delete(&model.StudySchedule{}, id).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, Response{Status: false, Message: "Gagal menghapus jadwal"})
	}
	return c.JSON(http.StatusOK, Response{Status: true, Message: "Jadwal berhasil dihapus"})
}
