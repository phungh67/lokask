```markdown
[⬅ Return to Main Compendium](../../README.md)

# 🗓️ Booking Data Model Schema (`booking.ts`)

This document provides a comprehensive review and structural documentation for the core data models governing service bookings. These interfaces define the expected contracts for both creating a booking (API input) and viewing a finalized booking record (System read model).

## 📘 Overview

The `booking.ts` file establishes the single source of truth for the structure of appointment records. It defines crucial enumeration types (`ServiceType`, `BookingStatus`) and two primary interfaces:

1.  **`Booking`**: The complete, comprehensive data model representing a booking as it is retrieved from the system (the read model/database view).
2.  **`CreateBookingRequest`**: The restricted data model defining the payload required by the API when a client attempts to initiate a new booking.

The clear separation between these two interfaces is a fundamental aspect of API design, ensuring that client input is minimized and sanitized before hitting the business logic layer.

---

## ✨ Detail & Data Structure Analysis

### 🧬 Enums and Types

| Type | Definition | Purpose |
| :--- | :--- | :--- |
| `ServiceType` | `"chat_only"`, `"video_call"`, `"voice_call"`, `"itinerary_review"` | Controls the specific modality of the appointment. Critical for infrastructure routing (e.g., which cloud service/API gateway to use). |
| `BookingStatus` | `"pending"`, `"confirmed"`, `"completed"`, `"cancelled"` | Defines the lifecycle stage of the booking. Used by the state machine logic. |

### 📝 Interface: `Booking` (Read Model)

This model represents the final, enriched view of the booking, containing both core transactional data and user display data joined from other tables (or microservices).

**Key Fields:**

*   **Identifiers:** `id`, `consultant_id`, `user_id`.
*   **Temporal Data:** `start_time`, `end_time`, `created_at`, `updated_at`. (All time fields must adhere strictly to ISO 8601 format).
*   **Transaction Fields:** `service_type`, `status`, `total_price`, `user_notes`.
*   **View-Joined Fields (Denormalized):** `traveller_name?`, `traveller_avatar?`, `consultant_name?`, etc. These fields are *optional* (`?`) and are expected to be populated via database views or ORM joins, improving read performance.

### 📤 Interface: `CreateBookingRequest` (Write Model / API Payload)

This model is the explicit contract for initiating a booking. It purposefully omits system-generated fields (`id`, `created_at`) and contains only the minimum necessary input fields.

**Purpose:** Enforces strong input validation at the API Gateway/Middleware layer. A request payload must conform exactly to this structure.

**Example Flow Consideration:**
If a service is being created, the `start_time` and `service_type` must be validated against the availability service (Time Slot Management) *before* this request body can be processed.

---

## 🛡️ System Design & Security Implications

### 💻 Architectural Placement

This data model forms the core schema for the **Booking Microservice**.

*   **Input Path (Write):** The API endpoint responsible for creation (e.g., `POST /bookings`) must validate the `CreateBookingRequest` against business rules, *not* just types.
*   **Output Path (Read):** The service fetching the details (e.g., `GET /bookings/{id}`) must handle the joins required to populate the `Booking` interface structure.

### 🔐 Security Considerations

1.  **Authorization:** All actions writing to this model must check that the authenticated user (`user_id` implied by the session) is authorized to manage the resource, or that the requested `user_id` matches their ID.
2.  **Data Manipulation:** The use of `CreateBookingRequest` prevents clients from directly manipulating sensitive fields (like `total_price` or `status`) that should only be set by backend business logic.
3.  **Time Zones:** The explicit use of ISO strings for time fields is crucial to prevent ambiguity and ensure consistency across geographical regions (UTC handling is mandatory).

---

## 💡 Note (Best Practices)

*   **Immutability:** The distinction between the Write Model (`CreateBookingRequest`) and Read Model (`Booking`) is excellent practice. It strongly decouples the client contract from the backend persistence structure.
*   **Completeness:** The definition of `ServiceType` is clear and robust, allowing future scalability by simply adding new allowed values.
*   **Clarity:** The use of `?` (optional) on view-joined fields in the `Booking` interface perfectly signals to developers that these values are not guaranteed and may require fallback logic.

---

## ⚠️ Warning (Tech Debt & Areas for Improvement)

### 🚨 Technical Debt / Missing Logic

1.  **Validation Logic:** The interfaces only define *structure*, not *validation*. **Crucial missing piece:** There is no defined business logic contract (e.g., maximum allowed booking time, minimum notice period, or price calculation validation) that must be enforced on `CreateBookingRequest`. This must be handled in the middleware layer.
2.  **Dependency Linking:** The `Booking` interface references several key entities (`user_id`, `consultant_id`). There must be explicit, enforced foreign key checks against the respective User and Consultant schemas during database interaction.
3.  **Event Sourcing:** For mission-critical status changes (e.g., pending $\rightarrow$ confirmed, or cancelled), the current structure suggests a direct update. Consider implementing an **Event Bus/Event Sourcing** pattern to record every state transition (`BookingStatus`) for a full audit trail.

### 🔗 Internal Linking Suggestions

To maintain code flow documentation, ensure the following links are established in related files:

*   **Request Handling:** This schema links directly to the API handler and validation logic, likely located at: `../middleware/booking/create-booking-handler.go`
*   **Validation:** The validation rules for `CreateBookingRequest` should be documented alongside the service's middleware: `../middleware/booking/validation/validate-booking-input.ts`
*   **Database Layer:** The implementation of the read model joins requires documentation in the repository layer: `../repository/booking_repo.go`
```