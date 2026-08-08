package route

import (
	"server/app/controller"

	"github.com/labstack/echo/v4"
)

func RouteTransaction(e *echo.Group) {
	e.GET("/admin/transactions", controller.GetAllTransactions)
}
