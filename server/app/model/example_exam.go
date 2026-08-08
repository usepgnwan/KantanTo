package model

import "time"

// ExampleExam represents a sample question shown on the landing page
type ExampleExam struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	Question    string    `gorm:"type:text" json:"question"`
	OptionA     string    `gorm:"type:text" json:"option_a"`
	OptionB     string    `gorm:"type:text" json:"option_b"`
	OptionC     string    `gorm:"type:text" json:"option_c"`
	OptionD     string    `gorm:"type:text" json:"option_d"`
	Answer      string    `gorm:"type:varchar(10)" json:"answer"` // "A", "B", "C", "D"
	Explanation string    `gorm:"type:text" json:"explanation"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}
