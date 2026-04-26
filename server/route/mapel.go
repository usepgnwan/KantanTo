package route

import (
	"server/app/controller"

	"github.com/labstack/echo/v4"
)

// RouteMapel registers mapel routes to the provided echo group
func RouteMapel(api *echo.Group) {
	mapel := api.Group("/mapel")
	mapel.GET("", controller.GetMapels)
	mapel.GET("/:id", controller.GetMapelByID)
	mapel.POST("", controller.CreateMapel)
	mapel.PUT("/:id", controller.UpdateMapel)
	mapel.DELETE("/:id", controller.DeleteMapel)
}
