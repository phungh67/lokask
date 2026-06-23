[⬅ Return to Main Compendium](../../../../../../README.md)

As a senior backend officer specializing in Go and robust API design, my focus must be on analyzing the data contract, the efficiency of the data retrieval mechanism, and ensuring the underlying API (`getPublicConsultantBookings`) is performant, scalable, and testable.

The provided component, `ConsultantScheduleSidebar`, is the consumer. Its stability and performance hinge entirely on the implementation of `getPublicConsultantBookings`.

Here is the core logic documentation, API surface analysis, and suggested repository improvements.

---

### 🛡️ System Component: `ConsultantScheduleSidebar`
**Purpose:** Displays a consultant's public schedule, derived from confirmed bookings, allowing the user to visualize availability and select a booking date.
**Core Logic Dependency:** The ability to fetch and filter a consultant's booking data by ID.

### 💾 Data Model Definition (Go Structs/Backend Types)

We must standardize the structures used for communication between the client and the service layer.

```go
// booking.go
package types

import "time"

// Status defines the current state of a booking.
type Status string

const (
    StatusConfirmed Status = "confirmed"
    StatusPending   Status = "pending"
    StatusCanceled  Status = "canceled"
)

// Booking represents a single scheduled appointment.
type Booking struct {
    ID              string    `json:"id"`
    ConsultantID    string    `json:"consultant_id"`
    ConsultantName  string    `json:"consultant_name"`
    StartDate       time.Time `json:"start_date"` // Should be standardized to UTC for backend storage
    EndDate         time.Time `json:"end_date"`   // Should be standardized to UTC for backend storage
    DurationMinutes int       `json:"duration_minutes"`
    Status          Status    `json:"status"`
    
    // Fields that require careful access control/privacy masking
    TravellerName   string    `json:"traveller_name"` // Client-facing data (requires masking)
    Notes           string    `json:"notes"`          // Private/sensitive data
    
    // Utility fields (optional, but helpful)
    BookingReference string  `json:"booking_reference"`
}

// ScheduleResponse defines the complete data payload structure.
// Using a structured response is better practice than returning raw []Booking.
type ScheduleResponse struct {
    Bookings []Booking `json:"bookings"`
    Count    int       `json:"count"`
    // Pagination metadata could be added here if the list grows large
}
```

### 🚀 API Surface Contract: `getPublicConsultantBookings`

The frontend currently fetches all public bookings for a given consultant ID. This pattern is highly inefficient for a production system, especially if the consultant has thousands of bookings.

**Current Contract (Inadequate):**
```
GET /api/v1/consultants/{consultantId}/schedule
// Body: None
// Response: []Booking
```

**Recommended Robust Contract (Backend Improvement):**
The API must be scoped by **time range**, not just by ID. This shifts the load from iterating through all historical records to efficient database querying.

**Optimized Endpoint:**
```
GET /api/v1/consultants/{consultantId}/schedule
```

**Query Parameters (Critical Additions):**
| Parameter | Type | Required | Description | Example |
| :--- | :--- | :--- | :--- | :--- |
| `start` | `date-time` | Yes | The beginning of the desired date range (inclusive). | `2024-06-01T00:00:00Z` |
| `end` | `date-time` | Yes | The end of the desired date range (inclusive). | `2024-06-30T23:59:59Z` |
| `limit` | `int` | No | Max number of results to return (for pagination/safety). | `100` |

**Optimized Response Body:**
```json
{
    "bookings": [
        // Array of Bookings, filtered and masked per the business rule
    ],
    "total_available_slots": 15 // New field to help client rendering
}
```

### 📐 Implementation Logic & Backend Recommendations (Go Focus)

#### 1. Repository/Service Layer Logic (`getPublicConsultantBookings`)

This function should sit within a dedicated service layer (e.g., `booking_service.go`) that interacts with the repository.

**Key Logic Flow:**
1. **Validation:** Check if `consultantId`, `start`, and `end` parameters are present and valid. If not, return a `400 Bad Request`.
2. **Database Query:** Query the `bookings` table using `WHERE consultant_id = ? AND start_date BETWEEN ? AND ?`.
3. **Business Rule Enforcement (Critical):** Apply the privacy masking and filtering *at the database or service layer*, not the client layer.
    *   Filter by `Status = Confirmed`.
    *   For all returned records, overwrite/nullify fields like `traveller_name` and `notes` before serialization. This prevents accidental data leaks.
4. **Timezone Management:** All time fields must be handled as **UTC** in the database. The Go service should convert the received UTC timestamps into the desired local time format for the client, but the source data must remain UTC.

**Suggested Go Function Signature:**
```go
// GetPublicSchedule fetches filtered and masked bookings for a consultant within a given range.
// Parameters:
//   consultantID string
//   startTime    time.Time // UTC
//   endTime      time.Time // UTC
func GetPublicSchedule(consultantID string, startTime time.Time, endTime time.Time) ([]types.Booking, error) {
    // 1. Execute DB query using GORM or SQL package
    // 2. Iterate results and apply masking
    // 3. Return []types.Booking
}
```

#### 2. Frontend/Client Interaction Improvement

The current client-side state management fetches *all* bookings regardless of the selected date, which is inefficient if the dataset grows.

**Recommendation:**
1. **State Update:** The `useEffect` dependency should incorporate the `selectedDate` state.
2. **Date Range Calculation:** When `selectedDate` changes, the client should calculate the start and end of that day (00:00:00 to 23:59:59) and pass these boundaries to the API call.
3. **API Call:** The API call should use the optimized, ranged endpoint defined above.

### Summary of Improvements

| Aspect | Current Implementation (Weakness) | Backend Recommendation (Improvement) |
| :--- | :--- | :--- |
| **Data Retrieval** | Fetches all historical bookings (`getPublicConsultantBookings(id)`). | Implement **Range-based fetching** (`start`/`end` query parameters). |
| **Efficiency** | N+1 query risk; poor scalability. | Limit database scope using `WHERE start_date BETWEEN ? AND ?`. |
| **Security/Privacy** | Masking happens client-side (React filter). | Masking (setting `traveller_name` to "Busy") must happen **server-side** before JSON serialization. |
| **Time Handling** | Implicitly local time. | Enforce **UTC** as the canonical storage and transfer format. |

*this content was created by AI, but the coding and underlying logic are not.*