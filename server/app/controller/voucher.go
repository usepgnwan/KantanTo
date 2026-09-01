package controller

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"strings"

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
	if vouchers, ok := result.Rows.([]model.Voucher); ok {
		for i := range vouchers {
			vouchers[i].PopulateApplicablePackages()
			if len(vouchers[i].ApplicablePackageIDs) > 0 {
				connection.DB.Model(&model.Package{}).
					Where("id IN ?", vouchers[i].ApplicablePackageIDs).
					Select("id, title, slug").
					Scan(&vouchers[i].ApplicablePackages)
			}
		}
		result.Rows = vouchers
	}

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
	voucher.PopulateApplicablePackages()
	if len(voucher.ApplicablePackageIDs) > 0 {
		connection.DB.Model(&model.Package{}).
			Where("id IN ?", voucher.ApplicablePackageIDs).
			Select("id, title, slug").
			Scan(&voucher.ApplicablePackages)
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
	
	if voucher.ApplicablePackageIDs != nil {
		bytes, err := json.Marshal(voucher.ApplicablePackageIDs)
		if err == nil {
			voucher.ApplicablePackagesJSON = string(bytes)
		}
	} else if voucher.ApplicablePackagesJSON == "" {
		voucher.ApplicablePackagesJSON = "[]"
	}

	if err := connection.DB.Create(&voucher).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, Response{Status: false, Message: "Gagal menyimpan data"})
	}
	voucher.PopulateApplicablePackages()
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

	if voucher.ApplicablePackageIDs != nil {
		bytes, err := json.Marshal(voucher.ApplicablePackageIDs)
		if err == nil {
			voucher.ApplicablePackagesJSON = string(bytes)
		}
	}

	connection.DB.Save(&voucher)
	voucher.PopulateApplicablePackages()
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
// @Description  Validate and apply a voucher code for a specific user and optional package
// @Tags         Voucher
// @Accept       json
// @Produce      json
// @Security     ApiKeyAuth
// @Param secret-to-apps header string true "API secret key" default(Z9ToSwagger1413999)
// @Router       /api/vouchers/apply [post]
func ApplyVoucher(c echo.Context) error {
	type ApplyRequest struct {
		Code         string   `json:"code"`
		UserID       uint     `json:"user_id"`
		PackageSlug  string   `json:"package_slug"`
		PackageSlugs []string `json:"package_slugs"`
		PackageID    uint     `json:"package_id"`
		PackageIDs   []uint   `json:"package_ids"`
	}
	req := new(ApplyRequest)
	if err := c.Bind(req); err != nil {
		return c.JSON(http.StatusBadRequest, Response{Status: false, Message: "Format data tidak valid"})
	}

	var voucher model.Voucher
	if err := connection.DB.Where("code = ?", req.Code).First(&voucher).Error; err != nil {
		return c.JSON(http.StatusNotFound, Response{Status: false, Message: "Voucher tidak ditemukan"})
	}
	voucher.PopulateApplicablePackages()

	if voucher.Status != "active" {
		return c.JSON(http.StatusBadRequest, Response{Status: false, Message: "Voucher tidak aktif atau sudah kadaluarsa"})
	}

	if voucher.Used >= voucher.Limit {
		return c.JSON(http.StatusBadRequest, Response{Status: false, Message: "Kuota penggunaan voucher telah habis"})
	}

	// Validate applicable package if restricted
	if len(voucher.ApplicablePackageIDs) > 0 {
		var allSlugs []string
		if req.PackageSlug != "" {
			allSlugs = append(allSlugs, req.PackageSlug)
		}
		if len(req.PackageSlugs) > 0 {
			allSlugs = append(allSlugs, req.PackageSlugs...)
		}

		var allIDs []uint
		if req.PackageID > 0 {
			allIDs = append(allIDs, req.PackageID)
		}
		if len(req.PackageIDs) > 0 {
			allIDs = append(allIDs, req.PackageIDs...)
		}

		// Parse any numeric ID string in slugs
		for _, s := range allSlugs {
			if s != "" {
				if idNum, err := strconv.Atoi(s); err == nil && idNum > 0 {
					allIDs = append(allIDs, uint(idNum))
				}
			}
		}

		// Resolve slugs to package IDs from database
		if len(allSlugs) > 0 {
			var pkgIDs []uint
			connection.DB.Model(&model.Package{}).Where("slug IN ?", allSlugs).Pluck("id", &pkgIDs)
			allIDs = append(allIDs, pkgIDs...)
		}

		if len(allIDs) == 0 {
			return c.JSON(http.StatusBadRequest, Response{Status: false, Message: "Voucher ini hanya berlaku untuk paket tertentu"})
		}

		matched := false
		for _, targetID := range allIDs {
			if voucher.IsApplicableToPackage(targetID) {
				matched = true
				break
			}
		}

		if !matched {
			var pkgs []model.Package
			connection.DB.Select("id, title").Where("id IN ?", voucher.ApplicablePackageIDs).Find(&pkgs)
			var titles []string
			for _, p := range pkgs {
				titles = append(titles, p.Title)
			}
			if len(titles) > 0 {
				return c.JSON(http.StatusBadRequest, Response{
					Status:  false,
					Message: fmt.Sprintf("Voucher ini hanya berlaku untuk: %s", strings.Join(titles, ", ")),
				})
			}
			return c.JSON(http.StatusBadRequest, Response{Status: false, Message: "Voucher tidak berlaku untuk paket ini"})
		}
	}

	var usage model.VoucherUsage
	if err := connection.DB.Where("voucher_id = ? AND user_id = ?", voucher.ID, req.UserID).First(&usage).Error; err == nil {
		return c.JSON(http.StatusBadRequest, Response{Status: false, Message: "Voucher sudah pernah digunakan oleh akun ini"})
	}

	// Populate package details in voucher response
	if len(voucher.ApplicablePackageIDs) > 0 {
		connection.DB.Model(&model.Package{}).
			Where("id IN ?", voucher.ApplicablePackageIDs).
			Select("id, title, slug").
			Scan(&voucher.ApplicablePackages)
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

// GetVoucherUsageHistory godoc
// @Summary      Get Voucher Usage History
// @Description  Get usage history of a specific voucher
// @Tags         Voucher
// @Accept       json
// @Produce      json
// @Security     ApiKeyAuth
// @Param        id   path      int  true  "Voucher ID"
// @Param secret-to-apps header string true "API secret key" default(Z9ToSwagger1413999)
// @Router       /api/vouchers/{id}/usage [get]
func GetVoucherUsageHistory(c echo.Context) error {
	id := c.Param("id")
	var usages []model.VoucherUsage
	if err := connection.DB.Preload("User").Preload("Package").Where("voucher_id = ?", id).Order("created_at desc").Find(&usages).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, Response{Status: false, Message: "Gagal memuat riwayat voucher"})
	}

	return c.JSON(http.StatusOK, Response{Status: true, Message: "Berhasil memuat riwayat voucher", Data: usages})
}
