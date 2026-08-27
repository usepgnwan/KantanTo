package main

import (
	"encoding/json"
	"fmt"
	"server/app/model"
	"server/connection"
)

func main() {
	connection.Connect()
	var txs []model.Transaction
	connection.DB.Where("package_id = 1").Find(&txs) // assuming tka-sd is id 1, or just print all
	
	for _, tx := range txs {
		fmt.Printf("ID: %d, User: %d, Pkg: %d, Max: %d, Used: %d, Status: %s, ActiveUntil: %v\n", 
			tx.ID, tx.UserID, tx.PackageID, tx.MaxExamAttempts, tx.UsedExamAttempts, tx.Status, tx.ActiveUntil)
	}
}
