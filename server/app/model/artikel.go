package model

import "time"

// Artikel merepresentasikan entitas blog/artikel
type Artikel struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	Judul       string    `json:"judul"`
	Slug        string    `gorm:"uniqueIndex" json:"slug"`
	Konten      string    `gorm:"type:text" json:"konten"`
	Deskripsi   string    `json:"deskripsi"` // Short excerpt
	Thumbnail   string    `json:"thumbnail"` // Stored file path
	Berkas      string    `json:"berkas"`    // Berkas pendukung (PDF/DOC/Excel), opsional
	Status      string    `json:"status"`    // "publish" | "draft"
	IsPriority  bool      `json:"is_priority"` // true = headline halaman 1
	CategoryID  *uint     `json:"category_id"`
	Category    Category  `gorm:"foreignKey:CategoryID" json:"category"`
	UserID      *uint     `json:"user_id"`    // Penulis
	User        User      `gorm:"foreignKey:UserID" json:"user"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}
