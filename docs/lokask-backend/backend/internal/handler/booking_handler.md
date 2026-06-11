
[⬅ Return to Main Compendium](../../README.md)

# 📅 Booking Handler Module (`handler/booking`)

## 📄 Overview

This module, housed within the `handler` package, is responsible for implementing the API logic related to user bookings and consultant schedules. It acts as the primary entry point (handler layer) for all booking-related HTTP requests, orchestrating interactions between the HTTP request context (`fiber.Ctx`), business domain logic, and data repositories.

The handlers manage core functionalities such as creating new bookings, retrieving personal schedules, viewing public consultant schedules, and updating booking statuses. Robust validation and transaction management are key features implemented here.

### 🚀 Key Features

*   **Transaction Safety:** Utilizes database transactions (`sqlx.DB.BeginTxx`) for critical operations like booking creation to ensure atomicity.
*   **Authorization Checks:** Implements checks to ensure users can only access/modify resources they own (e.g., `GetMySchedule`, `UpdateStatus`).
*   **Business Rule Enforcement:** Includes logic to prevent self-booking and handles time conflict detection (e.g., PostgreSQL overlap constraint check).
*   **Multi-View Support:** Provides separate endpoints for a logged-in user viewing their own schedule vs. public viewing of a consultant's available times.

---

## 🔎 Detail Analysis

### 🧩 Struct and Initialization

The core structure is `BookingHandler`, which holds necessary dependencies:

```go
type BookingHandler struct {
	BookingRepo    *repository.BookingRepository // Handles booking persistence logic
	Consultantrepo *repository.ConsultantRepository // Handles consultant profile lookups
	DB             *sqlx.DB // Direct database connection for transactions
}

func NewBookingHandler(bRepo *repository.BookingRepository, cRepo *repository.ConsultantRepository, db *sqlx.DB) *BookingHandler {
	// ... initialization logic ...
}
```

### ⚙️ Endpoint Implementations

#### 1. `CreateBooking(c *fiber.Ctx)` (POST /bookings)

This endpoint handles the creation of a new booking record.

**Flow Logic:**
1.  **Auth Context Retrieval:** Extracts `user_id` (traveler ID) from `c.Locals("user_id")`.
2.  **Validation:** Parses the request body (`domain.CreateBookingRequest`).
3.  **Pre-Check (Consultant Existence):** Verifies the target consultant ID exists using `Consultantrepo.GetProfileByID`.
4.  **Business Rule Check:** Ensures the booking user is not the consultant themselves (`profile.UserID != travelerID`).
5.  **Time Validation:** Parses and validates the start time using `time.RFC3339`. Calculates end time (currently hardcoded +60 mins).
6.  **Transaction:** Starts a database transaction (`h.DB.BeginTxx`).
7.  **Persistence:** Calls `BookingRepo.CreateBookingTx`.
8.  **Conflict Handling:** Specifically checks for the PostgreSQL `exclude_overlapping_bookings` error string to return a `409 Conflict`.
9.  **Completion:** Commits the transaction and returns the created booking object (`201 Created`).

#### 2. `GetMySchedule(c *fiber.Ctx)` (GET /consultant/{id}/schedule)

Retrieves the schedule specifically for the logged-in user viewing *their own* service provider's availability.

**Authorization:**
*   Requires the calling user to be the consultant whose schedule is being viewed. A check ensures `profile.UserID == loggedInUserUUID`. If not, returns `403 Forbidden`.
*   If authorized, calls `BookingRepo.GetConsultantBookings`.

#### 3. `PublicGetConsultantSchedule(c *fiber.Ctx)` (GET /consultant/{id}/schedule/public)

Retrieves the consultant's public schedule.

**Authorization:**
*   This endpoint intentionally skips logged-in user checks as it is designed for third-party viewing.
*   Calls `BookingRepo.GetConsultantBookings`.

#### 4. `GetUserTrips(c *fiber.Ctx)` (GET /user/trips)

Retrieves all bookings associated with the currently logged-in user (traveler).

**Security:**
*   Relies solely on `user_id` from the middleware context.
*   Calls `BookingRepo.GetUserBookings`.

#### 5. `DeleteBooking(c *fiber.Ctx)` (DELETE /booking/{id})

Deletes a specified booking record.

**Security/State:**
*   The ownership check is currently commented out (`// TODO: checking`).
*   Calls `BookingRepo.DeleteBooking`.

#### 6. `UpdateStatus(c *fiber.Ctx)` (PATCH /booking/{id}/status)

Updates the lifecycle status of a booking (e.g., pending $\to$ confirmed).

**Authorization Flow:**
1.  **ID Validation:** Parses the booking ID.
2.  **Ownership Check:** Crucial step: `BookingRepo.IsBookingOwner` verifies if the user making the request owns the booking. If not, returns `403 Forbidden`.
3.  **Status Validation:** Ensures the submitted status is one of the allowed values ("confirmed", "cancelled", "pending").
4.  **Update:** Calls `BookingRepo.UpdateBookingStatus`.

---

## 📝 Note for Development

*   **Time Handling:** The current implementation for `CreateBooking` hardcodes the duration to 60 minutes: `endTime := startTime.Add(60 * time.Minute)`. This should ideally be configurable or extracted from the request body (`CreateBookingRequest`).
*   **Ownership Context:** The `UpdateStatus` handler correctly utilizes middleware data (`c.Locals("user_id")`) combined with `BookingRepo.IsBookingOwner` to enforce state transitions and prevent unauthorized changes.
*   **`GetMySchedule` Scope:** The check `if profile.UserID != loggedInUserUUID` in `GetMySchedule` suggests that this endpoint is meant for the consultant to view their *own* schedule, not the traveler's. Clarifying this documentation is necessary.

---

## ⚠️ Warning & Technical Debt (Tech Debt)

1.  **Missing Booking Ownership Check (`DeleteBooking`):** The deletion handler currently lacks explicit authorization logic (`// TODO: checking`). It must verify that the `user_id` context belongs to the owner of the booking ID before executing the deletion.
2.  **Inconsistent API Design:** The middleware context usage for `user_id` and the parameter extraction for `id` (booking/consultant ID) needs clear standardization.
3.  **API Response Consistency:** When returning errors, some endpoints use `fiber.Status...` but the success response structure could be standardized across all handlers.
4.  **Timezone Management:** The current time handling relies on the client or server context. Explicit use of a standardized timezone library (like `time.Time` with location) is recommended to prevent future bugs.

---
### 📋 Summary of Dependencies and Interactions

| Component | Responsibility | Dependency/Call | Key Concept |
| :--- | :--- | :--- | :--- |
| `Handler` (API Layer) | Routing, Request Validation | `Service` layer | HTTP Request/Response |
| `Service` Layer | Business Logic Execution | `Repository` layer | Transaction Management |
| `Repository` Layer | Data Access, Persistence | Database Driver (e.g., SQL) | ACID Properties |
| **Middleware** | Authentication/Context Setting | JWT/Session Manager | Security Context |