package domain

import (
	"time"

	"github.com/google/uuid"
)

type Blog struct {
	ID       uuid.UUID `db:"id" json:"id"`
	AuthorID uuid.UUID `db:"author_id" json:"author_id"`

	Title         string `db:"title" json:"title"`
	Summary       string `db:"summary" json:"summary"`
	Content       string `db:"content" json:"content"`
	CoverImageURL string `db:"cover_image_url" json:"cover_image_url"`

	City    string `db:"city" json:"city"`
	Country string `db:"country" json:"country"`

	Rating      float64 `db:"rating" json:"rating"`
	ReviewCount int     `db:"review_count" json:"review_count"`

	CreatedAt time.Time `db:"created_at" json:"created_at"`
	UpdatedAt time.Time `db:"updated_at" json:"updated_at"`

	// Fields for "JOIN" queries (not in the blogs table, but useful for UI)
	AuthorName   string `db:"author_name" json:"author_name,omitempty"`
	AuthorAvatar string `db:"author_avatar" json:"author_avatar,omitempty"`
}
