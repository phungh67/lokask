
[⬅ Return to Main Compendium](../../README.md)

# 💾 Booking Repository Layer (`repository/booking.go`)

## Overview
The `BookingRepository` package serves as the data access layer for managing booking slots. It encapsulates all database operations related to creating, retrieving, updating, and deleting booking entries. It interacts directly with the PostgreSQL database (via `sqlx`) and is responsible for translating complex relational data structures (like joining users, consultants, and cities) into structured Go views (`ConsultantBookingView`, `UserBookingView`) for the application logic layer to consume.

**Domain Focus:** Booking Management, Appointment Scheduling.
**Key Components:** `BookingRepository` struct, SQL query execution methods.
**Dependencies:** `github.com/jmoiron/sqlx`, `github.com/google/uuid`, `asklocal/internal/domain`.

## Detail

### 🛠️ Data Structures (Views)
To handle specific use cases (viewing bookings for a consultant vs. viewing personal bookings), two custom views are used:

1.  **`ConsultantBookingView`**: Used when retrieving bookings for a consultant. It includes details about the *traveller* (the user who booked) and the consultant's city.
    *   *Fields:* `BookingEntry` (base data), `TravellerName`, `TravellerAvatar`, `TravellerLocation`, `ConsultantName`, `ConsultantAvatar`, `ConsultantCity`.
2.  **`UserBookingView`**: Used when retrieving personal bookings for a user. It includes details about the *consultant* (the service provider) and the consultant's city.
    *   *Fields:* `BookingEntry` (base data), `ConsultantName`, `ConsultantAvatar`, `CityName`.

### 🧱 Repository Implementation
The `BookingRepository` struct holds the `*sqlx.DB` connection pool.

*   **`NewBookingRepository(db *sqlx.DB) *BookingRepository`**: Constructor initializes the repository with the database connection.
*   **`CreateBookingTx(tx *sqlx.Tx, b *domain.BookingEntry) error`**: Handles the creation of a booking slot within an existing database transaction (`tx`). This ensures atomicity for booking creation.
*   **`GetConsultantBookings(ctx context.Context, consultantID uuid.UUID) ([]ConsultantBookingView, error)`**: Retrieves all bookings associated with a given `consultantID`. It performs joins across `bookings`, `users` (as travellers), `consultants`, and `cities`. **Query Optimization:** Filters strictly by `b.consultant_id = $1` and orders by `start_time` descending.
*   **`GetUserBookings(ctx context.Context, userID uuid.UUID) ([]UserBookingView, error)`**: Retrieves all bookings associated with a given `userID`. It performs joins across `bookings`, `consultants`, `users` (as consultants), and `cities`. **Query Optimization:** Filters strictly by `b.user_id = $1` and orders by `start_time` descending.
*   **`DeleteBooking(ctx context.Context, id uuid.UUID) error`**: Deletes a specific booking record by ID.
*   **`UpdateBookingStatus(ctx context.Context, id uuid.UUID, status string) error`**: Updates the status and automatically sets the `updated_at` timestamp for a booking ID.
*   **`IsBookingOwner(ctx context.Context, bookingID uuid.UUID, userID string) (bool, error)`**: A critical security method that verifies if the user ID matches the `user_id` of the consultant linked to the booking.

### 🔗 Relationships / Code Flow Links
| Component | Purpose | Related Module/Flow |
| :--- | :--- | :--- |
| `CreateBookingTx` | Creating a booking | Should be called within a service layer that handles business logic flow. |
| `GetConsultantBookings` | Listing bookings for a service provider | Consumers: `