[⬅ Return to Main Compendium](../../../../../../../README.md)

As a senior backend officer specializing in Go and backend architecture, I have analyzed this React component (`BookingList`). While this is client-side code, its core function dictates the required backend API structure, data contracts, and service logic.

The component is responsible for displaying, filtering, and paginating a list of bookings. Therefore, the backend must expose robust, optimized endpoints that handle these filtering requirements efficiently, ideally using database-level filtering rather than fetching massive datasets and filtering them in memory.

Here is the documentation of the required backend architecture.

---

## ⚙️ Backend Design Documentation: Booking Management Service

### 1. Core Domain Logic Overview

The primary business function is the retrieval of filtered and searched booking schedules for a specific user context (the `consultantId`).

**Goal:** Provide a single, paginated, and filterable API endpoint for listing bookings.

**Key Constraints Handled by Logic:**
1.  **Authorization:** All requests must be scoped to the authenticated `consultantId`.
2.  **Filtering:** Filtering by status (`upcoming`, `confirmed`, etc.) must be supported.
3.  **Searching:** Full-text search capability (e.g., by traveler name) is mandatory.
4.  **State:** Loading and zero-results states must be handled gracefully.

### 2. API Surface Definition (RESTful Contract)

We define a single, optimized endpoint for fetching the booking list. This approach minimizes chatty communication and allows the client to control all required parameters in one call.

#### Endpoint: Get Bookings List
*   **Method:** `GET`
*   **Path:** `/api/v1/consultants/{consultantId}/bookings`
*   **Request Parameters (Query):**

| Parameter | Type | Required | Description | Example Values | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `search` | `string` | No | Text search query (e.g., traveler name, service name). | `"Smith"` | Used for full-text search index. |
| `status` | `string` | No | Filter by booking status. | `"upcoming"`, `"completed"` | Must match predefined enum values. |
| `page` | `int` | No | Page number for pagination. | `1` | Default: 1 |
| `limit` | `int` | No | Number of results per page. | `20` | Default: 20 |
| `sort_by` | `string` | No | Field to sort results by. | `"date"`, `"status"` | Default: `date` (descending) |

*   **Successful Response (`200 OK`):**

```json
{
  "total_items": 150,
  "total_pages": 8,
  "current_page": 1,
  "limit": 20,
  "data": [
    {
      "id": "uuid-123",
      "booking_date": "2024-10-25T10:00:00Z",
      "status": "confirmed",
      "traveler_name": "Jane Doe",
      "service_name": "Deep Tissue Massage",
      "details": { /* ... other core booking data ... */ }
    }
    // ... more bookings
  ]
}
```

### 3. Backend Service Logic (Go Implementation)

The service layer (`booking_service.go`) encapsulates the business rules and orchestrates data retrieval from the repository.

#### `BookingService` Structure and Interface

```go
package service

import (
	"context"
	"your_project/repository"
)

// BookingService defines the business logic layer for managing bookings.
type BookingService struct {
	repo repository.BookingRepository
}

// NewBookingService creates a new instance of the BookingService.
func NewBookingService(repo repository.BookingRepository) *BookingService {
	return &BookingService{repo: repo}
}

// GetBookings fetches a paginated and filtered list of bookings for a consultant.
// This is the primary exposed logic function.
func (s *BookingService) GetBookings(
    ctx context.Context, 
    consultantID string, 
    searchQuery string, 
    statusFilter string, 
    page int, 
    limit int) (*BookingsResponse, error) {

    // 1. Input Validation & Sanitization
    if page < 1 { page = 1 }
    if limit < 1 || limit > 100 { limit = 20 }

    // 2. Business Logic Call to Repository
    // The service delegates the complex filtering/searching to the repository 
    // to utilize database query capabilities (e.g., SQL WHERE clauses, full-text search indexes).
    bookings, total, err := s.repo.FindBookings(
        ctx, 
        consultantID, 
        searchQuery, 
        statusFilter, 
        page, 
        limit,
    )

    if err != nil {
        // Log the error and return a domain-specific error or generic internal error
        return nil, fmt.Errorf("failed to retrieve bookings: %w", err)
    }

    // 3. Construction of Response Model
    // Maps database models to the clean API response structure.
    return &BookingsResponse{
        TotalItems: total,
        TotalPages: calculatePages(total, limit),
        CurrentPage: page,
        Limit: limit,
        Data: bookings,
    }, nil
}

// calculatePages helper function (omitted for brevity)
```

### 4. Repository Pattern (Data Access Layer)

The repository layer (`repository/booking_repository.go`) handles the low-level interaction with the persistence layer (e.g., PostgreSQL, MongoDB). **Crucially, it accepts structured parameters (like `searchQuery`, `statusFilter`) and translates them into optimized database queries.**

```go
package repository

import (
	"context"
	// Assume a database driver import here (e.g., "github.com/jackc/pgx/v5")
)

// BookingRepository defines the interface for booking data access.
type BookingRepository interface {
	FindBookings(
		ctx context.Context,
		consultantID string,
		searchQuery string,
		statusFilter string,
		page int,
		limit int,
	) ([]model.Booking, int, error)
}

// PostgresBookingRepository implements BookingRepository using SQL.
type PostgresBookingRepository struct {
	// db *sql.DB or *pgx.Pool
}

// FindBookings executes the core database query.
func (r *PostgresBookingRepository) FindBookings(
	ctx context.Context, 
	consultantID string, 
	searchQuery string, 
	statusFilter string, 
	page int, 
	limit int) ([]model.Booking, int, error) {

	// 1. Build Dynamic SQL Query
	// Use parameterized queries (prepared statements) to prevent SQL injection.
	sql := `
		SELECT * FROM bookings
		WHERE consultant_id = $1 
		-- Status Filtering (WHERE clause extension)
		AND (? = $2 OR $2 IS NULL) 
		-- Full-Text Search (Using ILIKE or dedicated FTS functions)
		AND (
            $3 IS NULL OR (
                traveler_name ILIKE '%' || $3 || '%' 
                OR service_name ILIKE '%' || $3 || '%'
            )
        )
		ORDER BY booking_date DESC
		LIMIT $4 OFFSET $5;
	`

	// 2. Execute Count Query (To get total_items)
	countSQL := `SELECT COUNT(*) FROM bookings WHERE consultant_id = $1 AND (? = $2 OR $2 IS NULL) AND (
        $3 IS NULL OR (traveler_name ILIKE '%' || $3 || '%' OR service_name ILIKE '%' || $3 || '%'))`
	
	var total int
	// Execute count query...

	// 3. Execute Data Fetching Query
	// Bind parameters: consultantID, statusFilter, searchQuery, limit, offset
	rows, err := r.db.QueryContext(ctx, sql, consultantID, statusFilter, searchQuery, limit, (page-1)*limit)

	// 4. Map Results
	// Iterate through rows and map them into the Go model.Booking slice.
	var bookings []model.Booking
	// ... row scanning logic ...

	return bookings, total, nil
}
```

---
*this content was created by AI, but the coding and underlying logic are not.*