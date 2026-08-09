package model

import "time"

// Grade merepresentasikan entitas Kelas (misal Kelas 1, Kelas 2, dst)
type Grade struct {
	ID               uint           `gorm:"primaryKey" json:"id"`
	Title            string         `json:"title"`
	Deskripsi        string         `json:"deskripsi"`
	EducationLevelID *uint          `json:"education_level_id"`
	EducationLevel   EducationLevel `gorm:"foreignKey:EducationLevelID" json:"education_level"`
	CreatedAt        time.Time      `json:"created_at"`
	UpdatedAt        time.Time      `json:"updated_at"`
}
