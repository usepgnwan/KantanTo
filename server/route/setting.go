package route

import (
	"server/app/controller"

	"github.com/labstack/echo/v4"
)

// RouteSetting registers setting routes to the provided echo group
func RouteSetting(api *echo.Group) {
	setting := api.Group("/setting")
	setting.GET("", controller.GetSetting)
	setting.PUT("", controller.UpdateSetting)
}
