[⬅ Return to Main Compendium](../../../../../README.md)

As a senior backend officer specializing in Go and backend architecture, I have documented the core logic, API surfaces, and data persistence patterns for the Booking system based on the provided interfaces.

---

## 🌐 Booking Service Module Documentation

### 1. Overview and Domain Model

The Booking service is responsible for managing the lifecycle of appointments between a `user` and a `consultant`. It handles scheduling, state transitions, pricing, and fetching enriched booking details.

#### 1.1. Data Structures (Go Representation)

We translate the provided types into canonical Go structs, ensuring proper JSON marshalling/unmarshalling and standard database column types.

**`ServiceType` Enumeration:**
```go
type ServiceType string
const (
	ChatOnly      ServiceType = "chat_only"
	VideoCall     ServiceType = "video_call"
	VoiceCall     ServiceType = "voice_call"
	ItineraryReview ServiceType = "itinerary_review"
)
```

**`BookingStatus` Enumeration:**
```go
type BookingStatus string
const (
	StatusPending    BookingStatus = "pending"
	StatusConfirmed  BookingStatus = "confirmed"
	StatusCompleted  BookingStatus = "completed"
	StatusCancelled  BookingStatus = "cancelled"
)
```

**`Booking` Entity (Read Model / DTO):**
This struct represents the full, joined `Booking` record that should be returned to the client.

```go
// Booking represents the complete, viewable record of a scheduled appointment.
type Booking struct {
	ID                string        `json:"id"`
	ConsultantID      string        `json:"consultant_id"`
	UserID            string        `json:"user_id"`
	
	// Scheduling Details (Stored as UTC ISO 8601 strings)
	StartTime         time.Time     `json:"start_time"` // Preferred: Use time.Time in Go
	EndTime           time.Time     `json:"end_time"`
	
	// Core Management Fields
	ServiceType       ServiceType   `json:"service_type"`
	Status            BookingStatus `json:"status"`
	TotalPrice       float64       `json:"total_price"`
	UserNotes         string        `json:"user_notes"`
	
	// Metadata
	CreatedAt         time.Time     `json:"created_at"`
	UpdatedAt         time.Time     `json:"updated_at"`

	// Enriched View Fields (Joined from other tables/services)
	TravellerName     string        `json:"traveller_name"`
	TravellerAvatar   string        `json:"traveller_avatar"`
	TravellerLocation string        `json:"traveller_location"`
	ConsultantName    string        `json:"consultant_name"`
	ConsultantAvatar  string        `json:"consultant_avatar"`
	ConsultantCity    string        `json:"consultant_city"`
}
```

**`CreateBookingRequest` (Write Model / Input):**
This struct is used for creating a new booking. Input validation is critical here.

```go
// CreateBookingRequest defines the minimum required data to schedule a booking.
type CreateBookingRequest struct {
	ConsultantID string    `json:"consultant_id" validate:"required"`
	StartTime    time.Time `json:"start_time" validate:"required"` // Input should be validated/parsed into time.Time
	ServiceType  ServiceType `json:"service_type" validate:"required"`
	UserNotes    string    `json:"user_notes"`
	TotalPrice  float64   `json:"total_price" validate:"required,gt=0"`
}
```

***

### 2. Service Layer Logic (Use Cases)

The primary interaction points are encapsulated within the `BookingService`.

#### 2.1. Core Workflow: `CreateBooking`

**Purpose:** Handles the business logic for initiating a new booking.

**Inputs:** `CreateBookingRequest`
**Outputs:** `Booking` entity (or an error).

**Logic Flow:**
1.  **Input Validation:** Validate `CreateBookingRequest` (e.g., checking if `start_time` is in the future, `total_price` is positive, and the `ServiceType` is valid).
2.  **Conflict Check (Crucial):** Call the `AvailabilityService` to verify that the `ConsultantID` is free between `start_time` and `end_time`. If unavailable, return a scheduling conflict error.
3.  **Persistence:** Create a new `Booking` record in the repository with `StatusPending`.
4.  **Enrichment/Retrieval:** After saving the core booking record, fetch associated, joined data (Consultant name, User profile details, etc.) to construct the final `Booking` DTO.
5.  **Finalization:** Return the constructed `Booking` object.

#### 2.2. Key Service Functions

| Function Signature | Description | Business Logic Handled |
| :--- | :--- | :--- |
| `Book(ctx context.Context, req CreateBookingRequest) (*Booking, error)` | Initiates the booking process. | Validation, Availability Check, Initial Save (Pending). |
| `UpdateStatus(ctx context.Context, id string, newStatus BookingStatus) (*Booking, error)` | Changes the booking status (e.g., Pending $\to$ Confirmed). | State Machine Logic: Must enforce valid transitions (e.g., cannot go directly from Cancelled $\to$ Completed). |
| `GetBookingDetails(ctx context.Context, id string) (*Booking, error)` | Retrieves all viewable details for a given booking ID. | Joining multiple data sources (Users, Consultants, Booking table) to enrich the view model. |

***

### 3. API Surface Definition (HTTP / Go Handlers)

We expose the functionality through a RESTful API following standard Go HTTP handler patterns.

**Base Path:** `/api/v1/bookings`

| Endpoint | HTTP Method | Request Body | Response Body | Description | Status Codes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `/` | `POST` | `CreateBookingRequest` | `Booking` | Creates a new booking instance. | 201 (Created), 400 (Validation), 409 (Conflict) |
| `/{id}` | `GET` | None | `Booking` | Retrieves all details for a specific booking. | 200 (OK), 404 (Not Found) |
| `/{id}/status` | `PATCH` | `{ "status": "confirmed" }` | `Booking` | Updates the status of an existing booking. | 200 (OK), 403 (Forbidden), 404 (Not Found) |

***

### 4. Repository Layer Pattern

The repository layer abstracts the data access logic, ensuring the business services never interact directly with SQL or ORM specifics.

#### 4.1. Interface Definition (Go)

We define the `BookingRepository` interface which dictates all necessary database interactions.

```go
// BookingRepository defines the interface for data access operations on the Booking entity.
type BookingRepository interface {
	// FindByID retrieves the core booking record and performs necessary joins to populate the full Booking DTO.
	FindByID(ctx context.Context, id string) (*Booking, error)

	// Create saves the core booking record. Used for the initial 'pending' state.
	Create(ctx context.Context, booking *Booking) error

	// UpdateStatus updates only the status and update timestamp.
	UpdateStatus(ctx context.Context, id string, status BookingStatus) error

	// IsBooked checks if the consultant is already booked during the requested time slot.
	// This is the critical conflict checking method.
	IsBooked(ctx context.Context, consultantID string, start, end time.Time) (bool, error)
}
```

#### 4.2. Implementation Notes (Go)

*   **Database Connection:** The implementation will utilize the `database/sql` package (or an ORM like GORM/sqlx) and must handle transaction isolation levels for write operations (especially `IsBooked` and `Create`).
*   **Time Handling:** All date/time operations must use `time.Time` in Go and should consistently treat all times as **UTC** to prevent timezone-related scheduling errors.
*   **Transaction Example:** The `Book` service logic should wrap the `IsBooked` check and the `Create` operation within a single database transaction to ensure atomicity.

---
*this content was created by AI, but the coding and underlying logic are not.*