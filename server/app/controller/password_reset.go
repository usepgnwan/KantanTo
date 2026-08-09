package controller

import (
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"log"
	"net/http"
	"time"

	. "server/app/helpers"
	"server/app/model"
	"server/connection"

	"github.com/labstack/echo/v4"
	"golang.org/x/crypto/bcrypt"
)

type ForgotPasswordRequest struct {
	Email string `json:"email" validate:"required,email"`
}

type ResetPasswordRequest struct {
	Token       string `json:"token" validate:"required"`
	NewPassword string `json:"new_password" validate:"required"`
}

// generateToken membuat token acak 32 byte (64 karakter hex)
func generateToken() (string, error) {
	bytes := make([]byte, 32)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}
	return hex.EncodeToString(bytes), nil
}

// ForgotPassword godoc
func ForgotPassword(c echo.Context) error {
	var req ForgotPasswordRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, Response{Status: false, Message: "Format request tidak valid"})
	}

	// Cek apakah email ada di database user
	var user model.User
	if err := connection.DB.Where("email = ?", req.Email).First(&user).Error; err != nil {
		return c.JSON(http.StatusNotFound, Response{
			Status:  false,
			Message: "Akun kamu tidak ditemukan. Pastikan email yang dimasukkan sudah benar.",
		})
	}

	// Generate token
	token, err := generateToken()
	if err != nil {
		return c.JSON(http.StatusInternalServerError, Response{Status: false, Message: "Gagal membuat token"})
	}

	// Simpan token ke database dengan expiry 10 menit
	resetToken := model.PasswordResetToken{
		UserID:    user.ID,
		Email:     user.Email,
		Token:     token,
		ExpiresAt: time.Now().Add(10 * time.Minute),
	}
	if err := connection.DB.Create(&resetToken).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, Response{Status: false, Message: "Gagal menyimpan token"})
	}

	// Kirim email dengan link reset
	frontendURL := "http://localhost:3000"
	resetLink := fmt.Sprintf("%s/reset-password?token=%s", frontendURL, token)

	subject := "Reset Password - Rifaya Tryout"
	body := fmt.Sprintf(`
		<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
			<h2 style="color: #333;">Reset Password</h2>
			<p>Halo <b>%s</b>,</p>
			<p>Kami menerima permintaan untuk mereset password akun Anda di Rifaya Tryout.</p>
			<p>Klik tombol di bawah ini untuk membuat password baru:</p>
			<div style="text-align: center; margin: 30px 0;">
				<a href="%s" style="background-color: #4F46E5; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
					Reset Password Saya
				</a>
			</div>
			<p style="color: #666; font-size: 14px;">Link ini hanya berlaku selama <b>10 menit</b>. Jika Anda tidak meminta reset password, abaikan email ini.</p>
			<hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
			<p style="color: #999; font-size: 12px;">Tim Rifaya Tryout</p>
		</div>
	`, user.Name, resetLink)

	go func() {
		if err := SendEmail(user.Email, subject, body); err != nil {
			log.Printf("[FORGOT-PASSWORD] Gagal mengirim email ke %s: %v", user.Email, err)
		}
	}()

	return c.JSON(http.StatusOK, Response{
		Status:  true,
		Message: "Jika email terdaftar, link reset password telah dikirim ke email Anda.",
	})
}

// ResetPassword godoc
func ResetPassword(c echo.Context) error {
	var req ResetPasswordRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, Response{Status: false, Message: "Format request tidak valid"})
	}

	// Cari token di database
	var resetToken model.PasswordResetToken
	if err := connection.DB.Where("token = ? AND used = ?", req.Token, false).First(&resetToken).Error; err != nil {
		return c.JSON(http.StatusBadRequest, Response{Status: false, Message: "Token tidak valid atau sudah digunakan"})
	}

	// Cek apakah token sudah expired
	if time.Now().After(resetToken.ExpiresAt) {
		return c.JSON(http.StatusBadRequest, Response{Status: false, Message: "Token sudah kedaluwarsa. Silakan minta link reset baru."})
	}

	// Hash password baru
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.NewPassword), bcrypt.DefaultCost)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, Response{Status: false, Message: "Gagal memproses password baru"})
	}

	// Update password user
	if err := connection.DB.Model(&model.User{}).Where("id = ?", resetToken.UserID).Update("password", string(hashedPassword)).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, Response{Status: false, Message: "Gagal memperbarui password"})
	}

	// Tandai token sebagai sudah digunakan
	connection.DB.Model(&resetToken).Update("used", true)

	return c.JSON(http.StatusOK, Response{
		Status:  true,
		Message: "Password berhasil direset. Silakan login dengan password baru Anda.",
	})
}
