package route

import (
	"server/app/controller"
	"github.com/labstack/echo/v4"
)

func RouteContactMessage(api *echo.Group) {
	contact := api.Group("/contact")
	contact.POST("/submit", controller.SubmitContactMessage)

	adminContact := api.Group("/admin/contacts")
	adminContact.GET("", controller.GetContactMessages)
	adminContact.GET("/:id", controller.GetContactMessageByID)
	adminContact.DELETE("/:id", controller.DeleteContactMessage)
}
