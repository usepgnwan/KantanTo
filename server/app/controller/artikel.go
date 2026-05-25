package controller

import (
	"bytes"
	"fmt"
	"image/jpeg"
	"image/png"
	"io"
	"math/rand"
	"net/http"
	"os"
	"path/filepath"
	"regexp"
	"strconv"
	"strings"
	"time"

	"github.com/disintegration/imaging"
	"github.com/labstack/echo/v4"

	. "server/app/helpers"
	"server/app/model"
	"server/connection"
)

// slugify membuat slug dari judul
func slugify(s string) string {
	s = strings.ToLower(s)
	reg := regexp.MustCompile(`[^a-z0-9\s-]`)
	s = reg.ReplaceAllString(s, "")
	space := regexp.MustCompile(`[\s]+`)
	s = space.ReplaceAllString(s, "-")
	return strings.Trim(s, "-")
}

// saveThumbnail menyimpan file gambar dengan kompresi (tanpa mengubah ukuran)
func saveThumbnail(fileHeader interface{ Read() (io.Reader, error) }, src io.Reader, originalName string) (string, error) {
	uploadDir := "./uploads/thumbnail"
	if err := os.MkdirAll(uploadDir, os.ModePerm); err != nil {
		return "", err
	}

	ext := strings.ToLower(filepath.Ext(originalName))
	allowedExts := map[string]bool{".jpg": true, ".jpeg": true, ".png": true}
	if !allowedExts[ext] {
		return "", fmt.Errorf("format file tidak didukung")
	}

	// Decode gambar
	img, err := imaging.Decode(src)
	if err != nil {
		return "", fmt.Errorf("gagal membaca gambar: %v", err)
	}

	// Generate unique filename
	rand.Seed(time.Now().UnixNano())
	filename := fmt.Sprintf("%d_%d%s", time.Now().Unix(), rand.Intn(9999), ext)
	outPath := filepath.Join(uploadDir, filename)

	f, err := os.Create(outPath)
	if err != nil {
		return "", err
	}
	defer f.Close()

	// Kompres & simpan tanpa resize (quality 75 untuk JPEG, PNG tetap lossless)
	switch ext {
	case ".jpg", ".jpeg":
		var buf bytes.Buffer
		if err := jpeg.Encode(&buf, img, &jpeg.Options{Quality: 75}); err != nil {
			return "", err
		}
		if _, err := f.Write(buf.Bytes()); err != nil {
			return "", err
		}
	case ".png":
		var buf bytes.Buffer
		if err := png.Encode(&buf, img); err != nil {
			return "", err
		}
		if _, err := f.Write(buf.Bytes()); err != nil {
			return "", err
		}
	}

	_ = img // keep import
	return "/uploads/thumbnail/" + filename, nil
}

// saveBerkas menyimpan file dokumen pendukung (PDF, DOC, DOCX, XLS, XLSX)
func saveBerkas(src io.Reader, originalName string) (string, error) {
	uploadDir := "./uploads/berkas"
	if err := os.MkdirAll(uploadDir, os.ModePerm); err != nil {
		return "", err
	}

	ext := strings.ToLower(filepath.Ext(originalName))
	allowedExts := map[string]bool{
		".pdf":  true,
		".doc":  true,
		".docx": true,
		".xls":  true,
		".xlsx": true,
	}
	if !allowedExts[ext] {
		return "", fmt.Errorf("format berkas tidak didukung, gunakan PDF/DOC/DOCX/XLS/XLSX")
	}

	rand.Seed(time.Now().UnixNano())
	filename := fmt.Sprintf("%d_%d%s", time.Now().Unix(), rand.Intn(9999), ext)
	outPath := filepath.Join(uploadDir, filename)

	f, err := os.Create(outPath)
	if err != nil {
		return "", err
	}
	defer f.Close()

	if _, err := io.Copy(f, src); err != nil {
		return "", err
	}

	return "/uploads/berkas/" + filename, nil
}

// GetArtikel godoc
// @Summary      Get list artikel
// @Description  Get paginated artikel dengan filter status dan is_priority
// @Tags         Artikel
// @Accept       json
// @Produce      json
// @Param        page       query     int     false  "Page" default(1)
// @Param        limit      query     int     false  "Limit" default(10)
// @Param        search     query     string  false  "Cari berdasarkan judul"
// @Param        status     query     string  false  "Filter status: publish / draft"
// @Param        priority   query     bool    false  "Filter is_priority"
// @Param secret-to-apps header string true "API secret key" default(Z9ToSwagger1413999)
// @Success      200  {object}  Response
// @Failure      500  {object}  Response
// @Router       /api/artikel [get]
func GetArtikel(c echo.Context) error {
	data := &Paginate{Model: &model.Artikel{}}
	query := connection.DB.Model(&model.Artikel{}).Preload("Category").Preload("User")

	if search := c.QueryParam("search"); search != "" {
		query = query.Where("judul ILIKE ?", "%"+search+"%")
	}
	if status := c.QueryParam("status"); status != "" {
		query = query.Where("status = ?", status)
	}
	if priority := c.QueryParam("priority"); priority == "true" {
		query = query.Where("is_priority = ?", true)
	}

	result := data.Paginate(query, c)

	// Selalu ambil top 1 is_priority=true artikel yang berstatus publish
	var headline *model.Artikel
	var h model.Artikel
	if err := connection.DB.
		Preload("Category").Preload("User").
		Where("is_priority = ? AND status = ?", true, "publish").
		Order("updated_at DESC").
		Limit(1).
		First(&h).Error; err == nil {
		headline = &h
	}

	return c.JSON(http.StatusOK, Response{
		Status:  true,
		Message: "Success get data",
		Data: map[string]interface{}{
			"headline": headline,
			"list":     result,
		},
	})
}

