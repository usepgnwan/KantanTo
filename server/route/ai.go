package route

import (
	"server/app/controller"

	"github.com/labstack/echo/v4"
)

// RouteAI registers AI routes
func RouteAI(api *echo.Group) {
	a := api.Group("/ai")
	a.POST("/chat", controller.AIChat)
}
