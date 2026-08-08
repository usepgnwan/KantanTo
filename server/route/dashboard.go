package route

import (
	"server/app/controller"
	"github.com/labstack/echo/v4"
)

func RouteDashboard(e *echo.Group) {
	dashboard := e.Group("/dashboard")
	dashboard.GET("/user-stats", controller.GetUserDashboardStats)
}
