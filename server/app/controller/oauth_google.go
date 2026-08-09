package controller

import (
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/url"
	"os"
	"strings"
	"time"

	. "server/app/helpers"
	"server/app/model"
	"server/connection"

	"github.com/golang-jwt/jwt/v5"
	"github.com/labstack/echo/v4"
	"golang.org/x/crypto/bcrypt"
)

type GoogleCallbackRequest struct {
	Code string `json:"code" validate:"required"`
}

type GoogleTokenResponse struct {
	AccessToken  string `json:"access_token"`
	TokenType    string `json:"token_type"`
	ExpiresIn    int    `json:"expires_in"`
	RefreshToken string `json:"refresh_token"`
	IDToken      string `json:"id_token"`
}

type GoogleUserInfo struct {
	ID            string `json:"id"`
	Email         string `json:"email"`
	VerifiedEmail bool   `json:"verified_email"`
	Name          string `json:"name"`
	Picture       string `json:"picture"`
}

func cleanEnvVal(key string) string {
	val := os.Getenv(key)
	val = strings.TrimSpace(val)
	val = strings.Trim(val, `"`)
	val = strings.Trim(val, `'`)
	return strings.TrimSpace(val)
}

// GoogleCallback godoc
func GoogleCallback(c echo.Context) error {
	var req GoogleCallbackRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, Response{Status: false, Message: "Format request tidak valid"})
	}

	if req.Code == "" {
		return c.JSON(http.StatusBadRequest, Response{Status: false, Message: "Authorization code diperlukan"})
	}

	clientID := cleanEnvVal("OAUTH_CLIEN_ID")
	clientSecret := cleanEnvVal("OAUT_SECRET")
	redirectURI := cleanEnvVal("OAUTH_REDIRECT")

	log.Printf("[OAUTH] Exchanging code for token. ClientID: %s, Redirect: %s", clientID, redirectURI)

	// Step 1: Tukar authorization code ke access_token
	tokenResp, err := exchangeCodeForToken(req.Code, clientID, clientSecret, redirectURI)
	if err != nil {
		log.Printf("[OAUTH] Failed to exchange code: %v", err)
		return c.JSON(http.StatusBadRequest, Response{Status: false, Message: "Gagal menukar kode otorisasi: " + err.Error()})
	}

	// Step 2: Dapatkan info user dari Google
	userInfo, err := getGoogleUserInfo(tokenResp.AccessToken)
	if err != nil {
		log.Printf("[OAUTH] Failed to get user info: %v", err)
		return c.JSON(http.StatusBadRequest, Response{Status: false, Message: "Gagal mendapatkan info akun Google"})
	}

	log.Printf("[OAUTH] Google user: %s (%s)", userInfo.Name, userInfo.Email)

	// Step 3: Cek apakah email sudah ada di database
	var user model.User
	result := connection.DB.Preload("Role").Where("email = ?", userInfo.Email).First(&user)

	if result.Error != nil {
		// User belum terdaftar, buat user baru
		log.Printf("[OAUTH] User not found, creating new user for: %s", userInfo.Email)

		// Generate random password untuk user OAuth
		randomBytes := make([]byte, 16)
		rand.Read(randomBytes)
		randomPassword := hex.EncodeToString(randomBytes)

		hashedPassword, _ := bcrypt.GenerateFromPassword([]byte(randomPassword), bcrypt.DefaultCost)

		user = model.User{
			Name:       userInfo.Name,
			Email:      userInfo.Email,
			Nohp:       "",
			Password:   string(hashedPassword),
			Status:     "aktif",
			FotoProfil: userInfo.Picture,
			RoleID:     2, // Student
		}

		if err := connection.DB.Create(&user).Error; err != nil {
			log.Printf("[OAUTH] Failed to create user: %v", err)
			return c.JSON(http.StatusInternalServerError, Response{Status: false, Message: "Gagal membuat akun baru"})
		}

		// Reload with Role preloaded
		connection.DB.Preload("Role").First(&user, user.ID)
	} else {
		// Update profile picture if user already exists
		if userInfo.Picture != "" && user.FotoProfil != userInfo.Picture {
			connection.DB.Model(&user).Update("foto_profil", userInfo.Picture)
			user.FotoProfil = userInfo.Picture
		}
	}

	// Step 4: Cek status user
	if user.Status != "aktif" {
		return c.JSON(http.StatusUnauthorized, Response{Status: false, Message: "Akun Anda belum aktif / di-suspend"})
	}

	// Step 5: Update last login
	now := time.Now()
	connection.DB.Model(&user).Update("last_login", now)
	user.LastLogin = &now

	// Step 6: Buat JWT token (sama seperti LoginUser)
	claims := &JwtCustomClaims{
		user.ID,
		user.Name,
		user.Nohp,
		user.Email,
		user.FotoProfil,
		user.RoleID,
		user.Role.Title,
		jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(time.Hour * 24)),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)

	signature := os.Getenv("SIGNATURETOAPPS")
	if signature == "" {
		signature = "default_secret"
	}

	t, err := token.SignedString([]byte(signature))
	if err != nil {
		return c.JSON(http.StatusInternalServerError, Response{Status: false, Message: "Gagal membuat token autentikasi"})
	}

	log.Printf("[OAUTH] Login successful for: %s", userInfo.Email)

	return c.JSON(http.StatusOK, Response{
		Status:  true,
		Message: "Login dengan Google berhasil",
		Data: map[string]interface{}{
			"token":  t,
			"bearer": "Bearer " + t,
			"user":   user,
		},
	})
}

// exchangeCodeForToken menukar authorization code ke access_token via Google Token API
func exchangeCodeForToken(code, clientID, clientSecret, redirectURI string) (*GoogleTokenResponse, error) {
	data := url.Values{}
	data.Set("code", code)
	data.Set("client_id", clientID)
	data.Set("client_secret", clientSecret)
	data.Set("redirect_uri", redirectURI)
	data.Set("grant_type", "authorization_code")

	resp, err := http.Post("https://oauth2.googleapis.com/token", "application/x-www-form-urlencoded", strings.NewReader(data.Encode()))
	if err != nil {
		return nil, fmt.Errorf("request to Google token API failed: %v", err)
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)

	if resp.StatusCode != 200 {
		return nil, fmt.Errorf("Google token API returned %d: %s", resp.StatusCode, string(body))
	}

	var tokenResp GoogleTokenResponse
	if err := json.Unmarshal(body, &tokenResp); err != nil {
		return nil, fmt.Errorf("failed to parse token response: %v", err)
	}

	return &tokenResp, nil
}

// getGoogleUserInfo mendapatkan info user dari Google menggunakan access_token
func getGoogleUserInfo(accessToken string) (*GoogleUserInfo, error) {
	req, _ := http.NewRequest("GET", "https://www.googleapis.com/oauth2/v2/userinfo", nil)
	req.Header.Set("Authorization", "Bearer "+accessToken)

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("request to Google userinfo API failed: %v", err)
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)

	if resp.StatusCode != 200 {
		return nil, fmt.Errorf("Google userinfo API returned %d: %s", resp.StatusCode, string(body))
	}

	var userInfo GoogleUserInfo
	if err := json.Unmarshal(body, &userInfo); err != nil {
		return nil, fmt.Errorf("failed to parse userinfo response: %v", err)
	}

	return &userInfo, nil
}
