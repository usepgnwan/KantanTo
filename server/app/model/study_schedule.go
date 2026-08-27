package model

import "time"

type StudySchedule struct {
	ID           uint      `gorm:"primaryKey" json:"id"`
	UserID       uint      `gorm:"index;not null" json:"user_id"`
	User         User      `gorm:"foreignKey:UserID" json:"-"`
	Date         time.Time `gorm:"type:date;not null;index" json:"date"`
	Type         string    `gorm:"not null" json:"type"` // "latihan" or "reminder"
	PackageID    *uint     `json:"package_id"`           // Nullable
	Package      *Package  `gorm:"foreignKey:PackageID" json:"package,omitempty"`
	ReminderText string    `gorm:"type:varchar(300)" json:"reminder_text"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}