// GetArtikelByID godoc
// @Summary      Get artikel by ID
// @Tags         Artikel
// @Param        id   path      int  true  "Artikel ID"
// @Param secret-to-apps header string true "API secret key" default(Z9ToSwagger1413999)
// @Success      200  {object}  Response
// @Failure      404  {object}  Response
// @Router       /api/artikel/{id} [get]
func GetArtikelByID(c echo.Context) error {
	id := c.Param("id")
	var a model.Artikel
	if err := connection.DB.Preload("Category").Preload("User").First(&a, id).Error; err != nil {
		return c.JSON(http.StatusNotFound, Response{Status: false, Message: "Artikel tidak ditemukan"})
	}
	return c.JSON(http.StatusOK, Response{Status: true, Message: "Success", Data: a})
}

// GetArtikelBySlug godoc
// @Summary      Get artikel by Slug (for public page)
// @Tags         Artikel
// @Param        slug path string true "Artikel Slug"
// @Success      200  {object}  Response
// @Failure      404  {object}  Response
// @Param secret-to-apps header string true "API secret key" default(Z9ToSwagger1413999)
// @Router       /api/artikel/slug/{slug} [get]
func GetArtikelBySlug(c echo.Context) error {
	slug := c.Param("slug")
	var a model.Artikel
	if err := connection.DB.Preload("Category").Preload("User").Where("slug = ? AND status = 'publish'", slug).First(&a).Error; err != nil {
		return c.JSON(http.StatusNotFound, Response{Status: false, Message: "Artikel tidak ditemukan"})
	}
	return c.JSON(http.StatusOK, Response{Status: true, Message: "Success", Data: a})
}

// CreateArtikel godoc
// @Summary      Create artikel baru
// @Description  Supports multipart/form-data dengan thumbnail upload + kompresi otomatis
// @Tags         Artikel
// @Accept       multipart/form-data
// @Produce      json
// @Param        judul        formData  string  true   "Judul"
// @Param        konten       formData  string  true   "Konten Markdown"
// @Param        deskripsi    formData  string  false  "Deskripsi singkat"
// @Param        status       formData  string  true   "Status: publish / draft"
// @Param        is_priority  formData  bool    false  "Apakah headline?"
// @Param        category_id  formData  int     false  "Category ID"
// @Param        thumbnail    formData  file    false  "File gambar thumbnail"
// @Param secret-to-apps header string true "API secret key" default(Z9ToSwagger1413999)
// @Success      201  {object}  Response
// @Failure      400  {object}  Response
// @Router       /api/artikel [post]
func CreateArtikel(c echo.Context) error {
	judul := c.FormValue("judul")
	if judul == "" {
		return c.JSON(http.StatusBadRequest, Response{Status: false, Message: "Judul wajib diisi"})
	}

	isPriority, _ := strconv.ParseBool(c.FormValue("is_priority"))
	categoryIDStr := c.FormValue("category_id")
	var categoryID *uint
	if categoryIDStr != "" {
		cid, err := strconv.ParseUint(categoryIDStr, 10, 64)
		if err == nil {
			uid := uint(cid)
			categoryID = &uid
		}
	}

	artikel := model.Artikel{
		Judul:      judul,
		Slug:       slugify(judul) + "-" + strconv.FormatInt(time.Now().Unix(), 10),
		Konten:     c.FormValue("konten"),
		Deskripsi:  c.FormValue("deskripsi"),
		Status:     c.FormValue("status"),
		IsPriority: isPriority,
		CategoryID: categoryID,
	}

	// user_id penulis
	if userIDStr := c.FormValue("user_id"); userIDStr != "" {
		uid, err := strconv.ParseUint(userIDStr, 10, 64)
		if err == nil {
			uidUint := uint(uid)
			artikel.UserID = &uidUint
		}
	}

	// Handle thumbnail upload
	file, err := c.FormFile("thumbnail")
	if err == nil {
		src, openErr := file.Open()
		if openErr == nil {
			defer src.Close()
			thumbPath, uploadErr := saveThumbnail(nil, src, file.Filename)
			if uploadErr == nil {
				artikel.Thumbnail = thumbPath
			}
		}
	}

	// Handle berkas pendukung (PDF/DOC/Excel)
	berkasFile, berkasErr := c.FormFile("berkas")
	if berkasErr == nil {
		bsrc, bopenErr := berkasFile.Open()
		if bopenErr == nil {
			defer bsrc.Close()
			berkasPath, buploadErr := saveBerkas(bsrc, berkasFile.Filename)
			if buploadErr == nil {
				artikel.Berkas = berkasPath
			}
		}
	}

	if err := connection.DB.Create(&artikel).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, Response{Status: false, Message: "Gagal menyimpan artikel"})
	}

	return c.JSON(http.StatusCreated, Response{Status: true, Message: "Artikel berhasil dibuat", Data: artikel})
}

