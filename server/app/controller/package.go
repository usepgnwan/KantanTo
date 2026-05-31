package controller

import (
	"encoding/json"
	"math"
	"net/http"
	"server/app/helpers"
	"server/app/model"
	"server/connection"
	"strconv"
	"time"

	"github.com/labstack/echo/v4"
	"gorm.io/gorm"
)

type packageListResponse struct {
	ID             uint     `json:"id"`
	Slug           string   `json:"slug"`
	Title          string   `json:"title"`
	Description    string   `json:"description"`
	Price          float64  `json:"price"`
	Category       string   `json:"category"`
	Classes        []string `json:"classes"`
	Subjects       []string `json:"subjects"`
	Duration       int      `json:"duration"`
	Status         string   `json:"status"`
	Thumbnail      string   `json:"thumbnail"`
	QuestionsCount int64    `json:"questions_count"`
	MaterialsCount int64    `json:"materials_count"`
	VideosCount    int64    `json:"videos_count"`
}

type packageCreatePayload struct {
	Slug        string   `json:"slug"`
	Title       string   `json:"title"`
	Description string   `json:"description"`
	Price       float64  `json:"price"`
	Category    string   `json:"category"`
	Classes     []string `json:"classes"`
	Subjects    []string `json:"subjects"`
	Duration    int      `json:"duration"`
	Status      string   `json:"status"`
	Thumbnail   string   `json:"thumbnail"`
}

func mapPackageResponse(pkg model.Package, qCount, mCount, vCount int64) packageListResponse {
	classes := jsonStringSlice(pkg.ClassesJSON)
	if classes == nil {
		classes = []string{}
	}
	subjects := jsonStringSlice(pkg.SubjectsJSON)
	if subjects == nil {
		subjects = []string{}
	}
	return packageListResponse{
		ID:             pkg.ID,
		Slug:           pkg.Slug,
		Title:          pkg.Title,
		Description:    pkg.Description,
		Price:          pkg.Price,
		Category:       pkg.Category,
		Classes:        classes,
		Subjects:       subjects,
		Duration:       pkg.Duration,
		Status:         pkg.Status,
		Thumbnail:      pkg.Thumbnail,
		QuestionsCount: qCount,
		MaterialsCount: mCount,
		VideosCount:    vCount,
	}
}

func GetPackages(c echo.Context) error {
	var packages []model.Package
	if err := connection.DB.Order("id asc").Find(&packages).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, helpers.Response{Status: false, Message: "Gagal mengambil daftar paket"})
	}

	result := make([]packageListResponse, 0, len(packages))
	for _, pkg := range packages {
		var qCount, mCount, vCount int64
		connection.DB.Model(&model.PackageQuestion{}).Where("package_id = ?", pkg.ID).Count(&qCount)
		connection.DB.Model(&model.PackageMaterial{}).Where("package_id = ?", pkg.ID).Count(&mCount)
		connection.DB.Model(&model.PackageVideo{}).Where("package_id = ?", pkg.ID).Count(&vCount)
		result = append(result, mapPackageResponse(pkg, qCount, mCount, vCount))
	}

	return c.JSON(http.StatusOK, helpers.Response{Status: true, Message: "Success", Data: result})
}

func CreatePackage(c echo.Context) error {
	payload := new(packageCreatePayload)
	if err := c.Bind(payload); err != nil {
		return c.JSON(http.StatusBadRequest, helpers.Response{Status: false, Message: err.Error()})
	}
	if payload.Slug == "" {
		return c.JSON(http.StatusBadRequest, helpers.Response{Status: false, Message: "Slug wajib diisi"})
	}

	classesJSON := toJSON(payload.Classes)
	subjectsJSON := toJSON(payload.Subjects)
	if payload.Status == "" {
		payload.Status = "draft"
	}

	pkg := model.Package{
		Slug:         payload.Slug,
		Title:        payload.Title,
		Description:  payload.Description,
		Price:        payload.Price,
		Category:     payload.Category,
		ClassesJSON:  classesJSON,
		SubjectsJSON: subjectsJSON,
		Duration:     payload.Duration,
		Status:       payload.Status,
		Thumbnail:    payload.Thumbnail,
	}
	if err := connection.DB.Create(&pkg).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, helpers.Response{Status: false, Message: "Gagal membuat paket: " + err.Error()})
	}

	return c.JSON(http.StatusOK, helpers.Response{Status: true, Message: "Paket berhasil dibuat", Data: mapPackageResponse(pkg, 0, 0, 0)})
}

