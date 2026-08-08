package model

import "time"

type Package struct {
	ID           uint      `gorm:"primaryKey" json:"id"`
	Slug         string    `gorm:"uniqueIndex;not null" json:"slug"`
	Title        string    `json:"title"`
	Description  string    `json:"description"`
	Price        float64   `gorm:"default:0" json:"price"`
	Category     string    `gorm:"default:''" json:"category"`
	ClassesJSON  string    `gorm:"type:text;default:'[]'" json:"-"`
	SubjectsJSON string    `gorm:"type:text;default:'[]'" json:"-"`
	Duration     int       `gorm:"default:0" json:"duration"`
	Status       string    `gorm:"default:'draft'" json:"status"`
	Thumbnail    string            `gorm:"default:''" json:"thumbnail"`
	Materials    []PackageMaterial `gorm:"foreignKey:PackageID;constraint:OnDelete:CASCADE" json:"materials"`
	CreatedAt    time.Time         `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

type PackageQuestion struct {
	ID             uint                 `gorm:"primaryKey" json:"id"`
	PackageID      uint                 `gorm:"index" json:"package_id"`
	Package        Package              `gorm:"foreignKey:PackageID;constraint:OnDelete:CASCADE" json:"-"`
	PackageSlug    string               `gorm:"index" json:"package_slug"`
	ClientID       string               `gorm:"index;not null" json:"client_id"`
	Type           string               `json:"type"`
	Title          string               `json:"title"`
	Question       string               `json:"question"`
	Discussion     string               `json:"discussion"`
	OptionsJSON    string               `gorm:"type:jsonb" json:"-"`
	CorrectJSON    string               `gorm:"type:jsonb" json:"-"`
	DiscussionJSON string               `gorm:"type:jsonb" json:"-"`
	Points         float64              `json:"points"`
	ScoringMethod  string               `json:"scoring_method"`
	SubQuestions   []PackageSubQuestion `gorm:"foreignKey:QuestionID;constraint:OnDelete:CASCADE" json:"sub_questions,omitempty"`
	CreatedAt      time.Time            `json:"created_at"`
	UpdatedAt      time.Time            `json:"updated_at"`
}

type PackageSubQuestion struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	QuestionID  uint      `gorm:"index;not null" json:"question_id"`
	ClientID    string    `gorm:"index;not null" json:"client_id"`
	Type        string    `json:"type"`
	Question    string    `json:"question"`
	Discussion  string    `json:"discussion"`
	OptionsJSON string    `gorm:"type:jsonb" json:"-"`
	CorrectJSON string    `gorm:"type:jsonb" json:"-"`
	Points      float64   `json:"points"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

type PackageMaterial struct {
	ID              uint      `gorm:"primaryKey" json:"id"`
	PackageID       uint      `gorm:"index" json:"package_id"`
	Package         Package   `gorm:"foreignKey:PackageID;constraint:OnDelete:CASCADE" json:"-"`
	ClientID        string    `gorm:"index;not null" json:"client_id"`
	Title           string    `json:"title"`
	Category        string    `json:"category"`
	Content         string    `gorm:"type:text" json:"content"`
	AttachmentsJSON string    `gorm:"type:jsonb" json:"-"`
	CreatedAt       time.Time `json:"created_at"`
	UpdatedAt       time.Time `json:"updated_at"`
}

type PackageVideo struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	PackageID   uint      `gorm:"index" json:"package_id"`
	Package     Package   `gorm:"foreignKey:PackageID;constraint:OnDelete:CASCADE" json:"-"`
	ClientID    string    `gorm:"index;not null" json:"client_id"`
	Title       string    `json:"title"`
	Duration    string    `json:"duration"`
	URL         string    `json:"url"`
	Description string    `gorm:"type:text" json:"description"`
	MediaType   string    `json:"media_type"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}
