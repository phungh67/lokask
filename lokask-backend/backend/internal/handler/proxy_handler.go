package handler

import (
	"io"
	"net/http"

	"github.com/gofiber/fiber/v2"
)

type ProxyHandler struct{}

func NewProxyHandler() *ProxyHandler {
	return &ProxyHandler{}
}

func (h *ProxyHandler) ProxyImage(c *fiber.Ctx) error {
	targetURL := c.Query("url")
	if targetURL == "" {
		return c.Status(400).SendString("Missing url query parameter")
	}

	req, err := http.NewRequest("GET", targetURL, nil)
	if err != nil {
		return c.Status(500).SendString("Invalid URL")
	}
	req.Header.Set("User-Agent", "Mozilla/5.0 (Compatible; LokaskBot/1.0)")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return c.Status(502).SendString("Failed to fetch remote image")
	}
	defer resp.Body.Close()

	imgData, err := io.ReadAll(resp.Body)
	if err != nil {
		return c.Status(500).SendString("Failed to read image data")
	}

	contentType := resp.Header.Get("Content-Type")
	if contentType == "" {
		contentType = "image/jpeg" // Fallback
	}
	c.Set("Content-Type", contentType)

	c.Set("Access-Control-Allow-Origin", "*")
	c.Set("Cache-Control", "public, max-age=86400")

	return c.Status(resp.StatusCode).Send(imgData)
}
