package controller

import (
	"encoding/json"
	"fmt"
	"math"
	"net/http"
	"server/app/model"
	"server/connection"

	"github.com/labstack/echo/v4"
	"gorm.io/gorm"
)

type examSubmitPayload struct {
	ClientID  string           `json:"client_id"`
	UserID    uint             `json:"user_id"`
	IsTesting bool             `json:"is_testing"`
	Answers   map[string][]int `json:"answers"` // ClientID -> array of selected option indexes
}

func parseCorrectJSON(jsonStr string) []int {
	var arr []int
	if err := json.Unmarshal([]byte(jsonStr), &arr); err == nil {
		return arr
	}
	var single int
	if err := json.Unmarshal([]byte(jsonStr), &single); err == nil {
		return []int{single}
	}
	return []int{}
}

func SubmitExam(c echo.Context) error {
	slug := c.Param("slug")

	var req examSubmitPayload
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]interface{}{
			"status":  false,
			"message": "Invalid request payload",
		})
	}

	// 1. Find the Package
	var pkg model.Package
	if err := connection.DB.Where("slug = ?", slug).First(&pkg).Error; err != nil {
		return c.JSON(http.StatusNotFound, map[string]interface{}{
			"status":  false,
			"message": "Package not found",
		})
	}

	// 2. Fetch all questions for this package
	var questions []model.PackageQuestion
	if err := connection.DB.Preload("SubQuestions", func(db *gorm.DB) *gorm.DB {
		return db.Order("id asc")
	}).Where("package_id = ?", pkg.ID).Order("id asc").Find(&questions).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]interface{}{
			"status":  false,
			"message": "Failed to fetch questions",
		})
	}

	// Create Session
	session := model.ExamSession{
		PackageID: pkg.ID,
		ClientID:  req.ClientID,
		UserID:    req.UserID,
		IsTesting: req.IsTesting,
	}
	if err := connection.DB.Create(&session).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]interface{}{
			"status":  false,
			"message": "Failed to create exam session",
		})
	}

	var totalScore float64 = 0
	var examAnswers []model.ExamAnswer

	for _, q := range questions {
		selected, hasAnswer := req.Answers[q.ClientID]
		if !hasAnswer {
			selected = []int{}
		}

		if q.Type == "nested" || q.Type == "scenario" {
			// Scenario Based: Independent Scoring for each sub-question
			for _, sub := range q.SubQuestions {
				subSelected, hasSubAns := req.Answers[sub.ClientID] // Frontend sends ClientID keys
				if !hasSubAns {
					subSelected = []int{}
				}

				subCorrect := parseCorrectJSON(sub.CorrectJSON)

				// Calculate totalIncorrect from sub-question options
				var subOpts []string
				json.Unmarshal([]byte(sub.OptionsJSON), &subOpts)
				totalIncorrect := len(subOpts) - len(subCorrect)
				if totalIncorrect < 0 {
					totalIncorrect = 0
				}

				pts, isCorrect := calculateScoreMulti(sub.Type, subSelected, subCorrect, sub.Points, "all_or_nothing", totalIncorrect)
				totalScore += pts

				b, _ := json.Marshal(subSelected)
				subID := sub.ID
				examAnswers = append(examAnswers, model.ExamAnswer{
					SessionID:           session.ID,
					QuestionID:          q.ID,
					SubQuestionID:       &subID,
					SelectedOptionsJSON: string(b),
					IsCorrect:           isCorrect,
					PointsEarned:        pts,
				})
			}
		} else {
			// Single or Multiple
			correct := parseCorrectJSON(q.CorrectJSON)
			
			// For total correct and incorrect calculations on partial scoring
			var totalOptions []string
			json.Unmarshal([]byte(q.OptionsJSON), &totalOptions)
			totalIncorrect := len(totalOptions) - len(correct)
			if totalIncorrect < 0 {
				totalIncorrect = 0
			}

			pts, isCorrect := calculateScoreMulti(q.Type, selected, correct, q.Points, q.ScoringMethod, totalIncorrect)
			totalScore += pts

			b, _ := json.Marshal(selected)
			examAnswers = append(examAnswers, model.ExamAnswer{
				SessionID:           session.ID,
				QuestionID:          q.ID,
				SubQuestionID:       nil,
				SelectedOptionsJSON: string(b),
				IsCorrect:           isCorrect,
				PointsEarned:        pts,
			})
		}
	}

	if len(examAnswers) > 0 {
		connection.DB.Create(&examAnswers)
	}

	// Update Session Score
	session.Score = totalScore
	connection.DB.Save(&session)

	return c.JSON(http.StatusOK, map[string]interface{}{
		"status":  true,
		"message": "Exam submitted successfully",
		"data": map[string]interface{}{
			"session_id": session.ID,
			"score":      totalScore,
		},
	})
}

