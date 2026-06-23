[⬅ Return to Main Compendium](../../../README.md)

As a senior backend officer specializing in Go and robust backend architecture, I have analyzed the infrastructure setup. This configuration defines a highly reliable microservice architecture utilizing PostgreSQL with PostGIS for geospatial data, Redis for caching, and a dedicated API layer written in Go (assuming best practices for service implementation).

The primary focus must be on designing the backend to handle its dependencies cleanly, maintaining separation of concerns, and adhering to Go idioms.

Here is the detailed documentation of the anticipated core logic, API surfaces, and repository patterns for the `backend` service.

---

## ⚙️ Go Backend Architecture Documentation (`lokask_api`)

### 1. Architectural Principles

The backend service must strictly follow the layered architecture pattern (often modeled as HTTP Handlers $\rightarrow$ Service $\rightarrow$ Repository $\rightarrow$ Database). This ensures that business logic is isolated from HTTP transport details and data access details.

*   **Language:** Go (Golang)
*   **Database:** PostgreSQL/PostGIS
*   **Cache:** Redis
*   **Cloud:** AWS S3 (for media/avatars)

### 2. Data Persistence and Repository Pattern (The `repository` Layer)

The repository layer handles all direct interaction with external data sources (DB, Cache, S3). It acts as an abstract adapter, preventing business logic from knowing *how* the data is stored.

#### A. PostgreSQL Repository (`repo/user_repository.go`, `repo/spatial_repository.go`)

This layer must use a robust SQL builder package (like `sqlx` or a dedicated ORM/Query Builder, though direct `sqlx` usage is often preferred in high-performance Go backends).

**Key Design Considerations:**

1.  **Transaction Handling:** All multi-step operations (e.g., creating a user profile and associated location) must be wrapped in database transactions to ensure atomicity.
2.  **Geospatial Queries:** All location-based searches must leverage the `ST_DWithin` or similar PostGIS functions. The repository function signature should accept bounding boxes or coordinates and return results filtered by these spatial constraints.
3.  **Error Handling:** Map database errors (e.g., `pq.Error`) into custom, high-level application errors (e.g., `ErrNotFound`, `ErrConflict`).

**Example Signature (Spatial Search):**
```go
// repo/spatial_repository.go
func (r *SpatialRepository) SearchNearbyPoints(ctx context.Context, 
    coordinates [2]float64, radiusMeters float64, 
    query *SearchCriteria) ([]model.Location, error) 
// Implementation detail: Translates coordinates/radius into ST_DWithin SQL clause.
```

#### B. Redis Repository (`repo/cache_repository.go`)

This layer handles caching logic, primarily for read-heavy, non-critical data (e.g., listing services, popular search results, user tokens).

**Cache Strategy:** Cache-Aside Pattern.
1. Check cache first.
2. If hit, return data.
3. If miss, query database $\rightarrow$ write data to cache $\rightarrow$ return data.

**Key Functions:**
```go
// repo/cache_repository.go
func (r *CacheRepository) Get(ctx context.Context, key string, dest interface{}) error
func (r *CacheRepository) Set(ctx context.Context, key string, value []byte, expiration time.Duration) error
```

#### C. Cloud Storage Repository (`repo/storage_repository.go`)

Handles external asset management (avatars, media files). This logic should be isolated to manage AWS credentials and bucket interactions.

**Key Functions:**
```go
// repo/storage_repository.go
func (r *StorageRepository) UploadFile(ctx context.Context, localFilePath string, remoteKey string, mimeType string) (string, error)
func (r *StorageRepository) GetSignedURL(ctx context.Context, objectKey string, expires time.Duration) (string, error)
```

### 3. Business Logic Layer (The `service` Layer)

This layer contains the core business rules. It orchestrates multiple repositories and dictates the workflow. **Services should never talk to the HTTP layer; they only talk to Repositories.**

#### Example: Location Service (`service/location_service.go`)

This service coordinates the complex process of generating a location listing.

**Core Logic Flow:**
1. Receive search criteria (user input).
2. **Cache Check:** Attempt to retrieve results from Redis based on the criteria hash.
3. **Cache Miss:**
    a. Call `SpatialRepository.SearchNearbyPoints` to fetch raw location data.
    b. Call `UserRepository` to enrich the results with user profile information.
    c. Call `StorageRepository` to generate temporary secure URLs for attached media.
    d. Combine and transform the data into a clean `model.LocationDetail` structure.
    e. **Cache Write:** Store the finalized result set back into Redis.
4. Return the structured results.

### 4. API Surface Definition (The `handler` Layer)

The handler layer is the entry point (the HTTP controller). Its job is minimal: validate incoming requests, convert them into service-layer input models, call the service, and format the outgoing response.

**Goal:** Keep handlers thin and focused on HTTP concerns (status codes, request body parsing).

| Endpoint | HTTP Method | Service Method Called | Description | Request Body Expects | Response Body Returns |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `/api/v1/locations/search` | `GET` | `LocationService.Search` | Finds points of interest based on coordinates and radius. | Query Params: `lat`, `lon`, `radius` | `[]model.LocationDetail` |
| `/api/v1/users` | `POST` | `UserService.CreateUser` | Registers a new user. | `UserRegistrationRequest` | `model.User` |
| `/api/v1/media/upload` | `POST` | `StorageService.HandleUpload` | Uploads and processes media (e.g., user avatar). | `MultipartForm` (file) | `{ success: bool, url: string }` |
| `/api/v1/profiles/{id}` | `GET` | `ProfileService.GetProfile` | Fetches a specific user profile, checking cache first. | None | `model.UserProfile` |
| `/api/v1/auth/login` | `POST` | `AuthService.Authenticate` | Validates credentials and returns a JWT token. | `{ email, password }` | `{ token: string }` |

### 5. Configuration and Dependency Management

All configuration must be loaded from environment variables (via Go's `os` package or a dedicated library like Viper).

| Configuration Key | Purpose | Dependency | Usage Context |
| :--- | :--- | :--- | :--- |
| `DB_HOST`, `DB_USER`, etc. | Database connection parameters. | `db` service | `Repository` Layer initialization. |
| `REDIS_ADDR` | Cache server address. | `redis` service | `CacheRepository` initialization. |
| `AWS_DEFAULT_REGION` | AWS region fallback. | AWS S3 | `StorageRepository` initialization. |
| `MAIL_API_KEY` | Credentials for transactional email. | External SMTP Service | `UserService` (for password resets, confirmations). |
| `DEPLOYMENT_MODE` | Determines if internal (local) or external (S3/Cloud) APIs are used. | Internal Logic | Service-level conditional logic. |

**Go Implementation Note:** Use the `context.Context` throughout every function signature (`service`, `repository`, `handler`) to manage request timeouts, tracing spans, and cancellation signals cleanly, which is essential for robust microservices.

---
*this content was created by AI, but the coding and underlying logic are not.*