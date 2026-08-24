package controller

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"server/app/model"
	"server/connection"
	"regexp"
	"strconv"
	"strings"
	"time"

	"github.com/labstack/echo/v4"
)

// GetProgressAnalysis gets the current analysis for the user
func GetProgressAnalysis(c echo.Context) error {
	userIDStr := c.QueryParam("user_id")
	if userIDStr == "" {
		return c.JSON(http.StatusBadRequest, map[string]interface{}{"status": false, "message": "user_id is required"})
	}
	userID, _ := strconv.Atoi(userIDStr)

	var analysis model.ProgressAnalysis
	if err := connection.DB.Where("user_id = ?", userID).Order("created_at desc").First(&analysis).Error; err != nil {
		return c.JSON(http.StatusOK, map[string]interface{}{
			"status":  true,
			"message": "No analysis found",
			"data":    nil,
		})
	}

	canDelete := time.Since(analysis.CreatedAt).Hours() >= 24*7

	return c.JSON(http.StatusOK, map[string]interface{}{
		"status":  true,
		"message": "Success",
		"data": map[string]interface{}{
			"id":            analysis.ID,
			"session_ids":   strings.Split(analysis.SessionIDs, ","),
			"analysis_text": analysis.AnalysisText,
			"created_at":    analysis.CreatedAt,
			"can_delete":    canDelete,
		},
	})
}

