package handler

import (
	"asklocal/internal/domain"
	"asklocal/internal/helper"
	"asklocal/internal/repository"
	"asklocal/internal/storage"
	"fmt"
	"log"
	"net/url"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type ConsultantHandler struct {
	Repo    *repository.ConsultantRepository
	Storage storage.FileStorage
}

type DeleteMediaRequest struct {
	ImageURL string `json:"image_url"`
}

var allowedExtensions = map[string]bool{
	".jpg":  true,
	".jpeg": true,
	".png":  true,
	".webp": true,
	".gif":  true,
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
		log.Printf("[ERROR] Error fetching consultant: %v\n", err)
		return c.Status(500).JSON(fiber.Map{
			"error": "internal server error.",
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
		log.Printf("[ERROR][UPDATE] Error catched: %v", err)
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body format",
		})
	}

	err = h.Repo.UpdateProfile(c.Context(), userID, payload)
	if err != nil {
		log.Printf("[ERROR][UPDATE] UpdateProfile failed: %v\n", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to update profile",
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
		log.Printf("[ERROR] Error when querying consultants: %v", err)
		return c.Status(500).JSON(fiber.Map{
			"error": "Internal server error.",
		})
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
	userIDParam := c.Params("id")
	userID, err := uuid.Parse(userIDParam)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid User ID format"})
	}

	profile, err := h.Repo.GetProfileByUserID(c.Context(), userID)

	if err != nil {
		return c.Status(404).JSON(fiber.Map{
			"error": "User is not a consultant",
		})
	}

	return c.JSON(profile)
}

// GetNiches handles GET /api/v1/niches
func (h *ConsultantHandler) GetNiches(c *fiber.Ctx) error {
	niches, err := h.Repo.ListNiches(c.Context())
	if err != nil {
		log.Printf("[ERROR] Cannot get consultant's niches: %v", err)
		return c.Status(500).JSON(fiber.Map{
			"error": "Internal server error.",
		})
	}
	return c.JSON(niches)
}

func (h *ConsultantHandler) GetLanguages(c *fiber.Ctx) error {
	language, err := h.Repo.ListUniqueLanguages(c.Context())
	if err != nil {
		log.Printf("[ERROR] Cannot get languagues: %v", err)
		return c.Status(500).JSON(fiber.Map{
			"error": "Internal server error.",
		})
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
		log.Printf("[ERROR] Cannot get citites: %v", err)
		return c.Status(500).JSON(fiber.Map{
			"error": "Internal server error.",
		})
	}
	return c.JSON(cities)
}

// func to handle media upload (not avatar)
func (h *ConsultantHandler) UploadMedia(c *fiber.Ctx) error {
	userIDStr := c.Locals("user_id").(string) // cast to only string
	userID, err := uuid.Parse(userIDStr)      // convert to uuid format (assume that we get the string)

	if err != nil {
		log.Printf("[ERROR][PARSE] Error when parsing data: %v", err)
		return c.Status(500).JSON(fiber.Map{
			"message": "Internal server error",
		})
	}

	// upload multiple files
	form, err := c.MultipartForm()
	if err != nil {
		log.Printf("[ERROR] Error when parsing data: %v", err)
		return c.Status(400).JSON(fiber.Map{
			"message": "Error",
		})
	}

	// log
	files := form.File["file"]
	if len(files) == 0 {
		files = form.File["gallery_images"]
		return c.Status(400).JSON(fiber.Map{
			"message": "No file provided.",
		})
	}

	mediaType := c.FormValue("type") // to check if it meant to be cover or galleries
	var uploadedURLs []string

	for _, fileHeader := range files {
		// check ext
		ext := strings.ToLower(filepath.Ext(fileHeader.Filename))
		if !allowedExtensions[ext] {
			log.Printf("[WARN] Blocked unsupported file format: %s", ext)
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"message": fmt.Sprintf("Unsupported file format: %s. Allowed formats are JPG, PNG, WEBP, and GIF.", ext),
			})
		}

		santizedFileName := filepath.Base(fileHeader.Filename)

		fileName := fmt.Sprintf("%d_%s", time.Now().UnixNano(), santizedFileName)
		var objectKey string

		if mediaType == "cover" {
			objectKey = fmt.Sprintf("covers/%s/%s", userID, fileName)
		} else {
			objectKey = fmt.Sprintf("galleries/%s/%s", userID, fileName)
		}

		_, err := h.Storage.UploadFile(fileHeader, userID.String(), objectKey)
		if err != nil {
			log.Printf("[ERROR] Bucket upload failed for %s: %v", fileName, err)
			continue
		}

		if mediaType == "cover" {
			err = h.Repo.UpdateCoverImage(userID, objectKey)
		} else {
			err = h.Repo.AddGalleryImage(userID, objectKey)
		}

		if err != nil {
			log.Printf("[ERROR] Failed to update database for %s: %v", fileName, err)
			continue
		}

		mediaURL, err := helper.BuildMediaURL(objectKey)
		if err == nil {
			uploadedURLs = append(uploadedURLs, mediaURL)
			log.Printf("[INFO] Upload media successfully to %s\n", mediaURL)
		}

		if mediaType == "cover" {
			break
		}
	}

	response := fiber.Map{
		"message": "Successfully uploaded media.",
	}

	if len(uploadedURLs) > 0 {
		response["media_url"] = uploadedURLs[0]
		response["media_urls"] = uploadedURLs
	}

	return c.JSON(response)
}

func (h *ConsultantHandler) DeleteGalleryMedia(c *fiber.Ctx) error {
	userIDstr := c.Locals("user_id").(string)
	userID, err := uuid.Parse(userIDstr)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Unauthorized",
		})
	}

	var req DeleteMediaRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request",
		})
	}

	parsedURL, err := url.Parse(req.ImageURL)
	var imageKey string

	if err == nil && parsedURL.Path != "" {
		imageKey = strings.TrimPrefix(parsedURL.Path, "/")

		unescapedKey, unescapeErr := url.QueryUnescape(imageKey)
		if unescapeErr == nil {
			imageKey = unescapedKey
		}
	} else {
		imageKey = req.ImageURL
	}

	if err := h.Repo.RemoveGalleryImage(userID, imageKey); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Invalid request",
		})
	}

	// clean file in S3
	// not necessary to throw error
	// but should warning if possible
	err = h.Storage.DeleteFile(c.Context(), imageKey)
	if err != nil {
		log.Printf("[WARNING] DB Unlink successful, but failed to delete file %s from storage: %v", imageKey, err)
	}

	return c.JSON(fiber.Map{"message": "Image deleted successfully."})
}
