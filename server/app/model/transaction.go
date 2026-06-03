package model

import "time"

type Transaction struct {
	ID            uint      `gorm:"primaryKey" json:"id"`
	InvoiceCode   string    `gorm:"uniqueIndex;not null" json:"invoice_code"`
	OrderID       string    `gorm:"not null" json:"order_id"` // random external order ID reference
	UserID        uint      `gorm:"not null" json:"user_id"`
	PackageID     uint      `gorm:"not null" json:"package_id"`
	Package       Package   `gorm:"foreignKey:PackageID" json:"package"`
	VoucherID     *uint     `json:"voucher_id"` // nullable
	Amount        float64   `gorm:"not null" json:"amount"`
	PaymentMethod string    `gorm:"default:'qris'" json:"payment_method"`
	Status        string    `gorm:"default:'pending payment'" json:"status"` // pending payment, active, inactive, expired
	ActiveUntil   *time.Time `json:"active_until"`
	Progress      float64    `gorm:"-" json:"progress"` // Calculated field, not in DB
	CreatedAt     time.Time  `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
}
