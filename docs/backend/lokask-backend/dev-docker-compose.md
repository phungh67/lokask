[⬅ Return to Main Compendium](../../../README.md)

## System Architecture & Backend Service Specification (Lokask API)

As the senior backend officer, my focus is on defining a robust, high-performance, and maintainable structure for the core API layer. The current infrastructure defined by the `docker-compose.yaml` provides excellent segregation of concerns (PostGIS, Minio, Redis), allowing the Go backend to operate efficiently without complex local dependency management.

The backend logic will be structured using clean architecture principles, particularly emphasizing the **Repository Pattern** to decouple business logic from data access mechanisms.

---

### ⚙️ I. Core Backend Design Principles (Go Focus)

The Go backend (`lokask_api_dev`) will adhere to the following patterns:

1.  **Layered Architecture:**
    *   **`cmd/`**: Entry point (`main.go`). Initializes dependencies, middleware, and starts the HTTP server.
    *   **`internal/api/`**: Defines the API handlers and routes (the **Controller** layer). Handles incoming HTTP requests, validates input, and calls the appropriate service method.
    *   **`internal/service/`**: Contains the core business logic. This layer orchestrates multiple repository calls (e.g., "Create a Booking" requires validation, writing to DB, and generating a file in S3).
    *   **`internal/repository/`**: Implements the **Repository Pattern**. This layer is responsible solely for data persistence/retrieval (DB queries, cache commands, S3 SDK calls). *This is the only place that should know about `sql.DB`, `*redis.Client`, or `s3.Client`*.
    *   **`internal/domain/`**: Contains pure Go structs and interfaces (Models). Defines the canonical data structures for the application.

2.  **Concurrency:** Utilizing Go's goroutines and channels for asynchronous tasks where applicable (e.g., image processing, sending notifications) to maintain high API throughput.
3.  **Error Handling:** Standardized error types with clear context (e.g., `ErrNotFound`, `ErrUnauthorized`, `ErrValidationFailed`) to ensure the API layer can return accurate HTTP status codes.

---

### 💾 II. Data Access & Repository Pattern Implementation

The following defines the interfaces that the `service` layer will interact with, ensuring testability and portability.

#### 1. Spatial Database Repository (`PostgreSQL/PostGIS`)

*   **Purpose:** Primary persistent storage for structured data, geographical coordinates, and relationships.
*   **Technology:** `database/sql` package with a PostgreSQL driver (e.g., `pgx`).
*   **Endpoint:** `DB_HOST: db`, `DB_PORT: 5432`
*   **Core Interface:** `BookingRepository`

```go
// internal/repository/booking_repository.go

type BookingRepository interface {
    // GetBookingByID fetches core booking data, including spatial location.
    GetBookingByID(ctx context.Context, id string) (*domain.Booking, error)

    // CreateBooking persists a new booking, potentially including a geometry point.
    CreateBooking(ctx context.Context, booking *domain.Booking, geoPoint geometry.Point) (string, error)

    // UpdateBookingStatus updates the state of a booking.
    UpdateBookingStatus(ctx context.Context, id string, status string) error
    
    // FindNearbyBookings executes a spatial query (ST_DWithin) to find services near a location.
    FindNearbyBookings(ctx context.Context, point geometry.Point, distanceMeters float64) ([]*domain.Booking, error)
}
```

#### 2. Object Storage Repository (`Minio`)

*   **Purpose:** Handling unstructured binary data (e.g., user uploaded images, vehicle photos, report PDFs).
*   **Technology:** AWS SDK for Go (`aws-sdk-go-v2`) configured for S3 compatibility.
*   **Endpoint:** `MINIO_ENDPOINT: minio:9000`
*   **Core Interface:** `StorageRepository`

```go
// internal/repository/storage_repository.go

type StorageRepository interface {
    // UploadImage uploads a byte stream (e.g., an uploaded photo) and returns a permanent public URL.
    UploadImage(ctx context.Context, key string, data []byte) (string, error)

    // DeleteImage deletes an object from the storage bucket.
    DeleteImage(ctx context.Context, key string) error
}
```

#### 3. Caching Repository (`Redis`)

*   **Purpose:** Session management, rate limiting, storing frequently accessed, non-critical data (e.g., cached location lookups, computed availability slots).
*   **Technology:** `go-redis/redis/v8` package.
*   **Endpoint:** `REDIS_ADDR: redis:6379`
*   **Core Interface:** `CacheRepository`

```go
// internal/repository/cache_repository.go

type CacheRepository interface {
    // Get retrieves a value by key, and attempts to deserialize it into a provided type T.
    Get(ctx context.Context, key string, dest interface{}) error

    // Set stores a value with a specific Time-To-Live (TTL).
    Set(ctx context.Context, key string, value []byte, ttl time.Duration) error
}
```

---

### 🌐 III. API Surface Definition (Go Handlers & Routes)

The API will be a RESTful service, versioned to manage future changes.

**Base URL:** `http://localhost:8080/api/v1`

| Endpoint | HTTP Method | Description | Required Middleware | Input/Payload | Output |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `/auth/login` | `POST` | Authenticate user credentials. | RateLimiter, JWT | `{username, password}` | `{token, expires_in}` |
| `/bookings` | `POST` | Create a new booking record. | AuthGuard | `{details: Model, geo_point: Point, file: Image}` | `201 Created, {booking_id}` |
| `/bookings/{id}` | `GET` | Retrieve a single booking details. | AuthGuard | None | `200 OK, {BookingModel}` |
| `/bookings/nearby` | `GET` | Find available services near a specified point. | None | `?lat={float}&lng={float}&radius={float}` | `200 OK, [BookingModel]` |
| `/upload/image` | `POST` | Upload a photo file (e.g., for profile or booking evidence). | AuthGuard | `multipart/form-data` | `200 OK, {public_url}` |
| `/user/profile` | `GET` | Retrieve current user profile data. | AuthGuard | None | `200 OK, {UserModel}` |

### 🛠️ IV. Initialization and Startup Logic

The `main.go` (or equivalent startup logic) must handle the service initialization sequence gracefully, relying on dependency health checks:

1.  **Initialize Dependencies:**
    *   Connect to Redis (check connection pool).
    *   Connect to PostgreSQL (ensure transaction isolation and session handling).
    *   Initialize Minio client credentials (using environment variables).
2.  **Dependency Injection:** The application must construct and inject concrete implementations of the repository interfaces (`BookingRepository`, `StorageRepository`, `CacheRepository`) into the `Service` layer.
    *   *Example:* `service.NewBookingService(repoBook, repoCache, repoStorage)`
3.  **HTTP Router Setup:** Configure the HTTP router (e.g., Gorilla Mux, Chi) with middleware (Auth, Logging, Recovery).
4.  **Server Start:** Start the HTTP server on port 8080.

This systematic approach ensures that the business logic (`service` layer) is completely ignorant of whether the data is coming from SQL, Redis, or an HTTP call—it only knows about the **interfaces**.

***
*this content was created by AI, but the coding and underlying logic are not.*