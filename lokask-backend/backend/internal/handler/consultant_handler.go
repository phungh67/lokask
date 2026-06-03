package handler

import (
	"asklocal/internal/domain"
	"asklocal/internal/repository"
	"asklocal/internal/storage"
	"fmt"
	"log"
	"strconv"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type ConsultantHandler struct {
	Repo    *repository.ConsultantRepository
	Storage storage.FileStorage
}

func NewConsultantHandler(repo *repository.ConsultantRepository, storage storage.FileStorage) *ConsultantHandler {
	return &ConsultantHandler{Repo: repo, Storage: storage}
}

// handle GET request /api/v1/consultants/:id
func (h *ConsultantHandler) GetProfile(c *fiber.Ctx) error {
	idStr := c.Params("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid UUID format"})
	}

	profile, err := h.Repo.GetProfileByID(c.Context(), id)
	if err != nil {
		log.Printf("Error fetching consultant: %v\n", err)
		return c.Status(500).JSON(fiber.Map{
			"error":   err.Error(),
			"details": "Check backend terminal for full trace",
		})
	}

	return c.JSON(profile)
}

func (h *ConsultantHandler) UpdateProfile(c *fiber.Ctx) error {
	tokenUserID, ok := c.Locals("user_id").(string)
	if !ok {
		return c.Status(401).JSON(fiber.Map{"error": "Unauthorized"})
	}

	userID, err := uuid.Parse(tokenUserID)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid token ID"})
	}

	var payload repository.UpdateProfilePayload
	if err := c.BodyParser(&payload); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body format",
		})
	}

	err = h.Repo.UpdateProfile(c.Context(), userID, payload)
	if err != nil {
		fmt.Printf("[Error] UpdateProfile failed: %v\n", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error":  "Failed to update profile",
			"detail": err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"message": "Profile updated successfully",
	})
}

func (h *ConsultantHandler) List(c *fiber.Ctx) error {
	cityFilter := c.Query("city")
	countryFilter := c.Query("country")
	nicheFilter := c.Query("niche")

	pageStr := c.Query("page")
	page := 1
	if val, err := strconv.Atoi(pageStr); err == nil && val > 0 {
		page = val
	}

	consultants, totalCount, err := h.Repo.ListConsultants(c.Context(), cityFilter, countryFilter, nicheFilter, page, 12)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	// Return empty list instead of null if no results
	if consultants == nil {
		consultants = []domain.ConsultantProfile{}
	}

	return c.JSON(fiber.Map{
		"data":        consultants,
		"total_count": totalCount,
		"page":        page,
		"limit":       12,
	})
}

// get by user id
func (h *ConsultantHandler) GetConsultantByUserID(c *fiber.Ctx) error {
	// 1. Get User ID from URL parameter
	userIDParam := c.Params("id")
	userID, err := uuid.Parse(userIDParam)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid User ID format"})
	}

	// 2. Call the Repository
	// (Ensure you added GetProfileByUserID to your repository in the previous step!)
	profile, err := h.Repo.GetProfileByUserID(c.Context(), userID)

	if err != nil {
		// If SQL returns "no rows", it means this user exists but is NOT a consultant yet.
		// We return 404 so the Frontend knows to show the "Become a Guide" banner.
		return c.Status(404).JSON(fiber.Map{
			"error": "User is not a consultant",
		})
	}

	// 3. Return the profile
	return c.JSON(profile)
}

// GetNiches handles GET /api/v1/niches
func (h *ConsultantHandler) GetNiches(c *fiber.Ctx) error {
	niches, err := h.Repo.ListNiches(c.Context())
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(niches)
}

func (h *ConsultantHandler) GetLanguages(c *fiber.Ctx) error {
	language, err := h.Repo.ListUniqueLanguages(c.Context())
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(language)
}

// get city helper
func (h *ConsultantHandler) GetCities(c *fiber.Ctx) error {
	var cities []struct {
		ID      int    `json:"id" db:"id"`
		Name    string `json:"name" db:"name"`
		Country string `json:"country" db:"country_code"`
	}

	err := h.Repo.DB.Select(&cities, "SELECT id, name, country_code FROM cities ORDER BY name ASC")
	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error":  "Failed to fetch cities",
			"detail": err.Error(),
		})
	}
	return c.JSON(cities)
}

// func
func (h *ConsultantHandler) UploadMedia(c *fiber.Ctx) error {
	userIDStr := c.Locals("user_id").(string) // cast to only string
	userID, err := uuid.Parse(userIDStr)      // convert to uuid format (assume that we get the string)

	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"message": "UUID error, either malformed or mismatched",
			"error":   err.Error(),
		})
	}

	fileHeader, err := c.FormFile("file")
	if err != nil {
		return c.Status(400).JSON(fiber.Map{
			"message": "No file was uploaded",
			"error":   err.Error(),
		})
	}

	mediaType := c.FormValue("type") // to check if it meant to be cover or galleries

	bucketName := "galleries"
	if mediaType == "cover" {
		bucketName = "covers"
	}

	url, err := h.Storage.UploadFile(fileHeader, userID.String(), bucketName)

	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"message": "DB upload failed",
			"error":   err.Error(),
		})
	}

	err = h.Repo.UpdateCoverImage(userID, url)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"message": "Failed to update avatar, something happened",
			"error":   err.Error(),
		})
	}

	log.Printf("[LOG] Upload media successfully to %s\n", url)

	return c.JSON(fiber.Map{
		"media_url": url,
		"message":   "Successfully upload media.",
	})
}
