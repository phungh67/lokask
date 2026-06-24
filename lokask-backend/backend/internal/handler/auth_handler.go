package handler

import (
	"asklocal/internal/config"
	"asklocal/internal/helper"
	"asklocal/internal/mailer"
	"asklocal/internal/repository"
	"crypto/md5"
	"crypto/rand"
	"database/sql"
	"encoding/hex"
	"fmt"
	"log"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"
	"golang.org/x/crypto/bcrypt"
)

// @TODO: use env or secret, this is hardcoded !!!
var jwtSecret = []byte("super_secret_jwt_key")

type AuthHandler struct {
	// check user, consultant,...
	UserRepo       *repository.UserRepository
	ConsultantRepo *repository.ConsultantRepository
	Mailer         *mailer.MailService
	DB             *sqlx.DB
}

// a register request
type RegisterRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
	FullName string `json:"full_name"`

	// The Decision Maker
	Role string `json:"role"` // Expected: "traveler" or "consultant"

	// Required ONLY if Role == "consultant"
	CityID int `json:"city_id"`
	// CityName string `json:"city"`
}

type LostPasswordRequest struct {
	Email string `json:"email"`
}

var validCities = map[string]bool{
	"Hanoi":            true,
	"Ho Chi Minh City": true,
	"Da Nang":          true,
	"Hoi An":           true,
	"Nha Trang":        true,
	"Da Lat":           true,
	"Phu Quoc":         true,
	"Quang Binh":       true,
	"Sapa":             true,
	"Hue":              true,
}

// a login request
type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

// helper for token generate
func generateSecureToken() (string, error) {
	bytes := make([]byte, 32)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}
	return hex.EncodeToString(bytes), nil
}

func (h *AuthHandler) Register(c *fiber.Ctx) error {
	var req RegisterRequest
	err := c.BodyParser(&req)
	if err != nil {
		log.Printf("[ERROR][AUTH] Error in registration, caused by: %v", err)
		return c.Status(400).JSON(fiber.Map{
			"error": "Invalid input",
		})
	}

	// mail guard here
	if !helper.IsValidEmailDomain(req.Email) {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"error": "Registration currently does not support this type of mail",
		})
	}

	// OTP
	// token
	verificationToken := uuid.New().String()
	expiresAt := time.Now().Add(24 * time.Hour)

	// validation logic
	if req.Role == "consultant" {
		// if req.CityName == "" {
		// 	return c.Status(400).JSON(fiber.Map{"error": "Consultants must provide a city name"})
		// }

		// Look up the ID based on the name provided in the form
		// err := h.DB.Get(&req.CityID, "SELECT id FROM cities WHERE id = $1 LIMIT 1", req.CityName)
		// if err == sql.ErrNoRows {
		// 	log.Printf("[ERROR][AUTH] An empty record, considering ID guessing attack: %v", err)
		// }

		if req.CityID <= 0 {
			return c.Status(400).JSON(fiber.Map{"error": "Consultants must select a valid city"})
		}
		// if err == sql.ErrNoRows {
		// 	insertErr := h.DB.QueryRow(
		// 		"INSERT INTO cities (name) VALUES ($1) RETURNING id",
		// 		req.CityName,
		// 	).Scan(&req.CityID)

		// 	if insertErr != nil {
		// 		log.Printf("[ERROR][AUTH] Failed to insert new city: %v", insertErr)
		// 		return c.Status(500).JSON(fiber.Map{"error": "Failed to register new city"})
		// 	}
		// } else if err != nil {
		// 	log.Printf("[ERROR][AUTH] Database error checking city: %v", err)
		// 	return c.Status(500).JSON(fiber.Map{"error": "Database error checking city"})
		// }
	}

	// begin transaction
	tx, err := h.DB.Beginx()
	if err != nil {
		log.Printf("[ERROR][AUTH] Error in communication with DB: %v", err)
		return c.Status(500).JSON(fiber.Map{
			"error": "Server error starting transaction",
		})
	}

	defer tx.Rollback()

	// check if the register one is matched with already existed email
	existing, _ := h.UserRepo.GetByEmail(req.Email)
	if existing != nil && existing.ID != "" {
		return c.Status(400).JSON(fiber.Map{"error": "Email already registered"})
	}

	// hash password
	hashedPwd, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to hash password"})
	}

	hash := md5.Sum([]byte(req.Email))
	seed := fmt.Sprintf("%x", hash)

	defaultAvatarURL := fmt.Sprintf("https://api.dicebear.com/7.x/avataaars/svg?seed=%s", seed)

	// create new user to put to database
	user := &repository.User{
		Email:        req.Email,
		PasswordHash: string(hashedPwd),
		FullName:     req.FullName,
		AvatarURL:    sql.NullString{String: defaultAvatarURL, Valid: true},
	}

	if err := h.UserRepo.CreateUserTx(tx, user, verificationToken, expiresAt); err != nil {
		// This usually catches the UNIQUE(email) constraint
		return c.Status(500).JSON(fiber.Map{
			"error":  "Could not create user",
			"detail": err.Error(),
		})
	}

	// if the user want to register as a consultant
	if req.Role == "consultant" {
		uID, err := uuid.Parse(user.ID)
		if err != nil {
			return c.Status(500).JSON(fiber.Map{
				"error":   "Internal ID conversion error",
				"details": err.Error(),
			})
		}

		consultant := &repository.Consultant{
			UserID: uID,
			CityID: req.CityID,
		}

		if err := h.ConsultantRepo.CreateConsultantTx(tx, consultant); err != nil {
			log.Printf("Consultant creation failed: %v", err)
			return c.Status(500).JSON(fiber.Map{
				"error":  "Failed to create consultant profile",
				"detail": err.Error(),
			})
		}
	}

	// commit (if we went to this, probably 90% we are safe)
	if err := tx.Commit(); err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error":  "Failed to commit transaction",
			"detail": err.Error(),
		})
	}

	go func(email, name, token string) {
		h.Mailer.SendVerificationEmail(email, name, token)
	}(user.Email, user.FullName, verificationToken)

	return c.Status(201).JSON(fiber.Map{
		"message": "User registered successfully",
		"user_id": user.ID,
		"role":    req.Role,
	})
}

