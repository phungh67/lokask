package repository

import (
	"asklocal/internal/domain"
	"asklocal/internal/helper"
	"context"
	"database/sql"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"
	"github.com/lib/pq"
)

type Consultant struct {
	ID     uuid.UUID `db:"id"`
	UserID uuid.UUID `db:"user_id"`
	CityID int       `db:"city_id"`

	Bio        *string  `db:"bio"`
	HourlyRate *float64 `db:"hourly_rate"`
}

type UpdateProfilePayload struct {
	FullName    *string  `json:"full_name"`
	DisplayName *string  `json:"display_name"`
	CityID      *int     `json:"city_id"`
	Quote       *string  `json:"quote"`
	Bio         *string  `json:"bio"`
	MainNicheID *int     `json:"main_niche_id"`
	Tags        []string `json:"tags"`
	Languages   []string `json:"languages"`
}

type ConsultantRepository struct {
	DB *sqlx.DB
}

func NewConsultantRepository(db *sqlx.DB) *ConsultantRepository {
	return &ConsultantRepository{DB: db}
}

// helper
func generateSlug(name string) string {
	return strings.ToLower(strings.ReplaceAll(strings.TrimSpace(name), " ", "-"))
}

func (r *ConsultantRepository) CreateConsultantTx(tx *sqlx.Tx, c *Consultant) error {
	query := `INSERT INTO consultants (user_id, city_id) VALUES ($1, $2) RETURNING id`
	return tx.QueryRow(query, c.UserID, c.CityID).Scan(&c.ID)
}

