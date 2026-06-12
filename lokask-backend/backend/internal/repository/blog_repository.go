package repository

import (
	"asklocal/internal/domain"
	"asklocal/internal/helper"
	"fmt"

	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"
)

type BlogRepository struct {
	DB *sqlx.DB
}

func NewBlogRepository(db *sqlx.DB) *BlogRepository {
	return &BlogRepository{DB: db}
}

// Create inserts a new blog post
func (r *BlogRepository) Create(blog *domain.Blog) error {
	query := `
		INSERT INTO blogs (id, author_id, title, summary, content, cover_image_url, city, country, rating, review_count, created_at, updated_at)
		VALUES (:id, :author_id, :title, :summary, :content, :cover_image_url, :city, :country, :rating, :review_count, :created_at, :updated_at)
	`
	_, err := r.DB.NamedExec(query, blog)
	return err
}

// GetByID fetches a specific blog and joins with the User table to get Author details
func (r *BlogRepository) GetByID(id uuid.UUID) (*domain.Blog, error) {
	var blog domain.Blog
	query := `
		SELECT 
			b.*,
			u.full_name as author_name,
			u.avatar_url as author_avatar
		FROM blogs b
		JOIN users u ON b.author_id = u.id
		WHERE b.id = $1
	`
	err := r.DB.Get(&blog, query, id)
	if err != nil {
		return nil, err
	}

	coverURL, _ := helper.BuildMediaURL(blog.CoverImageURL)
	if coverURL != "" {
		blog.CoverImageURL = coverURL
	}

	avatarURL, _ := helper.BuildMediaURL(blog.AuthorAvatar)
	if avatarURL != "" {
		blog.AuthorAvatar = avatarURL
	}

	return &blog, err
}

// BlogFilter allows searching by various criteria
type BlogFilter struct {
	City     string
	Country  string
	AuthorID string
	Limit    int
	Offset   int
}

// List fetches blogs based on filters (e.g., "Show me blogs about Rome")
func (r *BlogRepository) List(filter BlogFilter) ([]*domain.Blog, error) {
	var blogs []*domain.Blog

	// Base Query
	query := `
		SELECT 
			b.*,
			u.full_name as author_name,
			u.avatar_url as author_avatar
		FROM blogs b
		JOIN users u ON b.author_id = u.id
		WHERE 1=1
	`
	var args []interface{}
	argCount := 1

	// Dynamic Filtering
	if filter.City != "" {
		query += fmt.Sprintf(" AND b.city ILIKE $%d", argCount)
		args = append(args, filter.City)
		argCount++
	}
	if filter.Country != "" {
		query += fmt.Sprintf(" AND b.country = $%d", argCount)
		args = append(args, filter.Country)
		argCount++
	}
	if filter.AuthorID != "" {
		query += fmt.Sprintf(" AND b.author_id = $%d", argCount)
		args = append(args, filter.AuthorID)
		argCount++
	}

	// Ordering & Pagination
	query += " ORDER BY b.created_at DESC"

	if filter.Limit > 0 {
		query += fmt.Sprintf(" LIMIT $%d", argCount)
		args = append(args, filter.Limit)
		argCount++
	}
	if filter.Offset > 0 {
		query += fmt.Sprintf(" OFFSET $%d", argCount)
		args = append(args, filter.Offset)
		argCount++
	}

	err := r.DB.Select(&blogs, query, args...)

	for _, b := range blogs {
		if coverURL, _ := helper.BuildMediaURL(b.CoverImageURL); coverURL != "" {
			b.CoverImageURL = coverURL
		}
		if avatarURL, _ := helper.BuildMediaURL(b.AuthorAvatar); avatarURL != "" {
			b.AuthorAvatar = avatarURL
		}
	}

	return blogs, err
}

// Update allows modifying content or cover image
func (r *BlogRepository) Update(blog *domain.Blog) error {
	query := `
		UPDATE blogs 
		SET title = :title, 
			summary = :summary, 
			content = :content, 
			cover_image_url = :cover_image_url, 
			city = :city, 
			updated_at = NOW()
		WHERE id = :id AND author_id = :author_id
	`
	// Note: We check author_id ensuring you can't edit someone else's blog
	result, err := r.DB.NamedExec(query, blog)
	if err != nil {
		return err
	}

	rows, _ := result.RowsAffected()
	if rows == 0 {
		return fmt.Errorf("blog not found or unauthorized")
	}
	return nil
}

// Delete removes a blog post
func (r *BlogRepository) Delete(id uuid.UUID, authorID uuid.UUID) error {
	query := `DELETE FROM blogs WHERE id = $1 AND author_id = $2`
	result, err := r.DB.Exec(query, id, authorID)
	if err != nil {
		return err
	}

	rows, _ := result.RowsAffected()
	if rows == 0 {
		return fmt.Errorf("blog not found or unauthorized")
	}
	return nil
}
