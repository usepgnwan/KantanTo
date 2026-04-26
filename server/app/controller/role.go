package controller

import (
	"net/http"
	"server/app/helpers"
	. "server/app/helpers"
	"server/app/model"
	"server/connection"

	"github.com/labstack/echo/v4"
)

// GetRoles godoc
// @Summary      Get list of Roles
// @Description  Get paginated list of roles.
// @Tags         Role
// @Accept       json
// @Produce      json
// @Security     ApiKeyAuth
// @Param        page    query     int     false  "Page number" default(1)
// @Param        limit   query     int     false  "Items per page" default(10)
// @Param        search  query     string  false  "Search by title"
// @Param secret-to-apps header string true "API secret key" default(Z9ToSwagger1413999)
// @Success      200  {object}  ResponsePaginate
// @Failure      500  {object}  Response
// @Router       /api/role [get]
func GetRoles(c echo.Context) error {
	data := &helpers.Paginate{
		Model: &model.Role{},
	}

	search := c.QueryParam("search")
	query := connection.DB.Model(&model.Role{})
	if search != "" {
		query = query.Where("title ILIKE ?", "%"+search+"%")
	}

	result := data.Paginate(query, c)
	return c.JSON(http.StatusOK, Response{Status: true, Message: "Success get data", Data: result})
}

// CreateRole godoc
// @Summary      Create a new Role
// @Description  Create a new Role entry
// @Tags         Role
// @Accept       json
// @Produce      json
// @Security     ApiKeyAuth
// @Param        request body model.Role true "Role request body"
// @Param secret-to-apps header string true "API secret key" default(Z9ToSwagger1413999)
// @Success      201  {object}  Response
// @Failure      400  {object}  Response
// @Router       /api/role [post]
func CreateRole(c echo.Context) error {
	var role model.Role
	if err := c.Bind(&role); err != nil {
		return c.JSON(http.StatusBadRequest, Response{Status: false, Message: "Format data tidak valid"})
	}

	if err := connection.DB.Create(&role).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, Response{Status: false, Message: "Gagal membuat role"})
	}

	return c.JSON(http.StatusCreated, Response{Status: true, Message: "Role dibuat", Data: role})
}

// UpdateRole godoc
// @Summary      Update a Role
// @Description  Update Role by ID
// @Tags         Role
// @Accept       json
// @Produce      json
// @Security     ApiKeyAuth
// @Param        id   path      int  true  "Role ID"
// @Param        request body model.Role true "Role Payload"
// @Param secret-to-apps header string true "API secret key" default(Z9ToSwagger1413999)
// @Success      200  {object}  Response
// @Failure      404  {object}  Response
// @Router       /api/role/{id} [put]
func UpdateRole(c echo.Context) error {
	id := c.Param("id")
	var role model.Role

	if err := connection.DB.First(&role, id).Error; err != nil {
		return c.JSON(http.StatusNotFound, Response{Status: false, Message: "Role tidak ditemukan"})
	}

	if err := c.Bind(&role); err != nil {
		return c.JSON(http.StatusBadRequest, Response{Status: false, Message: "Format tidak valid"})
	}

	if err := connection.DB.Save(&role).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, Response{Status: false, Message: "Gagal menyimpan"})
	}

	return c.JSON(http.StatusOK, Response{Status: true, Message: "Behasil update role", Data: role})
}

// DeleteRole godoc
// @Summary      Delete a Role
// @Description  Delete Role by ID
// @Tags         Role
// @Accept       json
// @Produce      json
// @Security     ApiKeyAuth
// @Param        id   path      int  true  "Role ID"
// @Param secret-to-apps header string true "API secret key" default(Z9ToSwagger1413999)
// @Success      200  {object}  Response
// @Failure      404  {object}  Response
// @Router       /api/role/{id} [delete]
func DeleteRole(c echo.Context) error {
	id := c.Param("id")
	var role model.Role

	if err := connection.DB.First(&role, id).Error; err != nil {
		return c.JSON(http.StatusNotFound, Response{Status: false, Message: "Role tidak ditemukan"})
	}

	if err := connection.DB.Delete(&role).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, Response{Status: false, Message: "Gagal menghapus"})
	}

	return c.JSON(http.StatusOK, Response{Status: true, Message: "Terhapus", Data: nil})
}

// GetRoleById godoc
// @Summary      Get Role By ID
// @Description  Get Role By ID
// @Tags         Role
// @Accept       json
// @Produce      json
// @Security     ApiKeyAuth
// @Param        id   path      int  true  "Role ID"
// @Param secret-to-apps header string true "API secret key" default(Z9ToSwagger1413999)
// @Success      200  {object}  Response
// @Failure      404  {object}  Response
// @Router       /api/role/{id} [get]
func GetRoleById(c echo.Context) error {
	id := c.Param("id")
	var role model.Role

	if err := connection.DB.First(&role, id).Error; err != nil {
		return c.JSON(http.StatusNotFound, Response{Status: false, Message: "Role tidak ditemukan"})
	}

	return c.JSON(http.StatusOK, Response{Status: true, Message: "Success retrieved", Data: role})
}
