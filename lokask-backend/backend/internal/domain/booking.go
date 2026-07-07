package domain

import (
	"time"

	"github.com/google/uuid"
)

type BookingEntry struct {
	ID           uuid.UUID `db:"id" json:"id"`
	ConsultantID uuid.UUID `db:"consultant_id" json:"consultant_id"`
	UserID       uuid.UUID `db:"user_id" json:"user_id"`

	// Time slots
	StartTime time.Time `db:"start_time" json:"start_time"`
	EndTime   time.Time `db:"end_time" json:"end_time"`

	// Management
	ServiceType string  `db:"service_type" json:"service_type"`
	Status      string  `db:"status" json:"status"` // pending, confirmed, cancelled
	TotalPrice  float64 `db:"total_price" json:"total_price"`
	UserNotes   string  `db:"user_notes" json:"user_notes"`

	CreatedAt time.Time `db:"created_at" json:"created_at"`
	UpdatedAt time.Time `db:"updated_at" json:"updated_at"`
}

type CreateBookingRequest struct {
	ConsultantID string  `json:"consultant_id"`
	StartTime    string  `json:"start_time"`   // Received as ISO string from frontend
	ServiceType  string  `json:"service_type"` // e.g., 'video_call'
	UserNotes    string  `json:"user_notes"`
	TotalPrice   float64 `json:"total_price"`
}