func UpdatePackage(c echo.Context) error {
	slug := c.Param("slug")
	payload := new(packageCreatePayload)
	if err := c.Bind(payload); err != nil {
		return c.JSON(http.StatusBadRequest, helpers.Response{Status: false, Message: err.Error()})
	}

	var pkg model.Package
	if err := connection.DB.Where("slug = ?", slug).First(&pkg).Error; err != nil {
		return c.JSON(http.StatusNotFound, helpers.Response{Status: false, Message: "Paket tidak ditemukan"})
	}

	pkg.Title = payload.Title
	pkg.Description = payload.Description
	pkg.Price = payload.Price
	pkg.Category = payload.Category
	pkg.ClassesJSON = toJSON(payload.Classes)
	pkg.SubjectsJSON = toJSON(payload.Subjects)
	pkg.Duration = payload.Duration
	pkg.Status = payload.Status
	pkg.Thumbnail = payload.Thumbnail

	if err := connection.DB.Save(&pkg).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, helpers.Response{Status: false, Message: "Gagal memperbarui paket"})
	}

	var qCount, mCount, vCount int64
	connection.DB.Model(&model.PackageQuestion{}).Where("package_id = ?", pkg.ID).Count(&qCount)
	connection.DB.Model(&model.PackageMaterial{}).Where("package_id = ?", pkg.ID).Count(&mCount)
	connection.DB.Model(&model.PackageVideo{}).Where("package_id = ?", pkg.ID).Count(&vCount)

	return c.JSON(http.StatusOK, helpers.Response{Status: true, Message: "Paket berhasil diperbarui", Data: mapPackageResponse(pkg, qCount, mCount, vCount)})
}

func DeletePackage(c echo.Context) error {
	slug := c.Param("slug")
	if err := connection.DB.Where("slug = ?", slug).Delete(&model.Package{}).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, helpers.Response{Status: false, Message: "Gagal menghapus paket"})
	}
	return c.JSON(http.StatusOK, helpers.Response{Status: true, Message: "Paket berhasil dihapus"})
}

func findPackageBySlug(c echo.Context) (model.Package, error) {
	slug := c.Param("slug")
	var pkg model.Package
	err := connection.DB.Where("slug = ?", slug).First(&pkg).Error
	return pkg, err
}

const (
	QuestionTypeSingle   = "single"
	QuestionTypeMultiple = "multiple"
	QuestionTypeNested   = "nested"

	ScoringAllOrNothing = "all_or_nothing"
	ScoringPartial      = "partial"
)

type packageQuestionPayload struct {
	ID             string               `json:"id"`
	Type           string               `json:"type"`
	Title          string               `json:"title"`
	Question       string               `json:"question"`
	Discussion     string               `json:"discussion"`
	Options        []string             `json:"options"`
	Correct        interface{}          `json:"correct"`
	DiscussionRefs []string             `json:"discussion_refs"`
	Points         float64              `json:"points"`
	ScoringMethod  string               `json:"scoring_method"`
	SubQuestions   []subQuestionPayload `json:"sub_questions"`
}

type subQuestionPayload struct {
	ID         string      `json:"id"`
	Type       string      `json:"type"`
	Question   string      `json:"question"`
	Discussion string      `json:"discussion"`
	Options    []string    `json:"options"`
	Correct    interface{} `json:"correct"`
	Points     float64     `json:"points"`
}

type questionResponse struct {
	ID             string                `json:"id"`
	Type           string                `json:"type"`
	Title          string                `json:"title"`
	Question       string                `json:"question"`
	Discussion     string                `json:"discussion"`
	Options        []string              `json:"options"`
	Correct        interface{}           `json:"correct"`
	DiscussionRefs []string              `json:"discussion_refs"`
	Points         float64               `json:"points"`
	ScoringMethod  string                `json:"scoring_method"`
	SubQuestions   []subQuestionResponse `json:"sub_questions,omitempty"`
}

