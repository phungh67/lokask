package repository

import (
	"asklocal/internal/domain"
	"context"

	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"
)

type NotificationRepository struct {
	DB *sqlx.DB
}

func NewNotificationRepository(db *sqlx.DB) *NotificationRepository {
	return &NotificationRepository{
		DB: db,
	}
}

func (r *NotificationRepository) CreateNotification(ctx context.Context, userID uuid.UUID, notifType string, refID *uuid.UUID, content string) error {
	query := `
		INSERT INTO notifications (user_id, type, reference_id, content)
		VALUES ($1, $2, $3, $4)
	`
	_, err := r.DB.ExecContext(ctx, query, userID, notifType, refID, content)
	return err
}

func (r *NotificationRepository) GetUserNotifications(ctx context.Context, userID uuid.UUID) ([]domain.Notification, error) {
	var notifs []domain.Notification
	query := `
		SELECT * FROM notifications 
		WHERE user_id = $1 
		ORDER BY created_at DESC 
		LIMIT 30
	`
	err := r.DB.SelectContext(ctx, &notifs, query, userID)
	return notifs, err
}

func (r *NotificationRepository) MarkAsRead(ctx context.Context, notifID uuid.UUID, userID uuid.UUID) error {
	query := `UPDATE notifications SET is_read = TRUE WHERE id = $1 AND user_id = $2`
	_, err := r.DB.ExecContext(ctx, query, notifID, userID)
	return err
}

// low priority
func (r *NotificationRepository) MarkAllAsRead(ctx context.Context, userID uuid.UUID) error {
	query := `UPDATE notifications SET is_read = TRUE WHERE user_id = $1 AND is_read = FALSE`
	_, err := r.DB.ExecContext(ctx, query, userID)
	return err
}
