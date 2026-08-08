package route

import (
	"server/app/controller"

	"github.com/labstack/echo/v4"
)

func RouteLog(e *echo.Group) {
	log := e.Group("/logs")
	log.POST("/menu", controller.RecordMenuLog)
	log.GET("/menu", controller.GetMenuLogs)
}
