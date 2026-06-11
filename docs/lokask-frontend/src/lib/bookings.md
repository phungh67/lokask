```markdown
[⬅ Return to Main Compendium](../../README.md)

# 📅 Booking Service API Client

This module encapsulates all service layer calls related to fetching, creating, and modifying bookings. It acts as the unified interface for interacting with the Booking API endpoints, abstracting the HTTP details (methods, URLs, request bodies) from the business logic consuming these services.

## 🚀 Overview

The `bookingService` module provides dedicated, type-safe functions for performing CRUD operations on booking records. It utilizes a shared `fetchJson` utility to handle the underlying network communication and JSON serialization, ensuring consistency across all API interactions.

**Related Flow:**
*   **Client Logic Flow:** Defines how front-end components access booking data (e.g., `bookingService.createBooking(data)`).
*   **API Definition:** Relies on backend handlers (e.g., `bookHandler` in `../controllers/bookHandler.ts`) which are matched by the endpoint patterns.

---

## ✨ Detail & Function Reference

This section details each public function, its purpose, the underlying API call, and its expected input/output.

### 1. `createBooking(data: CreateBookingRequest)`

| Property | Value |
| :--- | :--- |
| **Purpose** | Used to create a new booking request (typically initiated by a user/traveller). |
| **Endpoint** | `POST /bookings` |
| **Method** | `POST` |
| **Input** | `data` (`CreateBookingRequest`): Payload containing necessary booking details. |
| **Output** | `Promise<Booking>`: The newly created booking object. |
| **Usage Context** | Traveller Dashboard. |

### 2. `getMyTrips(userId: string)`

| Property | Value |
| :--- | :--- |
| **Purpose** | Retrieves all bookings associated with a specific user (the individual making the booking). |
| **Endpoint** | `GET /bookings/my-trips` |
| **Method** | `GET` |
| **Input** | `userId` (`string`): The ID of the user whose trips are being fetched. |
| **Output** | `Promise<Booking[]>`: An array of the user's bookings. |
| **Matching Handler** | `protected.Get("/bookings/my-trips", bookHandler.GetUserTrips)` |

### 3. `getConsultantBookings(consultantId: string)`

| Property | Value |
| :--- | :--- |
| **Purpose** | Fetches all bookings scheduled for a specific consultant. |
| **Endpoint** | `GET /bookings/consultant/:id` |
| **Method** | `GET` |
| **Input** | `consultantId` (`string`): The ID of the consultant whose schedule is being viewed. |
| **Output** | `Promise<Booking[]>`: An array of bookings for the consultant. |
| **Matching Handler** | `protected.Get("/bookings/consultant/:id", bookHandler.GetMySchedule)` |

### 4. `getPublicConsultantBookings(consultantId: string)`

| Property | Value |
| :--- | :--- |
| **Purpose** | Publicly accessible view of a consultant's schedule, showing only officially confirmed bookings. |
| **Endpoint** | `GET /public/:id` |
| **Method** | `GET` |
| **Input** | `consultantId` (`string`): The ID of the consultant. |
| **Output** | `Promise<Booking[]>`: Array of public bookings. |
| **Security Note** | **Does not require authentication.** |

### 5. `updateBookingStatus(id: string, status: "confirmed" | "cancelled")`

| Property | Value |
| :--- | :--- |
| **Purpose** | Updates the status of an existing booking (e.g., confirmed by the consultant, or cancelled). |
| **Endpoint** | `PATCH /bookings/:id/status` |
| **Method** | `PATCH` |
| **Input** | `id` (`string`): The ID of the booking to update. `status`: The new status (`confirmed` or `cancelled`). |
| **Output** | `Promise<Booking>`: The updated booking object. |
| **Matching Handler** | `protected.Patch("/bookings/:id/status", bookHandler.UpdateStatus)` |

### 6. `deleteBooking(id: string)`

| Property | Value |
| :--- | :--- |
| **Purpose** | Permanently deletes a booking record. |
| **Endpoint** | `DELETE /bookings/:id` |
| **Method** | `DELETE` |
| **Input** | `id` (`string`): The ID of the booking to be deleted. |
| **Output** | `Promise<void>`: Successful deletion (assuming no return body). |
| **Matching Handler** | `protected.Delete("/bookings/:id", bookHandler.DeleteBooking)` |

---

## 📝 Notes & Best Practices

1.  **Error Handling:** All functions rely on the underlying `fetchJson` utility. It is critical that consuming components wrap calls to these functions in `try...catch` blocks to handle potential network failures, authentication errors, or invalid data submissions.
2.  **Authorization Context:** The distinction between `getMyTrips` (requires authenticated user context) and `getPublicConsultantBookings` (public access) is crucial. Always ensure the calling context matches the required access level.
3.  **Immutability:** When performing status updates (`updateBookingStatus`), the client should treat the input status as definitive and rely on the backend handler to validate if the transition is logically possible (e.g., cannot go from 'cancelled' back to 'confirmed').

## ⚠️ Warnings & Tech Debt

*   **Missing Error Handling Specificity:** While the service handles the API call, the error structure (HTTP status codes, specific error message format) from the backend API is assumed. If the backend error structure changes, this service layer needs updating to correctly interpret failures.
*   **Dependency Coupling:** The module is tightly coupled to the implementation of `fetchJson`. If `fetchJson` changes its signature (e.g., error handling mechanism), every function in this file must be reviewed.
*   **ID Type Safety:** All IDs (`id`, `consultantId`, `userId`) are passed as generic `string` types. While functionally correct, defining a dedicated `BookId` or `UserId` type alias would improve compile-time safety and documentation clarity.

## 🔗 Related Files

| File/Component | Link | Description |
| :--- | :--- | :--- |
| **Types** | `../../types/booking.ts` | Defines `Booking` and `CreateBookingRequest` structures. |
| **Utility** | `./core` | Contains the foundational `fetchJson` utility function. |
| **Backend Handlers** | `../controllers/bookHandler.ts` | The corresponding backend logic that consumes these API endpoints (e.g., `bookHandler.GetMySchedule`). |
```