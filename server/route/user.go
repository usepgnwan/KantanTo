package route

import (
	"server/app/controller"

	"github.com/labstack/echo/v4"
)

// RouteUser registers user routes
func RouteUser(api *echo.Group) {
	user := api.Group("/user")
	user.GET("", controller.GetUsers)
	user.POST("/register", controller.RegisterUser)
}
