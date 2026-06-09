# `handler/booking_handler.go` - Booking Service Handler

## 📚 Overview

This module provides the `BookingHandler`, which encapsulates all business logic and API endpoints related to managing user bookings (appointments, service schedules). It acts as the service layer interface for the booking functionality, interacting with the database via dedicated repositories (`BookingRepository`, `ConsultantRepository`).

The handler manages key operations such as creating new bookings, retrieving schedules (for both the user and the consultant), deleting bookings, and updating the booking status. It enforces critical business rules like ownership checks, overlap detection, and time format validation.

### 📐 Knowledge Base Areas Covered

*   System Design: Service Layer Implementation, Transaction Management (ACID).
*   Infrastructure: HTTP Request Handling (`fiber`), Database Interaction (`sqlx`).
*   Security: Authorization (Ownership checks, Role-based access control).

## 🔍 Detail Analysis

### 🛠️ Handler Structure

The `BookingHandler` struct holds dependencies required for booking operations:

```go
type BookingHandler struct {
	BookingRepo    *repository.BookingRepository
	Consultantrepo *repository.ConsultantRepository
	DB             *sqlx.DB // Used for starting database transactions
}
```

### 🚀 Endpoint Breakdown

#### 1. `CreateBooking(c *fiber.Ctx)`
*   **Purpose:** Allows a user (traveler) to book a service slot with a specific consultant.
*   **Flow:**
    1.  Extracts `travelerID` from `c.Locals("user_id")`.
    2.  Parses booking request details (including `ConsultantID`, `StartTime`, `TotalPrice`).
    3.  **Validation:**
        *   Checks if the provided `ConsultantID` exists.
        *   Checks if the traveler is attempting to book their own service (`User cannot book own service`).
        *   Validates `StartTime` format (must be ISO8601/RFC3339).
        *   Calculates `EndTime` (currently hardcoded to 60 minutes later for testing).
    4.  **Transaction:** Starts a database transaction (`DB.BeginTxx`).
    5.  Calls `BookingRepo.CreateBookingTx`:
        *   Handles database overlap constraint errors (PostgreSQL GiST) by returning a `409 Conflict`.
    6.  Commits the transaction upon success.
*   **Success Response:** `201 Created` with the created booking details.

#### 2. `GetMySchedule(c *fiber.Ctx)` (Consultant View)
*   **Purpose:** Allows a consultant to view their own scheduled bookings.
*   **Security:** Enforces strict ownership checking. It verifies that the authenticated user (`c.Locals("user_id")`) matches the `ConsultantID` provided in the path parameters.
*   **Flow:**
    1.  Retrieves `ConsultantID` from path parameters.
    2.  Retrieves the consultant's profile to verify identity.
    3.  **Authorization Check:** Compares `profile.UserID` with the logged-in user's ID. If they don't match, returns `403 Forbidden`.
    4.  Fetches all bookings associated with the `ConsultantID`.

#### 3. `PublicGetConsultantSchedule(c *fiber.Ctx)` (Public View)
*   **Purpose:** Allows any external user (not logged in as the consultant) to view a consultant's public schedule.
*   **Security:** Skips strict logged-in user checks, relying solely on the `ConsultantID` in the path.
*   **Note:** Currently, it retrieves *all* bookings, regardless of status.

#### 4. `GetUserTrips(c *fiber.Ctx)` (Traveler View)
*   **Purpose:** Allows a user (traveler) to view all bookings associated with their account.
*   **Flow:**
    1.  Retrieves `userID` from `c.Locals("user_id")`.
    2.  Fetches all bookings belonging to this `userID`.

#### 5. `DeleteBooking(c *fiber.Ctx)`
*   **Purpose:** Deletes a booking record by ID.
*   **Security:** Currently lacks comprehensive ownership checking on the client side, relying on the repository layer (though a check might be needed).
*   **Flow:** Calls `BookingRepo.DeleteBooking`.
*   **Success Response:** `204 No Content`.

#### 6. `UpdateStatus(c *fiber.Ctx)`
*   **Purpose:** Updates the status of a booking (e.g., pending $\rightarrow$ confirmed $\rightarrow$ cancelled).
*   **Security:** **Strict Ownership Check.** The handler first verifies if the authenticated user (`c.Locals("user_id")`) is the owner of the booking ID provided.
*   **Validation:** Validates the incoming status string (must be "confirmed", "cancelled", or "pending").
*   **Flow:** Calls `BookingRepo.UpdateBookingStatus`.

### 🏗️ Data Structures & Types

| Variable/Struct | Type | Source | Purpose |
| :--- | :--- | :--- | :--- |
| `c` | `*fiber.Ctx` | Fiber | HTTP Context containing request, parameters, and context locals. |
| `domain.CreateBookingRequest` | Struct | Domain | Payload for creating a booking (contains `ConsultantID`, `StartTime`, etc.). |
| `uuid.UUID` | Primitive | UUID library | Used for reliable identification of users and consultants. |
| `sqlx.Tx` | Interface | SQLX | Database transaction object ensuring atomic operations. |

## 📝 Note (Improvements and Best Practices)

1.  **Consultant Timezone Handling:** The current booking logic uses hardcoded `time.RFC3339` parsing and calculation (`endTime := startTime.Add(60 * time.Minute)`). For a production system, time calculations should use timezone-aware libraries (e.g., `time.Time` with specific zone context) to prevent ambiguity across different geographical locations.
2.  **Service Duration Abstraction:** The hardcoded 60-minute duration should be derived from the `ServiceType` or specified in the request payload to make the booking logic dynamic.
3.  **Robust Error Context:** When checking ownership (`UpdateStatus`), consider passing the necessary roles/permissions to the handler. Currently, it only checks if the user *is* the owner, but business logic might require confirming who is allowed to change the status (e.g., only the consultant can cancel/confirm).
4.  **Data Model Consistency:** The `DeleteBooking` function is missing clear ownership checks, which should be added to prevent unauthorized deletion of records.

## ⚠️ Warning (Incomplete/Potential Issues)

1.  **TODO in `PublicGetConsultantSchedule`:** The comment `@TODO: only show confirmed bookings (front-end side)` indicates that the current implementation fetches *all* bookings. The repository layer or the handler itself should filter bookings to only show available or confirmed slots to prevent exposing unnecessary data.
2.  **Weak Type Assertions in `GetMySchedule`:** The code uses `c.Locals("user_id").(string)`. If the middleware fails to set `user_id` in the context, this will cause a runtime panic. Robust code should use `c.Locals("user_id").(string)` wrapped in a check or `c.Locals("user_id").(string)` with a type assertion check.
3.  **Missing Input Validation (Depth):** While basic JSON parsing is used, there is no comprehensive input validation (e.g., ensuring `TotalPrice` is positive, `UserNotes` length limits).
4.  **Error Handling:** The handlers assume database and external service calls succeed. Robust error handling (e.g., transaction rollback, specific HTTP error codes for resource not found, validation failure) is required.