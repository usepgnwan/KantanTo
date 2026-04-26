package route

import (
	"server/app/controller"

	"github.com/labstack/echo/v4"
)

// RouteArtikel registers artikel routes
func RouteArtikel(api *echo.Group) {
	a := api.Group("/artikel")
	a.GET("", controller.GetArtikel)
	a.GET("/:id", controller.GetArtikelByID)
	a.GET("/slug/:slug", controller.GetArtikelBySlug)
	a.POST("", controller.CreateArtikel)
	a.PUT("/:id", controller.UpdateArtikel)
	a.DELETE("/:id", controller.DeleteArtikel)
}
