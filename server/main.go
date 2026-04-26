package main

import (
	"fmt"
	"log"
	"net/http"
	"os"

	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"

	"server/connection"
	"server/route"

	_ "server/docs" // load swagger docs
)

// @title Mapel API Documentation
// @version 1.0
// @description Dokumentasi API untuk CRUD Mapel
// @BasePath /
// @contact.name Admin
// @securityDefinitions.apikey ApiKeyAuth
// @in header
// @name secret-to-apps
func main() {
	connection.ConnectDB()

	e := echo.New()
	e.Use(middleware.CORS())
	e.Use(middleware.Recover())

	e.HTTPErrorHandler = func(err error, c echo.Context) {
		log.Printf("err %v", err.Error())
		var code int
		var message string

		if httpErr, ok := err.(*echo.HTTPError); ok {
			code = httpErr.Code
			if m, ok := httpErr.Message.(string); ok {
				message = m
			} else {
				message = fmt.Sprintf("%v", httpErr.Message)
			}
		} else {
			code = http.StatusInternalServerError
			message = err.Error()
		}

		c.JSON(code, map[string]interface{}{
			"status":  false,
			"message": message,
		})
	}

	route.InitRouting(e)

	port := os.Getenv("APP_PORT")
	if port == "" {
		port = "3026"
	}

	log.Printf("Starting Server on port :%s", port)
	e.Logger.Fatal(e.Start(fmt.Sprintf(":%s", port)))
}
