package route

import (
	"server/app/controller"
	"github.com/labstack/echo/v4"
)

func RouteEducationLevel(api *echo.Group) {
	educationLevel := api.Group("/education-level")
	educationLevel.GET("", controller.GetEducationLevel)
	educationLevel.GET("/:id", controller.GetEducationLevelByID)
	educationLevel.POST("", controller.CreateEducationLevel)
	educationLevel.PUT("/:id", controller.UpdateEducationLevel)
	educationLevel.DELETE("/:id", controller.DeleteEducationLevel)
}
