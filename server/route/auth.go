package route

import (
	"server/app/controller"

	"github.com/labstack/echo/v4"
)

// RouteAuth registers auth routes
func RouteAuth(api *echo.Group) {
	auth := api.Group("/auth")
	auth.POST("/login", controller.LoginUser)
}