type subQuestionResponse struct {
	ID         string      `json:"id"`
	Type       string      `json:"type"`
	Question   string      `json:"question"`
	Discussion string      `json:"discussion"`
	Options    []string    `json:"options"`
	Correct    interface{} `json:"correct"`
	Points     float64     `json:"points"`
}

type packageMaterialPayload struct {
	ID          string   `json:"id"`
	Title       string   `json:"title"`
	Category    string   `json:"category"`
	Content     string   `json:"content"`
	Attachments []string `json:"attachments"`
}

type packageMaterialResponse struct {
	ID          string   `json:"id"`
	Title       string   `json:"title"`
	Category    string   `json:"category"`
	Content     string   `json:"content"`
	Attachments []string `json:"attachments"`
}

type packageVideoPayload struct {
	ID          string `json:"id"`
	Title       string `json:"title"`
	Duration    string `json:"duration"`
	URL         string `json:"url"`
	Description string `json:"description"`
	MediaType   string `json:"media_type"`
}

type packageVideoResponse struct {
	ID          string `json:"id"`
	Title       string `json:"title"`
	Duration    string `json:"duration"`
	URL         string `json:"url"`
	Description string `json:"description"`
	MediaType   string `json:"media_type"`
}

type scoreRequest struct {
	Type          string          `json:"type"`
	Points        float64         `json:"points"`
	ScoringMethod string          `json:"scoring_method"`
	Options       []string        `json:"options"`
	Correct       []int           `json:"correct"`
	Answer        []int           `json:"answer"`
	SubQuestions  []subScoreInput `json:"sub_questions"`
}

type subScoreInput struct {
	Type    string   `json:"type"`
	Points  float64  `json:"points"`
	Options []string `json:"options"`
	Correct []int    `json:"correct"`
	Answer  []int    `json:"answer"`
}

func GetPackageQuestions(c echo.Context) error {
	pkg, err := findPackageBySlug(c)
	if err != nil {
		return c.JSON(http.StatusNotFound, helpers.Response{Status: false, Message: "Paket tidak ditemukan"})
	}

	var questions []model.PackageQuestion
	if err := connection.DB.
		Where("package_id = ?", pkg.ID).
		Preload("SubQuestions").
		Order("id asc").
		Find(&questions).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, helpers.Response{Status: false, Message: "Gagal mengambil soal"})
	}

	response := make([]questionResponse, 0, len(questions))
	for _, question := range questions {
		response = append(response, mapQuestionResponse(question))
	}

	return c.JSON(http.StatusOK, helpers.Response{Status: true, Message: "Success", Data: response})
}

func SavePackageQuestion(c echo.Context) error {
	pkg, err := findPackageBySlug(c)
	if err != nil {
		return c.JSON(http.StatusNotFound, helpers.Response{Status: false, Message: "Paket tidak ditemukan"})
	}

	payload := new(packageQuestionPayload)
	if err := c.Bind(payload); err != nil {
		return c.JSON(http.StatusBadRequest, helpers.Response{Status: false, Message: err.Error()})
	}

	normalizeQuestionPayload(payload)
	question, err := persistQuestion(pkg.ID, *payload)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, helpers.Response{Status: false, Message: "Gagal menyimpan soal"})
	}

	return c.JSON(http.StatusOK, helpers.Response{Status: true, Message: "Soal berhasil disimpan", Data: mapQuestionResponse(question)})
}

func SavePackageQuestions(c echo.Context) error {
	pkg, err := findPackageBySlug(c)
	if err != nil {
		return c.JSON(http.StatusNotFound, helpers.Response{Status: false, Message: "Paket tidak ditemukan"})
	}

	var payload []packageQuestionPayload
	if err := c.Bind(&payload); err != nil {
		return c.JSON(http.StatusBadRequest, helpers.Response{Status: false, Message: err.Error()})
	}

	response := make([]questionResponse, 0, len(payload))
	err = connection.DB.Transaction(func(tx *gorm.DB) error {
		for i := range payload {
			normalizeQuestionPayload(&payload[i])
			question, err := persistQuestionWithDB(tx, pkg.ID, payload[i])
			if err != nil {
				return err
			}
			response = append(response, mapQuestionResponse(question))
		}
		return nil
	})
	if err != nil {
		return c.JSON(http.StatusInternalServerError, helpers.Response{Status: false, Message: "Gagal menyimpan daftar soal"})
	}

	return c.JSON(http.StatusOK, helpers.Response{Status: true, Message: "Daftar soal berhasil disimpan", Data: response})
}

