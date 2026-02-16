package handler

import (
	"asklocal/internal/domain"
	"asklocal/internal/repository"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"
)

type BookingHandler struct {
	BookingRepo    *repository.BookingRepository
	Consultantrepo *repository.ConsultantRepository
	DB             *sqlx.DB
}

func NewBookingHandler(bRepo *repository.BookingRepository, cRepo *repository.ConsultantRepository, db *sqlx.DB) *BookingHandler {
	return &BookingHandler{
		BookingRepo:    bRepo,
		Consultantrepo: cRepo,
		DB:             db,
	}
}

func (h *BookingHandler) CreateBooking(c *fiber.Ctx) error {
	travelerID := c.Locals("user_id").(string)

	var req domain.CreateBookingRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{
			"error":   "Invalid request",
			"details": err.Error(),
		})
	}

	consultantID, _ := uuid.Parse(req.ConsultantID)
	profile, err := h.Consultantrepo.GetProfileByID(c.Context(), consultantID)

	if profile.ID.String() == travelerID {
		return c.Status(400).JSON(fiber.Map{
			"error":   "You cannot book yourself",
			"details": err.Error(),
		})
	}

	return nil
}

func (h *BookingHandler) GetMySchedule(c *fiber.Ctx) error {
	idStr := c.Params("id")
	consultantID, err := uuid.Parse(idStr)

	// check if the user is existed
	profile, err := h.Consultantrepo.GetProfileByID(c.Context(), consultantID)
	if err != nil {
		return c.Status(404).JSON(fiber.Map{
			"error":   "Consultant not found",
			"details": err.Error(),
		})
	}

	// logged in checking
	loggedInUserID := c.Locals("user_id").(string)

	if profile.ID.String() != loggedInUserID {
		return c.Status(403).JSON(fiber.Map{"error": "Unauthorized access to this schedule"})
	}

	bookings, err := h.BookingRepo.GetConsultantBookings(c.Context(), consultantID)

	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error":   "Could not get booking",
			"details": err.Error(),
		})
	}

	return c.JSON(bookings)
}

func (h *BookingHandler) GetUserTrips(c *fiber.Ctx) error {
	// Extract userID from middleware context
	uidStr := c.Locals("user_id").(string)
	userID, _ := uuid.Parse(uidStr)

	trips, err := h.BookingRepo.GetUserBookings(c.Context(), userID)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error":   "Failed to fetch your trips",
			"details": err.Error(),
		})
	}

	return c.JSON(trips)
}