// verification by email
func (h *AuthHandler) VerifyEmail(c *fiber.Ctx) error {
	token := c.Query("token")
	if token == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Missing token"})
	}

	err := h.UserRepo.VerifyUserEmail(c.Context(), token)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid or expired verification link"})
	}

	return c.Redirect("https://www.lokask.se/login?verified=true", fiber.StatusTemporaryRedirect)
}

// lost password logic

// send the request
func (h *AuthHandler) LostPassword(c *fiber.Ctx) error {
	var req struct {
		Email string `json:"email"`
	}
	if err := c.BodyParser(&req); err != nil {
		log.Printf("[ERROR][AUTH] Error in email input %s: %v", req.Email, err)
		return c.Status(400).JSON(fiber.Map{
			"error": "Invalid request",
		})
	}

	var userID string
	var userName string
	err := h.DB.QueryRow("SELECT id, full_name FROM users WHERE email = $1", req.Email).Scan(&userID, &userName)
	if err != nil {
		return c.JSON(fiber.Map{"message": "If an account exists, a reset link has been sent."})
	}

	token, err := generateSecureToken()
	if err != nil {
		log.Printf("[ERROR][AUTH] Generate token failed: %v", err)
		return c.Status(500).JSON(fiber.Map{"error": "Internal server error"})
	}

	expires := time.Now().Add(1 * time.Hour)
	_, err = h.DB.Exec("UPDATE users SET reset_password_token = $1, reset_password_expires = $2 WHERE id = $3", token, expires, userID)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to generate reset token"})
	}

	resetLink := fmt.Sprintf("https://lokask.se/reset-password?token=%s", token)

	_ = h.Mailer.SendResetPasswordEmail(req.Email, userName, resetLink)

	return c.JSON(fiber.Map{"message": "If an account exists, a reset link has been sent."})
}

func (h *AuthHandler) ResetPassword(c *fiber.Ctx) error {
	var req struct {
		Token       string `json:"token"`
		NewPassword string `json:"new_password"`
	}

	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{
			"error": "Invalid input",
		})
	}

	var userID string
	err := h.DB.QueryRow("SELECT id FROM users WHERE reset_password_token = $1 AND reset_password_expires > NOW()", req.Token).Scan(&userID)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{
			"error": "Token error",
		})
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.NewPassword), bcrypt.DefaultCost)
	if err != nil {
		log.Printf("[ERROR][AUTH] Error when hashing password: %v", err)
		return c.Status(500).JSON(fiber.Map{
			"error": "Internal server error",
		})
	}

	_, err = h.DB.Exec("UPDATE users SET password_hash = $1, reset_password_token = NULL, reset_password_expires = NULL WHERE id = $2", hashedPassword, userID)
	if err != nil {
		log.Printf("[ERROR][AUTH] Error in reset password with: %v", err)
		return c.Status(500).JSON(fiber.Map{
			"error": "Internal server error.",
		})
	}

	return c.JSON(fiber.Map{"message": "Password has been successfully reset."})
}

