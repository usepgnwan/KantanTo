package controller

import (
	"net/http"
	. "server/app/helpers"
	"server/app/model"
	"server/connection"
	"strconv"

	"github.com/labstack/echo/v4"
)

// GetGrade godoc
// @Summary      Get all Grade (Paginated)
// @Description  Get a paginated list of Grade
// @Tags         Grade
// @Accept       json
// @Produce      json
// @Param        page    query     int     false  "Page number" default(1)
// @Param        limit   query     int     false  "Limit per page" default(10)
// @Param        title   query     string  false  "Search by title"
// @Security     ApiKeyAuth
// @Success      200  {object}  Response{data=helpers.ResponsePaginate}
// @Failure      500  {object}  Response
// @Param secret-to-apps header string true "API secret key" default(Z9ToSwagger1413999)
// @Router       /api/grade [get]
func GetGrade(c echo.Context) error {
	data := &Paginate{
		Model: &model.Grade{},
	}
	db := connection.DB
	query := db.Model(&model.Grade{})

	title := c.QueryParam("title")
	if title != "" {
		query = query.Where("title ILIKE ?", "%"+title+"%")
	}

	result := data.Paginate(query, c)
	return c.JSON(http.StatusOK, Response{Status: true, Message: "Success get data", Data: result})
}

// GetGradeByID godoc
// @Summary      Get Grade by ID
// @Description  Get specific Grade by its ID
// @Tags         Grade
// @Accept       json
// @Produce      json
// @Security     ApiKeyAuth
// @Param        id   path      int  true  "Category ID"
// @Success      200  {object}  Response
// @Failure      404  {object}  Response
// @Param secret-to-apps header string true "API secret key" default(Z9ToSwagger1413999)
// @Router       /api/grade/{id} [get]
func GetGradeByID(c echo.Context) error {
	id := c.Param("id")
	var Grade model.Grade
	if err := connection.DB.First(&Grade, id).Error; err != nil {
		return c.JSON(http.StatusNotFound, Response{Status: false, Message: "Data tidak ditemukan"})
	}
	return c.JSON(http.StatusOK, Response{Status: true, Message: "Success", Data: Grade})
}

// CreateGrade godoc
// @Summary      Create new Grade
// @Description  Create a new Grade
// @Tags         Grade
// @Accept       json
// @Produce      json
// @Security     ApiKeyAuth
// @Param        request body model.Category true "Category Payload"
// @Success      200  {object}  Response
// @Failure      400  {object}  Response
// @Param secret-to-apps header string true "API secret key" default(Z9ToSwagger1413999)
// @Router       /api/grade [post]
func CreateGrade(c echo.Context) error {
	Grade := new(model.Grade)
	if err := c.Bind(Grade); err != nil {
		return c.JSON(http.StatusBadRequest, Response{Status: false, Message: err.Error()})
	}
	if err := connection.DB.Create(&Grade).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, Response{Status: false, Message: "Gagal menyimpan data"})
	}
	return c.JSON(http.StatusCreated, Response{Status: true, Message: "Created successfully", Data: Grade})
}

// UpdateGrade godoc
// @Summary      Update Grade
// @Description  Update Grade by ID
// @Tags         Grade
// @Accept       json
// @Produce      json
// @Security     ApiKeyAuth
// @Param        id   path      int  true  "Category ID"
// @Param        request body model.Category true "Category Payload"
// @Success      200  {object}  Response
// @Failure      404  {object}  Response
// @Param secret-to-apps header string true "API secret key" default(Z9ToSwagger1413999)
// @Router       /api/grade/{id} [put]
func UpdateGrade(c echo.Context) error {
	id, _ := strconv.Atoi(c.Param("id"))
	var Grade model.Grade
	if err := connection.DB.First(&Grade, id).Error; err != nil {
		return c.JSON(http.StatusNotFound, Response{Status: false, Message: "Data tidak ditemukan"})
	}
	if err := c.Bind(&Grade); err != nil {
		return c.JSON(http.StatusBadRequest, Response{Status: false, Message: err.Error()})
	}
	connection.DB.Save(&Grade)
	return c.JSON(http.StatusOK, Response{Status: true, Message: "Updated successfully", Data: Grade})
}

// DeleteGrade godoc
// @Summary      Delete Grade
// @Description  Delete Grade by ID
// @Tags         Grade
// @Accept       json
// @Produce      json
// @Security     ApiKeyAuth
// @Param        id   path      int  true  "Category ID"
// @Success      200  {object}  Response
// @Failure      404  {object}  Response
// @Param secret-to-apps header string true "API secret key" default(Z9ToSwagger1413999)
// @Router       /api/grade/{id} [delete]
func DeleteGrade(c echo.Context) error {
	id := c.Param("id")
	if err := connection.DB.Delete(&model.Grade{}, id).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, Response{Status: false, Message: "Gagal menghapus data"})
	}
	return c.JSON(http.StatusOK, Response{Status: true, Message: "Deleted successfully"})
}
