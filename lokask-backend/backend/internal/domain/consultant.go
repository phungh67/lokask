package domain

import (
	"time"

	"github.com/google/uuid"
)

// consultant object
type ConsultantProfile struct {
	// basic data for a consultant profile
	// ID and basic info
	ID   uuid.UUID `json:"id" db:"id"`
	Name string    `json:"full_name" db:"full_name"`

	// media file, avatar,...
	AvatarURL     string   `json:"avatarUrl" db:"avatar_url"`
	CoverURL      string   `json:"coverUrl" db:"cover_url"`
	GalleryImages []string `json:"galleryImages,omitempty" db:"-"`

	// content
	Bio   string `json:"bio" db:"bio"`
	Quote string `json:"quote" db:"quote"`

	// Statics
	Rating      float64 `json:"rating" db:"rating_avg"`
	HelpedCount int     `json:"helpedCount" db:"helped_count"`

	// verification
	IsHighlyTrusted bool    `json:"isHighlyTrusted" db:"is_verified"`
	HourlyRate      float64 `json:"hourly_rate" db:"hourly_rate"`

	// location infor
	City    string `json:"city" db:"city_name"`
	Country string `json:"country,omitempty" db:"country_code"`

	// tags/niches
	Tag  string   `json:"tag" db:"-"`
	Tags []string `json:"tags" db:"-"`

	// timestamp and extra information
	Languages    []string  `json:"languages,omitempty" db:"-"`
	ResponseTime string    `json:"responseTime,omitempty" db:"response_time"`
	JoinedAt     time.Time `json:"joinedAt" db:"created_at"`
	Badges       []Badge   `json:"badges"`
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
