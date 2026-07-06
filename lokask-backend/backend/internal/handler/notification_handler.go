package handler

import (
	"asklocal/internal/domain"
	"asklocal/internal/repository"
	"log"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type NotificationHandler struct {
	Repo *repository.NotificationRepository
}

// GET /notifications
func (h *NotificationHandler) GetMyNotification(c *fiber.Ctx) error {
	userIDStr, err := getUserID(c)
	if err != nil {
		return c.Status(401).JSON(fiber.Map{
			"error": "Unauthorized.",
		})
	}

	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{
			"error": "Invalid user ID",
		})
	}

	notifs, err := h.Repo.GetUserNotifications(c.UserContext(), userID)
	if err != nil {
		log.Printf("[ERROR][NOTI] Cannot get user notification: %v", err)
		return c.Status(500).JSON(fiber.Map{
			"error": "Internal server error.",
		})
	}

	if notifs == nil {
		notifs = []domain.Notification{}
	}

	return c.JSON(notifs)
}

// PUT /notifications/:id/read
func (h *NotificationHandler) MarkRead(c *fiber.Ctx) error {
	userIDStr, err := getUserID(c)
	if err != nil {
		return c.Status(401).JSON(fiber.Map{
			"error": "Unauthorized",
		})
	}

	userID, _ := uuid.Parse(userIDStr)
	notifID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(fiber.Map{
			"error": "Invalid Notification ID",
		})
	}

	if err := h.Repo.MarkAsRead(c.UserContext(), notifID, userID); err != nil {
		log.Printf("[ERROR][NOTI] Failed to update status of notification: %v", err)
		return c.Status(500).JSON(fiber.Map{
			"error": "Failed to update notification",
		})
	}

	return c.JSON(fiber.Map{"status": "success"})
}

// PUT notifications/read-all
func (h *NotificationHandler) MarkAllRead(c *fiber.Ctx) error {
	userIDStr, err := getUserID(c)
	if err != nil {
		return c.Status(401).JSON(fiber.Map{
			"error": "Unauthorized",
		})
	}

	userID, _ := uuid.Parse(userIDStr)

	if err := h.Repo.MarkAllAsRead(c.UserContext(), userID); err != nil {
		log.Printf("[ERROR][NOTI] Failed to update status of notifications: %v", err)
		return c.Status(500).JSON(fiber.Map{
			"error": "Failed to clear notifications",
		})
	}

	return c.JSON(fiber.Map{"status": "success"})
}
