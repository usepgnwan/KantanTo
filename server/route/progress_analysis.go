package route

import (
	"server/app/controller"

	"github.com/labstack/echo/v4"
)

func RouteProgressAnalysis(api *echo.Group) {
	pa := api.Group("/progress/analysis")
	pa.GET("", controller.GetProgressAnalysis)
	pa.POST("", controller.GenerateProgressAnalysis)
	pa.DELETE("/:id", controller.DeleteProgressAnalysis)
}
