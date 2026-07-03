package domain

import (
	"time"

	"github.com/google/uuid"
)

type Notification struct {
	ID          uuid.UUID  `db:"id" json:"id"`
	UserID      uuid.UUID  `db:"user_id" json:"user_id"`
	Type        string     `db:"type" json:"type"`
	ReferenceID *uuid.UUID `db:"reference_id" json:"reference_id"`
	Content     string     `db:"content" json:"content"`
	IsRead      bool       `db:"is_read" json:"is_read"`
	CreatedAt   time.Time  `db:"created_at" json:"created_at"`
}
