package handler

import (
	"asklocal/internal/domain"
	"asklocal/internal/repository"
	"log"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type ConsultantHandler struct {
	Repo *repository.ConsultantRepository
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

func (h *ConsultantHandler) List(c *fiber.Ctx) error {
	cityFilter := c.Query("city") // Reads ?city=... from URL
	countryFilter := c.Query("country")

	consultants, err := h.Repo.ListConsultants(c.Context(), cityFilter, countryFilter)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	// Return empty list instead of null if no results
	if consultants == nil {
		consultants = []domain.ConsultantProfile{}
	}

	return c.JSON(consultants)
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
