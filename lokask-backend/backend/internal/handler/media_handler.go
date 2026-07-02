package handler

import (
	"asklocal/internal/storage"
	"fmt"
	"log"
	"mime"
	"path/filepath"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
)

type MediaHandler struct {
	Storage storage.FileStorage
}

func NewMediaHandler(storage storage.FileStorage) *MediaHandler {
	return &MediaHandler{
		Storage: storage,
	}
}

func (h *MediaHandler) ServeMedia(c *fiber.Ctx) error {
	log.Printf("[DEBUG] ServeMedia triggered for path: %s", c.Path())
	objectKey := c.Params("*")
	if objectKey == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "File path is required",
		})
	}

	if strings.Contains(objectKey, "..") {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"error": "Invalid file path",
		})
	}

	fileStream, err := h.Storage.DownloadFile(c.Context(), objectKey)
	if err != nil {
		fmt.Printf("[ERROR][MEDIA] File not found or inaccessible: %s | %v\n", objectKey, err)
		return c.Status(fiber.StatusNotFound).SendString("File not found")
	}
	defer fileStream.Close()

	ext := filepath.Ext(objectKey)
	mimeType := mime.TypeByExtension(ext)
	if mimeType == "" {
		mimeType = "application/octet-stream"
	}

	c.Set("Content-Type", mimeType)
	c.Set("Cache-Control", fmt.Sprintf("public, max-age=%d", int(30*24*time.Hour/time.Second)))

	return c.SendStream(fileStream)
}
