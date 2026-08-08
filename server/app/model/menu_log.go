package model

import (
	"time"

	"gorm.io/gorm"
)

type MenuLog struct {
	ID        uint           `gorm:"primaryKey" json:"id"`
	Path      string         `gorm:"not null" json:"path"`
	Label     string         `json:"label"`
	Device    string         `json:"device"` // "web" | "mobile"
	UserID    *uint          `json:"user_id"` // Optional (can be null if not logged in)
	User      *User          `gorm:"foreignKey:UserID" json:"user,omitempty"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}
