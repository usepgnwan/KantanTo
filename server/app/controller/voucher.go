package controller

import (
	"net/http"
	"strconv"
	"gorm.io/gorm"
	. "server/app/helpers"
	"server/app/model"
	"server/connection"

	"github.com/labstack/echo/v4"
)

// GetVouchers godoc
// @Summary      Get all Vouchers (Paginated)
// @Description  Get a paginated list of Vouchers
// @Tags         Voucher
// @Accept       json
// @Produce      json
// @Security     ApiKeyAuth
// @Param secret-to-apps header string true "API secret key" default(Z9ToSwagger1413999)
// @Router       /api/vouchers [get]
func GetVouchers(c echo.Context) error {
	data := &Paginate{
		Model: &model.Voucher{},
	}
	db := connection.DB
	query := db.Model(&model.Voucher{})

	code := c.QueryParam("code")
	if code != "" {
		query = query.Where("code ILIKE ?", "%"+code+"%")
	}

	result := data.Paginate(query, c)
	return c.JSON(http.StatusOK, Response{Status: true, Message: "Success get data", Data: result})
}

// GetVoucherByID godoc
// @Summary      Get Voucher by ID
// @Description  Get specific Voucher by its ID
// @Tags         Voucher
// @Accept       json
// @Produce      json
// @Security     ApiKeyAuth
// @Param        id   path      int  true  "Voucher ID"
// @Param secret-to-apps header string true "API secret key" default(Z9ToSwagger1413999)
// @Router       /api/vouchers/{id} [get]
func GetVoucherByID(c echo.Context) error {
	id := c.Param("id")
	var voucher model.Voucher
	if err := connection.DB.First(&voucher, id).Error; err != nil {
		return c.JSON(http.StatusNotFound, Response{Status: false, Message: "Data tidak ditemukan"})
	}
	return c.JSON(http.StatusOK, Response{Status: true, Message: "Success", Data: voucher})
}

// CreateVoucher godoc
// @Summary      Create new Voucher
// @Description  Create a new voucher
// @Tags         Voucher
// @Accept       json
// @Produce      json
// @Security     ApiKeyAuth
// @Param secret-to-apps header string true "API secret key" default(Z9ToSwagger1413999)
// @Router       /api/vouchers [post]
func CreateVoucher(c echo.Context) error {
	voucher := new(model.Voucher)
	if err := c.Bind(voucher); err != nil {
		return c.JSON(http.StatusBadRequest, Response{Status: false, Message: err.Error()})
	}
	
	// Default status
	if voucher.Status == "" {
		voucher.Status = "active"
	}

	// Check if code already exists
	var existing model.Voucher
	if err := connection.DB.Where("code = ?", voucher.Code).First(&existing).Error; err == nil {
		return c.JSON(http.StatusBadRequest, Response{Status: false, Message: "Kode voucher sudah digunakan"})
	}
	
	if err := connection.DB.Create(&voucher).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, Response{Status: false, Message: "Gagal menyimpan data"})
	}
	return c.JSON(http.StatusCreated, Response{Status: true, Message: "Created successfully", Data: voucher})
}

// UpdateVoucher godoc
// @Summary      Update Voucher
// @Description  Update Voucher by ID
// @Tags         Voucher
// @Accept       json
// @Produce      json
// @Security     ApiKeyAuth
// @Param        id   path      int  true  "Voucher ID"
// @Param secret-to-apps header string true "API secret key" default(Z9ToSwagger1413999)
// @Router       /api/vouchers/{id} [put]
func UpdateVoucher(c echo.Context) error {
	id, _ := strconv.Atoi(c.Param("id"))
	var voucher model.Voucher
	if err := connection.DB.First(&voucher, id).Error; err != nil {
		return c.JSON(http.StatusNotFound, Response{Status: false, Message: "Data tidak ditemukan"})
	}
	
	if err := c.Bind(&voucher); err != nil {
		return c.JSON(http.StatusBadRequest, Response{Status: false, Message: err.Error()})
	}
	
	// Check if code already exists for another voucher
	var existing model.Voucher
	if err := connection.DB.Where("code = ? AND id != ?", voucher.Code, id).First(&existing).Error; err == nil {
		return c.JSON(http.StatusBadRequest, Response{Status: false, Message: "Kode voucher sudah digunakan oleh voucher lain"})
	}

	connection.DB.Save(&voucher)
	return c.JSON(http.StatusOK, Response{Status: true, Message: "Updated successfully", Data: voucher})
}

