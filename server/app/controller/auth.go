package controller

import (
	"net/http"
	"os"
	"time"

	. "server/app/helpers"
	"server/app/model"
	"server/connection"

	"github.com/golang-jwt/jwt/v5"
	"github.com/labstack/echo/v4"
	"golang.org/x/crypto/bcrypt"
)

type LoginRequest struct {
	Email    string `json:"email" validate:"required"`
	Password string `json:"password" validate:"required"`
}

type JwtCustomClaims struct {
	UserID        uint   `json:"user_id"`
	Nama          string `json:"nama"`
	Phone         string `json:"phone"`
	Email         string `json:"email"`
	RoleID        uint   `json:"roleid"`
	DeskripsiRole string `json:"deskripsi_role"`
	jwt.RegisteredClaims
}

// LoginUser godoc
// @Summary      Login and get token
// @Description  Authenticate using email and password, returning a JWT token payload containing nama, phone, email, roleid, deskripsi role.
// @Tags         Auth
// @Accept       json
// @Produce      json
// @Param        request body controller.LoginRequest true "Login Credentials"
// @Success      200  {object}  Response
// @Failure      401  {object}  Response
// @Param secret-to-apps header string true "API secret key" default(Z9ToSwagger1413999)
// @Router       /api/auth/login [post]
func LoginUser(c echo.Context) error {
	var req LoginRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, Response{Status: false, Message: "Format request tidak valid"})
	}

	var user model.User
	// Load related Role to populate descriptipn
	if err := connection.DB.Preload("Role").Where("email = ?", req.Email).First(&user).Error; err != nil {
		return c.JSON(http.StatusUnauthorized, Response{Status: false, Message: "Email atau password salah"})
	}

	// Compare pass
	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.Password)); err != nil {
		return c.JSON(http.StatusUnauthorized, Response{Status: false, Message: "Email atau password salah"})
	}

	if user.Status != "aktif" {
		return c.JSON(http.StatusUnauthorized, Response{Status: false, Message: "Akun Anda belum aktif / di-suspend"})
	}

	// Setup claims
	claims := &JwtCustomClaims{
		user.ID,
		user.Name,
		user.Nohp,
		user.Email,
		user.RoleID,
		user.Role.Title,
		jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(time.Hour * 24)),
		},
	}

	// Create token
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)

	// Fetch signature
	signature := os.Getenv("SIGNATURETOAPPS")
	if signature == "" {
		signature = "default_secret"
	}

	t, err := token.SignedString([]byte(signature))
	if err != nil {
		return c.JSON(http.StatusInternalServerError, Response{Status: false, Message: "Gagal membuat token autentikasi"})
	}

	return c.JSON(http.StatusOK, Response{
		Status:  true,
		Message: "Login Berhasil",
		Data: map[string]interface{}{
			"token": t,
			"user":  user,
		},
	})
}
