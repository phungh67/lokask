package handler

import (
	"asklocal/internal/config"
	"asklocal/internal/repository"
	"database/sql"
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
	CityID   int    `json:"city_id"`
	CityName string `json:"city"`
}

// a login request
type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

func (h *AuthHandler) Register(c *fiber.Ctx) error {
	var req RegisterRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{
			"error": "Invalid input",
			"cause": err.Error(),
		})
	}

	// validation logic
	if req.Role == "consultant" {
		if req.CityName == "" {
			return c.Status(400).JSON(fiber.Map{"error": "Consultants must provide a city name"})
		}

		// Look up the ID based on the name provided in the form
		err := h.DB.Get(&req.CityID, "SELECT id FROM cities WHERE name ILIKE $1 LIMIT 1", req.CityName)
		if err == sql.ErrNoRows {
			return c.Status(400).JSON(fiber.Map{"error": "City not supported yet. Please choose a supported city."})
		} else if err != nil {
			return c.Status(500).JSON(fiber.Map{"error": "Database error checking city"})
		}
	}

	// begin transaction
	tx, err := h.DB.Beginx()
	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error":  "Server error starting transaction",
			"detail": err.Error(),
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

	// create new user to put to database
	user := &repository.User{
		Email:        req.Email,
		PasswordHash: string(hashedPwd),
		FullName:     req.FullName,
	}

	if err := h.UserRepo.CreateUserTx(tx, user); err != nil {
		// This usually catches the UNIQUE(email) constraint
		return c.Status(500).JSON(fiber.Map{
			"error":  "Could not create user",
			"detail": err.Error(),
		})
	}

	// if the user want to register as a consultant
	if req.Role == "consultant" {
		consultant := &repository.Consultant{
			UserID: user.ID,
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

	return c.Status(201).JSON(fiber.Map{
		"message": "User registered successfully",
		"user_id": user.ID,
		"role":    req.Role,
	})
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
			"error":  "Invalid credentials",
			"detail": err.Error(),
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
	}

	// redis logic
	// generate session token
	sessionToken := uuid.New().String()

	// debug logic
	key := "session:" + sessionToken
	fmt.Printf("[INFO] LOGIN: Saving Key [%s] for User [%s]\n", key, user.ID)

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
			"id":         user.ID,
			"full_name":  user.FullName,
			"email":      user.Email,
			"avatar_url": user.AvatarURLJSON,
			"role":       role,
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

	// 🟢 Check role so Navbar knows whether to show "Dashboard"
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
