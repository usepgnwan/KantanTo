package connection

import (
	"fmt"
	"log"
	"os"

	"github.com/joho/godotenv"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"

	"server/app/model"
)

var DB *gorm.DB

func ConnectDB() {
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using OS env variables")
	}

	host := os.Getenv("DB_HOST")
	user := os.Getenv("DB_USER")
	password := os.Getenv("DB_PASSWORD")
	dbName := os.Getenv("DB_NAME")
	port := "5432" // default postgres port

	dsn := fmt.Sprintf("host=%s user=%s password=%s dbname=%s port=%s sslmode=disable TimeZone=Asia/Jakarta",
		host, user, password, dbName, port)

	var err error
	DB, err = gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}

	log.Println("Database connection successful")

	// Automigrate
	err = DB.AutoMigrate(&model.Mapel{}, &model.Category{}, &model.Grade{}, &model.Setting{}, &model.Role{}, &model.User{})
	if err != nil {
		log.Fatal("Failed to migrate database:", err)
	}
	log.Println("Database migration completed")
}