func ScoreQuestion(c echo.Context) error {
	payload := new(scoreRequest)
	if err := c.Bind(payload); err != nil {
		return c.JSON(http.StatusBadRequest, helpers.Response{Status: false, Message: err.Error()})
	}

	score := scoreByType(*payload)
	return c.JSON(http.StatusOK, helpers.Response{Status: true, Message: "Success", Data: map[string]float64{"score": score}})
}

func GetPackageMaterials(c echo.Context) error {
	pkg, err := findPackageBySlug(c)
	if err != nil {
		return c.JSON(http.StatusNotFound, helpers.Response{Status: false, Message: "Paket tidak ditemukan"})
	}

	var materials []model.PackageMaterial
	if err := connection.DB.
		Where("package_id = ?", pkg.ID).
		Order("id asc").
		Find(&materials).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, helpers.Response{Status: false, Message: "Gagal mengambil materi"})
	}

	response := make([]packageMaterialResponse, 0, len(materials))
	for _, material := range materials {
		response = append(response, mapMaterialResponse(material))
	}

	return c.JSON(http.StatusOK, helpers.Response{Status: true, Message: "Success", Data: response})
}

func SavePackageMaterial(c echo.Context) error {
	pkg, err := findPackageBySlug(c)
	if err != nil {
		return c.JSON(http.StatusNotFound, helpers.Response{Status: false, Message: "Paket tidak ditemukan"})
	}

	payload := new(packageMaterialPayload)
	if err := c.Bind(payload); err != nil {
		return c.JSON(http.StatusBadRequest, helpers.Response{Status: false, Message: err.Error()})
	}

	normalizeMaterialPayload(payload)
	material, err := persistMaterial(pkg.ID, *payload)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, helpers.Response{Status: false, Message: "Gagal menyimpan materi"})
	}

	return c.JSON(http.StatusOK, helpers.Response{Status: true, Message: "Materi berhasil disimpan", Data: mapMaterialResponse(material)})
}

func SavePackageMaterials(c echo.Context) error {
	pkg, err := findPackageBySlug(c)
	if err != nil {
		return c.JSON(http.StatusNotFound, helpers.Response{Status: false, Message: "Paket tidak ditemukan"})
	}

	var payload []packageMaterialPayload
	if err := c.Bind(&payload); err != nil {
		return c.JSON(http.StatusBadRequest, helpers.Response{Status: false, Message: err.Error()})
	}

	response := make([]packageMaterialResponse, 0, len(payload))
	err = connection.DB.Transaction(func(tx *gorm.DB) error {
		for i := range payload {
			normalizeMaterialPayload(&payload[i])
			material, err := persistMaterialWithDB(tx, pkg.ID, payload[i])
			if err != nil {
				return err
			}
			response = append(response, mapMaterialResponse(material))
		}
		return nil
	})
	if err != nil {
		return c.JSON(http.StatusInternalServerError, helpers.Response{Status: false, Message: "Gagal menyimpan daftar materi"})
	}

	return c.JSON(http.StatusOK, helpers.Response{Status: true, Message: "Daftar materi berhasil disimpan", Data: response})
}

func DeletePackageMaterial(c echo.Context) error {
	pkg, err := findPackageBySlug(c)
	if err != nil {
		return c.JSON(http.StatusNotFound, helpers.Response{Status: false, Message: "Paket tidak ditemukan"})
	}

	clientID := c.Param("id")
	if err := connection.DB.Where("package_id = ? AND client_id = ?", pkg.ID, clientID).Delete(&model.PackageMaterial{}).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, helpers.Response{Status: false, Message: "Gagal menghapus materi"})
	}
	return c.JSON(http.StatusOK, helpers.Response{Status: true, Message: "Materi berhasil dihapus"})
}

