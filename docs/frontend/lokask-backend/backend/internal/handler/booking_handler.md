[⬅ Return to Main Compendium](../../../../../../README.md)

As a senior frontend officer specializing in TypeScript and Vite, my goal is to document this backend API logic not in terms of Go structs and database transactions, but in terms of the **Frontend Data Contracts, State Management requirements, and Component Abstraction**.

The `BookingHandler` dictates the core business logic for the scheduling system. When consuming this API, we must model our entire frontend state and component interactions around these endpoints and their associated failure states (400, 403, 409, etc.).

---

## 🚀 Booking Module Architecture Documentation

This module manages all interactions related to service booking, scheduling visibility, and status updates.

### 1. Core Data Types (TypeScript Interfaces)

We define clear types based on the API contracts to ensure type safety throughout the entire stack.

```typescript
// src/types/booking.ts

/** Represents the request payload for creating a booking. */
export interface CreateBookingRequest {
    consultant_id: string;
    start_time: string; // ISO 8601 format
    end_time?: string; // Calculated on the backend, but useful for validation
    total_price: number;
    user_notes?: string;
    service_type: string;
}

/** Represents a single booking record (Response Model). */
export interface BookingEntry {
    booking_id: string; // Assuming UUID generation happens here or in the payload
    consultant_id: string;
    user_id: string;
    start_time: Date;
    end_time: Date;
    total_price: number;
    user_notes?: string;
    service_type: string;
    status: 'pending' | 'confirmed' | 'cancelled'; // Defined states
    // Add timestamps if the backend returns them
}

/** Shape for status update requests. */
export interface UpdateStatusPayload {
    status: 'pending' | 'confirmed' | 'cancelled';
}

// Custom Error Type for better UI handling
export type ApiError = {
    error: string;
    details?: string;
    status: number;
};
```

### 2. State Management Strategy (Central Store)

The booking data should be managed in a global state (e.g., using Zustand or Redux Toolkit) to prevent data fragmentation across multiple components (Calendar View, Booking Form, User Profile).

**State Slice Example (`bookingSlice`):**

| State Field | Type | Description | Source API |
| :--- | :--- | :--- | :--- |
| `userSchedule` | `BookingEntry[]` | The user's specific upcoming bookings. | `GetMySchedule` |
| `consultantSchedule` | `BookingEntry[]` | A consultant's view (for public/admin calendar). | `PublicGetConsultantSchedule` |
| `isLoading` | `boolean` | Global loading indicator for booking actions. | All endpoints |
| `error` | `ApiError | null` | Stores the most recent API error (e.g., 409 Conflict). | All endpoints |

**Key Actions/Thunks:**
1. `fetchUserSchedule(consultantId)`: Hits `GetMySchedule`.
2. `fetchConsultantSchedule(consultantId, startDate, endDate)`: Hits `PublicGetConsultantSchedule`.
3. `createBooking(data)`: Handles the entire submission lifecycle.
4. `updateBookingStatus(bookingId, newStatus)`: Handles status changes.
5. `deleteBooking(bookingId)`: Handles cancellation.

### 3. Component Architecture Breakdown

We break the UI into highly cohesive, reusable components.

| Component | Role / Functionality | Dependencies (State/API) | Key Interactions |
| :--- | :--- | :--- | :--- |
| **`BookingCalendar`** | The primary visualization component (e.g., a month/week view). | `userSchedule`, `consultantSchedule` | Reads state; uses filter logic to highlight available/booked slots. |
| **`BookingForm`** | Handles the input fields for scheduling. | `CreateBookingRequest` | **Manages local form state.** Calls `createBooking` action on submission. |
| **`ScheduleViewer`** | Displays a list/detail view for a single consultant's availability. | `consultantSchedule` | Only reads data. Contains **`BookingCard`** components. |
| **`BookingCard`** | Represents one instance of a booking. Used in both Calendar and List views. | `BookingEntry` | Displays details (time, owner, status). Contains **`StatusUpdateDropdown`**. |
| **`StatusUpdateDropdown`** | Controlled component attached to `BookingCard`. | `bookingId`, `isOwner` flag (read from API context). | Triggers `updateBookingStatus`. **Crucially depends on authorization check.** |

### 4. Key Interaction Flows & Logic Notes

#### A. Booking Creation Flow (`/book`)
1. **Validation:** Check for required fields (date, time, service).
2. **API Call:** `POST /book`
3. **Error Handling:** If the API returns a `409 Conflict` (e.g., slot already booked), the front end must display a user-friendly message indicating the conflict, rather than a generic error.
4. **Success:** Update local state and persist the new booking ID.

#### B. Viewing Availability Flow (Read-Only)
*This flow is implicitly handled by the calendar/availability component.*
1. **Client:** Reads the service calendar endpoint.
2. **Logic:** The frontend must implement logic to filter and display time slots based on service duration and existing booked slots returned by the API.

#### C. Authorization & Permissions
* **Principle:** Never assume the user has rights to modify a booking.
* **Check:** For any modification action (cancellation, rescheduling), the frontend must pass the user's ID and the booking ID to the backend for authorization validation before sending the request.

### Summary Table

| Feature | API Endpoint | Component Owner | State Impact | Critical Logic |
| :--- | :--- | :--- | :--- | :--- |
| **View Availability** | (GET) | `CalendarView` | Read-Only | Time slot filtering & range validation. |
| **Create Booking** | `POST /book` | `BookingFormComponent` | Write (Create) | Conflict checking (409). |
| **View My Bookings** | `GET /user/bookings` | `MyDashboard` | Read-Only | Displaying filtered user-specific data. |
| **Cancel Booking** | `DELETE /book/{id}` | `MyDashboard` | Write (Delete) | Authorization check and success confirmation. |