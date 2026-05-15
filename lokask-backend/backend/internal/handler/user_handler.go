package handler

import (
	"asklocal/internal/repository"
	"asklocal/internal/storage"
	"log"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type UserHandler struct {
	Repo    *repository.UserRepository
	Storage storage.FileStorage
}

func NewUserHandler(repo *repository.UserRepository, storage storage.FileStorage) *UserHandler {
	return &UserHandler{Repo: repo, Storage: storage}
}

func (h *UserHandler) UploadAvatar(c *fiber.Ctx) error {
	userIDStr := c.Locals("user_id").(string) // type casting
	userID, _ := uuid.Parse(userIDStr)

	// get the header
	fileHeader, err := c.FormFile("avatar")
	if err != nil {
		return c.Status(400).JSON(fiber.Map{
			"message": "No file uploaded",
			"error":   err.Error(),
		})
	}

	url, err := h.Storage.UploadProfilePicture(fileHeader, userID.String())

	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"message": "DB uploaded failed",
			"error":   err.Error(),
		})
	}

	// update database
	err = h.Repo.UpdateAvatar(userID, url)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"message": "Failed to update user profile",
			"error":   err.Error(),
		})
	}

	// debug
	log.Printf("[LOG] Upload image into: %s", url)

	return c.JSON(fiber.Map{
		"avatar_url": url,
		"message":    "Avatar updated successfully",
	})
}