func GetPackageVideos(c echo.Context) error {
	pkg, err := findPackageBySlug(c)
	if err != nil {
		return c.JSON(http.StatusNotFound, helpers.Response{Status: false, Message: "Paket tidak ditemukan"})
	}

	var videos []model.PackageVideo
	if err := connection.DB.
		Where("package_id = ?", pkg.ID).
		Order("id asc").
		Find(&videos).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, helpers.Response{Status: false, Message: "Gagal mengambil video"})
	}

	response := make([]packageVideoResponse, 0, len(videos))
	for _, video := range videos {
		response = append(response, mapVideoResponse(video))
	}

	return c.JSON(http.StatusOK, helpers.Response{Status: true, Message: "Success", Data: response})
}

func SavePackageVideo(c echo.Context) error {
	pkg, err := findPackageBySlug(c)
	if err != nil {
		return c.JSON(http.StatusNotFound, helpers.Response{Status: false, Message: "Paket tidak ditemukan"})
	}

	payload := new(packageVideoPayload)
	if err := c.Bind(payload); err != nil {
		return c.JSON(http.StatusBadRequest, helpers.Response{Status: false, Message: err.Error()})
	}

	normalizeVideoPayload(payload)
	video, err := persistVideo(pkg.ID, *payload)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, helpers.Response{Status: false, Message: "Gagal menyimpan video"})
	}

	return c.JSON(http.StatusOK, helpers.Response{Status: true, Message: "Video berhasil disimpan", Data: mapVideoResponse(video)})
}

func SavePackageVideos(c echo.Context) error {
	pkg, err := findPackageBySlug(c)
	if err != nil {
		return c.JSON(http.StatusNotFound, helpers.Response{Status: false, Message: "Paket tidak ditemukan"})
	}

	var payload []packageVideoPayload
	if err := c.Bind(&payload); err != nil {
		return c.JSON(http.StatusBadRequest, helpers.Response{Status: false, Message: err.Error()})
	}

	response := make([]packageVideoResponse, 0, len(payload))
	err = connection.DB.Transaction(func(tx *gorm.DB) error {
		for i := range payload {
			normalizeVideoPayload(&payload[i])
			video, err := persistVideoWithDB(tx, pkg.ID, payload[i])
			if err != nil {
				return err
			}
			response = append(response, mapVideoResponse(video))
		}
		return nil
	})
	if err != nil {
		return c.JSON(http.StatusInternalServerError, helpers.Response{Status: false, Message: "Gagal menyimpan daftar video"})
	}

	return c.JSON(http.StatusOK, helpers.Response{Status: true, Message: "Daftar video berhasil disimpan", Data: response})
}

func DeletePackageVideo(c echo.Context) error {
	pkg, err := findPackageBySlug(c)
	if err != nil {
		return c.JSON(http.StatusNotFound, helpers.Response{Status: false, Message: "Paket tidak ditemukan"})
	}

	clientID := c.Param("id")
	if err := connection.DB.Where("package_id = ? AND client_id = ?", pkg.ID, clientID).Delete(&model.PackageVideo{}).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, helpers.Response{Status: false, Message: "Gagal menghapus video"})
	}
	return c.JSON(http.StatusOK, helpers.Response{Status: true, Message: "Video berhasil dihapus"})
}

func persistQuestion(packageID uint, payload packageQuestionPayload) (model.PackageQuestion, error) {
	return persistQuestionWithDB(connection.DB, packageID, payload)
}

func persistMaterial(packageID uint, payload packageMaterialPayload) (model.PackageMaterial, error) {
	return persistMaterialWithDB(connection.DB, packageID, payload)
}

func persistVideo(packageID uint, payload packageVideoPayload) (model.PackageVideo, error) {
	return persistVideoWithDB(connection.DB, packageID, payload)
}

