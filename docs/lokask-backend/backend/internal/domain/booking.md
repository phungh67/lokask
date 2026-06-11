```markdown
[⬅ Return to Main Compendium](../../README.md)

# 🗓️ Booking Domain Models (`domain/booking.go`)

This module defines the core data structures (domain models) used throughout the application for handling booking entries and requests. It separates the internal representation of data (the database model) from the external API payloads.

## 🔬 Overview

This file encapsulates the primary business entities: `BookingEntry` (the authoritative record stored in the database) and `CreateBookingRequest` (the payload received when a user initiates a new booking). Adherence to these models ensures data consistency across services, database interactions, and API boundaries.

### Code Snippet Reference

```go
package domain

import "time"

type BookingEntry struct {
	// ... fields
}

type CreateBookingRequest struct {
	// ... fields
}
```

---

## 🧩 Detailed Analysis

### 1. `BookingEntry` (Domain/Database Model)

This struct represents a single, comprehensive record of a booking within the system. It includes management metadata and all core booking details.

| Field | Type | Purpose | Constraints/Tags |
| :--- | :--- | :--- | :--- |
| `ID` | `string` | Unique identifier for the booking. | `db:"id"`, `json:"id"` |
| `ConsultantID` | `string` | ID of the consultant/provider booked. | `db:"consultant_id"`, `json:"consultant_id"` |
| `UserID` | `string` | ID of the user making the booking. | `db:"user_id"`, `json:"user_id"` |
| `StartTime` | `time.Time` | Scheduled start time of the service. | `db:"start_time"`, `json:"start_time"` |
| `EndTime` | `time.Time` | Scheduled end time of the service. | `db:"end_time"`, `json:"end_time"` |
| `ServiceType` | `string` | The nature of the service (e.g., 'video_call', 'in_person'). | `db:"service_type"`, `json:"service_type"` |
| `Status` | `string` | Current lifecycle status of the booking. | `db:"status"`, **Must be** `pending`, `confirmed`, `cancelled`. |
| `TotalPrice` | `float64` | The total monetary cost of the booking. | `db:"total_price"`, `json:"total_price"` |
| `UserNotes` | `string` | Any specific notes provided by the user. | `db:"user_notes"`, `json:"user_notes"` |
| `CreatedAt` | `time.Time` | Timestamp when the record was created. | `db:"created_at"`, `json:"created_at"` |
| `UpdatedAt` | `time.Time` | Timestamp of the last record modification. | `db:"updated_at"`, `json:"updated_at"` |

### 2. `CreateBookingRequest` (API Input Model)

This struct defines the expected payload when a client submits a request to create a new booking. It is designed to be consumed by the API layer (e.g., `handler/booking.go`).

| Field | Type | Purpose | Conversion Notes |
| :--- | :--- | :--- | :--- |
| `ConsultantID` | `string` | ID of the desired consultant. | Direct mapping. |
| `StartTime` | `string` | Start time provided by the frontend. | **Crucial:** Received as an ISO formatted string (`json:"start_time"`), must be parsed into `time.Time` internally. |
| `ServiceType` | `string` | Type of service. | Direct mapping. |
| `UserNotes` | `string` | Notes for the booking. | Direct mapping. |
| `TotalPrice` | `float64` | Calculated total price. | Direct mapping. |

---

## 📝 Notes and Best Practices

1. **Time Handling:** The input model (`CreateBookingRequest`) receives `StartTime` as a string. **All business logic layers must immediately parse this string into a `time.Time` object and validate it for proper time zones.** Relying on string passing across service boundaries is highly discouraged.
2. **Status Flow:** The `Status` field dictates the booking's lifecycle. A dedicated state machine service or layer should enforce transitions (e.g., `pending` -> `confirmed` -> `completed` or `cancelled`).
3. **Data Source:** When performing write operations (Create/Update), the internal service layer should be responsible for automatically populating `CreatedAt`, `UpdatedAt`, and potentially deriving the `EndTime` from the input `StartTime` and `ServiceType`.

---

## ⚠️ Warnings & Technical Debt

*   **Timezone Management (CRITICAL):** The current definition lacks explicit time zone handling. When parsing `StartTime` from a string (e.g., "2024-10-25T10:00:00Z"), ensure that the time parsed into `time.Time` is treated as UTC or explicitly localized to the relevant time zone (local time of the consultant/user). **Failure to handle this correctly will lead to booking conflicts and scheduling failures.**
*   **Input Validation:** The `CreateBookingRequest` currently lacks validation rules (e.g., required fields, valid date ranges, total price > 0). A dedicated validation middleware or validation service call should be mandatory before processing the request.
*   **Field Redundancy/Derivation:** The `EndTime` field is often derivable from `StartTime` and `ServiceType` (duration). Consider whether the API should require `EndTime` or if the service should calculate it automatically, reducing input risk.

---

## 🔗 Related Components & Logic Flow

| Component | Link | Description |
| :--- | :--- | :--- |
| **API Handling** | [../handler/booking_handler.go](./../handler/booking_handler.go) | Handles the incoming HTTP requests and marshals JSON into `CreateBookingRequest`. |
| **Business Logic** | [../service/booking_service.go](./../service/booking_service.go) | Contains the core logic for checking availability, calculating pricing, and managing status transitions. **This service must consume the `domain.BookingEntry` for persistence.** |
| **Database Layer** | [../repository/booking_repository.go](./../repository/booking_repository.go) | Handles all database interactions (CRUD operations) using `BookingEntry` as the primary object. |
| **Validation Middleware**| [../middleware/validator.go](./../middleware/validator.go) | Should intercept requests before they reach the service layer to validate fields of `CreateBookingRequest`. |

### Figure: Booking Lifecycle Flow (Conceptual)

*(Conceptual Diagram: The diagram should illustrate the flow: Request -> Handler -> Validator -> Service -> Repository -> Database. The critical data flow points are marked.)*

**[Conceptual Figure: Booking Flow Diagram]**
*Self-Generated Figure Note: A flow chart should be inserted here illustrating the request flow. The input (JSON) should map to `CreateBookingRequest` and subsequently be validated and transformed into the internal `BookingEntry` object before persisting to the database.*
```