[⬅ Return to Main Compendium](../../../../../README.md)

This component is a client-side presentation layer, but analyzing its dependencies allows us to define a precise **API Contract**, **Data Models**, and the necessary **Service Layer Logic** in a robust backend system.

Given the component's dependency on the `Review` data structure, we will architect the solution around serving reliable, structured, and consistent data.

---

## 🧑‍💻 Backend Architecture Documentation

### 1. Data Models & API Contract (The Source of Truth)

The `ReviewCard` consumes the `Review` type. We must solidify this into a canonical Go struct that represents the data structure expected from the API endpoint.

**Go Data Model (`pkg/models/review.go`):**

```go
package models

import (
	"time"
)

// Review represents the core structure of a user-submitted review.
type Review struct {
	ID            string     `json:"id"`
	ConsultantID  string     `json:"consultant_id"` // ID of the consultant being reviewed
	ReviewerID    string     `json:"reviewer_id"`   // ID of the person who left the review
	Name          string     `json:"name"`           // Reviewer's full name
	Comment       string     `json:"comment"`        // The main text body of the review
	Rating        float64    `json:"rating"`         // Numerical rating (e.g., 4.5 out of 5)
	Date          time.Time  `json:"date"`           // Date the review was posted
	ReviewAvatar  *string    `json:"review_avatar"` // Optional URL for the reviewer's avatar
	VerifiedStay  bool       `json:"verified_stay"` // Flag indicating a confirmed interaction
}

// ReviewResponse encapsulates the minimal data needed for the frontend component.
// This minimizes payload size and shields the frontend from database schema changes.
type ReviewResponse struct {
	ID            string  `json:"id"`
	Name          string  `json:"name"`
	Comment       string  `json:"comment"`
	Rating        float64 `json:"rating"`
	Date          string  `json:"date"` // Use string format optimized for frontend date formatting
	ReviewAvatar  *string `json:"review_avatar"`
	VerifiedStay  bool    `json:"verified_stay"`
}
```

**API Surface Definition:**

| Endpoint | Method | Description | Request Body | Response Body | Pagination/Filtering |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `/api/v1/consultants/{consultantId}/reviews` | `GET` | Retrieves a paginated list of reviews for a specific consultant. | None | `[]models.ReviewResponse` | `?page=N&limit=M&sortBy=date&sortOrder=desc` |

### 2. Core Backend Logic & Service Layer

The **Service Layer** (`pkg/service`) is responsible for the business rules, transforming raw data (from the repository) into the clean `ReviewResponse` model required by the client.

**A. Business Logic: Data Aggregation & Transformation**

1.  **Review Collection:** The service must fetch a list of reviews based on the `consultantId`.
2.  **Data Standardization:** The service converts raw database timestamps and objects into the standardized `models.ReviewResponse`.
3.  **Rating Calculation (Crucial):** While the API fetches individual reviews, a helper endpoint is often needed to provide summary statistics (e.g., average rating, count).

**Service Interface (`pkg/service/review_service.go`):**

```go
package service

import (
    "myapp/pkg/models"
)

type ReviewService interface {
	GetReviewsByConsultant(consultantID string, page, limit int, sortBy string) ([]models.ReviewResponse, error)
	GetSummaryRating(consultantID string) (float64, int, error) // Avg rating, total count
}

type reviewServiceImpl struct {
    repo ReviewRepository
}

func (s *reviewServiceImpl) GetReviewsByConsultant(consultantID string, page, limit int, sortBy string) ([]models.ReviewResponse, error) {
    // 1. Call Repository layer to fetch raw data
    rawReviews, err := s.repo.FindByConsultant(consultantID, page, limit, sortBy)
    if err != nil {
        return nil, err
    }

    // 2. Transform and clean data for API consumption
    responses := make([]models.ReviewResponse, len(rawReviews))
    for i, r := range rawReviews {
        responses[i] = models.ReviewResponse{
            ID: r.ID,
            Name: r.Name,
            Comment: r.Comment,
            Rating: r.Rating,
            // Format date into a simple, client-friendly string format (e.g., YYYY-MM-DD)
            // Let the frontend handle localization (e.g., 'Month Day, Year')
            Date: r.Date.Format("2006-01-02"), 
            ReviewAvatar: r.ReviewAvatar,
            VerifiedStay: r.VerifiedStay,
        }
    }
    return responses, nil
}
```

### 3. Repository Layer (Database Interaction)

The **Repository Layer** (`pkg/repository`) abstracts the database access (e.g., PostgreSQL, MongoDB). The Service layer should *never* directly execute SQL/queries; it only speaks to the repository interface.

**Repository Interface (`pkg/repository/review_repository.go`):**

```go
package repository

import "myapp/pkg/models"

// ReviewRepository defines the contract for database interaction concerning reviews.
type ReviewRepository interface {
	// FindByConsultant fetches a slice of raw review records.
	FindByConsultant(consultantID string, page, limit int, sortBy string) ([]models.Review, error)
	// GetReviewByID fetches a single review (used for detail views).
	GetReviewByID(reviewID string) (*models.Review, error)
}
```

**Example Implementation Detail (Pseudocode):**

The implementation would handle:
1. Pagination (using `LIMIT` and `OFFSET` clauses).
2. Sorting (ordering by `date` or `rating`).
3. Safe handling of null/missing optional fields (like `review_avatar`).

### 4. Summary of Patterns Applied

| Pattern | Location | Purpose | Implementation Detail |
| :--- | :--- | :--- | :--- |
| **Repository Pattern** | `pkg/repository` | Decouples business logic from data storage details. | Uses `ReviewRepository` interface. |
| **Service Layer Pattern** | `pkg/service` | Executes business logic, transforming domain models into API payloads. | Converts `models.Review` (DB format) $\rightarrow$ `models.ReviewResponse` (API format). |
| **Model Pattern** | `pkg/models` | Defines strict, versioned data structures (API Contract). | `ReviewResponse` ensures only necessary data is exposed to the client. |
| **Data Validation** | Controller/Service | Ensures inputs (e.g., `consultantID`, page number) are valid before hitting the repository. | Mandatory input checks and sanitation. |

---
*this content was created by AI, but the coding and underlying logic are not.*