func persistQuestionWithDB(db *gorm.DB, packageID uint, payload packageQuestionPayload) (model.PackageQuestion, error) {
	optionsJSON := toJSON(payload.Options)
	correctJSON := toJSON(payload.Correct)
	discussionJSON := toJSON(payload.DiscussionRefs)

	question := model.PackageQuestion{}
	err := db.Where("package_id = ? AND client_id = ?", packageID, payload.ID).First(&question).Error
	if err != nil && err != gorm.ErrRecordNotFound {
		return question, err
	}

	question.PackageID = packageID
	question.ClientID = payload.ID
	question.Type = payload.Type
	question.Title = payload.Title
	question.Question = payload.Question
	question.Discussion = payload.Discussion
	question.OptionsJSON = optionsJSON
	question.CorrectJSON = correctJSON
	question.DiscussionJSON = discussionJSON
	question.Points = payload.Points
	question.ScoringMethod = payload.ScoringMethod

	if err == gorm.ErrRecordNotFound {
		if err := db.Create(&question).Error; err != nil {
			return question, err
		}
	} else if err := db.Save(&question).Error; err != nil {
		return question, err
	}

	if err := db.Where("question_id = ?", question.ID).Delete(&model.PackageSubQuestion{}).Error; err != nil {
		return question, err
	}
	for _, sub := range payload.SubQuestions {
		if sub.Type == "" {
			sub.Type = QuestionTypeSingle
		}
		row := model.PackageSubQuestion{
			QuestionID:  question.ID,
			ClientID:    sub.ID,
			Type:        sub.Type,
			Question:    sub.Question,
			Discussion:  sub.Discussion,
			OptionsJSON: toJSON(sub.Options),
			CorrectJSON: toJSON(sub.Correct),
			Points:      sub.Points,
		}
		if err := db.Create(&row).Error; err != nil {
			return question, err
		}
	}

	if err := db.Preload("SubQuestions").First(&question, question.ID).Error; err != nil {
		return question, err
	}
	return question, nil
}

func persistMaterialWithDB(db *gorm.DB, packageID uint, payload packageMaterialPayload) (model.PackageMaterial, error) {
	material := model.PackageMaterial{}
	err := db.Where("package_id = ? AND client_id = ?", packageID, payload.ID).First(&material).Error
	if err != nil && err != gorm.ErrRecordNotFound {
		return material, err
	}

	material.PackageID = packageID
	material.ClientID = payload.ID
	material.Title = payload.Title
	material.Category = payload.Category
	material.Content = payload.Content
	material.AttachmentsJSON = toJSON(payload.Attachments)

	if err == gorm.ErrRecordNotFound {
		if err := db.Create(&material).Error; err != nil {
			return material, err
		}
	} else if err := db.Save(&material).Error; err != nil {
		return material, err
	}

	return material, nil
}

func persistVideoWithDB(db *gorm.DB, packageID uint, payload packageVideoPayload) (model.PackageVideo, error) {
	video := model.PackageVideo{}
	err := db.Where("package_id = ? AND client_id = ?", packageID, payload.ID).First(&video).Error
	if err != nil && err != gorm.ErrRecordNotFound {
		return video, err
	}

	video.PackageID = packageID
	video.ClientID = payload.ID
	video.Title = payload.Title
	video.Duration = payload.Duration
	video.URL = payload.URL
	video.Description = payload.Description
	video.MediaType = payload.MediaType

	if err == gorm.ErrRecordNotFound {
		if err := db.Create(&video).Error; err != nil {
			return video, err
		}
	} else if err := db.Save(&video).Error; err != nil {
		return video, err
	}

	return video, nil
}

func normalizeQuestionPayload(payload *packageQuestionPayload) {
	if payload.Type == "" {
		payload.Type = QuestionTypeSingle
	}
	if payload.ScoringMethod == "" {
		payload.ScoringMethod = ScoringAllOrNothing
	}
	if payload.Type == QuestionTypeNested {
		total := 0.0
		for i := range payload.SubQuestions {
			total += payload.SubQuestions[i].Points
		}
		payload.Points = total
	}
}

func normalizeMaterialPayload(payload *packageMaterialPayload) {
	if payload.ID == "" {
		payload.ID = strconv.FormatInt(time.Now().UnixNano(), 10)
	}
	if payload.Category == "" {
		payload.Category = "Umum"
	}
	if payload.Attachments == nil {
		payload.Attachments = []string{}
	}
}

func normalizeVideoPayload(payload *packageVideoPayload) {
	if payload.ID == "" {
		payload.ID = strconv.FormatInt(time.Now().UnixNano(), 10)
	}
	if payload.MediaType == "" {
		payload.MediaType = "video"
	}
}