// calculateScore is used for sub-questions (nested/scenario).
// totalOptions = total count of options for this sub-question.
func calculateScore(qType string, selected []int, correct []int, maxPoints float64, scoringMethod string) (float64, bool) {
	// For sub-questions we don't have totalOptions easily, use len(correct)+3 as fallback
	totalIncorrect := 3
	return calculateScoreMulti(qType, selected, correct, maxPoints, scoringMethod, totalIncorrect)
}

// calculateScoreMulti implements the full scoring logic:
//
// single: full points if selected[0] == correct[0], else 0
//
// multiple – all_or_nothing:
//   Must select EXACTLY all correct answers and nothing else → maxPoints, else 0
//
// multiple – partial (prosedural):
//   pts = (correctChosen/totalCorrect × maxPts) − (wrongChosen/totalWrong × maxPts)
//   floor at 0. isCorrect = (pts == maxPoints)
func calculateScoreMulti(qType string, selected []int, correct []int, maxPoints float64, scoringMethod string, totalIncorrect int) (float64, bool) {
	if len(selected) == 0 {
		return 0, false
	}

	// ── single / sub-question ──────────────────────────────────────────────
	if qType == "single" || qType == "" {
		if len(correct) > 0 && len(selected) > 0 && selected[0] == correct[0] {
			return maxPoints, true
		}
		return 0, false
	}

	// Build correct set
	correctSet := make(map[int]bool, len(correct))
	for _, c := range correct {
		correctSet[c] = true
	}

	// Count chosen-correct and chosen-wrong
	correctChosen := 0
	wrongChosen := 0
	for _, s := range selected {
		if correctSet[s] {
			correctChosen++
		} else {
			wrongChosen++
		}
	}

	totalCorrect := len(correct)
	if totalCorrect == 0 {
		return 0, false
	}
	if totalIncorrect < 0 {
		totalIncorrect = 0
	}

	// ── all_or_nothing ────────────────────────────────────────────────────
	// Must pick ALL correct AND nothing wrong
	if scoringMethod == "all_or_nothing" || scoringMethod == "" {
		if correctChosen == totalCorrect && wrongChosen == 0 {
			return maxPoints, true
		}
		return 0, false
	}

	// ── partial / prosedural ──────────────────────────────────────────────
	// Poin = (benarDipilih/totalBenar × maxPts) − (salahDipilih/totalSalah × maxPts)
	// Jika hasil < 0 → 0
	if scoringMethod == "partial" {
		positiveComponent := (float64(correctChosen) / float64(totalCorrect)) * maxPoints

		var negativeComponent float64
		if totalIncorrect > 0 && wrongChosen > 0 {
			negativeComponent = (float64(wrongChosen) / float64(totalIncorrect)) * maxPoints
		}

		pts := positiveComponent - negativeComponent
		if pts < 0 {
			pts = 0
		}

		pts = math.Round(pts*100) / 100
		isCorrect := pts >= maxPoints
		return pts, isCorrect
	}

	return 0, false
}

