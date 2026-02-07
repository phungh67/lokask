package handler

import (
	"asklocal/internal/domain"
	"asklocal/internal/repository"
	"asklocal/internal/storage"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type BlogHandler struct {
	Repo    *repository.BlogRepository
	Storage *storage.MinioClient
}

// Create handles posting a new blog with a cover image
func (h *BlogHandler) Create(c *fiber.Ctx) error {
	// 1. Get User ID from Auth Middleware
	userIDStr := c.Locals("user_id").(string)
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid user ID"})
	}

	// 2. Parse Form Fields
	title := c.FormValue("title")
	content := c.FormValue("content")
	summary := c.FormValue("summary") // Optional: Short desc for the card
	city := c.FormValue("city")
	country := c.FormValue("country")

	if title == "" || content == "" {
		return c.Status(400).JSON(fiber.Map{"error": "Title and Content are required"})
	}

	// 3. Handle Cover Image Upload (Optional but recommended)
	var coverImageURL string
	file, err := c.FormFile("cover_image")
	if err == nil {
		// Upload to MinIO
		rawURL, err := h.Storage.UploadFile(file, "travel-photos")
		if err != nil {
			return c.Status(500).JSON(fiber.Map{"error": "Failed to upload cover image"})
		}
		coverImageURL = strings.Replace(rawURL, ":9001", ":9000", 1)
	}

	// 4. Create Model
	blog := &domain.Blog{
		ID:            uuid.New(),
		AuthorID:      userID,
		Title:         title,
		Summary:       summary,
		Content:       content,
		CoverImageURL: coverImageURL,
		City:          city,
		Country:       country,
		CreatedAt:     time.Now(),
		UpdatedAt:     time.Now(),
	}

	// 5. Save to DB
	if err := h.Repo.Create(blog); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to save blog post", "detail": err.Error()})
	}

	return c.Status(201).JSON(blog)
}

// List fetches blogs with filters (e.g. ?city=Rome)
func (h *BlogHandler) List(c *fiber.Ctx) error {
	filter := repository.BlogFilter{
		City:     c.Query("city"),
		Country:  c.Query("country"),
		AuthorID: c.Query("author_id"),
		Limit:    20, // Default limit
	}

	blogs, err := h.Repo.List(filter)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to fetch blogs", "detail": err.Error()})
	}

	return c.JSON(blogs)
}

// Get fetches a single blog by ID
func (h *BlogHandler) Get(c *fiber.Ctx) error {
	idStr := c.Params("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid Blog ID"})
	}

	blog, err := h.Repo.GetByID(id)
	if err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Blog not found"})
	}

	return c.JSON(blog)
}