func mapQuestionResponse(question model.PackageQuestion) questionResponse {
	response := questionResponse{
		ID:             question.ClientID,
		Type:           question.Type,
		Title:          question.Title,
		Question:       question.Question,
		Discussion:     question.Discussion,
		Options:        jsonStringSlice(question.OptionsJSON),
		Correct:        jsonAny(question.CorrectJSON),
		DiscussionRefs: jsonStringSlice(question.DiscussionJSON),
		Points:         question.Points,
		ScoringMethod:  question.ScoringMethod,
		SubQuestions:   make([]subQuestionResponse, 0, len(question.SubQuestions)),
	}
	for _, sub := range question.SubQuestions {
		response.SubQuestions = append(response.SubQuestions, subQuestionResponse{
			ID:         sub.ClientID,
			Type:       sub.Type,
			Question:   sub.Question,
			Discussion: sub.Discussion,
			Options:    jsonStringSlice(sub.OptionsJSON),
			Correct:    jsonAny(sub.CorrectJSON),
			Points:     sub.Points,
		})
	}
	return response
}

func mapMaterialResponse(material model.PackageMaterial) packageMaterialResponse {
	return packageMaterialResponse{
		ID:          material.ClientID,
		Title:       material.Title,
		Category:    material.Category,
		Content:     material.Content,
		Attachments: jsonStringSlice(material.AttachmentsJSON),
	}
}

func mapVideoResponse(video model.PackageVideo) packageVideoResponse {
	return packageVideoResponse{
		ID:          video.ClientID,
		Title:       video.Title,
		Duration:    video.Duration,
		URL:         video.URL,
		Description: video.Description,
		MediaType:   video.MediaType,
	}
}

func scoreByType(payload scoreRequest) float64 {
	if payload.Type == QuestionTypeNested {
		total := 0.0
		for _, sub := range payload.SubQuestions {
			total += scoreMultiple(sub.Type, sub.Points, ScoringAllOrNothing, sub.Options, sub.Correct, sub.Answer)
		}
		return roundScore(total)
	}

	if payload.Type == QuestionTypeSingle {
		return scoreMultiple(payload.Type, payload.Points, ScoringAllOrNothing, payload.Options, payload.Correct, payload.Answer)
	}

	return scoreMultiple(payload.Type, payload.Points, payload.ScoringMethod, payload.Options, payload.Correct, payload.Answer)
}

func scoreMultiple(questionType string, maxPoints float64, scoringMethod string, options []string, correct []int, answer []int) float64 {
	if questionType == QuestionTypeSingle || scoringMethod == ScoringAllOrNothing {
		if sameIntSet(correct, answer) {
			return roundScore(maxPoints)
		}
		return 0
	}

	correctSet := intSet(correct)
	answerSet := intSet(answer)
	correctSelected := 0
	wrongSelected := 0
	for selected := range answerSet {
		if correctSet[selected] {
			correctSelected++
		} else {
			wrongSelected++
		}
	}

	totalCorrect := len(correctSet)
	totalWrong := len(options) - totalCorrect
	if totalCorrect == 0 {
		return 0
	}

	score := (float64(correctSelected) / float64(totalCorrect)) * maxPoints
	if totalWrong > 0 {
		score -= (float64(wrongSelected) / float64(totalWrong)) * maxPoints
	}
	if score < 0 {
		score = 0
	}
	return roundScore(score)
}

func sameIntSet(a []int, b []int) bool {
	if len(a) != len(b) {
		return false
	}
	aSet := intSet(a)
	for _, item := range b {
		if !aSet[item] {
			return false
		}
	}
	return true
}

func intSet(items []int) map[int]bool {
	set := make(map[int]bool, len(items))
	for _, item := range items {
		set[item] = true
	}
	return set
}

func roundScore(value float64) float64 {
	return math.Round(value*100) / 100
}

func toJSON(value interface{}) string {
	raw, err := json.Marshal(value)
	if err != nil {
		return "null"
	}
	return string(raw)
}

func jsonStringSlice(raw string) []string {
	var value []string
	if err := json.Unmarshal([]byte(raw), &value); err != nil {
		return []string{}
	}
	return value
}

func jsonAny(raw string) interface{} {
	var value interface{}
	if err := json.Unmarshal([]byte(raw), &value); err != nil {
		return nil
	}
	return value
}
