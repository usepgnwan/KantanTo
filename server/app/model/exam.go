package model

import "time"

type ExamSession struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	PackageID uint      `gorm:"index;not null" json:"package_id"`
	Package   Package   `gorm:"foreignKey:PackageID;constraint:OnDelete:CASCADE" json:"package"`
	ClientID  string    `gorm:"index;not null" json:"client_id"`
	UserID    uint      `gorm:"index;not null" json:"user_id"`
	User      User      `gorm:"foreignKey:UserID;constraint:OnDelete:CASCADE" json:"user"`
	Score     float64   `gorm:"default:0" json:"score"`
	IsTesting bool      `gorm:"default:false" json:"is_testing"`
	StartTime time.Time `json:"start_time"`
	EndTime   time.Time `json:"end_time"`
	Answers   []ExamAnswer `gorm:"foreignKey:SessionID;constraint:OnDelete:CASCADE" json:"answers,omitempty"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type ExamAnswer struct {
	ID                  uint      `gorm:"primaryKey" json:"id"`
	SessionID           uint      `gorm:"index;not null" json:"session_id"`
	QuestionID          uint      `gorm:"index;not null" json:"question_id"`
	SubQuestionID       *uint     `gorm:"index" json:"sub_question_id"` // null if not nested
	SelectedOptionsJSON string    `gorm:"type:jsonb" json:"-"` // e.g. "[1, 2]"
	IsCorrect           bool      `gorm:"default:false" json:"is_correct"`
	PointsEarned        float64   `gorm:"default:0" json:"points_earned"`
	CreatedAt           time.Time `json:"created_at"`
	UpdatedAt           time.Time `json:"updated_at"`
}
