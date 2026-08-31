package model

import (
	"encoding/json"
	"time"

	"gorm.io/gorm"
)

type PackageSummary struct {
	ID    uint   `json:"id"`
	Title string `json:"title"`
	Slug  string `json:"slug"`
}

type Voucher struct {
	ID                     uint             `gorm:"primaryKey" json:"id"`
	Code                   string           `gorm:"uniqueIndex;not null" json:"code"`
	Type                   string           `gorm:"not null" json:"type"` // "fixed" | "percentage"
	Value                  float64          `gorm:"not null" json:"value"`
	Limit                  int              `gorm:"not null" json:"limit"`
	Used                   int              `gorm:"default:0" json:"used"`
	ExpiryDate             string           `gorm:"not null" json:"expiryDate"`
	Status                 string           `gorm:"default:'active'" json:"status"`
	ApplicablePackagesJSON string           `gorm:"type:text;default:'[]'" json:"-"`
	ApplicablePackageIDs   []uint           `gorm:"-" json:"applicable_package_ids"`
	ApplicablePackages     []PackageSummary `gorm:"-" json:"applicable_packages"`
	CreatedAt              time.Time        `json:"created_at"`
	UpdatedAt              time.Time        `json:"updated_at"`
	DeletedAt              gorm.DeletedAt   `gorm:"index" json:"-"`
}

func (v *Voucher) PopulateApplicablePackages() {
	if v.ApplicablePackagesJSON != "" && v.ApplicablePackagesJSON != "[]" {
		_ = json.Unmarshal([]byte(v.ApplicablePackagesJSON), &v.ApplicablePackageIDs)
	}
	if v.ApplicablePackageIDs == nil {
		v.ApplicablePackageIDs = []uint{}
	}
}

func (v *Voucher) AfterFind(tx *gorm.DB) (err error) {
	v.PopulateApplicablePackages()
	return nil
}

func (v *Voucher) BeforeSave(tx *gorm.DB) (err error) {
	if v.ApplicablePackageIDs != nil {
		bytes, err := json.Marshal(v.ApplicablePackageIDs)
		if err == nil {
			v.ApplicablePackagesJSON = string(bytes)
		}
	} else if v.ApplicablePackagesJSON == "" {
		v.ApplicablePackagesJSON = "[]"
	}
	return nil
}

func (v *Voucher) IsApplicableToPackage(packageID uint) bool {
	ids := v.ApplicablePackageIDs
	if len(ids) == 0 && v.ApplicablePackagesJSON != "" && v.ApplicablePackagesJSON != "[]" {
		_ = json.Unmarshal([]byte(v.ApplicablePackagesJSON), &ids)
	}
	if len(ids) == 0 {
		return true // All packages
	}
	for _, id := range ids {
		if id == packageID {
			return true
		}
	}
	return false
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
