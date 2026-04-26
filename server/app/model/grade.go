package model

import "time"

// Mapel merepresentasikan entitas Kelas
type Grade struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	Title     string    `json:"title"`
	Deskripsi string    `json:"deskripsi"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}
