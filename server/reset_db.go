package main

import (
	"fmt"
	"server/app/model"
	"server/connection"
)

func main() {
	connection.ConnectDB()
	
	var txs []model.Transaction
	connection.DB.Where("status = ?", "active").Order("created_at asc").Find(&txs)
	
	// Reset all to used_exam_attempts = 1 so the sum is 1. Wait, if there are multiple transactions...
	// If the user has 2 transactions, and they want the sum to be 1, we set the first to 1 and second to 0.
	var count int
	for _, tx := range txs {
		if tx.MaxExamAttempts > 0 { // Just pick any one to have 1
			if count == 0 {
				connection.DB.Model(&tx).Update("used_exam_attempts", 1)
				fmt.Printf("Updated TX %d to used=1\n", tx.ID)
				count++
			} else {
				connection.DB.Model(&tx).Update("used_exam_attempts", 0)
				fmt.Printf("Updated TX %d to used=0\n", tx.ID)
			}
		}
	}
	fmt.Println("Reset complete!")
}