func GetExamSession(c echo.Context) error {
	id := c.Param("id")

	var session model.ExamSession
	if err := connection.DB.Preload("User").Preload("Package").Preload("Answers", func(db *gorm.DB) *gorm.DB {
		return db.Order("id asc")
	}).Where("id = ?", id).First(&session).Error; err != nil {
		return c.JSON(http.StatusNotFound, map[string]interface{}{
			"status":  false,
			"message": "Session not found",
		})
	}

	// Build enriched answer list
	type AnswerDetail struct {
		ID              uint    `json:"id"`
		QuestionID      uint    `json:"question_id"`
		SubQuestionID   *uint   `json:"sub_question_id"`
		SelectedOptions []int   `json:"selected_options"`
		IsCorrect       bool    `json:"is_correct"`
		PointsEarned    float64 `json:"points_earned"`
		MaxPoints       float64 `json:"max_points"`
		// Question details
		QuestionText   string   `json:"question_text"`
		QuestionTitle  string   `json:"question_title"`
		QuestionType   string   `json:"question_type"`
		ScoringMethod  string   `json:"scoring_method"`
		Options        []string `json:"options"`
		CorrectAnswers []int    `json:"correct_answers"`
		Discussion     string   `json:"discussion"`
		// Scenario context
		ParentQuestion string `json:"parent_question,omitempty"`
		ParentTitle    string `json:"parent_title,omitempty"`
	}

	var enrichedAnswers []AnswerDetail

	for _, ans := range session.Answers {
		detail := AnswerDetail{
			ID:            ans.ID,
			QuestionID:    ans.QuestionID,
			SubQuestionID: ans.SubQuestionID,
			IsCorrect:     ans.IsCorrect,
			PointsEarned:  ans.PointsEarned,
		}

		// Parse selected options
		json.Unmarshal([]byte(ans.SelectedOptionsJSON), &detail.SelectedOptions)
		if detail.SelectedOptions == nil {
			detail.SelectedOptions = []int{}
		}

		if ans.SubQuestionID != nil {
			// Sub-question: fetch both the sub-question and its parent
			var sub model.PackageSubQuestion
			if err := connection.DB.Where("id = ?", *ans.SubQuestionID).First(&sub).Error; err == nil {
				detail.QuestionText = sub.Question
				detail.QuestionType = sub.Type
				detail.Discussion = sub.Discussion
				detail.MaxPoints = sub.Points

				var opts []string
				json.Unmarshal([]byte(sub.OptionsJSON), &opts)
				detail.Options = opts

				detail.CorrectAnswers = parseCorrectJSON(sub.CorrectJSON)
			}

			// Fetch parent question for context
			var parent model.PackageQuestion
			if err := connection.DB.Where("id = ?", ans.QuestionID).First(&parent).Error; err == nil {
				detail.ParentQuestion = parent.Question
				detail.ParentTitle = parent.Title
				detail.QuestionTitle = parent.Title
			}
		} else {
			// Regular question
			var q model.PackageQuestion
			if err := connection.DB.Where("id = ?", ans.QuestionID).First(&q).Error; err == nil {
				detail.QuestionText = q.Question
				detail.QuestionTitle = q.Title
				detail.QuestionType = q.Type
				detail.ScoringMethod = q.ScoringMethod
				detail.Discussion = q.Discussion
				detail.MaxPoints = q.Points

				var opts []string
				json.Unmarshal([]byte(q.OptionsJSON), &opts)
				detail.Options = opts

				detail.CorrectAnswers = parseCorrectJSON(q.CorrectJSON)
			}
		}

		// Recalculate is_correct and points_earned live from current correct data
		// (fixes stale DB values from before parseCorrectJSON fix)
		if len(detail.CorrectAnswers) > 0 && detail.MaxPoints > 0 {
			var totalOpts []string
			for _, o := range detail.Options {
				totalOpts = append(totalOpts, o)
			}
			totalIncorrect := len(totalOpts) - len(detail.CorrectAnswers)
			if totalIncorrect < 0 {
				totalIncorrect = 0
			}
			detail.PointsEarned, detail.IsCorrect = calculateScoreMulti(
				detail.QuestionType,
				detail.SelectedOptions,
				detail.CorrectAnswers,
				detail.MaxPoints,
				detail.ScoringMethod,
				totalIncorrect,
			)
		}

		enrichedAnswers = append(enrichedAnswers, detail)
	}

	// Sum live score from recalculated answers
	var liveScore float64
	for _, a := range enrichedAnswers {
		liveScore += a.PointsEarned
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"status": true,
		"data": map[string]interface{}{
			"id":         session.ID,
			"score":      liveScore,
			"is_testing": session.IsTesting,
			"created_at": session.CreatedAt,
			"package":    session.Package,
			"user":       session.User,
			"answers":    enrichedAnswers,
		},
	})
}

func GetAllExamSessions(c echo.Context) error {
	page := 1
	limit := 10
	
	if p := c.QueryParam("page"); p != "" {
		// Just simple parse, assuming integer
		fmt.Sscanf(p, "%d", &page)
	}
	if l := c.QueryParam("limit"); l != "" {
		fmt.Sscanf(l, "%d", &limit)
	}
	
	isTesting := c.QueryParam("is_testing") == "true"
	search := c.QueryParam("search")

	offset := (page - 1) * limit

	var sessions []model.ExamSession
	var total int64

	userID := c.QueryParam("user_id")
	query := connection.DB.Model(&model.ExamSession{}).Where("is_testing = ?", isTesting)

	if userID != "" {
		query = query.Where("user_id = ?", userID)
	}

	// If there's a search term, we can join with User and search by name or email
	if search != "" {
		query = query.Joins("JOIN users ON users.id = exam_sessions.user_id").
			Where("users.nama ILIKE ? OR users.email ILIKE ?", "%"+search+"%", "%"+search+"%")
	}

	query.Count(&total)

	if err := query.Preload("User").Preload("Package").Order("created_at DESC").Limit(limit).Offset(offset).Find(&sessions).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]interface{}{
			"status":  false,
			"message": "Failed to fetch exam sessions",
		})
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"status": true,
		"data": map[string]interface{}{
			"items": sessions,
			"total": total,
			"page":  page,
			"limit": limit,
		},
	})
}