// UpdateArtikel godoc
// @Summary      Update artikel
// @Tags         Artikel
// @Accept       multipart/form-data
// @Produce      json
// @Param        id           path      int     true   "Artikel ID"
// @Param        judul        formData  string  false  "Judul"
// @Param        konten       formData  string  false  "Konten"
// @Param        deskripsi    formData  string  false  "Deskripsi"
// @Param        status       formData  string  false  "Status: publish / draft"
// @Param        is_priority  formData  bool    false  "Headline?"
// @Param        category_id  formData  int     false  "Category ID"
// @Param        user_id      formData  int     false  "User ID"
// @Param        thumbnail    formData  file    false  "Thumbnail baru (opsional)"
// @Param secret-to-apps header string true "API secret key" default(Z9ToSwagger1413999)
// @Success      200  {object}  Response
// @Failure      404  {object}  Response
// @Router       /api/artikel/{id} [put]
func UpdateArtikel(c echo.Context) error {
	id := c.Param("id")
	var artikel model.Artikel
	if err := connection.DB.First(&artikel, id).Error; err != nil {
		return c.JSON(http.StatusNotFound, Response{Status: false, Message: "Artikel tidak ditemukan"})
	}

	if judul := c.FormValue("judul"); judul != "" {
		artikel.Judul = judul
	}
	if konten := c.FormValue("konten"); konten != "" {
		artikel.Konten = konten
	}
	if deskripsi := c.FormValue("deskripsi"); deskripsi != "" {
		artikel.Deskripsi = deskripsi
	}
	if status := c.FormValue("status"); status != "" {
		artikel.Status = status
	}
	if isPriorityStr := c.FormValue("is_priority"); isPriorityStr != "" {
		isPriority, _ := strconv.ParseBool(isPriorityStr)
		artikel.IsPriority = isPriority
	}
	// user_id penulis (update opsional)
	if userIDStr := c.FormValue("user_id"); userIDStr != "" {
		uid, err := strconv.ParseUint(userIDStr, 10, 64)
		if err == nil {
			uidUint := uint(uid)
			artikel.UserID = &uidUint
		}
	}

	categoryIDStr := c.FormValue("category_id")
	if categoryIDStr != "" {
		cid, err := strconv.ParseUint(categoryIDStr, 10, 64)
		if err == nil {
			uid := uint(cid)
			artikel.CategoryID = &uid
		}
	}

	// Thumbnail baru (opsional)
	file, err := c.FormFile("thumbnail")
	if err == nil {
		src, openErr := file.Open()
		if openErr == nil {
			defer src.Close()
			thumbPath, uploadErr := saveThumbnail(nil, src, file.Filename)
			if uploadErr == nil {
				// Hapus thumbnail lama
				if artikel.Thumbnail != "" {
					_ = os.Remove("." + artikel.Thumbnail)
				}
				artikel.Thumbnail = thumbPath
			}
		}
	}

	// Berkas pendukung baru (opsional)
	berkasFile, berkasErr := c.FormFile("berkas")
	if berkasErr == nil {
		bsrc, bopenErr := berkasFile.Open()
		if bopenErr == nil {
			defer bsrc.Close()
			berkasPath, buploadErr := saveBerkas(bsrc, berkasFile.Filename)
			if buploadErr == nil {
				// Hapus berkas lama
				if artikel.Berkas != "" {
					_ = os.Remove("." + artikel.Berkas)
				}
				artikel.Berkas = berkasPath
			}
		}
	}

	if err := connection.DB.Save(&artikel).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, Response{Status: false, Message: "Gagal update artikel"})
	}

	return c.JSON(http.StatusOK, Response{Status: true, Message: "Artikel berhasil diperbarui", Data: artikel})
}

// DeleteArtikel godoc
// @Summary      Delete artikel
// @Tags         Artikel
// @Param        id path int true "Artikel ID"
// @Param secret-to-apps header string true "API secret key" default(Z9ToSwagger1413999)
// @Success      200  {object}  Response
// @Failure      404  {object}  Response
// @Router       /api/artikel/{id} [delete]
func DeleteArtikel(c echo.Context) error {
	id := c.Param("id")
	var artikel model.Artikel
	if err := connection.DB.First(&artikel, id).Error; err != nil {
		return c.JSON(http.StatusNotFound, Response{Status: false, Message: "Artikel tidak ditemukan"})
	}

	// Hapus file thumbnail
	if artikel.Thumbnail != "" {
		_ = os.Remove("." + artikel.Thumbnail)
	}

	if err := connection.DB.Delete(&artikel).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, Response{Status: false, Message: "Gagal menghapus artikel"})
	}

	return c.JSON(http.StatusOK, Response{Status: true, Message: "Artikel dihapus"})
}
