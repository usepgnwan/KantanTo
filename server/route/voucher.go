package route

import (
	"server/app/controller"

	"github.com/labstack/echo/v4"
)

func RouteVoucher(e *echo.Group) {
	voucher := e.Group("/vouchers")
	
	voucher.GET("", controller.GetVouchers)
	voucher.GET("/:id/usage", controller.GetVoucherUsageHistory)
	voucher.GET("/:id", controller.GetVoucherByID)
	
	voucher.POST("", controller.CreateVoucher)
	voucher.PUT("/:id", controller.UpdateVoucher)
	voucher.DELETE("/:id", controller.DeleteVoucher)
	
	voucher.POST("/apply", controller.ApplyVoucher)
	voucher.POST("/record-usage", controller.RecordVoucherUsage)
}
