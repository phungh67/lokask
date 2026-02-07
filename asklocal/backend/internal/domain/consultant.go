package domain

import (
	"time"

	"github.com/google/uuid"
)

// consultant object
type ConsultantProfile struct {
	// basic data for a consultant profile
	ID         uuid.UUID `json:"id" db:"id"`
	FullName   string    `json:"full_name" db:"full_name"`
	AvatarURL  string    `json:"avatar_url" db:"avatar_url"`
	Bio        string    `json:"bio" db:"bio"`
	HourlyRate float64   `json:"hourly_rate" db:"hourly_rate"`
	Rating     float64   `json:"rating" db:"rating_avg"`
	IsVerified bool      `json:"is_verified" db:"is_verified"`

	// location infor
	City    string `json:"city" db:"city_name"`
	Country string `json:"country" db:"country_code"`

	// more fields
	Languages    string `json:"languages" db:"languages"`
	ResponseTime string `json:"response_time" db:"response_time"`

	Badges []Badge `json:"badges"`

	// character's field
	Reviews   []Review  `json:"reviews"`
	Niches    []string  `json:"niches"`    // e.g. ["Foodie", "History"]
	Portfolio []string  `json:"portfolio"` // Array of Image URLs
	JoinedAt  time.Time `json:"joined_at" db:"created_at"`
}

// for mapping the review to consultant (e.g review from previous clients)
type Review struct {
	ID             uuid.UUID `json:"id" db:"id"`
	ReviewerName   string    `json:"reviewer_name" db:"reviewer_name"`
	ReviewerAvatar string    `json:"reviewer_avatar" db:"reviewer_avatar"`
	Rating         int       `json:"rating" db:"rating"`
	Comment        string    `json:"comment" db:"comment"`
	VerifiedStay   bool      `json:"verified_stay" db:"verified_stay"`
	CreatedAt      time.Time `json:"date" db:"created_at"`
}

// consultant's hobbies
type Niche struct {
	ID          int    `db:"id" json:"id"`
	Slug        string `db:"slug" json:"slug"`
	DisplayName string `db:"display_name" json:"display_name"`
}

// Badge represents a trust indicator calculated by the backend
type Badge struct {
	ID          string `json:"id"`        // e.g. "tenure_gold", "verified_id"
	IconName    string `json:"icon_name"` // Hint for frontend icon (optional)
	Title       string `json:"title"`
	Description string `json:"description"`
}