// GenerateProgressAnalysis generates a new analysis using Groq
func GenerateProgressAnalysis(c echo.Context) error {
	type RequestBody struct {
		UserID     uint   `json:"user_id"`
		SessionIDs []uint `json:"session_ids"`
	}
	var req RequestBody
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]interface{}{"status": false, "message": "Invalid request body"})
	}

	if req.UserID == 0 {
		return c.JSON(http.StatusBadRequest, map[string]interface{}{"status": false, "message": "user_id is required"})
	}

	if len(req.SessionIDs) == 0 || len(req.SessionIDs) > 2 {
		return c.JSON(http.StatusBadRequest, map[string]interface{}{"status": false, "message": "Pilih 1 atau 2 sesi ujian"})
	}

	// Check if active analysis exists
	var existing model.ProgressAnalysis
	if err := connection.DB.Where("user_id = ?", req.UserID).Order("created_at desc").First(&existing).Error; err == nil {
		return c.JSON(http.StatusBadRequest, map[string]interface{}{"status": false, "message": "Analisis sudah ada. Anda hanya dapat membuat yang baru setelah menghapus yang lama (setelah 1 minggu)."})
	}

	// Fetch wrong answers from these sessions
	var answers []model.ExamAnswer
	if err := connection.DB.
		Where("session_id IN (?) AND is_correct = false", req.SessionIDs).
		Find(&answers).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]interface{}{"status": false, "message": "Failed to fetch answers"})
	}

	if len(answers) == 0 {
		return c.JSON(http.StatusBadRequest, map[string]interface{}{"status": false, "message": "Tidak ada soal yang salah pada sesi yang dipilih."})
	}

	// Fetch question details for prompt
	var questionIDs []uint
	for _, ans := range answers {
		questionIDs = append(questionIDs, ans.QuestionID)
	}

	var questions []model.PackageQuestion
	connection.DB.Where("id IN (?)", questionIDs).Find(&questions)

	questionMap := make(map[uint]model.PackageQuestion)
	for _, q := range questions {
		questionMap[q.ID] = q
	}

	// Regex to strip base64 image data
	base64Regex := regexp.MustCompile(`data:image/[^"']+;base64,[^"']+`)

	// Build the prompt
	var promptBuilder strings.Builder
	promptBuilder.WriteString("Berikut adalah daftar soal yang dijawab salah oleh siswa (soal bergambar diabaikan). Tolong berikan analisis progres dan saran belajar singkat sebagai seorang guru yang memotivasi. Fokus pada identifikasi konsep yang belum dipahami.\n\n")

	validQuestionCount := 0
	for i, ans := range answers {
		q, ok := questionMap[ans.QuestionID]
		if !ok {
			continue
		}
		
		// If question or options contain base64 image, skip this question entirely
		if base64Regex.MatchString(q.Question) || base64Regex.MatchString(q.OptionsJSON) {
			continue
		}

		promptBuilder.WriteString(fmt.Sprintf("Soal %d: %s\n", i+1, q.Question))
		promptBuilder.WriteString(fmt.Sprintf("Pilihan Ganda: %s\n", q.OptionsJSON))
		promptBuilder.WriteString(fmt.Sprintf("Jawaban Siswa (indeks salah): %s\n", ans.SelectedOptionsJSON))
		promptBuilder.WriteString(fmt.Sprintf("Jawaban Benar (indeks): %s\n\n", q.CorrectJSON))
		validQuestionCount++
	}

	if validQuestionCount == 0 {
		return c.JSON(http.StatusBadRequest, map[string]interface{}{"status": false, "message": "Semua soal yang dijawab salah berisi gambar sehingga tidak dapat dikirim ke AI untuk menghindari limit kuota."})
	}

	// Send to Groq
	apiKey := os.Getenv("GROQ_API_KEY")
	if apiKey == "" {
		return c.JSON(http.StatusInternalServerError, map[string]interface{}{"status": false, "message": "GROQ_API_KEY belum disetel"})
	}

	modelStr := os.Getenv("GROQ_MODEL")
	if modelStr == "" {
		modelStr = "llama3-8b-8192"
	}

	messages := []map[string]string{
		{
			"role":    "system",
			"content": "Anda adalah guru privat yang sabar, cerdas, dan memotivasi. Anda bertugas menganalisis kesalahan siswa dalam tryout dan memberikan panduan belajar. Jangan gunakan tools apapun. Format jawaban dalam Markdown.",
		},
		{
			"role":    "user",
			"content": promptBuilder.String(),
		},
	}

	payload := map[string]interface{}{
		"model":    modelStr,
		"messages": messages,
	}

	payloadBytes, _ := json.Marshal(payload)
	httpRequest, err := http.NewRequest("POST", "https://api.groq.com/openai/v1/chat/completions", bytes.NewBuffer(payloadBytes))
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]interface{}{"status": false, "message": "Gagal membuat request AI"})
	}

	httpRequest.Header.Set("Authorization", "Bearer "+apiKey)
	httpRequest.Header.Set("Content-Type", "application/json")

	client := &http.Client{}
	httpResponse, err := client.Do(httpRequest)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]interface{}{"status": false, "message": "Gagal memanggil AI"})
	}
	defer httpResponse.Body.Close()

	if httpResponse.StatusCode != http.StatusOK {
		bodyBytes, _ := io.ReadAll(httpResponse.Body)
		fmt.Println("Groq Error Response:", string(bodyBytes))
		return c.JSON(http.StatusInternalServerError, map[string]interface{}{"status": false, "message": "Response dari AI tidak sukses: " + string(bodyBytes)})
	}

	var groqResp struct {
		Choices []struct {
			Message struct {
				Content string `json:"content"`
			} `json:"message"`
		} `json:"choices"`
	}
	if err := json.NewDecoder(httpResponse.Body).Decode(&groqResp); err != nil || len(groqResp.Choices) == 0 {
		return c.JSON(http.StatusInternalServerError, map[string]interface{}{"status": false, "message": "Gagal mem-parsing response AI"})
	}

	analysisText := groqResp.Choices[0].Message.Content

	var sIDs []string
	for _, id := range req.SessionIDs {
		sIDs = append(sIDs, strconv.Itoa(int(id)))
	}

	// Save to DB
	newAnalysis := model.ProgressAnalysis{
		UserID:       req.UserID,
		SessionIDs:   strings.Join(sIDs, ","),
		AnalysisText: analysisText,
	}

	if err := connection.DB.Create(&newAnalysis).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]interface{}{"status": false, "message": "Gagal menyimpan analisis"})
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"status":  true,
		"message": "Analisis berhasil dibuat",
		"data": map[string]interface{}{
			"id":            newAnalysis.ID,
			"session_ids":   sIDs,
			"analysis_text": newAnalysis.AnalysisText,
			"created_at":    newAnalysis.CreatedAt,
			"can_delete":    false, // newly created, definitely false
		},
	})
}

// DeleteProgressAnalysis deletes the analysis if 7 days have passed
func DeleteProgressAnalysis(c echo.Context) error {
	userIDStr := c.QueryParam("user_id")
	if userIDStr == "" {
		return c.JSON(http.StatusBadRequest, map[string]interface{}{"status": false, "message": "user_id is required"})
	}
	userID, _ := strconv.Atoi(userIDStr)

	idStr := c.Param("id")

	var analysis model.ProgressAnalysis
	if err := connection.DB.Where("id = ? AND user_id = ?", idStr, userID).First(&analysis).Error; err != nil {
		return c.JSON(http.StatusNotFound, map[string]interface{}{"status": false, "message": "Analisis tidak ditemukan"})
	}

	if time.Since(analysis.CreatedAt).Hours() < 24*7 {
		return c.JSON(http.StatusBadRequest, map[string]interface{}{"status": false, "message": "Analisis baru dapat dihapus setelah 1 minggu dari waktu pembuatan"})
	}

	if err := connection.DB.Delete(&analysis).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]interface{}{"status": false, "message": "Gagal menghapus analisis"})
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"status":  true,
		"message": "Analisis berhasil dihapus",
	})
}

