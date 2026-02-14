package domain

import "time"

type BookingEntry struct {
	ID           string `db:"id" json:"id"`
	ConsultantID string `db:"consultant_id" json:"consultant_id"`
	UserID       string `db:"user_id" json:"user_id"`

	// Time slots
	StartTime time.Time `db:"start_time" json:"start_time"`
	EndTime   time.Time `db:"end_time" json:"end_time"`

	// Management
	Status     string  `db:"status" json:"status"` // pending, confirmed, cancelled
	TotalPrice float64 `db:"total_price" json:"total_price"`
	UserNotes  string  `db:"user_notes" json:"user_notes"`

	CreatedAt time.Time `db:"created_at" json:"created_at"`
	UpdatedAt time.Time `db:"updated_at" json:"updated_at"`
}
