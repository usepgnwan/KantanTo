package controller

import (
	"net/http"
	. "server/app/helpers"
	"server/app/model"
	"server/connection"
	"strconv"

	"github.com/labstack/echo/v4"
)

// GetCategory godoc
// @Summary      Get all Category (Paginated)
// @Description  Get a paginated list of Category
// @Tags         Category
// @Accept       json
// @Produce      json
// @Param        page    query     int     false  "Page number" default(1)
// @Param        limit   query     int     false  "Limit per page" default(10)
// @Param        title   query     string  false  "Search by title"
// @Security     ApiKeyAuth
// @Success      200  {object}  Response{data=helpers.ResponsePaginate}
// @Failure      500  {object}  Response
// @Param secret-to-apps header string true "API secret key" default(Z9ToSwagger1413999)
// @Router       /api/category [get]
func GetCategory(c echo.Context) error {
	data := &Paginate{
		Model: &model.Category{},
	}
	db := connection.DB
	query := db.Model(&model.Category{})

	title := c.QueryParam("title")
	if title != "" {
		query = query.Where("title ILIKE ?", "%"+title+"%")
	}

	result := data.Paginate(query, c)
	return c.JSON(http.StatusOK, Response{Status: true, Message: "Success get data", Data: result})
}

// GetCategoryByID godoc
// @Summary      Get Category by ID
// @Description  Get specific Category by its ID
// @Tags         Category
// @Accept       json
// @Produce      json
// @Security     ApiKeyAuth
// @Param        id   path      int  true  "Category ID"
// @Success      200  {object}  Response
// @Failure      404  {object}  Response
// @Param secret-to-apps header string true "API secret key" default(Z9ToSwagger1413999)
// @Router       /api/category/{id} [get]
func GetCategoryByID(c echo.Context) error {
	id := c.Param("id")
	var Category model.Category
	if err := connection.DB.First(&Category, id).Error; err != nil {
		return c.JSON(http.StatusNotFound, Response{Status: false, Message: "Data tidak ditemukan"})
	}
	return c.JSON(http.StatusOK, Response{Status: true, Message: "Success", Data: Category})
}

// CreateCategory godoc
// @Summary      Create new Category
// @Description  Create a new mata pelajaran
// @Tags         Category
// @Accept       json
// @Produce      json
// @Security     ApiKeyAuth
// @Param        request body model.Category true "Category Payload"
// @Success      200  {object}  Response
// @Failure      400  {object}  Response
// @Param secret-to-apps header string true "API secret key" default(Z9ToSwagger1413999)
// @Router       /api/category [post]
func CreateCategory(c echo.Context) error {
	Category := new(model.Category)
	if err := c.Bind(Category); err != nil {
		return c.JSON(http.StatusBadRequest, Response{Status: false, Message: err.Error()})
	}
	if err := connection.DB.Create(&Category).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, Response{Status: false, Message: "Gagal menyimpan data"})
	}
	return c.JSON(http.StatusCreated, Response{Status: true, Message: "Created successfully", Data: Category})
}

// UpdateCategory godoc
// @Summary      Update Category
// @Description  Update Category by ID
// @Tags         Category
// @Accept       json
// @Produce      json
// @Security     ApiKeyAuth
// @Param        id   path      int  true  "Category ID"
// @Param        request body model.Category true "Category Payload"
// @Success      200  {object}  Response
// @Failure      404  {object}  Response
// @Param secret-to-apps header string true "API secret key" default(Z9ToSwagger1413999)
// @Router       /api/category/{id} [put]
func UpdateCategory(c echo.Context) error {
	id, _ := strconv.Atoi(c.Param("id"))
	var Category model.Category
	if err := connection.DB.First(&Category, id).Error; err != nil {
		return c.JSON(http.StatusNotFound, Response{Status: false, Message: "Data tidak ditemukan"})
	}
	if err := c.Bind(&Category); err != nil {
		return c.JSON(http.StatusBadRequest, Response{Status: false, Message: err.Error()})
	}
	connection.DB.Save(&Category)
	return c.JSON(http.StatusOK, Response{Status: true, Message: "Updated successfully", Data: Category})
}

// DeleteCategory godoc
// @Summary      Delete Category
// @Description  Delete Category by ID
// @Tags         Category
// @Accept       json
// @Produce      json
// @Security     ApiKeyAuth
// @Param        id   path      int  true  "Category ID"
// @Success      200  {object}  Response
// @Failure      404  {object}  Response
// @Param secret-to-apps header string true "API secret key" default(Z9ToSwagger1413999)
// @Router       /api/category/{id} [delete]
func DeleteCategory(c echo.Context) error {
	id := c.Param("id")
	if err := connection.DB.Delete(&model.Category{}, id).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, Response{Status: false, Message: "Gagal menghapus data"})
	}
	return c.JSON(http.StatusOK, Response{Status: true, Message: "Deleted successfully"})
}
