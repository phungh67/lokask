package handler

import (
	"asklocal/internal/domain"
	"asklocal/internal/repository"
	"strings"
	"time"

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
	// get traveler (booking)
	travelerIDStr := c.Locals("user_id").(string)
	travelerID, _ := uuid.Parse(travelerIDStr)

	// parse request body
	var req domain.CreateBookingRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request body"})
	}

	// check if booking self, ownership,...
	consultantID, _ := uuid.Parse(req.ConsultantID)
	profile, err := h.Consultantrepo.GetProfileByID(c.Context(), consultantID)
	if err != nil {
		return c.Status(404).JSON(fiber.Map{
			"error":   "Consultant not found",
			"details": err.Error(),
		})
	}
	if profile.UserID == travelerID {
		return c.Status(400).JSON(fiber.Map{"error": "You cannot book your own service"})
	}

	// time checking
	startTime, err := time.Parse(time.RFC3339, req.StartTime)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid start time format. Use ISO8601"})
	}

	// hardcoded for 60 for testing
	endTime := startTime.Add(60 * time.Minute)

	// input booking
	booking := &domain.BookingEntry{
		ConsultantID: consultantID.String(),
		UserID:       travelerID.String(),
		StartTime:    startTime,
		EndTime:      endTime,
		TotalPrice:   req.TotalPrice,
		UserNotes:    req.UserNotes,
		ServiceType:  req.ServiceType,
	}

	// transaction
	tx, err := h.DB.BeginTxx(c.Context(), nil)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to start transaction"})
	}

	defer tx.Rollback()

	if err := h.BookingRepo.CreateBookingTx(tx, booking); err != nil {
		// Handle PostgreSQL GiST overlap constraint
		if strings.Contains(err.Error(), "exclude_overlapping_bookings") {
			return c.Status(409).JSON(fiber.Map{"error": "This time slot is already booked"})
		}
		return c.Status(500).JSON(fiber.Map{"error": "Booking failed", "details": err.Error()})
	}

	if err := tx.Commit(); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to finalize booking"})
	}

	return c.Status(201).JSON(booking)
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
	loggedInUserIDStr := c.Locals("user_id").(string)
	loggedInUserUUID, _ := uuid.Parse(loggedInUserIDStr)

	if profile.UserID != loggedInUserUUID {
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
