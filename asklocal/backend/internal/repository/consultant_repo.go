package repository

import (
	"asklocal/internal/domain"
	"context"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"
)

type Consultant struct {
	ID     string `db:"id"`
	UserID string `db:"user_id"`
	CityID int    `db:"city_id"`

	Bio        *string  `db:"bio"`
	HourlyRate *float64 `db:"hourly_rate"`
}

type ConsultantRepository struct {
	DB *sqlx.DB
}

func NewConsultantRepository(db *sqlx.DB) *ConsultantRepository {
	return &ConsultantRepository{DB: db}
}

func (r *ConsultantRepository) CreateConsultantTx(tx *sqlx.Tx, c *Consultant) error {
	// create new consultant (by register)
	query := `INSERT INTO consultants (user_id, city_id) VALUES ($1, $2) RETURNING id`
	return tx.QueryRow(query, c.UserID, c.CityID).Scan(&c.ID)
}

// get consultant profile by ID, fetches city and user info
func (r *ConsultantRepository) GetProfileByID(ctx context.Context, id uuid.UUID) (*domain.ConsultantProfile, error) {
	profile := &domain.ConsultantProfile{}

	query := `
			SELECT
				c.id,
				u.full_name,
				COALESCE(u.avatar_url, '') as avatar_url,
				COALESCE(c.bio, '') as bio,
				COALESCE(c.hourly_rate, 0)::FLOAT as hourly_rate, 
				c.rating_avg::FLOAT as rating_avg,
				c.is_verified,
				ci.name as city_name,
				COALESCE(ci.country_code, '') as country_code,
				COALESCE(c.languages, 'English') as languages,
				COALESCE(c.response_time, 'Within 24h') as response_time,
				c.created_at
			FROM consultants c
			JOIN users u ON c.user_id = u.id
			JOIN cities ci ON c.city_id = ci.id
			WHERE c.id = $1
	`

	err := r.DB.GetContext(ctx, profile, query, id)
	if err != nil {
		return nil, fmt.Errorf("[ERROR][DB] Error fetching profile: %w", err)
	}

	var reviews []domain.Review
	reviewQuery := `
		SELECT 
			r.id, 
			u.full_name as reviewer_name, 
			COALESCE(u.avatar_url, '') as reviewer_avatar, 
			r.rating, 
			r.comment, 
			r.verified_stay,
			r.created_at
		FROM reviews r
		JOIN users u ON r.reviewer_id = u.id
		WHERE r.consultant_id = $1 
		ORDER BY r.created_at DESC 
		LIMIT 5
	`

	_ = r.DB.SelectContext(ctx, &reviews, reviewQuery, id)

	if reviews == nil {
		profile.Reviews = []domain.Review{}
	} else {
		profile.Reviews = reviews
	}
	// ------------------------------------------------

	// fetching details of that consultant (hobbies, images,...)
	var niches []string
	nicheQuery := `
			SELECT n.display_name
			FROM consultant_niches cn
			JOIN niches n ON cn.niche_id = n.id
			WHERE cn.consultant_id = $1
	`

	err = r.DB.SelectContext(ctx, &niches, nicheQuery, id)
	if err != nil {
		return nil, err
	}

	if niches == nil {
		profile.Niches = []string{}
	} else {
		profile.Niches = niches
	}

	// fetch image
	var images []string
	imgQuery := `SELECT image_url FROM portfolio_items WHERE consultant_id = $1 LIMIT 6`
	err = r.DB.SelectContext(ctx, &images, imgQuery, id)

	if err != nil {
		return nil, err
	}

	if images == nil {
		profile.Portfolio = []string{}
	} else {
		profile.Portfolio = images
	}

	profile.Badges = calculateBadges(profile)

	return profile, nil
}

// get a user by userID (and this case applies for an user also a consultant)
func (r *ConsultantRepository) GetProfileByUserID(ctx context.Context, userID uuid.UUID) (*domain.ConsultantProfile, error) {
	profile := &domain.ConsultantProfile{}

	// Query is almost identical to GetProfileByID, but WHERE is c.user_id
	query := `
			SELECT
				c.id,
				u.full_name,
				COALESCE(u.avatar_url, '') as avatar_url,
				COALESCE(c.bio, '') as bio,
				COALESCE(c.hourly_rate, 0)::FLOAT as hourly_rate, 
				c.rating_avg::FLOAT as rating_avg,
				c.is_verified,
				ci.name as city_name,
				COALESCE(ci.country_code, '') as country_code,
				COALESCE(c.languages, 'English') as languages,
				COALESCE(c.response_time, 'Within 24h') as response_time,
				c.created_at
			FROM consultants c
			JOIN users u ON c.user_id = u.id
			JOIN cities ci ON c.city_id = ci.id
			WHERE c.user_id = $1
	`

	err := r.DB.GetContext(ctx, profile, query, userID)
	if err != nil {
		return nil, err // Returns error if user is NOT a consultant
	}

	// --- Initialize empty slices so JSON doesn't return "null" ---
	profile.Reviews = []domain.Review{}
	profile.Niches = []string{}
	profile.Portfolio = []string{}

	// --- Optional: Fetch Extra Data (Niches, etc.) ---
	// Since we now have profile.ID, we can reuse the logic to fetch niches
	var niches []string
	nicheQuery := `
			SELECT n.display_name
			FROM consultant_niches cn
			JOIN niches n ON cn.niche_id = n.id
			WHERE cn.consultant_id = $1
	`
	_ = r.DB.SelectContext(ctx, &niches, nicheQuery, profile.ID)
	if niches != nil {
		profile.Niches = niches
	}

	// Calculate Badges
	profile.Badges = calculateBadges(profile)

	return profile, nil
}

