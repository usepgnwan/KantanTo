package controller

import (
	"net/http"
	"server/app/model"
	"server/connection"
	"time"

	. "server/app/helpers"
	"github.com/labstack/echo/v4"
)

// GetUserDashboardStats godoc
// @Summary      Get user dashboard stats
// @Description  Get dynamic stats for User Dashboard
// @Tags         Dashboard
// @Accept       json
// @Produce      json
// @Security     ApiKeyAuth
// @Param secret-to-apps header string true "API secret key" default(Z9ToSwagger1413999)
// @Param user_id query string true "User ID"
// @Router       /api/dashboard/user-stats [get]
func GetUserDashboardStats(c echo.Context) error {
	userID := c.QueryParam("user_id")
	if userID == "" {
		return c.JSON(http.StatusBadRequest, Response{Status: false, Message: "user_id tidak ditemukan"})
	}

	var totalPackages int64
	connection.DB.Model(&model.Transaction{}).Where("user_id = ? AND status = 'active'", userID).Count(&totalPackages)

	var totalExams int64
	connection.DB.Model(&model.ExamSession{}).Where("user_id = ?", userID).Count(&totalExams)

	var avgScore float64
	connection.DB.Model(&model.ExamSession{}).Where("user_id = ?", userID).Select("COALESCE(AVG(score), 0)").Scan(&avgScore)

	sevenDaysAgo := time.Now().AddDate(0, 0, -7)

	var recentExams int64
	connection.DB.Model(&model.ExamSession{}).Where("user_id = ? AND created_at >= ?", userID, sevenDaysAgo).Count(&recentExams)

	var recentViews int64
	connection.DB.Model(&model.MenuLog{}).Where("user_id = ? AND created_at >= ? AND path LIKE '%/paket/%'", userID, sevenDaysAgo).Count(&recentViews)

	studyHours := (float64(recentExams) * 2.0) + (float64(recentViews) * 0.25)

	// 5. Akurasi & Error Rate (7 hari terakhir)
	var sessions []model.ExamSession
	connection.DB.Preload("Answers").
		Where("user_id = ? AND created_at >= ?", userID, sevenDaysAgo).
		Find(&sessions)

	type AccuracyData struct {
		Day      string  `json:"day"`
		Accuracy float64 `json:"accuracy"`
		Error    float64 `json:"error"`
	}

	var accuracyList []AccuracyData
	now := time.Now()
	for i := 6; i >= 0; i-- {
		targetDate := now.AddDate(0, 0, -i)
		dayName := targetDate.Format("Mon") // e.g. "Mon", "Tue"

		var totalAnswers int
		var correctAnswers int

		for _, s := range sessions {
			if s.CreatedAt.Format("2006-01-02") == targetDate.Format("2006-01-02") {
				totalAnswers += len(s.Answers)
				for _, ans := range s.Answers {
					if ans.IsCorrect {
						correctAnswers++
					}
				}
			}
		}

		acc := 0.0
		errRate := 0.0
		if totalAnswers > 0 {
			acc = float64(correctAnswers) / float64(totalAnswers) * 100
			errRate = 100.0 - acc
		}

		accuracyList = append(accuracyList, AccuracyData{
			Day:      dayName,
			Accuracy: acc,
			Error:    errRate,
		})
	}

	// 6. Rekomendasi Belajar (Materi terlemah)
	type SubjectStat struct {
		Subject string
		Total   int
		Correct int
	}
	var subjectStats []SubjectStat
	connection.DB.Raw(`
		SELECT pq.title as subject, count(ea.id) as total, sum(case when ea.is_correct then 1 else 0 end) as correct 
		FROM exam_answers ea 
		JOIN exam_sessions es ON es.id = ea.session_id 
		JOIN package_questions pq ON pq.id = ea.question_id 
		WHERE es.user_id = ? 
		GROUP BY pq.title
	`, userID).Scan(&subjectStats)

	weakestSubject := "Literasi Bahasa Inggris"
	lowestAcc := 100.0
	potentialPoints := 15

	for _, stat := range subjectStats {
		if stat.Total > 0 {
			acc := float64(stat.Correct) / float64(stat.Total) * 100.0
			if acc < lowestAcc {
				lowestAcc = acc
				
				subjName := stat.Subject
				if subjName == "" {
					subjName = "Kemampuan Dasar"
				}
				
				weakestSubject = subjName
				potentialPoints = (stat.Total - stat.Correct) * 5 // Asumsi 1 soal = 5 poin
			}
		}
	}

	if potentialPoints == 0 {
		potentialPoints = 15
	}

	type Recommendation struct {
		Subject       string `json:"subject"`
		PotentialPts  int    `json:"potential_points"`
		PackageSlug   string `json:"package_slug"`
		MaterialID    uint   `json:"material_id"`
	}

	rec := Recommendation{
		Subject:      weakestSubject,
		PotentialPts: potentialPoints,
	}

	var matRes struct {
		PackageSlug string
		MaterialID  uint
	}

	// Cari Material terkait
	connection.DB.Raw(`
		SELECT p.slug as package_slug, pm.id as material_id 
		FROM package_materials pm 
		JOIN packages p ON p.id = pm.package_id 
		JOIN transactions t ON t.package_id = p.id 
		WHERE t.user_id = ? AND t.status = 'active' AND (pm.category = ? OR pm.title ILIKE ?)
		LIMIT 1
	`, userID, weakestSubject, "%"+weakestSubject+"%").Scan(&matRes)

	if matRes.MaterialID == 0 {
		// fallback
		connection.DB.Raw(`
			SELECT p.slug as package_slug, pm.id as material_id 
			FROM package_materials pm 
			JOIN packages p ON p.id = pm.package_id 
			JOIN transactions t ON t.package_id = p.id 
			WHERE t.user_id = ? AND t.status = 'active'
			LIMIT 1
		`, userID).Scan(&matRes)
	}

	rec.PackageSlug = matRes.PackageSlug
	rec.MaterialID = matRes.MaterialID

	// 7. Cek apakah user masuk Top 5 nilai terbesar
	var top5Scores []float64
	connection.DB.Raw(`
		SELECT MAX(score) as max_score 
		FROM exam_sessions 
		GROUP BY user_id 
		ORDER BY max_score DESC 
		LIMIT 5
	`).Scan(&top5Scores)

	var userMaxScore float64
	connection.DB.Raw(`
		SELECT MAX(score) 
		FROM exam_sessions 
		WHERE user_id = ?
	`, userID).Scan(&userMaxScore)

	isTop5 := false
	if userMaxScore > 0 {
		for _, s := range top5Scores {
			if userMaxScore >= s {
				isTop5 = true
				break
			}
		}
	}

	// 8. Cek apakah profil pengguna sudah lengkap
	var user model.User
	connection.DB.First(&user, userID)
	isProfileComplete := false
	if user.AsalSekolah != "" && user.TargetCampus != "" && user.TargetMajor != "" && user.TargetPoint != "" {
		isProfileComplete = true
	}

	return c.JSON(http.StatusOK, Response{
		Status:  true,
		Message: "Berhasil memuat statistik",
		Data: map[string]interface{}{
			"total_packages":      totalPackages,
			"total_exams":         totalExams,
			"avg_score":           avgScore,
			"study_hours":         studyHours,
			"accuracy_data":       accuracyList,
			"recommendation":      rec,
			"is_top_5":            isTop5,
			"is_profile_complete": isProfileComplete,
			"dream_description":   user.DreamDescription,
			"target_campus":       user.TargetCampus,
			"target_major":        user.TargetMajor,
			"target_point":        user.TargetPoint,
		},
	})
}
