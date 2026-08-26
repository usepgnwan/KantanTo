package controller

import (
	"net/http"
	"server/app/helpers"
	. "server/app/helpers"
	"server/app/model"
	"server/connection"

	"github.com/labstack/echo/v4"
	"golang.org/x/crypto/bcrypt"
)

// GetUsers godoc
// @Summary      Get list of Users
// @Description  Get paginated list of users including preloaded Role.
// @Tags         User
// @Accept       json
// @Produce      json
// @Security     ApiKeyAuth
// @Param        page    query     int     false  "Page number" default(1)
// @Param        limit   query     int     false  "Items per page" default(10)
// @Param        search  query     string  false  "Search by name or email"
// @Param secret-to-apps header string true "API secret key" default(Z9ToSwagger1413999)
// @Success      200  {object}  ResponsePaginate
// @Failure      500  {object}  Response
// @Router       /api/user [get]
func GetUsers(c echo.Context) error {
	data := &helpers.Paginate{
		Model: &model.User{},
	}

	search := c.QueryParam("search")
	query := connection.DB.Model(&model.User{}).Preload("Role")
	if search != "" {
		query = query.Where("name ILIKE ? OR email ILIKE ?", "%"+search+"%", "%"+search+"%")
	}

	result := data.Paginate(query, c)
	return c.JSON(http.StatusOK, Response{Status: true, Message: "Success get data", Data: result})
}

// Request struct for Registration
type RegisterRequest struct {
	Name        string `json:"name" validate:"required"`
	Email       string `json:"email" validate:"required,email"`
	Nohp        string `json:"nohp" validate:"required"`
	Password    string `json:"password" validate:"required,min=6"`
	AsalSekolah string `json:"asal_sekolah"`
}

// RegisterUser godoc
// @Summary      Register a new User
// @Description  Register a new user with default status Active and Role 2 (Student). Email and Nohp must be unique.
// @Tags         User
// @Accept       json
// @Produce      json
// @Param        request body controller.RegisterRequest true "Registration data"
// @Success      201  {object}  Response
// @Failure      400  {object}  Response
// @Router       /api/user/register [post]
func RegisterUser(c echo.Context) error {
	var req RegisterRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, Response{Status: false, Message: "Format request tidak valid"})
	}

	// Cek keunikan email
	var count int64
	connection.DB.Model(&model.User{}).Where("email = ?", req.Email).Count(&count)
	if count > 0 {
		return c.JSON(http.StatusBadRequest, Response{Status: false, Message: "Email sudah terdaftar"})
	}

	// Cek keunikan no hp
	connection.DB.Model(&model.User{}).Where("nohp = ?", req.Nohp).Count(&count)
	if count > 0 {
		return c.JSON(http.StatusBadRequest, Response{Status: false, Message: "Nomor HP sudah terdaftar"})
	}

	// Hash Password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, Response{Status: false, Message: "Terjadi kesalahan pada enkripsi password"})
	}

	// Proses Simpan User
	newUser := model.User{
		Name:        req.Name,
		Email:       req.Email,
		Nohp:        req.Nohp,
		Password:    string(hashedPassword),
		Status:      "aktif", // default
		AsalSekolah: req.AsalSekolah,
		RoleID:      2, // default (misal 2 = Student)
	}

	if err := connection.DB.Create(&newUser).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, Response{Status: false, Message: "Gagal menyimpan pendaftaran"})
	}

	return c.JSON(http.StatusCreated, Response{Status: true, Message: "Registrasi berhasil", Data: newUser})
}

// GetProfile godoc
// @Summary      Get User Profile
// @Description  Get a user's profile details.
// @Tags         User
// @Accept       json
// @Produce      json
// @Security     ApiKeyAuth
// @Param        id path int true "User ID"
// @Param secret-to-apps header string true "API secret key" default(Z9ToSwagger1413999)
// @Success      200  {object}  Response
// @Failure      404  {object}  Response
// @Router       /api/user/profile/{id} [get]
func GetProfile(c echo.Context) error {
	id := c.Param("id")
	var user model.User
	if err := connection.DB.Preload("Role").First(&user, id).Error; err != nil {
		return c.JSON(http.StatusNotFound, Response{Status: false, Message: "User tidak ditemukan"})
	}
	return c.JSON(http.StatusOK, Response{Status: true, Message: "Success", Data: user})
}

