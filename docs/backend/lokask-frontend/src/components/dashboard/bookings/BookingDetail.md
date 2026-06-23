[⬅ Return to Main Compendium](../../../../../../../README.md)

As a senior backend officer specializing in Go and complex system logic, I have analyzed this frontend component (`BookingDetail.tsx`). This component heavily interacts with the lifecycle management of a `Booking` entity.

The primary responsibility of the backend system is to expose robust, atomic endpoints that manage the state transitions, retrieve necessary details, and initiate actions (like scheduling calls).

Here is the technical documentation covering the core business logic, required API surfaces, and recommended repository patterns in a Go backend environment.

---

## ⚙️ Backend Architecture Documentation: Booking Management

The `BookingDetail` component represents the read and write interface for a confirmed or pending booking session. All interactions must be treated as state transitions on the `Booking` entity.

### 1. Core Logic Documentation (The Business Service Layer)

The core logic must reside within a dedicated service package (e.g., `internal/service/booking_service.go`). This layer coordinates data retrieval, state validation, and business rules execution before interacting with the repository.

#### 1.1 State Management Logic
The system must enforce strict state machine rules for the `Booking` status.

| Action Triggered (Frontend) | Target Status | Required Pre-conditions | Backend Logic/Validation |
| :--- | :--- | :--- | :--- |
| `Confirm booking` (via `onConfirm`) | `confirmed` | Status must be `pending`. Booking details (payer, consultant availability) must be validated. | 1. Set `status = "confirmed"`. 2. Record confirmation timestamp. 3. Optional: Trigger Payment Gateway record. |
| `Reschedule` (via `onReschedule`) | *Pending/New* | Status must be `pending` or `confirmed`. Must provide new `start_time`, `end_time`, and potentially a reason. | 1. **Critical:** Check consultant and traveller availability for the new slot. 2. If successful, update the booking times and set status to `pending_reschedule` (or overwrite if the frontend assumes success). 3. Must check for price adjustments due to time changes. |
| `Cancel booking` (via `onCancel`) | `cancelled` | Status must be `pending`, `confirmed`, or `completed` (if cancellation fee applies). | 1. Set `status = "cancelled"`. 2. Record cancellation timestamp and reason. 3. **Critical:** Execute refund/fee calculation logic based on cancellation timing/policy. |
| *Call Initiation* (via `openCallWindow`) | N/A | Status must be `confirmed`. Must validate `service_type` (Voice/Video). | Backend does not handle the call itself, but the API must validate that the time window is valid and the roles are set. |
| *Update Notes* (via `onUpdateNotes`) | N/A | Must be authenticated (Traveller/Consultant role check). | Update `user_notes` or `consultant_notes` specific to the user performing the action. |

#### 1.2 Time/Duration Calculation
The service must be able to calculate and validate the duration using the `start_time` and `end_time` fields.

*   **Input:** `start_time` (Timestamp), `end_time` (Timestamp).
*   **Output:** Duration in minutes (Int).
*   **Logic:** Use robust time parsing (e.g., Go's `time` package) to calculate `diff`.

### 2. API Surfaces (Go HTTP Handlers & Endpoints)

These endpoints map the required actions to the backend API. All endpoints should require a secure authentication context (JWT/Session) to identify the user performing the action.

#### `api/v1/bookings/{booking_id}`

| Method | Endpoint | Description | Request Body (Input) | Response Body (Output) | Access Control |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **GET** | `/bookings/{id}` | Retrieves all details of a specific booking. Used for rendering the `BookingDetail`. | None | `Booking` struct (full details) | Must be traveller OR consultant associated with the booking. |
| **PUT** | `/bookings/{id}/confirm` | Transitions the booking from `pending` to `confirmed`. | `{}` | `Booking` (updated status) | Traveller only (if initiating confirmation). |
| **POST** | `/bookings/{id}/reschedule` | Changes the scheduling slot. | `{ "start_time": string, "end_time": string, "reason": string }` | `Booking` (updated details) | Traveller/System Admin. |
| **POST** | `/bookings/{id}/cancel` | Marks the booking as cancelled. | `{ "reason": string, "cancellation_fee_applied": bool }` | `Booking` (updated status, refund status) | Any user with permission. |
| **PATCH** | `/bookings/{id}/notes` | Updates notes associated with the booking. | `{ "notes": "New text content" }` | `{ "status": "success", "notes": "Updated notes" }` | User associated with the booking. |

**Design Notes:**
1.  **Idempotency:** PUT/PATCH requests should be idempotent.
2.  **Error Handling:** All write operations must handle conflicts (e.g., attempting to change a booking that has already been finalized).
3.  **Response Structure:** All API responses should include a standardized success/error envelope.

### 3. Data Models (Structs)

```go
// CoreBooking represents the primary entity.
type CoreBooking struct {
    ID          string    `json:"id"`
    UserID      string    `json:"user_id"`
    Status      string    `json:"status"` // e.g., PENDING, CONFIRMED, CANCELLED
    StartTime   time.Time `json:"start_time"`
    EndTime     time.Time `json:"end_time"`
    ServiceType string    `json:"service_type"`
    Notes       string    `json:"notes,omitempty"`
}

// BookingDetails aggregates all necessary information for the frontend.
type BookingDetails struct {
    CoreBooking
    UserReference      string `json:"user_reference"` // Associated user ID
    PaymentStatus      string `json:"payment_status"`
    FinancialDetails   struct {
        TotalAmount float64 `json:"total_amount"`
        Currency    string  `json:"currency"`
        // ... other payment-related fields
    } `json:"financial_details"`
    // ... other related data for the UI
}
```