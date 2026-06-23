[⬅ Return to Main Compendium](../../../../../README.md)

## Backend Design and Implementation Guide (Go/Golang)

As a senior backend officer, my primary goal is to ensure the underlying data structures are type-safe, performant, and adhere to standard Go best practices, particularly focusing on clean separation of concerns (Repository $\rightarrow$ Service $\rightarrow$ Handler).

### 1. Data Model Translation (Go Structs)

I have translated the provided TypeScript interfaces into Go structs. I've used standard JSON tags (`json:"..."`) for serialization and maintained clear capitalization conventions (CamelCase) for Go fields.

```go
package model

// --- Core Models ---

// Badge represents a recognition badge for a consultant.
type Badge struct {
	ID          string `json:"id"`
	IconName    string `json:"icon_name"`
	Title       string `json:"title"`
	Description string `json:"description"`
}

// Review represents a client review submitted by a user.
type Review struct {
	ID           string    `json:"id"`
	ReviewName   string    `json:"review_name"`
	ReviewAvatar string    `json:"review_avatar"`
	Rating       float64   `json:"rating"`
	Comment      string    `json:"comment"`
	VerifiedStay bool      `json:"verified_stay"`
	Date         string    `json:"date"`
}

// Consultant represents the full profile data for a consulting expert.
type Consultant struct {
	ID            string      `json:"id"`
	UserID        string      `json:"user_id"`
	Name          string      `json:"name"` // Full legal name
	DisplayName   string      `json:"display_name"`
	City          string      `json:"city"`
	Country       string      `json:"country"`
	Tag           string      `json:"tag"`       // Used in the compact card
	Tags          []string    `json:"tags"`      // Used in the main card
	Quote         string      `json:"quote"`
	Rating        float64     `json:"rating"`
	HelpedCount   int         `json:"helped_count"`
	AvatarURL     string      `json:"avatar_url"`
	CoverURL      string      `json:"cover_url"`

	// Optional fields (Pointers or nil checks are recommended in Go)
	IsHighlyTrusted *bool        `json:"is_highly_trusted,omitempty"`
	Bio             *string      `json:"bio,omitempty"`
	Languages       []string     `json:"languages,omitempty"`
	ResponseTime    *string      `json:"response_time,omitempty"`
	IsOnline        *bool        `json:"is_online,omitempty"`
	GalleryImages   []string     `json:"gallery_images,omitempty"`
	Badges          []Badge      `json:"badges,omitempty"`
	Reviews         []Review     `json:"reviews,omitempty"`
}

// UpdateProfileRequest encapsulates the fields allowed for partial profile updates.
// Note: We use pointers or map[string]interface{} for flexible updates,
// but matching the input structure first is best practice.
type UpdateProfileRequest struct {
	FullName     *string   `json:"full_name,omitempty"`
	DisplayName  *string   `json:"display_name,omitempty"`
	CityID       *int      `json:"city_id,omitempty"`
	Quote        *string   `json:"quote,omitempty"`
	Bio          *string   `json:"bio,omitempty"`
	Languages    *[]string `json:"languages,omitempty"`

	MainNicheID  *int      `json:"main_niche_id,omitempty"`
	Tags         []string  `json:"tags,omitempty"` // Tags might overwrite or append
}
```

### 2. Repository Pattern (Data Access Layer)

The repository layer abstracts the database interactions. We define interfaces to enforce the contract, making the service layer testable and decoupled from specific database technologies (e.g., PostgreSQL, MongoDB).

```go
package repository

import (
	"context"
	"myproject/model"
)

// ConsultantRepository defines the contract for interacting with Consultant data.
type ConsultantRepository interface {
	// GetByID retrieves a consultant profile by their unique ID.
	GetByID(ctx context.Context, id string) (*model.Consultant, error)

	// UpdateProfile saves the updated profile data.
	// This signature allows the service layer to pass a partial or full model.
	UpdateProfile(ctx context.Context, consultant *model.Consultant) error

	// SaveUpdatedProfile handles the update using a dedicated request payload,
	// minimizing the risk of updating unintended fields.
	SaveUpdatedProfile(ctx context.Context, userID string, req *model.UpdateProfileRequest) error

	// CreateNewConsultant handles initial profile creation.
	CreateNewConsultant(ctx context.Context, c *model.Consultant) error
}

// Example Implementation (Conceptual stub)
type PostgresConsultantRepo struct {
	// db *sql.DB connection or *mongo.Client client
}

// (Implementation details for GetByID, UpdateProfile, etc., would go here,
// using SQL queries or database drivers.)
```

