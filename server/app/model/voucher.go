package model

import (
	"time"

	"gorm.io/gorm"
)

type Voucher struct {
	ID         uint           `gorm:"primaryKey" json:"id"`
	Code       string         `gorm:"uniqueIndex;not null" json:"code"`
	Type       string         `gorm:"not null" json:"type"` // "fixed" | "percentage"
	Value      float64        `gorm:"not null" json:"value"`
	Limit      int            `gorm:"not null" json:"limit"`
	Used       int            `gorm:"default:0" json:"used"`
	ExpiryDate string         `gorm:"not null" json:"expiryDate"`
	Status     string         `gorm:"default:'active'" json:"status"`
	CreatedAt  time.Time      `json:"created_at"`
	UpdatedAt  time.Time      `json:"updated_at"`
	DeletedAt  gorm.DeletedAt `gorm:"index" json:"-"`
}

type VoucherUsage struct {
	ID        uint           `gorm:"primaryKey" json:"id"`
	VoucherID uint           `gorm:"not null" json:"voucher_id"`
	OrderID   string         `gorm:"not null" json:"order_id"`
	UserID    uint           `gorm:"not null" json:"user_id"`
	PackageID uint           `gorm:"not null" json:"package_id"`
	Amount    float64        `gorm:"not null" json:"amount"`
	Date      string         `gorm:"not null" json:"date"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`

	Voucher Voucher `gorm:"foreignKey:VoucherID" json:"voucher,omitempty"`
	User    User    `gorm:"foreignKey:UserID" json:"user,omitempty"`
	Package Package `gorm:"foreignKey:PackageID" json:"package,omitempty"`
}
