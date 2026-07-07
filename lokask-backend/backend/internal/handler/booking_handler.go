package handler

import (
	"asklocal/internal/domain"
	"asklocal/internal/repository"
	"log"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"
)

type BookingHandler struct {
	BookingRepo    *repository.BookingRepository
	Consultantrepo *repository.ConsultantRepository
	Notifier       *repository.NotificationRepository
	DB             *sqlx.DB
}

func NewBookingHandler(bRepo *repository.BookingRepository, cRepo *repository.ConsultantRepository, notifier *repository.NotificationRepository, db *sqlx.DB) *BookingHandler {
	return &BookingHandler{
		BookingRepo:    bRepo,
		Consultantrepo: cRepo,
		Notifier:       notifier,
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
		ConsultantID: consultantID,
		UserID:       travelerID,
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

	// noti
	var info struct {
		ConsultantUserID string `db:"user_id"`
		TravelerName     string `db:"full_name"`
	}

	query := `
    	SELECT c.user_id, u.full_name 
    	FROM consultants c, users u 
    	WHERE c.id = $1 AND u.id = $2
	`

	err = h.DB.GetContext(c.UserContext(), &info, query, consultantID, travelerID)

	if err == nil {
		refID := booking.ID
		content := "You have a new booking request from " + info.TravelerName

		_ = h.Notifier.CreateNotification(
			c.UserContext(),
			uuid.MustParse(info.ConsultantUserID),
			"new_booking",
			&refID,
			content,
		)

		notifPayload := fiber.Map{
			"type":         "new_booking",
			"reference_id": booking.ID.String(),
			"sender_name":  info.TravelerName,
			"preview":      content,
			"created_at":   time.Now().Format(time.RFC3339),
		}
		BroadcastNotification(info.ConsultantUserID, notifPayload)
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

// public get consultant booking
func (h *BookingHandler) PublicGetConsultantSchedule(c *fiber.Ctx) error {
	idStr := c.Params("id")
	consultantID, err := uuid.Parse(idStr)

	// passed the other_user_id (from front-end) to this
	// @TODO: only show confirmed bookings (front-end side)

	// skip logged in checking here due to logged in user is not the same person
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

func (h *BookingHandler) DeleteBooking(c *fiber.Ctx) error {
	idStr := c.Params("id")
	bookingID, _ := uuid.Parse(idStr)
	// userID := c.Locals("user_id").(string)

	// TODO: checking
	err := h.BookingRepo.DeleteBooking(c.Context(), bookingID)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to delete booking"})
	}

	return c.SendStatus(204) // No Content
}

func (h *BookingHandler) UpdateStatus(c *fiber.Ctx) error {
	idStr := c.Params("id")
	bookingID, err := uuid.Parse(idStr)

	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid booking ID format"})
	}

	var req struct {
		Status string `json:"status"` // "confirmed", "cancelled", etc.
	}
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request"})
	}

	// shield here, disallow others to change booking
	userID, ok := c.Locals("user_id").(string)
	if !ok || userID == "" {
		return c.Status(401).JSON(fiber.Map{"error": "Unauthorized"})
	}

	isOwner, err := h.BookingRepo.IsBookingOwner(c.Context(), bookingID, userID)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Database error checking ownership"})
	}
	if !isOwner {
		return c.Status(403).JSON(fiber.Map{"error": "Forbidden: You do not own this booking"})
	}

	if req.Status != "confirmed" && req.Status != "cancelled" && req.Status != "pending" {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid status. Must be pending, confirmed, or cancelled."})
	}

	err = h.BookingRepo.UpdateBookingStatus(c.Context(), bookingID, req.Status)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to update booking"})
	}

	if req.Status == "confirmed" {
		var info struct {
			TravelerUserID string `db:"traveler_id"`
			ConsultantName string `db:"consultant_name"`
		}
		query := `
			SELECT 
            	b.user_id AS traveler_id, 
            	u_cons.full_name AS consultant_name
        	FROM bookings b
        	JOIN consultants c ON b.consultant_id = c.id
        	JOIN users u_cons ON c.user_id = u_cons.id
        	WHERE b.id = $1
		`

		err = h.DB.GetContext(c.UserContext(), &info, query, bookingID)

		if err == nil {
			refID := bookingID
			content := info.ConsultantName + " has confirmed your booking!"

			_ = h.Notifier.CreateNotification(
				c.UserContext(),
				uuid.MustParse(info.TravelerUserID),
				"booking_confirmed",
				&refID,
				content,
			)

			notifPayload := fiber.Map{
				"type":         "new_booking",
				"reference_id": bookingID.String(),
				"sender_name":  info.ConsultantName,
				"preview":      content,
				"created_at":   time.Now().Format(time.RFC3339),
			}
			BroadcastNotification(info.TravelerUserID, notifPayload)
		} else {
			log.Printf("[WARN][BOOKING] Failed to fetch info for confirmation notification: %v", err)
		}
	}

	return c.JSON(fiber.Map{"status": req.Status})
}
