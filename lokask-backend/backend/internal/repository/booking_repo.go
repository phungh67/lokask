package repository

import (
	"asklocal/internal/domain"
	"context"

	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"
)

type ConsultantBookingView struct {
	domain.BookingEntry
	TravellerName   string `db:"traveller_name" json:"traveller_name"`
	TravellerAvatar string `db:"traveller_avatar" json:"traveller_avatar"`
}

type BookingRepository struct {
	DB *sqlx.DB
}

func NewBookingRepository(db *sqlx.DB) *BookingRepository {
	return &BookingRepository{DB: db}
}

// Create a new booking slot
func (r *BookingRepository) CreateBookingTx(tx *sqlx.Tx, b *domain.BookingEntry) error {
	query := `
		INSERT INTO bookings (
			consultant_id, 
			user_id, 
			start_time, 
			end_time, 
			total_price,
			user_notes
		) 
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING id, status, created_at, updated_at
	`
	return tx.QueryRow(
		query,
		b.ConsultantID,
		b.UserID,
		b.StartTime,
		b.EndTime,
		b.TotalPrice,
		b.UserNotes,
	).Scan(&b.ID, &b.Status, &b.CreatedAt, &b.UpdatedAt)
}

// fetch all bookings from a consultant
// strictly use consultant id first
func (r *BookingRepository) GetConsultantBookings(ctx context.Context, consultantID uuid.UUID) ([]ConsultantBookingView, error) {
	var bookings []ConsultantBookingView
	query := `
        SELECT 
            b.*, 
            u.full_name AS traveller_name, 
            u.avatar_url AS traveller_avatar
        FROM bookings b
        JOIN users u ON b.user_id = u.id
        WHERE b.consultant_id = $1
        ORDER BY b.start_time DESC
    `
	err := r.DB.SelectContext(ctx, &bookings, query, consultantID)
	return bookings, err
}
