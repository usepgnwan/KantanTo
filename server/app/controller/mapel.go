package controller

import (
	"net/http"
	"server/app/helpers"
	"server/app/model"
	"server/connection"
	"strconv"

	"github.com/labstack/echo/v4"
)

// Response adalah format respon template
type Response struct {
	Status  bool        `json:"status"`
	Message string      `json:"message"`
	Data    interface{} `json:"data,omitempty"`
}

// GetMapels godoc
// @Summary      Get all Mapel (Paginated)
// @Description  Get a paginated list of mata pelajaran
// @Tags         Mapel
// @Accept       json
// @Produce      json
// @Param        page    query     int     false  "Page number" default(1)
// @Param        limit   query     int     false  "Limit per page" default(10)
// @Param        title   query     string  false  "Search by title"
// @Security     ApiKeyAuth
// @Success      200  {object}  Response{data=helpers.ResponsePaginate}
// @Failure      500  {object}  Response
// @Param secret-to-apps header string true "API secret key" default(Z9ToSwagger1413999)
// @Router       /api/mapel [get]
func GetMapels(c echo.Context) error {
	data := &helpers.Paginate{
		Model: &model.Mapel{},
	}
	db := connection.DB
	query := db.Model(&model.Mapel{})

	title := c.QueryParam("title")
	if title != "" {
		query = query.Where("title ILIKE ?", "%"+title+"%")
	}

	result := data.Paginate(query, c)
	return c.JSON(http.StatusOK, Response{Status: true, Message: "Success get data", Data: result})
}

// GetMapelByID godoc
// @Summary      Get Mapel by ID
// @Description  Get specific mata pelajaran by its ID
// @Tags         Mapel
// @Accept       json
// @Produce      json
// @Security     ApiKeyAuth
// @Param        id   path      int  true  "Mapel ID"
// @Success      200  {object}  Response
// @Failure      404  {object}  Response
// @Param secret-to-apps header string true "API secret key" default(Z9ToSwagger1413999)
// @Router       /api/mapel/{id} [get]
func GetMapelByID(c echo.Context) error {
	id := c.Param("id")
	var mapel model.Mapel
	if err := connection.DB.First(&mapel, id).Error; err != nil {
		return c.JSON(http.StatusNotFound, Response{Status: false, Message: "Data tidak ditemukan"})
	}
	return c.JSON(http.StatusOK, Response{Status: true, Message: "Success", Data: mapel})
}

// CreateMapel godoc
// @Summary      Create new Mapel
// @Description  Create a new mata pelajaran
// @Tags         Mapel
// @Accept       json
// @Produce      json
// @Security     ApiKeyAuth
// @Param        request body model.Mapel true "Mapel Payload"
// @Success      200  {object}  Response
// @Failure      400  {object}  Response
// @Param secret-to-apps header string true "API secret key" default(Z9ToSwagger1413999)
// @Router       /api/mapel [post]
func CreateMapel(c echo.Context) error {
	mapel := new(model.Mapel)
	if err := c.Bind(mapel); err != nil {
		return c.JSON(http.StatusBadRequest, Response{Status: false, Message: err.Error()})
	}
	if err := connection.DB.Create(&mapel).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, Response{Status: false, Message: "Gagal menyimpan data"})
	}
	return c.JSON(http.StatusCreated, Response{Status: true, Message: "Created successfully", Data: mapel})
}

// UpdateMapel godoc
// @Summary      Update Mapel
// @Description  Update mapel by ID
// @Tags         Mapel
// @Accept       json
// @Produce      json
// @Security     ApiKeyAuth
// @Param        id   path      int  true  "Mapel ID"
// @Param        request body model.Mapel true "Mapel Payload"
// @Success      200  {object}  Response
// @Failure      404  {object}  Response
// @Param secret-to-apps header string true "API secret key" default(Z9ToSwagger1413999)
// @Router       /api/mapel/{id} [put]
func UpdateMapel(c echo.Context) error {
	id, _ := strconv.Atoi(c.Param("id"))
	var mapel model.Mapel
	if err := connection.DB.First(&mapel, id).Error; err != nil {
		return c.JSON(http.StatusNotFound, Response{Status: false, Message: "Data tidak ditemukan"})
	}
	if err := c.Bind(&mapel); err != nil {
		return c.JSON(http.StatusBadRequest, Response{Status: false, Message: err.Error()})
	}
	connection.DB.Save(&mapel)
	return c.JSON(http.StatusOK, Response{Status: true, Message: "Updated successfully", Data: mapel})
}

// DeleteMapel godoc
// @Summary      Delete Mapel
// @Description  Delete mapel by ID
// @Tags         Mapel
// @Accept       json
// @Produce      json
// @Security     ApiKeyAuth
// @Param        id   path      int  true  "Mapel ID"
// @Success      200  {object}  Response
// @Failure      404  {object}  Response
// @Param secret-to-apps header string true "API secret key" default(Z9ToSwagger1413999)
// @Router       /api/mapel/{id} [delete]
func DeleteMapel(c echo.Context) error {
	id := c.Param("id")
	if err := connection.DB.Delete(&model.Mapel{}, id).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, Response{Status: false, Message: "Gagal menghapus data"})
	}
	return c.JSON(http.StatusOK, Response{Status: true, Message: "Deleted successfully"})
}
