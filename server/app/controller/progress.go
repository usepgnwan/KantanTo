package controller

import (
	"net/http"
	"server/app/model"
	"server/connection"

	"github.com/labstack/echo/v4"
)

func MarkMaterialAsRead(c echo.Context) error {
	type RequestBody struct {
		UserID     uint `json:"user_id" validate:"required"`
		PackageID  uint `json:"package_id" validate:"required"`
		MaterialID uint `json:"material_id" validate:"required"`
	}

	var req RequestBody
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]interface{}{
			"status":  false,
			"message": "Invalid request body",
		})
	}

	// Verify the package and material actually exist
	var pkg model.Package
	if err := connection.DB.First(&pkg, req.PackageID).Error; err != nil {
		return c.JSON(http.StatusNotFound, map[string]interface{}{
			"status":  false,
			"message": "Package not found",
		})
	}

	var material model.PackageMaterial
	if err := connection.DB.First(&material, req.MaterialID).Error; err != nil {
		return c.JSON(http.StatusNotFound, map[string]interface{}{
			"status":  false,
			"message": "Material not found",
		})
	}

	// Check if record exists
	var existing model.UserMaterialProgress
	if err := connection.DB.Where("user_id = ? AND material_id = ?", req.UserID, req.MaterialID).First(&existing).Error; err == nil {
		// Already marked as read
		return c.JSON(http.StatusOK, map[string]interface{}{
			"status":  true,
			"message": "Material already marked as read",
		})
	}

	// Create new record
	newProgress := model.UserMaterialProgress{
		UserID:     req.UserID,
		PackageID:  req.PackageID,
		MaterialID: req.MaterialID,
	}

	if err := connection.DB.Create(&newProgress).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]interface{}{
			"status":  false,
			"message": "Failed to mark material as read",
		})
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"status":  true,
		"message": "Material marked as read",
	})
}
