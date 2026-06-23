[⬅ Return to Main Compendium](../../../README.md)

As a senior backend officer, I analyze this frontend structure and deduce the necessary backend architecture. The functionality—connecting users with local advice—requires a robust, scalable backend that handles asynchronous queries, user authentication, and content moderation.

The core services must be designed using Go, focusing on concurrency, efficiency, and clear separation of concerns (Repository Pattern).

---

## 🌐 Lokask Backend Architecture Documentation

**Goal:** To provide a secure, scalable API for handling user questions, authenticating users (Travelers and Locals), and managing the knowledge base.

### ⚙️ I. Core Backend Logic (Go Packages)

The backend should be structured using microservices or distinct packages within a monolith, adhering to the Domain-Driven Design (DDD) principle.

#### 1. `internal/service` (Business Logic Layer)
This layer contains the complex, business-rule-driven logic. It orchestrates calls between repositories.

*   **`QueryService`:**
    *   **Purpose:** Handles the lifecycle of a user query (from submission to answer aggregation).
    *   **Core Logic:**
        1.  Validate query parameters (e.g., character limits, required location context).
        2.  Determine appropriate retrieval strategy (e.g., matching geo-location, topic tagging).
        3.  Manage query status (Pending $\rightarrow$ Answered $\rightarrow$ Archived).
        4.  Handle rate limiting and spam detection checks before invoking repository writes.
*   **`UserManagementService`:**
    *   **Purpose:** Manages user roles and permissions (Traveler, Local, Admin).
    *   **Core Logic:**
        1.  **Authentication:** JWT token validation/generation upon login.
        2.  **Authorization:** Role-based access control (RBAC) checks before allowing write operations (e.g., only confirmed Locals can submit official answers).
        3.  Handle profile enrichment and data integrity checks.

#### 2. `internal/repository` (Data Access Layer)
This layer isolates the application logic from the database specifics. It defines interfaces that concrete implementations (e.g., `PostgresRepo`, `RedisCache`) will satisfy.

*   **`QueryRepository`:**
    *   **Methods:** `Save(ctx context.Context, query *models.Query)`, `GetByID(ctx context.Context, id string) (*models.Query, error)`, `FindPendingQueries(ctx context.Context) ([]*models.Query, error)`.
    *   **Implementation Note:** Should use transactional logic for ensuring query status updates are atomic.
*   **`AnswerRepository`:**
    *   **Methods:** `Save(ctx context.Context, answer *models.Answer)`, `FindAnswersByQuery(ctx context.Context, queryID string, limit int) ([]*models.Answer, error)`.
    *   **Implementation Note:** Crucial logic here is pagination and optimized fetching (e.g., indexing on `query_id` and `created_at`).
*   **`UserRepository`:**
    *   **Methods:** `FindByEmail(ctx context.Context, email string) (*models.User, error)`, `Save(ctx context.Context, user *models.User) error`.

### 🎯 II. API Surface Documentation (RESTful Endpoints)

We will expose a secure, versioned API (e.g., `/api/v1`). All endpoints require authentication (Bearer Token).

| Endpoint | HTTP Method | Functionality | Request Body | Response Body | Security/Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `/v1/auth/login` | `POST` | Authenticates user and issues JWT. | `{"email": string, "password": string}` | `{"token": string}` | Public endpoint. |
| `/v1/query` | `POST` | Submits a new travel query. | `{"title": string, "location": string, "details": string}` | `{"query_id": string, "status": "Pending"}` | Requires valid Traveler token. |
| `/v1/query/{queryId}` | `GET` | Retrieves a specific query and associated answers. | *(None)* | `{"query": ..., "answers": []}` | Read-only. Cached heavily. |
| `/v1/local/answer/{queryId}` | `POST` | A Local submits an answer to a query. | `{"answer_text": string, "source": string}` | `{"answer_id": string}` | **Critical:** Requires "Local" role validation. |
| `/v1/profile` | `GET` | Retrieves the authenticated user's profile. | *(None)* | `{User Model}` | Basic authorization check. |
| `/v1/feed` | `GET` | Fetches a curated feed of popular or new queries/answers. | `{"limit": int, "topic": string}` | `[] {Query/Answer Models}` | Optimized for public browsing (high read throughput). |

### 💾 III. Data Modeling & Schemas (Go Structs/Models)

We define canonical models to ensure data consistency across the service layer.

```go
package models

// User represents any user interacting with the platform.
type User struct {
    UserID    string `json:"user_id"`
    Email     string `json:"email"`
    Role      string `json:"role"` // E.g., "Traveler", "Local", "Admin"
    Bio       string `json:"bio"`
    IsVerified bool `json:"is_verified"`
}

// Query represents the travel advice request submitted by a Traveler.
type Query struct {
    QueryID    string `json:"query_id"`
    OwnerID    string `json:"owner_id"`
    Title      string `json:"title"`
    Location   string `json:"location"`
    Details    string `json:"details"`
    Status     string `json:"status"` // E.g., "Pending", "Answered", "Closed"
    CreatedAt  time.Time `json:"created_at"`
}

// Answer represents the advice provided by a Local.
type Answer struct {
    AnswerID string `json:"answer_id"`
    QueryID string `json:"query_id"`
    LocalID string `json:"local_id"`
    Content  string `json:"content"`
    Rating   float64 `json:"rating"` // Aggregated score
    CreatedAt time.Time `json:"created_at"`
    // Optional: Source citation/confirmation
}
```

### Summary of Go Implementation Best Practices

1.  **Context Handling:** All service and repository functions must accept `context.Context` to manage timeouts and cancellations effectively.
2.  **Error Handling:** Utilize custom error types (`ErrUnauthorized`, `ErrNotFound`, `ErrValidation`) instead of relying solely on basic `error` interfaces, allowing calling services to handle failure types explicitly.
3.  **Concurrency:** Use Go routines and channels for non-blocking background tasks (e.g., sending notifications when a query is answered).
4.  **Dependency Injection:** The `main` package should initialize and inject all repository interfaces into the service layer, ensuring easy testability.

*this content was created by AI, but the coding and underlying logic are not.*