package repository

import (
	"asklocal/internal/domain"
	"context"

	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"
)

type ConsultantBookingView struct {
	domain.BookingEntry
	TravellerName     string  `db:"traveller_name" json:"traveller_name"`
	TravellerAvatar   *string `db:"traveller_avatar" json:"traveller_avatar"`
	TravellerLocation string  `db:"traveller_location" json:"traveller_location"`

	ConsultantName   *string `db:"consultant_name" json:"consultant_name"`
	ConsultantAvatar *string `db:"consultant_avatar" json:"consultant_avatar"`
	ConsultantCity   string  `db:"consultant_city" json:"consultant_city"`
}

type UserBookingView struct {
	domain.BookingEntry
	ConsultantName   string `db:"consultant_name" json:"consultant_name"`
	ConsultantAvatar string `db:"consultant_avatar" json:"consultant_avatar"`
	CityName         string `db:"consultant_city" json:"consultant_city"`
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
			user_notes,
			service_type
		) 
		VALUES ($1, $2, $3, $4, $5, $6, $7)
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
		b.ServiceType,
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
        COALESCE(u.avatar_url, '') AS traveller_avatar,
        ct.name AS consultant_city
    FROM bookings b
    JOIN users u ON b.user_id = u.id
    JOIN consultants c ON b.consultant_id = c.id
    JOIN cities ct ON c.city_id = ct.id
    WHERE b.consultant_id = $1
    ORDER BY b.start_time DESC
`
	err := r.DB.SelectContext(ctx, &bookings, query, consultantID)
	return bookings, err
}

// get booking by userID
func (r *BookingRepository) GetUserBookings(ctx context.Context, userID uuid.UUID) ([]UserBookingView, error) {
	var bookings []UserBookingView
	query := `
    SELECT 
        b.*, 
        u.full_name AS consultant_name, 
        COALESCE(u.avatar_url, '') AS consultant_avatar,
        ct.name AS consultant_city
    FROM bookings b
    JOIN consultants c ON b.consultant_id = c.id
    JOIN users u ON c.user_id = u.id
    JOIN cities ct ON c.city_id = ct.id
	WHERE b.user_id = $1
    ORDER BY b.start_time DESC
`
	// sqlx maps the results into the slice of structs
	err := r.DB.SelectContext(ctx, &bookings, query, userID)
	return bookings, err
}

// delete a booking slot
func (r *BookingRepository) DeleteBooking(ctx context.Context, id uuid.UUID) error {
	query := `DELETE FROM bookings WHERE id = $1`
	_, err := r.DB.ExecContext(ctx, query, id)
	return err
}

// update booking status
func (r *BookingRepository) UpdateBookingStatus(ctx context.Context, id uuid.UUID, status string) error {
	query := `UPDATE bookings SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`
	_, err := r.DB.ExecContext(ctx, query, status, id)
	return err
}

// ownership check
func (r *BookingRepository) IsBookingOwner(ctx context.Context, bookingID uuid.UUID, userID string) (bool, error) {
	var exists bool
	// Use 1 to just check if exist, not touch actual data
	query := `
		SELECT EXISTS (
			SELECT 1 FROM bookings b
			JOIN consultants c ON b.consultant_id = c.id
			WHERE b.id = $1 AND (c.user_id = $2 OR b.user_id = $2)
		)
	`
	err := r.DB.QueryRowContext(ctx, query, bookingID, userID).Scan(&exists)
	return exists, err
}
