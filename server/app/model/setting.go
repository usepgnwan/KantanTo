package model

import "time"

// Setting merepresentasikan konfigurasi platform aplikasi
type Setting struct {
	ID           uint      `gorm:"primaryKey" json:"id"`
	NamaAplikasi string    `json:"nama_aplikasi"`
	Deskripsi    string    `json:"deskripsi"`
	NoWa         string    `json:"no_wa"`
	Email        string    `json:"email"`
	Alamat       string    `json:"alamat"`
	Ppn          float64   `gorm:"default:11" json:"ppn"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}
