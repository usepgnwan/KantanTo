package middleware

import (
	"net/http"
	"os"
	"strings"

	"github.com/labstack/echo/v4"
)

func HeaderAuthorizationMiddleware(next echo.HandlerFunc) echo.HandlerFunc {
	return func(c echo.Context) error {

		headerValue := c.Request().Header.Get("secret-to-apps")

		if headerValue == "" {
			return c.JSON(http.StatusForbidden, map[string]interface{}{
				"message": "API can't use",
				"status":  false,
				"data":    nil,
			})
		}

		if strings.TrimSpace(headerValue) != os.Getenv("SECRETKEY_HEADER") {
			return c.JSON(http.StatusUnauthorized, map[string]interface{}{
				"message": "Invalid secret key",
				"status":  false,
				"data":    nil,
			})
		}

		return next(c)
	}
}
