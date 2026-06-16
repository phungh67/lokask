# 📚 Booking API Client Functions (`booking.ts`)

[⬅ Return to Main Compendium](../../README.md)

## 📝 Overview

This module provides a comprehensive client layer for interacting with the booking management service. It encapsulates various API calls—including creating, viewing, updating, and deleting bookings—abstracting the HTTP interaction using `fetchJson`. The functions are critical components that manage core application state related to user travel and consultation schedules.

## 🔐 Security Vulnerability Assessment

| Function / Payload | Vulnerability Type | Priority | Description |
| :--- | :--- | :--- | :--- |
| `getConsultantBookings(consultantId)` | IDOR / Authorization | **High** | The function accepts `consultantId` directly from the signature and uses it in the path. If the calling service does not rigorously validate that the requesting user is authorized to view the specified `consultantId`'s data, an attacker could enumerate and view private booking data (IDOR). |
| `deleteBooking(id)` | Authorization / Input Validation | **High** | Deletes records based solely on `id`. There is no visible check to ensure the calling user is the owner of the booking or has administrative rights. A malicious actor could delete any booking if they guess a valid ID. |
| `updateBookingStatus(id, status)` | Authorization / State Management | **High** | Modifies the state of a booking (`status`). Authorization must be enforced at the endpoint level: only the owner, or a dedicated admin role, should be permitted to call this function. |
| All functions using path parameters (`id`, `consultantId`) | IDOR | **High** | All functions relying on path parameters (`/bookings/:id/status`, `/bookings/consultant/:id`) must enforce ownership and scope checks. The front-end logic or calling middleware must guarantee that the user is authorized for the resource being manipulated. |
| `getMyTrips(userId)` | Logical Bug / Unused Parameter | **Medium** | The function accepts `userId` but does not appear to use it in the `fetchJson` call (which only sends `/bookings/my-trips`). This suggests the necessary context passing logic might be missing or implicitly handled by a downstream middleware, leading to potential confusion or failure. |
| `createBooking(data)` | Input Validation | **Medium** | While the API call uses JSON serialization, the client layer does not enforce strict validation on the incoming `data: CreateBookingRequest`. Invalid or overly large payloads could lead to backend failures or unexpected processing. |

***

### 🔍 Detailed Analysis & Technical Implementation Notes

#### **[High Priority] Authorization and Scoping Flaws**
All functions involving resource identification (`id`, `consultantId`) present a risk of **Insecure Direct Object Reference (IDOR)**. While the underlying backend logic likely contains checks, the client layer assumes successful authorization. Middleware handling should be mandatory for all public-facing endpoints that accept IDs.

#### **[Medium Priority] Client Logic Consistency**
The signature for `getMyTrips` is misleading given that `userId` is accepted but not passed to `fetchJson`. If the intent is to query *the user's own* trips, the function should either:
1. Remove `userId` and rely solely on context middleware.
2. Use `userId` in the API call path (e.g., `/bookings/my-trips/${userId}`), if the backend requires explicit IDs.

#### **[General Note] Error Handling**
The module relies entirely on `fetchJson`. It is assumed that `fetchJson` handles network errors, 401/403 unauthorized responses, and 404 not found errors gracefully. Explicit try/catch blocks wrapping these calls in the calling component would improve client resilience.

## ⚠️ Warning and Technical Debt

1. **Missing Authorization Middleware Links:** This module requires robust security context middleware. For example, the logic behind securing `getConsultantBookings` (ensuring the calling user *is* the consultant) should ideally be linked back to the middleware definition.
    * **Required Linkage:** `getConsultantBookings` $\rightarrow$ `../middleware/auth.go` (Scope Check Logic).
2. **Lack of Transactional Safety:** State-modifying functions (`updateBookingStatus`, `deleteBooking`) should be wrapped in a client-side or service layer transaction check to ensure atomicity (e.g., checking if a booking is active before attempting a cancellation).
3. **Payload Typing:** While types are used (`Booking`, `CreateBookingRequest`), robust runtime validation (e.g., using Zod or Yup) should be applied to the `data` payload before calling `JSON.stringify(data)` to prevent unexpected API input formats.

## 🧠 Future Enhancements / Suggestions

*   **Batch Operations:** Implement a function to fetch or update multiple bookings (e.g., `bulkUpdateBookingStatus`).
*   **Input Validation:** Introduce a dedicated validation service utility to clean and validate all string inputs (`id`, `consultantId`) before they are passed to `fetchJson`.

***

### 💻 Code Flow Mapping (Internal Links)

| Function | Purpose | Related Logic/Middleware | Suggested Link Reference |
| :--- | :--- | :--- | :--- |
| `createBooking` | Creates a new booking record. | Backend Validation/Schema Check (POST payload). | `../../api/middleware/schemaValidation` |
| `getMyTrips` | Retrieves current user's bookings. | Authentication Context (User ID derived from JWT). | `../middleware/auth.go` (Role: User) |
| `getConsultantBookings` | View bookings for a specific consultant. | Authorization Check (Admin/Scope validation required). | `../middleware/auth.go` (Scope: Consultant) |
| `getPublicConsultantBookings`| View general availability. | None (Public Endpoint). | N/A |
| `updateBookingStatus` | Modifies status (Confirm/Cancel). | Ownership Check + Role Check (Only owner or admin). | `../middleware/auth.go` (Action: Update) |
| `deleteBooking` | Deletes a booking record. | Ownership Check + Role Check (Owner only). | `../middleware/auth.go` (Action: Delete) |