package controller

import (
	"fmt"
	"log"
	"net/http"
	. "server/app/helpers"
	"server/app/model"
	"server/connection"

	"github.com/labstack/echo/v4"
)

// GetContactMessages godoc
func GetContactMessages(c echo.Context) error {
	data := &Paginate{
		Model: &model.ContactMessage{},
	}
	db := connection.DB
	query := db.Model(&model.ContactMessage{})

	search := c.QueryParam("search")
	if search != "" {
		query = query.Where("name ILIKE ? OR email ILIKE ? OR subject ILIKE ?", "%"+search+"%", "%"+search+"%", "%"+search+"%")
	}

	result := data.Paginate(query, c)
	return c.JSON(http.StatusOK, Response{Status: true, Message: "Success get data", Data: result})
}

// GetContactMessageByID godoc
func GetContactMessageByID(c echo.Context) error {
	id := c.Param("id")
	var msg model.ContactMessage
	if err := connection.DB.First(&msg, id).Error; err != nil {
		return c.JSON(http.StatusNotFound, Response{Status: false, Message: "Data tidak ditemukan"})
	}

	// Mark as read when opened
	if !msg.IsRead {
		msg.IsRead = true
		connection.DB.Save(&msg)
	}

	return c.JSON(http.StatusOK, Response{Status: true, Message: "Success", Data: msg})
}

// SubmitContactMessage godoc
func SubmitContactMessage(c echo.Context) error {
	msg := new(model.ContactMessage)
	if err := c.Bind(msg); err != nil {
		return c.JSON(http.StatusBadRequest, Response{Status: false, Message: err.Error()})
	}

	// Save to DB
	if err := connection.DB.Create(&msg).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, Response{Status: false, Message: "Gagal menyimpan pesan"})
	}

	// Send auto-reply to sender in background goroutine
	go func(name, email, subj string) {
		subject := "Terima Kasih Telah Menghubungi Rifaya Tryout"
		body := fmt.Sprintf(`
			<h3>Halo %s,</h3>
			<p>Terima kasih telah menghubungi kami. Kami telah menerima pesan Anda dengan subjek <b>"%s"</b>.</p>
			<p>Tim Rifaya Tryout akan segera menindaklanjuti pesan Anda dan membalas dalam waktu maksimal 1x24 jam.</p>
			<br/>
			<p>Salam hangat,</p>
			<p><b>Tim Rifaya Tryout</b></p>
		`, name, subj)

		if err := SendEmail(email, subject, body); err != nil {
			log.Printf("[CONTACT] Gagal mengirim email auto-reply ke %s: %v", email, err)
		}
	}(msg.Name, msg.Email, msg.Subject)

	return c.JSON(http.StatusCreated, Response{Status: true, Message: "Pesan berhasil dikirim", Data: msg})
}

// DeleteContactMessage godoc
func DeleteContactMessage(c echo.Context) error {
	id := c.Param("id")
	if err := connection.DB.Delete(&model.ContactMessage{}, id).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, Response{Status: false, Message: "Gagal menghapus pesan"})
	}
	return c.JSON(http.StatusOK, Response{Status: true, Message: "Deleted successfully"})
}
