[⬅ Return to Main Compendium](../../../../../README.md)

As a senior backend officer focused on robust architectural patterns, my review of this component reveals that its primary function is presentation (rendering state) and routing (triggering navigation/actions). All core business logic—specifically data retrieval, authentication checks, and state mutations—must be managed by the backend API layer.

I will abstract the UI logic into three core architectural layers: **Data Models**, **Repository Layer**, and **Service/Business Logic Layer**.

---

## 🚀 Backend Architecture Document: Consultant Profile Card

### 1. Data Model Definition (Go Structs)

We must define the canonical data structure used throughout the application. This structure must be consistent between the API response and the frontend component's `Consultant` type.

```go
// Consultant represents the core data entity for a local expert.
type Consultant struct {
	ID             string  `json:"id"`
	Name           string  `json:"name"`
	DisplayName    *string `json:"display_name,omitempty"` // Optional fallback/shortened name
	AvatarURL      string  `json:"avatar_url"`
	CoverURL       string  `json:"cover_url"`
	City           string  `json:"city"`
	Tag            string  `json:"tag"`
	Rating         float64 `json:"rating"`
	HelpedCount    int     `json:"helped_count"`
	// Note: The wishlist count or status might be fetched separately
	// or aggregated if displaying it on the list view.
}

// UserWishlistResponse is used for mutations (e.g., adding to wishlist)
type UserWishlistResponse struct {
	Success bool `json:"success"`
	Message string `json:"message"`
}
```

### 2. API Surface Definition (API Contract)

The component's actions map directly to three critical API endpoints. We assume an API gateway structure using versioning (`/api/v1`).

#### A. GET /api/v1/consultants/list (Read Operation)

*   **Purpose:** Fetch the initial list of consultants to display on the browsing page.
*   **Parameters:**
    *   `limit` (int): Pagination limit.
    *   `offset` (int): Pagination offset.
    *   `search` (string): Filter by name or tag.
*   **Request Body:** None.
*   **Response Body:** `[]Consultant`
*   **Logic Constraint:** Must handle filtering and pagination correctly to populate the array of `Consultant` structs.

#### B. POST /api/v1/consultants/{id}/wishlist (Write/Mutation Operation)

*   **Purpose:** Handles the core "Heart/Wishlist" action, which is the primary mutation in the component. This must be secured and atomic.
*   **Authentication:** Requires a valid `User` token/session.
*   **Path Variables:**
    *   `id` (string): The `Consultant` ID.
*   **Request Body:** None (User ID is derived from the authentication token).
*   **Response Body:** `UserWishlistResponse` (Indicates if the operation was successful, allowing frontend state update).
*   **Business Logic:** Checks if the user has already added the consultant to the wishlist. If so, it *toggles* the state (removes it).

#### C. POST /api/v1/consultants/{id}/ask (Write/Action Operation)

*   **Purpose:** Handles the "Ask this local" button click, initiating a consultation request or conversation thread.
*   **Authentication:** Requires a valid `User` token/session.
*   **Path Variables:**
    *   `id` (string): The `Consultant` ID.
*   **Request Body:**
    *   `message` (string): The initial message/query from the user (optional, but highly recommended).
*   **Response Body:** A status confirmation (e.g., HTTP 202 Accepted, with a `RequestID` for subsequent polling).
*   **Business Logic:** This endpoint must trigger the creation of a `ConsultationRequest` entity, linking the `User` to the `Consultant`.

### 3. Repository Pattern & Service Layer Logic

The **Service Layer** coordinates business logic, while the **Repository Layer** manages database interaction (CRUD operations).

#### 💾 `ConsultantRepository` (Repository Pattern)

This layer handles direct communication with the database.

```go
// Interface defines the required database operations.
type ConsultantRepository interface {
    // GetByID fetches a single consultant's full profile.
    GetByID(ctx context.Context, id string) (*Consultant, error)
    // GetList fetches paginated list of consultants.
    GetList(ctx context.Context, search string, limit int, offset int) ([]Consultant, error)
    // CheckWishlistStatus checks if a specific user has favorited a consultant.
    CheckWishlistStatus(ctx context.Context, userID, consultantID string) (bool, error)
    // ToggleWishlist records or deletes the wishlist association.
    ToggleWishlist(ctx context.Context, userID, consultantID string) error
}
```

#### 💼 `ConsultantService` (Service Layer)

This layer executes the business rules using the repository.

```go
type ConsultantService struct {
    repo ConsultantRepository
}

// AddToWishlist encapsulates the business logic for the heart button.
func (s *ConsultantService) AddToWishlist(ctx context.Context, userID, consultantID string) error {
    // 1. Pre-check (Optional: read current status first)
    // status, err := s.repo.CheckWishlistStatus(ctx, userID, consultantID)
    // if status { return fmt.Errorf("already favorited") }

    // 2. Execute the write operation
    err := s.repo.ToggleWishlist(ctx, userID, consultantID)
    if err != nil {
        // Implement robust error handling (e.g., transaction rollback)
        return fmt.Errorf("failed to update wishlist: %w", err)
    }
    return nil
}

// InitiateConsultation handles the complexity of the "Ask this local" action.
func (s *ConsultantService) InitiateConsultation(ctx context.Context, userID, consultantID string, initialMessage string) (*ConsultationRequest, error) {
    // 1. Validate Consultant existence and status (e.g., Is this consultant active?)
    // 2. Create the Request record in the database.
    // 3. Return the newly created Request object.
    // ... implementation details ...
    return &ConsultationRequest{/*...*/}, nil
}
```

### Summary of Improvements (Backend Perspective)

1.  **Decoupling:** The component relies on strongly typed API contracts, ensuring that the frontend is agnostic to how the data (or the request) is stored.
2.  **Security:** The critical mutations (`Wishlist`, `Ask`) are protected within the Service Layer, ensuring that authentication checks, data validation (e.g., rate limiting, banned users), and database transaction integrity occur on the backend.
3.  **Scalability:** Separating the `Repository` (data access details) from the `Service` (business rules) allows us to swap underlying database technologies (e.g., PostgreSQL to MongoDB) without rewriting the core business logic.

***
*this content was created by AI, but the coding and underlying logic are not.*