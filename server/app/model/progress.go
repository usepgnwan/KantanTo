package model

import "time"

type UserMaterialProgress struct {
	ID         uint      `gorm:"primaryKey" json:"id"`
	UserID     uint      `gorm:"index:idx_user_material,unique" json:"user_id"`
	PackageID  uint      `gorm:"index" json:"package_id"`
	MaterialID uint      `gorm:"index:idx_user_material,unique" json:"material_id"`
	CreatedAt  time.Time `json:"created_at"`
	UpdatedAt  time.Time `json:"updated_at"`
}
