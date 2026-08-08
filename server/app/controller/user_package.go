package controller

import (
	"encoding/json"
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

	statusFilter := c.QueryParam("status")
	search := c.QueryParam("search")
	mapelID := c.QueryParam("mapel_id")

	var transactions []model.Transaction
	
	query := connection.DB.
		Preload("Package").
		Preload("Package.Materials").
		Where("transactions.user_id = ?", userID)

	if statusFilter != "" && statusFilter != "all" {
		query = query.Where("transactions.status = ?", statusFilter)
	} else if statusFilter == "" {
		query = query.Where("transactions.status = ?", "active")
	}

	if search != "" || (mapelID != "" && mapelID != "all") {
		query = query.Joins("JOIN packages ON packages.id = transactions.package_id")
	}

	if search != "" {
		query = query.Where("(packages.title LIKE ? OR packages.description LIKE ?)", "%"+search+"%", "%"+search+"%")
	}

	if mapelID != "" && mapelID != "all" {
		var m model.Mapel
		if err := connection.DB.First(&m, mapelID).Error; err == nil {
			query = query.Where("(packages.subjects_json LIKE ? OR packages.category = ?)", "%"+m.Title+"%", m.Title)
		}
	}

	// Query transactions for the user
	if err := query.Find(&transactions).Error; err != nil {
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

// GetMyMapels godoc
// @Summary      Get distinct mapels from user's active packages
// @Description  Get list of mapels associated with packages owned by user
// @Tags         User Package
// @Accept       json
// @Produce      json
// @Security     ApiKeyAuth
// @Param secret-to-apps header string true "API secret key" default(Z9ToSwagger1413999)
// @Router       /api/user/mapels [get]
func GetMyMapels(c echo.Context) error {
	userID := c.QueryParam("user_id")
	if userID == "" {
		return c.JSON(http.StatusBadRequest, Response{Status: false, Message: "user_id tidak ditemukan"})
	}

	var packages []model.Package
	if err := connection.DB.
		Joins("JOIN transactions ON transactions.package_id = packages.id").
		Where("transactions.user_id = ? AND transactions.status = ?", userID, "active").
		Find(&packages).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, Response{Status: false, Message: "Gagal memuat mata pelajaran"})
	}

	// Extract unique subject names from owned packages
	subjectSet := make(map[string]bool)
	for _, pkg := range packages {
		var subjects []string
		if pkg.SubjectsJSON != "" {
			json.Unmarshal([]byte(pkg.SubjectsJSON), &subjects)
		}
		for _, s := range subjects {
			if s != "" {
				subjectSet[s] = true
			}
		}
	}

	var titles []string
	for title := range subjectSet {
		titles = append(titles, title)
	}

	var mapels []model.Mapel
	if len(titles) > 0 {
		connection.DB.Where("title IN ?", titles).Order("title asc").Find(&mapels)
	} else {
		mapels = []model.Mapel{}
	}

	return c.JSON(http.StatusOK, Response{Status: true, Message: "Berhasil memuat list mata pelajaran", Data: mapels})
}