// query all existings consultants
func (r *ConsultantRepository) ListConsultants(ctx context.Context, city string, country string) ([]domain.ConsultantProfile, error) {
	sql := `
		SELECT 
			c.id, 
			u.full_name, 
			COALESCE(u.avatar_url, '') as avatar_url,
			COALESCE(c.bio, '') as bio,
			COALESCE(c.hourly_rate, 0)::FLOAT as hourly_rate,
			c.rating_avg::FLOAT as rating_avg, 
			c.is_verified, 
			ci.name as city_name, 
			COALESCE(ci.country_code, '') as country_code,
			c.created_at
		FROM consultants c
		JOIN users u ON c.user_id = u.id
		JOIN cities ci ON c.city_id = ci.id
		WHERE 1=1
	`

	args := []interface{}{}
	argId := 1

	// filtered with cities (e.g. Rome, Paris,...)
	if city != "" {
		sql += fmt.Sprintf(" AND ci.name ILIKE $%d", argId)
		args = append(args, "%"+city+"%")
		argId++
	}

	if country != "" {
		// approach: assumed that city is referenced with city code (2 characters)
		// eg. Thailan = TH
		sql += fmt.Sprintf(" AND ci.country_code ILIKE $%d", argId)
		args = append(args, country)
		argId++
	}

	sql += " ORDER BY c.rating_avg DESC LIMIT 20"

	rows, err := r.DB.QueryxContext(ctx, sql, args...)
	if err != nil {
		return nil, err
	}

	defer rows.Close()

	var consultants []domain.ConsultantProfile
	for rows.Next() {
		var p domain.ConsultantProfile
		if err := rows.StructScan(&p); err != nil {
			return nil, err
		}

		var niches []string
		nicheQuery := `
			SELECT n.display_name 
			FROM consultant_niches cn
			JOIN niches n ON cn.niche_id = n.id
			WHERE cn.consultant_id = $1
		`
		_ = r.DB.SelectContext(ctx, &niches, nicheQuery, p.ID)

		if niches == nil {
			p.Niches = []string{}
		} else {
			p.Niches = niches
		}
		p.Portfolio = []string{}

		consultants = append(consultants, p)
	}

	return consultants, nil
}

// ListNiches fetches all available filter options
func (r *ConsultantRepository) ListNiches(ctx context.Context) ([]domain.Niche, error) {
	var niches []domain.Niche
	query := `SELECT id, slug, display_name FROM niches ORDER BY display_name ASC`

	err := r.DB.SelectContext(ctx, &niches, query)
	if err != nil {
		return nil, err
	}
	return niches, nil
}

// calculated internal properties to give badges
func calculateBadges(profile *domain.ConsultantProfile) []domain.Badge {
	var badges []domain.Badge

	yearsActive := time.Since(profile.JoinedAt).Hours() / 24 / 365

	// rate seniority
	if yearsActive > 3 {
		badges = append(badges, domain.Badge{
			ID:          "tenure_gold",
			IconName:    "calendar_today",
			Title:       fmt.Sprintf("%.0f+ Years on LokaAsk", yearsActive),
			Description: fmt.Sprintf("Member since %d. Experienced local guide.", profile.JoinedAt.Year()),
		})
	} else if yearsActive >= 1 {
		badges = append(badges, domain.Badge{
			ID:          "tenure_silver",
			IconName:    "calendar_today",
			Title:       "Rising Talent",
			Description: fmt.Sprintf("Joined in %d. Building a strong reputation.", profile.JoinedAt.Year()),
		})
	} else {
		badges = append(badges, domain.Badge{
			ID:          "new_member",
			IconName:    "fiber_new",
			Title:       "New Local",
			Description: "Just joined! Be one of the first to book.",
		})
	}

	// rating logic (based on reviewer)
	if profile.Rating >= 4.8 {
		badges = append(badges, domain.Badge{
			ID:          "local_master",
			IconName:    "emoji_events",
			Title:       "Local Master",
			Description: "Top 5% of locals based on traveler ratings.",
		})
	} else if profile.Rating >= 4.5 {
		badges = append(badges, domain.Badge{
			ID:          "traveler_fav",
			IconName:    "thumb_up",
			Title:       "Traveler Favorite",
			Description: "Consistently high ratings from guests.",
		})
	}

	// verification Logic
	if profile.IsVerified {
		badges = append(badges, domain.Badge{
			ID:          "verified_identity",
			IconName:    "fingerprint",
			Title:       "Identity Verified",
			Description: "Personal info confirmed. You're in safe hands.",
		})
	}

	// expert Logic (if they have niches)
	if len(profile.Niches) > 0 {
		badges = append(badges, domain.Badge{
			ID:          "expert",
			IconName:    "verified_user",
			Title:       "Certified Expert",
			Description: fmt.Sprintf("Expertise in %s", profile.Niches[0]),
		})
	}

	// response Time Logic
	if strings.Contains(strings.ToLower(profile.ResponseTime), "hour") ||
		strings.Contains(strings.ToLower(profile.ResponseTime), "instant") {
		badges = append(badges, domain.Badge{
			ID:          "quick_responder",
			IconName:    "bolt",
			Title:       "Quick Responder",
			Description: "Usually replies within 1 hour.",
		})
	}

	return badges
}
