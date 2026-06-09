# 💾 Booking Repository Documentation

This repository layer handles all database interactions related to booking slots, adhering to the Repository pattern to decouple the business logic from the data persistence details. It is primarily responsible for CRUD operations and complex data retrieval for booking management.

## 📖 Overview

The `BookingRepository` is the Data Access Layer (DAL) for managing `Booking` entries. It utilizes `sqlx` for interacting with a PostgreSQL/SQL database backend. The repository provides specialized functions to retrieve booking data tailored to whether the user is viewing bookings *as a consultant* or *as a regular user*. It also includes crucial methods for transaction management, status updates, and enforcing data ownership checks.

### 📂 Key Components

*   **`BookingRepository`**: The main struct holding the database connection (`*sqlx.DB`).
*   **`ConsultantBookingView`**: A specialized database view/struct used when fetching bookings from the perspective of a **Consultant**.
*   **`UserBookingView`**: A specialized database view/struct used when fetching bookings from the perspective of a **User**.
*   **Methods**: Operations for creating, retrieving, deleting, updating status, and validating ownership.

## 🛠 Detail

### 1. Data Structures (Views)

These structs are specialized mapping views designed to pull necessary, denormalized data from multiple joined tables (`users`, `consultants`, `cities`) into cohesive structures for the calling service layer.

#### `ConsultantBookingView`
Used to retrieve bookings associated with a specific `Consultant`.

| Field | Type | Source | Description |
| :--- | :--- | :--- | :--- |
| `domain.BookingEntry` | Embedding | `bookings` table | Core booking details (ID, times, price, etc.). |
| `TravellerName` | `string` | `users` (User) | Full name of the user who booked the slot. |
| `TravellerAvatar` | `*string` | `users` (User) | Avatar URL of the user who booked the slot. |
| `TravellerLocation` | `string` | `users` (User) | Location of the user who booked the slot. |
| `ConsultantName` | `*string` | `consultants` | Name of the consultant receiving the booking (derived from joins). |
| `ConsultantAvatar` | `*string` | `consultants` | Avatar URL of the consultant. |
| `ConsultantCity` | `string` | `cities` | City name of the consultant. |

#### `UserBookingView`
Used to retrieve bookings associated with a specific `User` (Client).

| Field | Type | Source | Description |
| :--- | :--- | :--- | :--- |
| `domain.BookingEntry` | Embedding | `bookings` table | Core booking details. |
| `ConsultantName` | `string` | `consultants` | Full name of the consultant. |
| `ConsultantAvatar` | `string` | `consultants` | Avatar URL of the consultant. |
| `CityName` | `string` | `cities` | City name of the consultant. |

### 2. Core Functionality

#### `CreateBookingTx(tx *sqlx.Tx, b *domain.BookingEntry)`
*   **Purpose**: Creates a new booking record within an existing database transaction.
*   **Mechanism**: Executes a parameterized `INSERT` statement. It uses `RETURNING` clauses to immediately fetch the generated `id`, initial `status`, and timestamps (`created_at`, `updated_at`) back into the `BookingEntry` object (`b`).
*   **Usage**: Must be called with an active `sqlx.Tx` context.

#### `GetConsultantBookings(ctx context.Context, consultantID uuid.UUID)`
*   **Purpose**: Retrieves all bookings assigned to a specific `Consultant`.
*   **Mechanism**: Performs multiple `JOIN` operations: `bookings` $\to$ `users` (for the client) $\to$ `consultants` $\to$ `cities`.
*   **Security/Design**: Filters results strictly by `consultant_id` and orders results by `start_time` descending.

#### `GetUserBookings(ctx context.Context, userID uuid.UUID)`
*   **Purpose**: Retrieves all bookings made by a specific `User`.
*   **Mechanism**: Performs multiple `JOIN` operations: `bookings` $\to$ `consultants` $\to$ `users` (for the consultant's details) $\to$ `cities`.
*   **Security/Design**: Filters results strictly by `user_id` and orders results by `start_time` descending.

#### `DeleteBooking(ctx context.Context, id uuid.UUID)`
*   **Purpose**: Deletes a booking record by its primary key ID.
*   **Operation**: Simple `DELETE FROM bookings WHERE id = $1`.

#### `UpdateBookingStatus(ctx context.Context, id uuid.UUID, status string)`
*   **Purpose**: Updates the operational status of a booking (e.g., 'CONFIRMED', 'CANCELLED').
*   **Operation**: Executes an `UPDATE` statement, ensuring `updated_at` is always set to the current timestamp.

#### `IsBookingOwner(ctx context.Context, bookingID uuid.UUID, userID string)`
*   **Purpose**: Critical security and ownership check. Determines if the `User` provided owns the consultant associated with the given `bookingID`.
*   **Mechanism**: Uses a semi-join query (`SELECT EXISTS`) checking if the `booking.consultant_id` corresponds to a `consultant` record whose `user_id` matches the provided `userID`.
*   **Security**: Essential for protecting data access and ensuring users can only modify/view bookings belonging to their associated consultant account.

## ⚠️ Warning

### Transaction Integrity
When performing operations that modify the booking state (e.g., booking creation, status update), always ensure the calling service wraps these calls within a proper database transaction (`sqlx.Tx`). Using the `CreateBookingTx` method is recommended as it requires an active transaction context.

### Data Mismatch in Views
Be extremely careful when relying on the `*string` pointer types in `ConsultantBookingView` (e.g., `ConsultantName`, `ConsultantAvatar`). These fields are nullable (`NULL`) in the database. The calling logic must handle `nil` pointer checks to prevent panics, especially if the join data is missing or improperly configured.

## 💡 Note

### Query Optimization (Indexing)
For optimal performance, ensure the following columns are indexed in the database:
1.  `bookings.consultant_id` (Crucial for `GetConsultantBookings`).
2.  `bookings.user_id` (Crucial for `GetUserBookings`).
3.  `bookings.id` (Crucial for `DeleteBooking` and `UpdateBookingStatus`).
4.  `bookings.status` (If filtering by status is common).

### Security Focus - Ownership Check
The `IsBookingOwner` method uses a strict check against the `consultants.user_id`. This is the single source of truth for ownership and must be relied upon for any protected endpoint (e.g., DELETE, UPDATE).

## 🖼️ Figured: Booking Repository Flow Diagram

```mermaid
graph LR
    A[Service Layer Call] --> B{BookingRepository};

    subgraph Data Access Layer (DAL)
        B --> C(CreateBookingTx);
        B --> D{GetConsultantBookings};
        B --> E{GetUserBookings};
        B --> F[Update/Delete Operations];
        B --> G{IsBookingOwner Check};
    end

    D --> |Joins Users, Consultants, Cities| H[SELECT FROM bookings];
    E --> |Joins Consultants, Users, Cities| H;
    C --> |INSERT INTO bookings (via TX)| I[Database];
    F --> |UPDATE/DELETE WHERE ID| I;
    G --> |JOIN bookings/consultants/users| I;

    I --> J[Transaction/Commit];
    J --> B;
```