package route

import (
	"os"
	"server/app/controller"
	"server/app/middleware"

	"github.com/labstack/echo/v4"
	echoMiddleware "github.com/labstack/echo/v4/middleware"
	echoSwagger "github.com/swaggo/echo-swagger"
)

func InitRouting(e *echo.Echo) {
	e.Static("/uploads", "uploads")
	e.GET("/sitemap.xml", controller.GenerateSitemapIndex)
	e.GET("/page-sitemap.xml", controller.GeneratePageSitemap)
	e.GET("/package-sitemap.xml", controller.GeneratePackageSitemap)
	e.GET("/blog-sitemap.xml", controller.GenerateBlogSitemap)

	// Swagger Endpoint with Basic Auth
	swaggerGroup := e.Group("/swagger")
	swaggerGroup.Use(echoMiddleware.BasicAuth(func(username, password string, c echo.Context) (bool, error) {
		// Validate username and password
		if username == os.Getenv("USERSWAGGER") && password == os.Getenv("PASSWORDSWAGGER") {
			return true, nil
		}
		return false, nil
	}))
	swaggerGroup.GET("/*", echoSwagger.WrapHandler)

	// API Group
	api := e.Group("/api")

	// Apply Header Authorization
	api.Use(middleware.HeaderAuthorizationMiddleware)

	api.POST("/checkout", controller.Checkout)
	api.GET("/user/packages", controller.GetMyPackages)
	api.GET("/user/mapels", controller.GetMyMapels)
	api.POST("/user/progress", controller.MarkMaterialAsRead)
	api.GET("/user/schedules", controller.GetSchedules)
	api.POST("/user/schedules", controller.CreateSchedule)
	api.DELETE("/user/schedules/:id", controller.DeleteSchedule)

	// Call separate route logic
	RouteMapel(api)
	RouteCategory(api)
	RouteEducationLevel(api)
	RouteContactMessage(api)
	RouteGrade(api)
	RouteSetting(api)
	RouteRole(api)
	RouteUser(api)
	RouteAuth(api)
	RouteArtikel(api)
	RoutePackage(api)
	RouteExam(api)
	RouteVoucher(api)
	RouteTransaction(api)
	RouteLog(api)
	RouteDashboard(api)
	RouteExampleExam(api)
	RouteAI(api)
	RouteProgressAnalysis(api)
}
