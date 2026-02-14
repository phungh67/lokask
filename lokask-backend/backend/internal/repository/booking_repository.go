package repository

import (
	"asklocal/internal/domain"

	"github.com/jmoiron/sqlx"
)

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