// GetProfileByID fetches full profile including new fields (Quote, Cover, HelpedCount)
func (r *ConsultantRepository) GetProfileByID(ctx context.Context, id uuid.UUID) (*domain.ConsultantProfile, error) {
	profile := &domain.ConsultantProfile{}

	query := `
			SELECT
				c.id,
				c.user_id,
				u.full_name,
				COALESCE(NULLIF(u.alias, ''), array_to_string((string_to_array(u.full_name, ' '))[1:2], ' ')) as display_name,
				COALESCE(u.avatar_url, '') as avatar_url,
				COALESCE(c.bio, '') as bio,
				COALESCE(c.quote, '') as quote,         
				COALESCE(c.cover_url, '') as cover_url, 
				COALESCE(c.gallery_images, '{}') as gallery_images,
				COALESCE(c.helped_count, 0) as helped_count,                        
				COALESCE(c.hourly_rate, 0)::FLOAT as hourly_rate, 
				COALESCE(c.rating_avg, 0)::FLOAT as rating_avg,
				COALESCE(c.is_verified, false) as is_verified,
				ci.name as city_name,
				COALESCE(ci.country_code, '') as country_code,
				c.languages[1:array_length(c.languages, 1)] as languages,
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

	if len(profile.Languages) == 0 {
		profile.Languages = pq.StringArray{"English"}
	}

	// construct image url
	ConsultantCoverURL, _ := helper.BuildMediaURL(profile.CoverURL)
	if ConsultantCoverURL != "" {
		profile.CoverURL = ConsultantCoverURL
	}

	// temp removal reviews field
	profile.Reviews = []domain.Review{}
	profile.Tags = []string{}

	// 1. Fetch Reviews
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
	if reviews != nil {
		profile.Reviews = reviews
	}

	// 2. Fetch Tags (mapped from Niches table)
	var tags []string
	tagQuery := `
			SELECT n.display_name
			FROM consultant_niches cn
			JOIN niches n ON cn.niche_id = n.id
			WHERE cn.consultant_id = $1
	`
	_ = r.DB.SelectContext(ctx, &tags, tagQuery, id)

	if tags != nil {
		profile.Tags = tags
		// Populate singular 'Tag' for Compact Card
		if len(tags) > 0 {
			profile.Tag = tags[0]
		} else {
			profile.Tag = "Local"
		}
	} else {
		profile.Tag = "Local"
	}

	// 3. Fetch Images (Map to GalleryImages)
	builtImages := make([]string, 0, len(profile.GalleryImages))
	for _, imgPath := range profile.GalleryImages {
		fullPath, _ := helper.BuildMediaURL(imgPath)
		if fullPath != "" {
			builtImages = append(builtImages, fullPath)
		}
	}
	profile.GalleryImages = builtImages

	// 4. Calculate Badges
	profile.Badges = calculateBadges(profile)

	return profile, nil
}

// GetProfileByUserID fetches profile by UserID
func (r *ConsultantRepository) GetProfileByUserID(ctx context.Context, userID uuid.UUID) (*domain.ConsultantProfile, error) {
	profile := &domain.ConsultantProfile{}

	query := `
			SELECT
				c.id,
				c.user_id,
				u.full_name,
				COALESCE(NULLIF(u.alias, ''), array_to_string((string_to_array(u.full_name, ' '))[1:2], ' ')) as display_name,				
				COALESCE(u.avatar_url, '') as avatar_url,
				COALESCE(c.bio, '') as bio,
				COALESCE(c.quote, '') as quote,         
				COALESCE(c.cover_url, '') as cover_url,
				COALESCE(c.gallery_images, '{}') as gallery_images,
				COALESCE(c.helped_count, 0) as helped_count,                         
				COALESCE(c.hourly_rate, 0)::FLOAT as hourly_rate, 
				COALESCE(c.rating_avg, 0)::FLOAT as rating_avg,
				COALESCE(c.is_verified, false) as is_verified,
				ci.name as city_name,
				COALESCE(ci.country_code, '') as country_code,
				COALESCE(c.response_time, 'Within 24h') as response_time,
				c.created_at
			FROM consultants c
			JOIN users u ON c.user_id = u.id
			JOIN cities ci ON c.city_id = ci.id
			WHERE c.user_id = $1
	`

	err := r.DB.GetContext(ctx, profile, query, userID)
	if err != nil {
		return nil, err
	}

	// log.Printf("DEBUG: Profile ID: %v, Name: %s, DisplayName: %s\n", profile.ID, profile.Name, profile.DisplayName)

	if len(profile.Languages) == 0 {
		profile.Languages = []string{"English"}
	}

	// Initialize slices
	// profile.Reviews = []domain.Review{}
	profile.Tags = []string{}
	avatarURL, _ := helper.BuildMediaURL(profile.AvatarURL)
	if avatarURL != "" {
		profile.AvatarURL = avatarURL
	}

	coverURL, _ := helper.BuildMediaURL(profile.CoverURL)
	if coverURL != "" {
		profile.CoverURL = coverURL
	}

	builtImages := make([]string, 0, len(profile.GalleryImages))
	for _, imgPath := range profile.GalleryImages {
		fullPath, _ := helper.BuildMediaURL(imgPath)
		if fullPath != "" {
			builtImages = append(builtImages, fullPath)
		}
	}
	profile.GalleryImages = builtImages

	// Fetch Tags (using profile.ID retrieved from above query)
	var tags []string
	tagQuery := `
			SELECT n.display_name
			FROM consultant_niches cn
			JOIN niches n ON cn.niche_id = n.id
			WHERE cn.consultant_id = $1
	`
	_ = r.DB.SelectContext(ctx, &tags, tagQuery, profile.ID)

	if tags != nil {
		profile.Tags = tags
		if len(tags) > 0 {
			profile.Tag = tags[0]
		} else {
			profile.Tag = "Local"
		}
	} else {
		profile.Tag = "Local"
	}

	profile.Badges = calculateBadges(profile)
	return profile, nil
}

// consultant per page
// ListConsultants fetches list for Explore page
func (r *ConsultantRepository) ListConsultants(ctx context.Context, cityID *int, countryCode string, niche string, page int, limit int) ([]domain.ConsultantProfile, int, error) {
	if page < 1 {
		page = 1
	}
	if page > 100 {
		page = 100
	}
	if limit < 1 {
		limit = 12
	}
	offset := (page - 1) * limit

	baseSql := `
		FROM consultants c
    	JOIN users u ON c.user_id = u.id
    	JOIN cities ci ON c.city_id = ci.id
		LEFT JOIN consultant_niches cn ON c.id = cn.consultant_id
        LEFT JOIN niches n ON cn.niche_id = n.id
    	WHERE 1=1
	`

	filterSql := ""
	var args []interface{}
	argId := 1

	if cityID != nil {
		filterSql += fmt.Sprintf(" AND c.city_id = $%d", argId)
		args = append(args, *cityID)
		argId++
	}

	if countryCode != "" {
		filterSql += fmt.Sprintf(" AND ci.country_code ILIKE $%d", argId)
		args = append(args, countryCode)
		argId++
	}

	if niche != "" {
		filterSql += fmt.Sprintf(" AND n.display_name = $%d", argId)
		args = append(args, niche)
		argId++
	}

	var totalCount int
	countSql := "SELECT COUNT(DISTINCT c.id) " + baseSql + filterSql
	err := r.DB.GetContext(ctx, &totalCount, countSql, args...)
	if err != nil {
		return nil, 0, err
	}

	if totalCount == 0 {
		return []domain.ConsultantProfile{}, 0, nil
	}

	dataSql := `
    SELECT DISTINCT 
        c.id, 
        c.user_id,
        u.full_name, 
		COALESCE(NULLIF(u.alias, ''), array_to_string((string_to_array(u.full_name, ' '))[1:2], ' ')) as display_name,
        COALESCE(u.avatar_url, '') as avatar_url,
		COALESCE(c.bio, '') as bio,
        COALESCE(c.quote, '') as quote,        
        COALESCE(c.cover_url, '') as cover_url, 
        COALESCE(c.gallery_images, '{}') as gallery_images,
        COALESCE(c.helped_count, 0) as helped_count,                        
        COALESCE(c.hourly_rate, 0)::FLOAT as hourly_rate,
        COALESCE(c.rating_avg, 0)::FLOAT as rating_avg, 
        COALESCE(c.is_verified, false) as is_verified, 
        ci.name as city_name, 
        COALESCE(ci.country_code, '') as country_code,
        c.created_at
	` + baseSql + filterSql + fmt.Sprintf(" ORDER BY rating_avg DESC, c.id ASC LIMIT $%d OFFSET $%d", argId, argId+1)

	dataArgs := append(args, limit, offset)

	rows, err := r.DB.QueryxContext(ctx, dataSql, dataArgs...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var consultants []domain.ConsultantProfile
	var consultantIDs []uuid.UUID

	for rows.Next() {
		var p domain.ConsultantProfile
		if err := rows.StructScan(&p); err != nil {
			return nil, 0, err
		}

		if avatarURL, _ := helper.BuildMediaURL(p.AvatarURL); avatarURL != "" {
			p.AvatarURL = avatarURL
		}
		if coverURL, _ := helper.BuildMediaURL(p.CoverURL); coverURL != "" {
			p.CoverURL = coverURL
		}

		galleryImages := make([]string, 0, len(p.GalleryImages))
		for _, image := range p.GalleryImages {
			if imageURL, _ := helper.BuildMediaURL(image); imageURL != "" {
				galleryImages = append(galleryImages, imageURL)
			}
		}
		p.GalleryImages = galleryImages

		consultantIDs = append(consultantIDs, p.ID)
		consultants = append(consultants, p)
	}

	if len(consultantIDs) > 0 {
		type TagRow struct {
			ConsultantID uuid.UUID `db:"consultant_id"`
			DisplayName  string    `db:"display_name"`
		}

		var tagRows []TagRow
		tagQuery := `
            SELECT cn.consultant_id, n.display_name 
            FROM consultant_niches cn
            JOIN niches n ON cn.niche_id = n.id
            WHERE cn.consultant_id = ANY($1)
        `
		_ = r.DB.SelectContext(ctx, &tagRows, tagQuery, pq.Array(consultantIDs))

		tagMap := make(map[uuid.UUID][]string)
		for _, tr := range tagRows {
			tagMap[tr.ConsultantID] = append(tagMap[tr.ConsultantID], tr.DisplayName)
		}

		for i, c := range consultants {
			if tags, exists := tagMap[c.ID]; exists && len(tags) > 0 {
				consultants[i].Tags = tags
				consultants[i].Tag = tags[0]
			} else {
				consultants[i].Tags = []string{}
				consultants[i].Tag = "Local"
			}
		}
	}

	return consultants, totalCount, nil
}

func (r *ConsultantRepository) UpdateProfile(ctx context.Context, userID uuid.UUID, data UpdateProfilePayload) error {
	tx, err := r.DB.BeginTxx(ctx, nil)
	if err != nil {
		return fmt.Errorf("could not begin transaction: %w", err)
	}
	defer tx.Rollback()

	// basic information, name, fullname
	userQuery := `
        UPDATE users 
        SET full_name = COALESCE($1, full_name), 
            alias = COALESCE($2, alias), 
            updated_at = NOW() 
        WHERE id = $3
    `
	_, err = tx.ExecContext(ctx, userQuery, data.FullName, data.DisplayName, userID)
	if err != nil {
		return fmt.Errorf("failed to update users table: %w", err)
	}

	// update city, bio, language strictly using the validated integer ID
	consultantQuery := `
        UPDATE consultants 
        SET city_id = COALESCE($1, city_id), 
            quote = COALESCE($2, quote), 
            bio = COALESCE($3, bio), 
            languages = COALESCE($4, languages)
        WHERE user_id = $5
    `
	_, err = tx.ExecContext(ctx, consultantQuery, data.CityID, data.Quote, data.Bio, pq.Array(data.Languages), userID)
	if err != nil {
		return fmt.Errorf("failed to update consultants table: %w", err)
	}

	// Update consultant - consultant_niches - niches
	if data.MainNicheID != nil || data.Tags != nil {
		var consultantID uuid.UUID
		err = tx.GetContext(ctx, &consultantID, "SELECT id FROM consultants WHERE user_id = $1", userID)
		if err != nil {
			return fmt.Errorf("failed to find consultant ID: %w", err)
		}

		var currentMainNicheID *int
		_ = tx.GetContext(ctx, &currentMainNicheID, "SELECT niche_id FROM consultant_niches WHERE consultant_id = $1 AND is_primary = true", consultantID)

		var currentTags []string
		_ = tx.SelectContext(ctx, &currentTags, `
            SELECT n.display_name 
            FROM consultant_niches cn 
            JOIN niches n ON cn.niche_id = n.id 
            WHERE cn.consultant_id = $1 AND cn.is_primary = false`,
			consultantID,
		)

		activeMainNicheID := currentMainNicheID
		if data.MainNicheID != nil {
			activeMainNicheID = data.MainNicheID
		}

		activeTags := currentTags
		if data.Tags != nil {
			activeTags = data.Tags
		}

		_, err = tx.ExecContext(ctx, "DELETE FROM consultant_niches WHERE consultant_id = $1", consultantID)
		if err != nil {
			return fmt.Errorf("failed to clear old niches: %w", err)
		}

		if activeMainNicheID != nil && *activeMainNicheID > 0 {
			_, err = tx.ExecContext(ctx, `
                INSERT INTO consultant_niches (consultant_id, niche_id, is_primary) 
                VALUES ($1, $2, true)`, consultantID, *activeMainNicheID)
			if err != nil {
				return fmt.Errorf("failed to insert primary niche: %w", err)
			}
		}

		if len(activeTags) > 0 {
			for _, tag := range activeTags {
				tag = strings.TrimSpace(tag)
				if tag == "" {
					continue
				}

				var nicheID int
				slug := generateSlug(tag)

				err = tx.GetContext(ctx, &nicheID, `SELECT id FROM niches WHERE display_name ILIKE $1 OR slug = $2 LIMIT 1`, tag, slug)

				if err == sql.ErrNoRows {
					err = tx.QueryRowContext(ctx, `
                        INSERT INTO niches (slug, display_name) 
                        VALUES ($1, $2) 
                        RETURNING id
                    `, slug, tag).Scan(&nicheID)

					if err != nil {
						return fmt.Errorf("failed to create new niche '%s': %w", tag, err)
					}
				} else if err != nil {
					return fmt.Errorf("failed to lookup niche '%s': %w", tag, err)
				}

				if activeMainNicheID != nil && nicheID == *activeMainNicheID {
					continue
				}

				_, err = tx.ExecContext(ctx, `
                    INSERT INTO consultant_niches (consultant_id, niche_id, is_primary) 
                    VALUES ($1, $2, false)
                    ON CONFLICT DO NOTHING`, consultantID, nicheID)

				if err != nil {
					return fmt.Errorf("failed to insert secondary niche link: %w", err)
				}
			}
		}
	}

	return tx.Commit()
}

func (r *ConsultantRepository) ListNiches(ctx context.Context) ([]domain.Niche, error) {
	var niches []domain.Niche
	query := `
        SELECT 
            n.id, 
            n.slug, 
            n.display_name 
        FROM niches n
        JOIN consultant_niches cn ON n.id = cn.niche_id
        GROUP BY n.id, n.slug, n.display_name
        ORDER BY COUNT(cn.consultant_id) DESC, n.display_name ASC
    `

	err := r.DB.SelectContext(ctx, &niches, query)
	if err != nil {
		return nil, fmt.Errorf("error listing niches: %w", err)
	}

	// handle empty result(s)
	if niches == nil {
		return []domain.Niche{}, nil
	}

	return niches, nil
}

func (r *ConsultantRepository) ListUniqueLanguages(ctx context.Context) ([]string, error) {
	languages := []string{}

	query := `
        SELECT DISTINCT unnest(languages) AS language 
        FROM consultants 
        ORDER BY language
    `

	err := r.DB.SelectContext(ctx, &languages, query)
	if err != nil {
		return nil, fmt.Errorf("error fetching unique languages: %w", err)
	}

	return languages, nil
}

// calculateBadges logic remains largely the same, but uses Tags
func calculateBadges(profile *domain.ConsultantProfile) []domain.Badge {
	var badges []domain.Badge

	// Tenure
	yearsActive := time.Since(profile.JoinedAt).Hours() / 24 / 365
	if yearsActive > 3 {
		badges = append(badges, domain.Badge{ID: "tenure_gold", IconName: "calendar_today", Title: fmt.Sprintf("%.0f+ Years", yearsActive), Description: "Experienced local."})
	}

	// Rating
	if profile.Rating >= 4.8 {
		badges = append(badges, domain.Badge{ID: "local_master", IconName: "emoji_events", Title: "Local Master", Description: "Top 5% of locals."})
	}

	// Verification
	if profile.IsHighlyTrusted {
		badges = append(badges, domain.Badge{ID: "verified_identity", IconName: "fingerprint", Title: "Verified", Description: "Identity confirmed."})
	}

	// Expert (Using Tags)
	if len(profile.Tags) > 0 {
		badges = append(badges, domain.Badge{
			ID:          "expert",
			IconName:    "verified_user",
			Title:       "Certified Expert",
			Description: fmt.Sprintf("Expertise in %s", profile.Tags[0]),
		})
	}

	// Response Time
	if strings.Contains(strings.ToLower(profile.ResponseTime), "hour") ||
		strings.Contains(strings.ToLower(profile.ResponseTime), "instant") {
		badges = append(badges, domain.Badge{ID: "quick_responder", IconName: "bolt", Title: "Quick Responder", Description: "Replies fast."})
	}

	return badges
}

func (r *ConsultantRepository) UpdateCoverImage(userID uuid.UUID, coverURL string) error {
	query := `
		UPDATE consultants
		SET cover_url = $1
		WHERE user_id = $2
	`

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	_, err := r.DB.ExecContext(ctx, query, coverURL, userID)

	return err
}

func (r *ConsultantRepository) AddGalleryImage(userID uuid.UUID, imageKey string) error {
	query := `
		UPDATE consultants
		SET gallery_images = array_append(gallery_images, $1)
		WHERE user_id = $2
	`

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	_, err := r.DB.ExecContext(ctx, query, imageKey, userID)
	return err
}

func (r *ConsultantRepository) RemoveGalleryImage(userID uuid.UUID, imageKey string) error {
	query := `
		UPDATE consultants
		SET gallery_images = array_remove(gallery_images, $1)
		WHERE user_id = $2
	`

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	_, err := r.DB.ExecContext(ctx, query, imageKey, userID)
	return err
}

func (r *ConsultantRepository) ShowAllReviews() {
	// profile := &domain.ConsultantProfile{}

}
