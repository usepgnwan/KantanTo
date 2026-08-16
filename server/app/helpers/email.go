package helpers

import (
	"crypto/tls"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"gopkg.in/gomail.v2"
)

// tes
// cleanEnv membersihkan tanda kutip dan spasi dari nilai environment variable
func cleanEnv(key string) string {
	val := os.Getenv(key)
	val = strings.TrimSpace(val)
	val = strings.Trim(val, `"`)
	val = strings.Trim(val, `'`)
	return strings.TrimSpace(val)
}

// writeEmailLog menulis log ke file log/email_error.txt
func writeEmailLog(level string, msg string) {
	// Dapatkan path absolut dari working directory
	wd, wdErr := os.Getwd()
	if wdErr != nil {
		log.Printf("[EMAIL-LOG] Gagal mendapatkan working directory: %v", wdErr)
		return
	}

	logDir := filepath.Join(wd, "log")
	if err := os.MkdirAll(logDir, 0755); err != nil {
		log.Printf("[EMAIL-LOG] Gagal membuat folder log di %s: %v", logDir, err)
		return
	}

	logFile := filepath.Join(logDir, "email_error.txt")
	f, err := os.OpenFile(logFile, os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)
	if err != nil {
		log.Printf("[EMAIL-LOG] Gagal membuka file log %s: %v", logFile, err)
		return
	}
	defer f.Close()

	timestamp := time.Now().Format("2006-01-02 15:04:05")
	entry := fmt.Sprintf("[%s] [%s] %s\n", timestamp, level, msg)
	f.WriteString(entry)
}

// SendEmail mengirim email dengan konfigurasi SMTP dari .env
func SendEmail(to string, subject string, body string) error {
	host := cleanEnv("MAIL_HOST")
	portStr := cleanEnv("MAIL_PORT")
	username := cleanEnv("MAIL_USERNAME")
	password := cleanEnv("MAIL_PASSWORD")
	from := cleanEnv("MAIL_FROM_ADDRESS")

	log.Printf("[EMAIL] Attempting to send email to: %s", to)
	writeEmailLog("INFO", fmt.Sprintf("Attempting to send email to: %s | Subject: %s", to, subject))

	if host == "" || portStr == "" || username == "" || password == "" {
		errMsg := fmt.Sprintf("SMTP config incomplete - host: '%s', port: '%s', username: '%s', password length: %d", host, portStr, username, len(password))
		writeEmailLog("ERROR", errMsg)
		return fmt.Errorf("[EMAIL] %s", errMsg)
	}

	port, err := strconv.Atoi(portStr)
	if err != nil {
		errMsg := fmt.Sprintf("Invalid port '%s': %v", portStr, err)
		writeEmailLog("ERROR", errMsg)
		return fmt.Errorf("[EMAIL] %s", errMsg)
	}

	m := gomail.NewMessage()
	m.SetHeader("From", from)
	m.SetHeader("To", to)
	m.SetHeader("Subject", subject)
	m.SetBody("text/html", body)

	d := gomail.NewDialer(host, port, username, password)
	d.TLSConfig = &tls.Config{
		ServerName:         host,
		InsecureSkipVerify: false,
	}

	if err := d.DialAndSend(m); err != nil {
		errMsg := fmt.Sprintf("FAILED to send email to %s: %v", to, err)
		log.Printf("[EMAIL] %s", errMsg)
		writeEmailLog("ERROR", errMsg)
		return fmt.Errorf("failed to send email: %v", err)
	}

	log.Printf("[EMAIL] SUCCESS - Email sent to %s", to)
	writeEmailLog("SUCCESS", fmt.Sprintf("Email sent to %s | Subject: %s", to, subject))
	return nil
}
