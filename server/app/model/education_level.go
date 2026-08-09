package model

import "time"

// EducationLevel merepresentasikan entitas Tingkat Pendidikan (misal SD, SMP, SMA)
type EducationLevel struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	Title     string    `json:"title"`
	Deskripsi string    `json:"deskripsi"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}
