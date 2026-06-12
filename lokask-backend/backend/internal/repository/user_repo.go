package repository

import (
	"context"
	"database/sql"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"
)

type User struct {
	// user structure
	ID           string `db:"id" json:"id"`
	Email        string `db:"email" json:"email"`
	PasswordHash string `db:"password_hash" json:"-"`
	FullName     string `db:"full_name" json:"full_name"`

	// prevent spam or disposable mail
	IsVerified        bool           `db:"is_verified" json:"is_verified"`
	VerificationToken sql.NullString `db:"verification_token" json:"-"`
	TokenExpiresAt    sql.NullTime   `db:"token_expires_at" json:"-"`

	// additional fields for displaying the avatar in profile,...
	AvatarURL     sql.NullString `db:"avatar_url" json:"-"`
	AvatarURLJSON string         `json:"avatar_url"`
}

// query user from dabatase
type UserRepository struct {
	DB *sqlx.DB
}

// initialize
func NewUserRepository(db *sqlx.DB) *UserRepository {
	return &UserRepository{DB: db}
}

// transaction to create an user
func (r *UserRepository) CreateUserTx(tx *sqlx.Tx, user *User, token string, expiresAt time.Time) error {
	// insert
	query := `INSERT INTO users (email, password_hash, full_name, avatar_url, verification_token, token_expires_at) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`
	return tx.QueryRow(query, user.Email, user.PasswordHash, user.FullName, user.AvatarURL, token, expiresAt).Scan(&user.ID)
}

// lookup by checking email
func (r *UserRepository) GetByEmail(email string) (*User, error) {
	var user User
	// update query to include avatar
	query := `SELECT id, email, password_hash, full_name, avatar_url FROM users WHERE email = $1`
	err := r.DB.Get(&user, query, email)

	// place data in json
	if user.AvatarURL.Valid {
		user.AvatarURLJSON = user.AvatarURL.String
	}

	return &user, err
}

// lockup user by checking user ID
func (r *UserRepository) GetByID(userID string) (*User, error) {
	var user User

	query := `SELECT id, email, password_hash, full_name, avatar_url FROM users WHERE id = $1`
	err := r.DB.Get(&user, query, userID)

	if user.AvatarURL.Valid {
		user.AvatarURLJSON = user.AvatarURL.String
	}

	return &user, err
}

// update self-avatar
func (r *UserRepository) UpdateAvatar(userID uuid.UUID, avatarURL string) error {
	query := `
        UPDATE users 
        SET avatar_url = $1, updated_at = $2 
        WHERE id = $3
    `

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	_, err := r.DB.ExecContext(ctx, query, avatarURL, time.Now(), userID)

	return err
}

// verification
func (r *UserRepository) VerifyUserEmail(ctx context.Context, token string) error {
	query := `
		UPDATE users 
		SET is_verified = TRUE, 
		    verification_token = NULL, 
		    token_expires_at = NULL, 
		    updated_at = NOW()
		WHERE verification_token = $1 
		  AND token_expires_at > NOW() 
		  AND is_verified = FALSE
	`

	result, err := r.DB.ExecContext(ctx, query, token)
	if err != nil {
		return err
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return err
	}

	if rowsAffected == 0 {
		return fmt.Errorf("invalid or expired verification token")
	}

	return nil
}
