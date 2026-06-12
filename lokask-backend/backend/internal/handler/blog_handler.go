package handler

import (
	"asklocal/internal/domain"
	"asklocal/internal/repository"
	"asklocal/internal/storage"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type BlogHandler struct {
	Repo    *repository.BlogRepository
	Storage storage.FileStorage
}

// Create handles posting a new blog with a cover image
func (h *BlogHandler) Create(c *fiber.Ctx) error {
	// userID
	userIDStr := c.Locals("user_id").(string)
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid user ID"})
	}

	// extract data
	title := c.FormValue("title")
	content := c.FormValue("content")
	summary := c.FormValue("summary") // Optional: Short desc for the card
	city := c.FormValue("city")
	country := c.FormValue("country")

	if title == "" || content == "" {
		return c.Status(400).JSON(fiber.Map{"error": "Title and Content are required"})
	}

	// cover image
	newBlogID := uuid.New()

	var coverImageKey string
	file, err := c.FormFile("cover_image")
	if err == nil {
		// Upload to MinIO
		key, uploadErr := h.Storage.UploadFile(file, newBlogID.String(), "blog")
		if uploadErr != nil {
			return c.Status(500).JSON(fiber.Map{"error": "Failed to upload cover image"})
		}
		coverImageKey = key
	}

	// object
	blog := &domain.Blog{
		ID:            newBlogID,
		AuthorID:      userID,
		Title:         title,
		Summary:       summary,
		Content:       content,
		CoverImageURL: coverImageKey,
		City:          city,
		Country:       country,
		CreatedAt:     time.Now(),
		UpdatedAt:     time.Now(),
	}

	// push to db
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
