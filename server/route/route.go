package route

import (
	"os"
	"server/app/middleware"

	"github.com/labstack/echo/v4"
	echoMiddleware "github.com/labstack/echo/v4/middleware"
	echoSwagger "github.com/swaggo/echo-swagger"
)

func InitRouting(e *echo.Echo) {
	e.Static("/uploads", "uploads")
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

	// Call separate route logic
	RouteMapel(api)
	RouteCategory(api)
	RouteGrade(api)
	RouteSetting(api)
	RouteRole(api)
	RouteUser(api)
	RouteAuth(api)
	RouteArtikel(api)
}
