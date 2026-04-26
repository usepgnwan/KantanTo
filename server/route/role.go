package route

import (
	"server/app/controller"

	"github.com/labstack/echo/v4"
)

// RouteRole registers role routes
func RouteRole(api *echo.Group) {
	role := api.Group("/role")
	role.GET("", controller.GetRoles)
	role.GET("/:id", controller.GetRoleById)
	role.POST("", controller.CreateRole)
	role.PUT("/:id", controller.UpdateRole)
	role.DELETE("/:id", controller.DeleteRole)
}
