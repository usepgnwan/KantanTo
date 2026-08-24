package model

import "time"

type ProgressAnalysis struct {
	ID           uint      `gorm:"primaryKey" json:"id"`
	UserID       uint      `gorm:"index;not null" json:"user_id"`
	User         User      `gorm:"foreignKey:UserID;constraint:OnDelete:CASCADE" json:"user,omitempty"`
	SessionIDs   string    `gorm:"type:text;not null" json:"session_ids"` // Stored as comma separated string e.g., "10,11"
	AnalysisText string    `gorm:"type:text;not null" json:"analysis_text"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}
