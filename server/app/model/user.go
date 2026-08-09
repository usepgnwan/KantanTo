package model

import "time"

// User merepresentasikan entitas pengguna dalam aplikasi
type User struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	Name        string    `json:"name"`
	Email       string    `gorm:"uniqueIndex" json:"email"`
	Nohp        string    `gorm:"uniqueIndex" json:"nohp"`
	Password    string    `json:"-"` // Disembunyikan di HTTP Response
	Status      string    `json:"status"`
	AsalSekolah string    `json:"asal_sekolah"`
	FotoProfil  string    `json:"foto_profil"`
	RoleID      uint      `json:"role_id"`
	Role             Role       `gorm:"foreignKey:RoleID" json:"role"`
	DreamDescription string     `gorm:"type:text" json:"dream_description"`
	TargetCampus     string     `json:"target_campus"`
	TargetMajor      string     `json:"target_major"`
	TargetPoint      string     `json:"target_point"`
	CreatedAt        time.Time  `json:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"`
	LastLogin   *time.Time `json:"last_login"`
}
