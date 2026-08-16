package controller

import (
	"bytes"
	"encoding/json"
	"io"
	"net/http"
	"os"

	. "server/app/helpers"

	"github.com/labstack/echo/v4"
)

// Request structure for AI Chat from frontend
type AIChatRequest struct {
	Prompt string `json:"prompt" validate:"required"`
}

// Structure for Groq API Request
type GroqMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type GroqPayload struct {
	Model    string        `json:"model"`
	Messages []GroqMessage `json:"messages"`
}

// AIChat godoc
// @Summary      Chat with AI via Groq
// @Description  Send a prompt to Groq API and get an AI response
// @Tags         AI
// @Accept       json
// @Produce      json
// @Param        request body controller.AIChatRequest true "Prompt"
// @Success      200  {object}  Response
// @Failure      400  {object}  Response
// @Failure      500  {object}  Response
// @Security     ApiKeyAuth
// @Router       /api/ai/chat [post]
func AIChat(c echo.Context) error {
	var req AIChatRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, Response{Status: false, Message: "Format request tidak valid"})
	}

	if req.Prompt == "" {
		return c.JSON(http.StatusBadRequest, Response{Status: false, Message: "Prompt wajib diisi"})
	}

	apiKey := os.Getenv("GROQ_API_KEY")
	if apiKey == "" {
		return c.JSON(http.StatusInternalServerError, Response{Status: false, Message: "GROQ_API_KEY belum disetel di file .env"})
	}

	model := os.Getenv("GROQ_MODEL")
	if model == "" {
		model = "llama3-8b-8192" // Default fallback model
	}

	messages := []GroqMessage{
		{
			Role:    "user",
			Content: req.Prompt,
		},
	}

	payload := GroqPayload{
		Model:    model,
		Messages: messages,
	}

	payloadBytes, err := json.Marshal(payload)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, Response{Status: false, Message: "Gagal menyiapkan payload"})
	}

	httpRequest, err := http.NewRequest("POST", "https://api.groq.com/openai/v1/chat/completions", bytes.NewBuffer(payloadBytes))
	if err != nil {
		return c.JSON(http.StatusInternalServerError, Response{Status: false, Message: "Gagal membuat request ke API AI"})
	}

	httpRequest.Header.Set("Authorization", "Bearer "+apiKey)
	httpRequest.Header.Set("Content-Type", "application/json")

	client := &http.Client{}
	httpResponse, err := client.Do(httpRequest)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, Response{Status: false, Message: "Gagal menghubungi API AI: " + err.Error()})
	}
	defer httpResponse.Body.Close()

	responseBody, err := io.ReadAll(httpResponse.Body)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, Response{Status: false, Message: "Gagal membaca response API AI"})
	}

	if httpResponse.StatusCode != http.StatusOK {
		var errResp map[string]interface{}
		json.Unmarshal(responseBody, &errResp)
		return c.JSON(httpResponse.StatusCode, Response{
			Status:  false,
			Message: "Gagal mendapatkan response dari AI",
			Data:    errResp,
		})
	}

	var data map[string]interface{}
	if err := json.Unmarshal(responseBody, &data); err != nil {
		return c.JSON(http.StatusInternalServerError, Response{Status: false, Message: "Gagal memparsing response API AI"})
	}

	// Extract the text content from the choices array
	var aiMessageContent string
	if choices, ok := data["choices"].([]interface{}); ok && len(choices) > 0 {
		if choice, ok := choices[0].(map[string]interface{}); ok {
			if message, ok := choice["message"].(map[string]interface{}); ok {
				if content, ok := message["content"].(string); ok {
					aiMessageContent = content
				}
			}
		}
	}

	if aiMessageContent == "" {
		return c.JSON(http.StatusInternalServerError, Response{Status: false, Message: "Format response API AI tidak dikenali atau kosong"})
	}

	return c.JSON(http.StatusOK, Response{
		Status:  true,
		Message: "Success",
		Data:    aiMessageContent,
	})
}