### 3. Service Layer (Business Logic)

The Service layer contains the core business logic. It orchestrates calls to the repository, performs validation, applies business rules, and handles data transformation (e.g., converting raw input data into a complex `Consultant` object).

```go
package service

import (
	"context"
	"errors"
	"myproject/model"
	"myproject/repository"
)

// ConsultantService defines the contract for business operations related to consultants.
type ConsultantService interface {
	// GetProfile retrieves and aggregates the full profile data.
	GetProfile(ctx context.Context, id string) (*model.Consultant, error)

	// UpdateProfile attempts to update a consultant's details.
	// This method performs validation and handles the complexity of partial updates.
	UpdateProfile(ctx context.Context, userID string, req *model.UpdateProfileRequest) (*model.Consultant, error)
}

type consultantServiceImpl struct {
	repo repository.ConsultantRepository
}

// NewConsultantService initializes the service dependency.
func NewConsultantService(repo repository.ConsultantRepository) *consultantServiceImpl {
	return &consultantServiceImpl{repo: repo}
}

// GetProfile implements the business logic for retrieving a profile.
func (s *consultantServiceImpl) GetProfile(ctx context.Context, id string) (*model.Consultant, error) {
	if id == "" {
		return nil, errors.New("consultant ID cannot be empty")
	}

	// 1. Call the repository
	consultant, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}

	// 2. Apply business rules (e.g., enriching data, calculating derived fields)
	// Example: Ensure Tags are always trimmed and lowercase
	for i := range consultant.Tags {
		consultant.Tags[i] = trimAndLower(consultant.Tags[i])
	}

	return consultant, nil
}

// UpdateProfile implements the business logic for updating a profile.
func (s *consultantServiceImpl) UpdateProfile(ctx context.Context, userID string, req *model.UpdateProfileRequest) (*model.Consultant, error) {
	// 1. Pre-Validation: Check if required fields are present if necessary
	if req == nil {
		return nil, errors.New("update request payload cannot be null")
	}

	// 2. Business Rule Execution & Data Mapping
	// This method ensures that the service layer validates the request
	// before blindly passing it to the database.
	if req.Bio != nil && len((*req.Bio).String()) > 500 {
		return nil, errors.New("bio cannot exceed 500 characters")
	}

	// 3. Delegation to Repository (Data Persistence)
	err := s.repo.SaveUpdatedProfile(ctx, userID, req)
	if err != nil {
		return nil, errors.New("failed to save profile update: " + err.Error())
	}

	// 4. Fetch and Return the updated model (Best practice: Don't return the request object)
	return s.GetProfile(ctx, userID)
}

// Helper function (conceptual)
func trimAndLower(s string) string {
	// Logic to clean string input
	return s
}
```

### 4. API Handler Layer (HTTP Endpoint)

The handler layer is responsible only for the HTTP plumbing: reading the request body, binding it to the appropriate Go struct, calling the service layer, and writing the appropriate HTTP response code.

```go
package handler

import (
	"encoding/json"
	"net/http"
	"myproject/model"
	"myproject/service"
)

type Handler struct {
	svc service.ConsultantService
}

func NewHandler(svc service.ConsultantService) *Handler {
	return &Handler{svc: svc}
}

// GetProfileHandler handles GET /consultants/{id}
func (h *Handler) GetProfileHandler(w http.ResponseWriter, r *http.Request) {
	// Assume ID is extracted from URL parameters (e.g., chi.URLParams["id"])
	consultantID := "some-id-from-path"

	ctx := r.Context() // Use the request context
	profile, err := h.svc.GetProfile(ctx, consultantID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(profile)
}

// UpdateProfileHandler handles PATCH /consultants/me
func (h *Handler) UpdateProfileHandler(w http.ResponseWriter, r *http.Request) {
	// 1. Decode Request Body into the specific payload struct
	var req model.UpdateProfileRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request payload", http.StatusBadRequest)
		return
	}

	ctx := r.Context()
	// Assume UserID is derived from authentication middleware
	userID := "authenticated-user-id"

	// 2. Call the service layer
	updatedProfile, err := h.svc.UpdateProfile(ctx, userID, &req)
	if err != nil {
		// Map service errors to appropriate HTTP status codes (e.g., 400 Bad Request vs 500 Internal Error)
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	// 3. Respond with 200 OK and the updated resource
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(updatedProfile)
}
```

***
*this content was created by AI, but the coding and underlying logic are not.*