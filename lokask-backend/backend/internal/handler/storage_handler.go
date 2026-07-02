// using this handle to mask the actual location of
// storage for static assets
package handler

import (
	"asklocal/internal/helper"
	"asklocal/internal/storage"
	"log"

	"github.com/gofiber/fiber/v2"
)

type StorageHandler struct {
	Storage storage.FileStorage
}

func NewStorageHandler(s storage.FileStorage) *StorageHandler {
	return &StorageHandler{
		Storage: s,
	}
}

func (h *StorageHandler) UploadMedia(c *fiber.Ctx) (string, error) {
	userIDStr := c.Locals("user_id").(string)

	fileHeader, err := c.FormFile("avatar")
	if err != nil {
		return "", c.Status(400).JSON(fiber.Map{
			"error": "No file was provided.",
		})
	}

	key, err := helper.ValidateAndSecureFilename(fileHeader.Filename)
	if err != nil {
		log.Printf("[WARN][UPLOAD] Blocked upload: %v", err)
		return "", c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"message": "Bad request.",
		})
	}

	url, err := h.Storage.UploadFile(fileHeader, userIDStr, key)

	if err != nil {
		return url, nil
	}

	log.Printf("[ERROR][HANDLER] Upload failed due to: %v", err)
	return "", c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
		"message": "Upload failed.",
	})
}
