package domain

import (
	"time"

	"github.com/google/uuid"
	"github.com/lib/pq"
)

// pagination
type PaginatedConsultants struct {
	Data       []ConsultantProfile `json:"data"`
	TotalCount int                 `json:"total_count"`
	Page       int                 `json:"page"`
	Limit      int                 `json:"limit"`
}

type PaginatedReviews struct {
	Data       []Review `json:"data"`
	TotalCount int      `json:"total_count"`
	Page       int      `json:"page"`
	Limit      int      `json:"limit"`
}

// consultant object
type ConsultantProfile struct {
	// basic data for a consultant profile
	// ID and basic info
	ID     uuid.UUID `json:"id" db:"id"`
	UserID uuid.UUID `db:"user_id" json:"user_id"`
	Name   string    `json:"name" db:"full_name"`

	// for better display
	DisplayName string `json:"displayName" db:"display_name"`

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
	Languages    pq.StringArray `db:"languages" json:"languages"`
	ResponseTime string         `db:"response_time" json:"response_time"`
	JoinedAt     time.Time      `json:"joinedAt" db:"created_at"`
	Badges       []Badge        `json:"badges"`
	Reviews      []Review       `json:"reviews"`
}

// for session and billing system
type ConsultantSession struct {
	ID             uuid.UUID `db:"id" json:"id"`
	ConversationID uuid.UUID `db:"conversation_id" json:"conversation_id"`
	PackageType    string    `db:"package_type" json:"package_type"`
	DurationHours  int       `db:"duration_hours" json:"duration_hours"`
	Status         string    `db:"status" json:"status"`
	PaidAt         time.Time `db:"paid_at" json:"paid_at"`
	StartedAt      time.Time `db:"started_at" json:"started_at"`
	ExpiresAt      time.Time `db:"expires_at" json:"expires_at"`
	CreatedAt      time.Time `db:"created_at" json:"created_at"`
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
