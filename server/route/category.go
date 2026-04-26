package route

import (
	"server/app/controller"

	"github.com/labstack/echo/v4"
)

// RouteCategory registers category routes to the provided echo group
func RouteCategory(api *echo.Group) {
	category := api.Group("/category")
	category.GET("", controller.GetCategory)
	category.GET("/:id", controller.GetCategoryByID)
	category.POST("", controller.CreateCategory)
	category.PUT("/:id", controller.UpdateCategory)
	category.DELETE("/:id", controller.DeleteCategory)
}
