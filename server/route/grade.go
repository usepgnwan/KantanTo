package route

import (
	"server/app/controller"

	"github.com/labstack/echo/v4"
)

// RouteGrade registers category routes to the provided echo group
func RouteGrade(api *echo.Group) {
	grade := api.Group("/grade")
	grade.GET("", controller.GetGrade)
	grade.GET("/:id", controller.GetGradeByID)
	grade.POST("", controller.CreateGrade)
	grade.PUT("/:id", controller.UpdateGrade)
	grade.DELETE("/:id", controller.DeleteGrade)
}