type UpdateProfileRequest struct {
	Name             string `json:"name"`
	Email            string `json:"email"`
	Nohp             string `json:"nohp"`
	AsalSekolah      string `json:"asal_sekolah"`
	DreamDescription string `json:"dream_description"`
	TargetCampus     string `json:"target_campus"`
	TargetMajor      string `json:"target_major"`
	TargetPoint      string `json:"target_point"`
}

// UpdateProfile godoc
// @Summary      Update User Profile
// @Description  Update a user's profile details.
// @Tags         User
// @Accept       json
// @Produce      json
// @Security     ApiKeyAuth
// @Param        id path int true "User ID"
// @Param        request body controller.UpdateProfileRequest true "Update Profile Data"
// @Param secret-to-apps header string true "API secret key" default(Z9ToSwagger1413999)
// @Success      200  {object}  Response
// @Failure      400  {object}  Response
// @Failure      404  {object}  Response
// @Router       /api/user/profile/{id} [put]
func UpdateProfile(c echo.Context) error {
	id := c.Param("id")
	var user model.User
	if err := connection.DB.First(&user, id).Error; err != nil {
		return c.JSON(http.StatusNotFound, Response{Status: false, Message: "User tidak ditemukan"})
	}

	var req UpdateProfileRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, Response{Status: false, Message: "Format request tidak valid"})
	}

	// Update fields if provided
	if req.Name != "" {
		user.Name = req.Name
	}
	if req.Email != "" {
		// Optional: check uniqueness
		user.Email = req.Email
	}
	if req.Nohp != "" {
		// Optional: check uniqueness
		user.Nohp = req.Nohp
	}
	if req.AsalSekolah != "" {
		user.AsalSekolah = req.AsalSekolah
	}
	if req.DreamDescription != "" {
		user.DreamDescription = req.DreamDescription
	}
	if req.TargetCampus != "" {
		user.TargetCampus = req.TargetCampus
	}
	if req.TargetMajor != "" {
		user.TargetMajor = req.TargetMajor
	}
	if req.TargetPoint != "" {
		user.TargetPoint = req.TargetPoint
	}

	if err := connection.DB.Save(&user).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, Response{Status: false, Message: "Gagal menyimpan profile"})
	}

	return c.JSON(http.StatusOK, Response{Status: true, Message: "Profile berhasil diperbarui", Data: user})
}

type UpdatePasswordRequest struct {
	OldPassword string `json:"old_password" validate:"required"`
	NewPassword string `json:"new_password" validate:"required,min=6"`
}

// UpdatePassword godoc
// @Summary      Update User Password
// @Description  Update a user's password.
// @Tags         User
// @Accept       json
// @Produce      json
// @Security     ApiKeyAuth
// @Param        id path int true "User ID"
// @Param        request body controller.UpdatePasswordRequest true "Update Password Data"
// @Param secret-to-apps header string true "API secret key" default(Z9ToSwagger1413999)
// @Success      200  {object}  Response
// @Failure      400  {object}  Response
// @Failure      404  {object}  Response
// @Router       /api/user/password/{id} [put]
func UpdatePassword(c echo.Context) error {
	id := c.Param("id")
	var user model.User
	if err := connection.DB.First(&user, id).Error; err != nil {
		return c.JSON(http.StatusNotFound, Response{Status: false, Message: "User tidak ditemukan"})
	}

	var req UpdatePasswordRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, Response{Status: false, Message: "Format request tidak valid"})
	}

	// Compare old password
	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.OldPassword)); err != nil {
		return c.JSON(http.StatusBadRequest, Response{Status: false, Message: "Password lama salah"})
	}

	// Hash new password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.NewPassword), bcrypt.DefaultCost)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, Response{Status: false, Message: "Gagal memproses password baru"})
	}

	// Update password
	if err := connection.DB.Model(&user).Update("password", string(hashedPassword)).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, Response{Status: false, Message: "Gagal menyimpan password baru"})
	}

	return c.JSON(http.StatusOK, Response{Status: true, Message: "Password berhasil diperbarui"})
}
