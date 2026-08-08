package route

import (
	"server/app/controller"

	"github.com/labstack/echo/v4"
)

func RouteExampleExam(api *echo.Group) {
	// Public route for landing page
	api.GET("/example-exam/random", controller.GetRandomExampleExam)

	// Admin routes
	admin := api.Group("/example-exam")
	admin.GET("", controller.GetExampleExams)
	admin.POST("", controller.CreateExampleExam)
	admin.PUT("/:id", controller.UpdateExampleExam)
	admin.DELETE("/:id", controller.DeleteExampleExam)
}
