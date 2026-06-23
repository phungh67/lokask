[⬅ Return to Main Compendium](../../../../../../../README.md)

As a senior backend officer specializing in Go and robust backend architecture, I have analyzed the `ScheduleCallDialog` component. The core backend logic resides in how the frontend prepares and sends the payload via the `createBooking` function.

The design of this system is solid, relying on a clear **Request-Response contract** defined by the payload structure. My documentation will focus on translating this contract into Go-native structures, service layers, and repository patterns, ensuring data integrity and transaction safety.

---

## 💻 Backend Architecture Documentation (Go Lang)

### 1. Core Data Model (Go Structs)

The following Go structs represent the database models and the API request payload structure.

#### 1.1 `BookingRequest` (API Input Payload)
This struct maps directly to the `payload: CreateBookingRequest` object in the frontend, serving as the input contract for our service layer.

```go
package models

import "time"

// BookingRequest represents the data required to schedule a consultation.
type BookingRequest struct {
    ConsultantID string    `json:"consultant_id"`
    StartTime    time.Time `json:"start_time"`
    ServiceType  string    `json:"service_type"` // e.g., "video_call" or "voice_call"
    UserNotes    *string   `json:"user_notes,omitempty"`
    TotalPrice   float64   `json:"total_price"`
}
```

#### 1.2 `Booking` (Database Entity)
This represents the persisted state in the database.

```go
package models

import (
    "time"
    "github.com/jinzhu/gorm" // Assuming GORM or similar ORM
)

// Booking models the scheduled appointment in the system.
type Booking struct {
    gorm.Model
    ConsultantID string    `gorm:"column:consultant_id;index"`
    StartTime    time.Time `gorm:"column:start_time;uniqueIndex"` // Key field for conflict checking
    ServiceType  string    `gorm:"column:service_type"`
    Notes        *string   `gorm:"column:user_notes"`
    TotalPrice   float64   `gorm:"column:total_price"`
    // Add status tracking (e.g., Confirmed, Cancelled, Completed)
}
```

### 2. API Service Surface (Go Handlers/Routes)

The endpoint must accept and validate the `BookingRequest`.

#### Endpoint: `POST /api/v1/bookings/schedule`

| Parameter | Type | Description | Example |
| :--- | :--- | :--- | :--- |
| `consultant_id` | `string` | ID of the consultant receiving the booking. | `"consultant-abc-123"` |
| `start_time` | `string` | ISO 8601 formatted start time (e.g., `2024-01-20T14:00:00Z`). | `time.Time` |
| `service_type` | `string` | The nature of the call. | `"video_call"` |
| `user_notes` | `string` | Optional notes from the user. | `"Follow up discussion."` |
| `total_price` | `float64` | Calculated final price. | `50.00` |

**Go Handler Signature (Conceptual):**

```go
// BookingsController handles incoming booking requests.
func BookingsController(c *gin.Context) {
    var req models.BookingRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        // Handle bad request JSON body
        c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request payload."})
        return
    }

    // Delegation to the business logic layer
    booking, err := bookingService.CreateBooking(c.MustGet("consultant_id"), &req)
    if err != nil {
        // Handle business logic failures (e.g., time conflict)
        c.JSON(http.StatusConflict, gin.H{"error": err.Error()})
        return
    }

    c.JSON(http.StatusCreated, gin.H{"message": "Booking confirmed", "booking": booking})
}
```

### 3. Backend Business Logic (Service Layer)

The `BookingService` is the core component, responsible for orchestrating validation and transactional guarantees.

```go
// bookingService.go
package service

import (
    "errors"
    "time"
    "github.com/your_project/models"
    "github.com/your_project/repository"
)

// CreateBooking validates and persists the booking record.
func (s *BookingService) CreateBooking(consultantID string, req *models.BookingRequest) (*models.Booking, error) {
    // --- 1. Input Validation ---
    if consultantID == "" {
        return nil, errors.New("consultant ID is required")
    }
    if req.StartTime.IsZero() {
        return nil, errors.New("start time cannot be empty")
    }
    // Add further validation (e.g., ServiceType must be valid)

    // --- 2. Business Constraint Validation (Crucial Step) ---
    // Check for overlapping bookings for the given consultant.
    // This uses the database's unique constraint or dedicated query.
    if err := s.isTimeSlotAvailable(consultantID, req.StartTime, req.ServiceType, 30); err != nil { // Assume a minimum duration check
        return nil, errors.New("this time slot is already booked or conflicts with existing appointments")
    }

    // --- 3. Transactional Persistence ---
    // Use a transaction block to ensure atomicity.
    // Either the booking is fully created, or none of it is.
    newBooking, err := s.repo.Create(models.Booking{
        ConsultantID: consultantID,
        StartTime:    req.StartTime,
        ServiceType:  req.ServiceType,
        Notes:        req.UserNotes,
        TotalPrice:   req.TotalPrice,
        // Model fields handle timestamps...
    })

    if err != nil {
        return nil, fmt.Errorf("failed to save booking: %w", err)
    }
    return newBooking, nil
}
```

### Key Technical Considerations & Improvements

1.  **Concurrency Control:** The check (`isAvailable`) and the write (`Create`) must be wrapped in a single database transaction. This prevents race conditions where two users book the same slot simultaneously.
2.  **Availability Check Logic (Advanced):** The current implementation relies on checking availability *before* saving. A more robust, transaction-safe method would be to check for overlapping time ranges:
    $$ \text{Overlap} \iff (T_A \le T_{Start} \text{ AND } T_{End} \ge T_{End}) \text{ OR } (T_A \ge T_{Start} \text{ AND } T_{End} \le T_{End}) $$
    *Where $T_A$ and $T_B$ are the start/end times of two bookings.*
3.  **Data Integrity:** The time slot used for booking should ideally be determined by the service, not just passed through the payload, to account for time zone conversion and buffer time.
4.  **Error Handling:** The frontend should expect specific HTTP error codes (e.g., `409 Conflict`) when the time slot is unavailable, rather than generic `500 Internal Server Error`.