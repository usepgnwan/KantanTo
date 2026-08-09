package controller

import (
	"net/http"
	. "server/app/helpers"
	"server/app/model"
	"server/connection"
	"strconv"

	"github.com/labstack/echo/v4"
)

// GetEducationLevel godoc
// @Summary      Get all Education Level (Paginated)
// @Description  Get a paginated list of Education Level
// @Tags         Education Level
// @Accept       json
// @Produce      json
// @Param        page    query     int     false  "Page number" default(1)
// @Param        limit   query     int     false  "Limit per page" default(10)
// @Param        title   query     string  false  "Search by title"
// @Security     ApiKeyAuth
// @Success      200  {object}  Response{data=helpers.ResponsePaginate}
// @Failure      500  {object}  Response
// @Param secret-to-apps header string true "API secret key" default(Z9ToSwagger1413999)
// @Router       /api/education-level [get]
func GetEducationLevel(c echo.Context) error {
	data := &Paginate{
		Model: &model.EducationLevel{},
	}
	db := connection.DB
	query := db.Model(&model.EducationLevel{})

	title := c.QueryParam("title")
	if title != "" {
		query = query.Where("title ILIKE ?", "%"+title+"%")
	}

	result := data.Paginate(query, c)
	return c.JSON(http.StatusOK, Response{Status: true, Message: "Success get data", Data: result})
}

// GetEducationLevelByID godoc
// @Summary      Get Education Level by ID
// @Description  Get specific Education Level by its ID
// @Tags         Education Level
// @Accept       json
// @Produce      json
// @Security     ApiKeyAuth
// @Param        id   path      int  true  "Education Level ID"
// @Success      200  {object}  Response
// @Failure      404  {object}  Response
// @Param secret-to-apps header string true "API secret key" default(Z9ToSwagger1413999)
// @Router       /api/education-level/{id} [get]
func GetEducationLevelByID(c echo.Context) error {
	id := c.Param("id")
	var educationLevel model.EducationLevel
	if err := connection.DB.First(&educationLevel, id).Error; err != nil {
		return c.JSON(http.StatusNotFound, Response{Status: false, Message: "Data tidak ditemukan"})
	}
	return c.JSON(http.StatusOK, Response{Status: true, Message: "Success", Data: educationLevel})
}

// CreateEducationLevel godoc
// @Summary      Create new Education Level
// @Description  Create a new Education Level
// @Tags         Education Level
// @Accept       json
// @Produce      json
// @Security     ApiKeyAuth
// @Param        request body model.EducationLevel true "Education Level Payload"
// @Success      200  {object}  Response
// @Failure      400  {object}  Response
// @Param secret-to-apps header string true "API secret key" default(Z9ToSwagger1413999)
// @Router       /api/education-level [post]
func CreateEducationLevel(c echo.Context) error {
	educationLevel := new(model.EducationLevel)
	if err := c.Bind(educationLevel); err != nil {
		return c.JSON(http.StatusBadRequest, Response{Status: false, Message: err.Error()})
	}
	if err := connection.DB.Create(&educationLevel).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, Response{Status: false, Message: "Gagal menyimpan data"})
	}
	return c.JSON(http.StatusCreated, Response{Status: true, Message: "Created successfully", Data: educationLevel})
}

// UpdateEducationLevel godoc
// @Summary      Update Education Level
// @Description  Update Education Level by ID
// @Tags         Education Level
// @Accept       json
// @Produce      json
// @Security     ApiKeyAuth
// @Param        id   path      int  true  "Education Level ID"
// @Param        request body model.EducationLevel true "Education Level Payload"
// @Success      200  {object}  Response
// @Failure      404  {object}  Response
// @Param secret-to-apps header string true "API secret key" default(Z9ToSwagger1413999)
// @Router       /api/education-level/{id} [put]
func UpdateEducationLevel(c echo.Context) error {
	id, _ := strconv.Atoi(c.Param("id"))
	var educationLevel model.EducationLevel
	if err := connection.DB.First(&educationLevel, id).Error; err != nil {
		return c.JSON(http.StatusNotFound, Response{Status: false, Message: "Data tidak ditemukan"})
	}
	if err := c.Bind(&educationLevel); err != nil {
		return c.JSON(http.StatusBadRequest, Response{Status: false, Message: err.Error()})
	}
	connection.DB.Save(&educationLevel)
	return c.JSON(http.StatusOK, Response{Status: true, Message: "Updated successfully", Data: educationLevel})
}

// DeleteEducationLevel godoc
// @Summary      Delete Education Level
// @Description  Delete Education Level by ID
// @Tags         Education Level
// @Accept       json
// @Produce      json
// @Security     ApiKeyAuth
// @Param        id   path      int  true  "Education Level ID"
// @Success      200  {object}  Response
// @Failure      404  {object}  Response
// @Param secret-to-apps header string true "API secret key" default(Z9ToSwagger1413999)
// @Router       /api/education-level/{id} [delete]
func DeleteEducationLevel(c echo.Context) error {
	id := c.Param("id")
	if err := connection.DB.Delete(&model.EducationLevel{}, id).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, Response{Status: false, Message: "Gagal menghapus data"})
	}
	return c.JSON(http.StatusOK, Response{Status: true, Message: "Deleted successfully"})
}