func (h *AuthHandler) Login(c *fiber.Ctx) error {
	// login logic function

	var req LoginRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{
			"error":    err.Error(),
			"messages": "Check log and backend for details",
		})
	}

	// find user in the db
	user, err := h.UserRepo.GetByEmail(req.Email)
	if err != nil || user == nil || user.ID == "" {
		return c.Status(401).JSON(fiber.Map{
			"error": "Invalid credentials",
		})
	}

	// check password (if correctly)
	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)); err != nil {
		return c.Status(401).JSON(fiber.Map{
			"error":  "Invalid credentials",
			"detail": err.Error(),
		})
	}

	// check role (additional check)
	var role string = "traveller"
	var consultantID string
	err = h.DB.Get(&consultantID, "SELECT id FROM consultants WHERE user_id=$1", user.ID)
	if err == nil && consultantID != "" {
		role = "consultant"
	} else {
		consultantID = ""
	}

	// redis logic
	// generate session token
	sessionToken := uuid.New().String()

	// debug logic
	// key := "session:" + sessionToken
	// fmt.Printf("[INFO] LOGIN: Saving Key [%s] for User [%s]\n", key, user.ID)

	if user.IsVerified == false {
		// log.Printf("[LOG] user status: %s %t", user.FullName, user.IsVerified)
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"error": "not verified yet",
		})
	}

	err = config.RedisClient.Set(c.Context(), "session:"+sessionToken, user.ID, 6*time.Hour).Err()
	if err != nil {
		// Log the actual error so you can see it in "docker compose logs backend"
		fmt.Printf("[REDIS] Redis Set Failed: %v\n", err)

		return c.Status(500).JSON(fiber.Map{
			"error": "Failed to create session",
		})
	}

	if user.AvatarURL.Valid {
		user.AvatarURLJSON = user.AvatarURL.String
	}

	// cookie
	c.Cookie(&fiber.Cookie{
		Name:     "session_id",
		Value:    sessionToken,
		Expires:  time.Now().Add(6 * time.Hour),
		HTTPOnly: true,  // Prevents XSS access to the token
		Secure:   false, // Set to true in production with HTTPS
		SameSite: "Lax",
		Path:     "/",
	})

	// generate jwt (of course, this step, user must be existed)
	// only five minutes !!!
	return c.JSON(fiber.Map{
		"token": sessionToken,
		"user": fiber.Map{
			"id":            user.ID,
			"consultant_id": consultantID,
			"full_name":     user.FullName,
			"email":         user.Email,
			"avatar_url":    user.AvatarURLJSON,
			"role":          role,
		},
		"message": "Logged in",
	})
}

func (h *AuthHandler) Logout(c *fiber.Ctx) error {
	// 1. Get the token from cookie or header
	token := c.Cookies("session_id")

	if token != "" {
		config.RedisClient.Del(c.Context(), "session:"+token)
	}

	c.ClearCookie("session_id")

	return c.Status(200).JSON(fiber.Map{
		"message": "Logged out successfully",
	})
}

func (h *AuthHandler) GetMe(c *fiber.Ctx) error {
	rawID := c.Locals("user_id")

	if rawID == nil {
		return c.Status(401).JSON(fiber.Map{
			"authenticated": false,
			"error":         "Unauthorized: Session missing",
		})
	}

	userID, ok := rawID.(string)
	if !ok {
		return c.Status(500).JSON(fiber.Map{"error": "Internal Error"})
	}

	user, err := h.UserRepo.GetByID(userID)
	if err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "User not found"})
	}

	role := "traveller"
	var consultantID string
	err = h.DB.Get(&consultantID, "SELECT id FROM consultants WHERE user_id=$1", user.ID)
	if err == nil && consultantID != "" {
		role = "consultant"
	}

	return c.JSON(fiber.Map{
		"id":         user.ID,
		"full_name":  user.FullName,
		"email":      user.Email,
		"avatar_url": user.AvatarURLJSON,
		"role":       role,
	})
}
