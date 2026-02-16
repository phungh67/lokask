package handler

import (
	"asklocal/internal/repository"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"
)

type BookingHandler struct {
	BookingRepo *repository.BookingRepository
	DB          *sqlx.DB
}

func (h *BookingHandler) GetMySchedule(c *fiber.Ctx) error {
	idStr := c.Params("id")
	consutantID, err := uuid.Parse(idStr)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{
			"error":  "Invalid data",
			"detail": err.Error(),
		})
	}

	bookings, err := h.BookingRepo.GetConsultantBookings(c.Context(), consutantID)

	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error":   "Could not get booking",
			"details": err.Error(),
		})
	}

	return c.JSON(bookings)
}
