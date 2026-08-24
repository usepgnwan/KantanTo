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
	err = DB.AutoMigrate(
		&model.Mapel{},
		&model.Category{},
		&model.EducationLevel{},
		&model.Grade{},
		&model.Setting{},
		&model.Role{},
		&model.User{},
		&model.Artikel{},
		&model.Package{},
		&model.PackageQuestion{},
		&model.PackageSubQuestion{},
		&model.PackageMaterial{},
		&model.PackageVideo{},
		&model.ExamSession{},
		&model.ExamAnswer{},
		&model.Voucher{},
		&model.VoucherUsage{},
		&model.Transaction{},
		&model.UserMaterialProgress{},
		&model.ProgressAnalysis{},
		&model.MenuLog{},
		&model.ExampleExam{},
		&model.ContactMessage{},
		&model.PasswordResetToken{},
	)
	if err != nil {
		log.Fatal("Failed to migrate database:", err)
	}
	migratePackageContentIDs()
	log.Println("Database migration completed")
}

func migratePackageContentIDs() {
	migrations := []struct {
		table string
	}{
		{table: "package_questions"},
		{table: "package_materials"},
		{table: "package_videos"},
	}

	for _, migration := range migrations {
		if !columnExists(migration.table, "package_slug") || !columnExists(migration.table, "package_id") {
			continue
		}

		if err := DB.Exec(
			fmt.Sprintf(
				"UPDATE %s AS child SET package_id = packages.id FROM packages WHERE child.package_slug = packages.slug AND (child.package_id IS NULL OR child.package_id = 0)",
				migration.table,
			),
		).Error; err != nil {
			log.Printf("Failed to migrate %s.package_id from package_slug: %v", migration.table, err)
		}
	}
}

func columnExists(tableName, columnName string) bool {
	var count int64
	if err := DB.Raw(
		"SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = ? AND column_name = ?",
		tableName,
		columnName,
	).Scan(&count).Error; err != nil {
		log.Printf("Failed to inspect column %s.%s: %v", tableName, columnName, err)
		return false
	}
	return count > 0
}