// DeleteVoucher godoc
// @Summary      Delete Voucher
// @Description  Delete Voucher by ID
// @Tags         Voucher
// @Accept       json
// @Produce      json
// @Security     ApiKeyAuth
// @Param        id   path      int  true  "Voucher ID"
// @Param secret-to-apps header string true "API secret key" default(Z9ToSwagger1413999)
// @Router       /api/vouchers/{id} [delete]
func DeleteVoucher(c echo.Context) error {
	id := c.Param("id")
	if err := connection.DB.Delete(&model.Voucher{}, id).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, Response{Status: false, Message: "Gagal menghapus data"})
	}
	return c.JSON(http.StatusOK, Response{Status: true, Message: "Deleted successfully"})
}

// ApplyVoucher godoc
// @Summary      Apply Voucher
// @Description  Validate and apply a voucher code for a specific user
// @Tags         Voucher
// @Accept       json
// @Produce      json
// @Security     ApiKeyAuth
// @Param secret-to-apps header string true "API secret key" default(Z9ToSwagger1413999)
// @Router       /api/vouchers/apply [post]
func ApplyVoucher(c echo.Context) error {
	type ApplyRequest struct {
		Code   string `json:"code"`
		UserID uint   `json:"user_id"`
	}
	req := new(ApplyRequest)
	if err := c.Bind(req); err != nil {
		return c.JSON(http.StatusBadRequest, Response{Status: false, Message: "Format data tidak valid"})
	}

	var voucher model.Voucher
	if err := connection.DB.Where("code = ?", req.Code).First(&voucher).Error; err != nil {
		return c.JSON(http.StatusNotFound, Response{Status: false, Message: "Voucher tidak ditemukan"})
	}

	if voucher.Status != "active" {
		return c.JSON(http.StatusBadRequest, Response{Status: false, Message: "Voucher tidak aktif atau sudah kadaluarsa"})
	}

	if voucher.Used >= voucher.Limit {
		return c.JSON(http.StatusBadRequest, Response{Status: false, Message: "Kuota penggunaan voucher telah habis"})
	}

	var usage model.VoucherUsage
	if err := connection.DB.Where("voucher_id = ? AND user_id = ?", voucher.ID, req.UserID).First(&usage).Error; err == nil {
		return c.JSON(http.StatusBadRequest, Response{Status: false, Message: "Voucher sudah pernah digunakan oleh akun ini"})
	}

	return c.JSON(http.StatusOK, Response{Status: true, Message: "Voucher berhasil diterapkan", Data: voucher})
}

// RecordVoucherUsage godoc
// @Summary      Record Voucher Usage
// @Description  Record usage of a voucher after a successful checkout
// @Tags         Voucher
// @Accept       json
// @Produce      json
// @Security     ApiKeyAuth
// @Param secret-to-apps header string true "API secret key" default(Z9ToSwagger1413999)
// @Router       /api/vouchers/record-usage [post]
func RecordVoucherUsage(c echo.Context) error {
	usage := new(model.VoucherUsage)
	if err := c.Bind(usage); err != nil {
		return c.JSON(http.StatusBadRequest, Response{Status: false, Message: "Format data tidak valid"})
	}

	tx := connection.DB.Begin()

	if err := tx.Create(&usage).Error; err != nil {
		tx.Rollback()
		return c.JSON(http.StatusInternalServerError, Response{Status: false, Message: "Gagal mencatat pemakaian voucher"})
	}

	if err := tx.Model(&model.Voucher{}).Where("id = ?", usage.VoucherID).UpdateColumn("used", gorm.Expr("used + ?", 1)).Error; err != nil {
		tx.Rollback()
		return c.JSON(http.StatusInternalServerError, Response{Status: false, Message: "Gagal mengupdate kuota voucher"})
	}

	// Update status dynamically if limit reached
	var voucher model.Voucher
	if err := tx.First(&voucher, usage.VoucherID).Error; err == nil {
		if voucher.Used >= voucher.Limit {
			tx.Model(&voucher).Update("status", "finished")
		}
	}

	tx.Commit()
	return c.JSON(http.StatusOK, Response{Status: true, Message: "Pemakaian voucher berhasil dicatat", Data: usage})
}
