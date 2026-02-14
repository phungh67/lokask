package handler

import (
	"asklocal/internal/repository"

	"github.com/gofiber/fiber/v2"
	"github.com/jmoiron/sqlx"
)

type BookingHandler struct {
	BookingRepo *repository.BookingRepository
	DB          *sqlx.DB
}

func (h *BookingHandler) Book(c *fiber.Ctx) error {
	return nil
}
