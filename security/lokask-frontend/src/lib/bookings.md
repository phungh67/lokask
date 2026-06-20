[⬅ Return to Main Compendium](../../README.md)

# 🛡️ API Client Functions: Booking Management (`booking.ts`)

## 📑 Overview

This module (`booking.ts`) provides standardized client-side wrappers for interacting with the core booking API endpoints. It handles the serialization and transmission of requests (POST, PATCH, DELETE, GET) using a centralized `fetchJson` utility. The functions cover the full lifecycle of a booking: creation, viewing (mine, consultant's, public), updating status, and deletion.

The module structure is clean and directly maps to RESTful API interactions, which is good for maintainability but requires strict adherence to authorization context.

## ✨ Structural Flow & Logic

This file primarily acts as a clean API client layer. All business logic regarding authorization and data validation should reside in the middleware/handler layer (as suggested by the JSDoc comments), not here.

### 🔗 Related Modules & Flow Links

| Function | Endpoint/Flow | Description |
| :--- | :--- | :--- |
| `createBooking` | `/bookings` | Initiates a new booking (Requires user authentication/context). |
| `getMyTrips` | `/bookings/my-trips` | Retrieves bookings associated with the authenticated user. **(Requires User context)** |
| `getConsultantBookings` | `/bookings/consultant/:id` | Retrieves the consultant's entire schedule. **(Requires high authorization)** |
| `getPublicConsultantBookings` | `/public/${consultantId}` | View publicly available schedule. (Unauthenticated). |
| `updateBookingStatus` | `/bookings/:id/status` | Modifies the status (Confirm/Cancel). **(Requires ownership/admin rights)** |
| `deleteBooking` | `/bookings/:id` | Permanently deletes a booking record. **(Requires owner/admin rights)** |

## 🔬 Security Verification Detail

The security analysis focuses on how parameters are handled, the potential for insecure direct object reference (IDOR), and the reliance on the surrounding system (middleware) for proper authorization.

### 🔴 Vulnerability Analysis Summary

| Function | Vulnerable Object/Parameter | Potential Attack | Priority | Mitigation Required |
| :--- | :--- | :--- | :--- | :--- |
| `getConsultantBookings` | `consultantId` (Path Param) | IDOR, Unauthorized access to non-visible data. | **High** | Backend must enforce that the requester is authorized to view this specific consultant's data. |
| `updateBookingStatus` | `id` (Path Param) | IDOR (Modifying another user's booking). | **High** | Backend must validate that the authenticated user is the owner of the booking ID. |
| `deleteBooking` | `id` (Path Param) | IDOR, Unauthorized data deletion. | **High** | Backend must enforce ownership check before executing the DELETE request. |
| `getMyTrips` | *(None)* | N/A | Low | Assumption: Middleware correctly sets `userId` to enforce scope. |
| `createBooking` | `data` (Body) | Mass assignment, Input validation failure. | Medium | Input validation/Schema enforcement on the backend must be robust. |

### 🛡️ Detailed Component Analysis

#### 1. `createBooking(data: CreateBookingRequest)`
*   **Inputs:** `data` (Request Body).
*   **Vulnerability:** If the backend fails to validate the input schema (e.g., allowing unexpected fields, incorrect data types, or overly large payloads), it could lead to data corruption or unexpected API behavior.
*   **Security Concern:** Input validation and mass assignment vulnerabilities.

#### 2. `getConsultantBookings(consultantId: string)`
*   **Inputs:** `consultantId` (Path Parameter).
*   **Vulnerability:** **IDOR (Insecure Direct Object Reference).** This function relies solely on the path parameter `:id`. A malicious actor could change `consultantId` to view the schedule of a competitor or another consultant they are not authorized to see.
*   **Severity:** High. This exposes sensitive business data (schedules).

#### 3. `updateBookingStatus(id: string, status: "confirmed" | "cancelled")`
*   **Inputs:** `id` (Path Parameter), `status` (Body Parameter).
*   **Vulnerability:** **IDOR and Authorization Bypass.** An attacker could pass a booking ID (`id`) belonging to a different user and potentially change the status (e.g., canceling a booking they did not make, or marking another user's booking as confirmed).
*   **Severity:** High. Direct tampering with core business records.

#### 4. `deleteBooking(id: string)`
*   **Inputs:** `id` (Path Parameter).
*   **Vulnerability:** **IDOR and Unauthorized Deletion.** Similar to status updates, passing a random valid booking ID allows unauthorized deletion of records, leading to data loss.
*   **Severity:** High. Critical impact on data integrity.

## 📝 Notes & Warnings

### ⚠️ WARNING (Critical Implementation Gap)

The security of this entire client module heavily depends on the associated backend middleware (e.g., `protected.Get`, `protected.Patch`). **If the backend does not implement robust ownership/authorization checks using the authenticated user's context (JWT/session), every single function using dynamic IDs (`id`, `consultantId`) is critically vulnerable to IDOR.**

### 💡 Tech Debt / Improvement Suggestions

1.  **Strong Typing for IDs:** While `id: string` is used, consider abstracting the ID type if the system uses UUIDs or specific formats to prevent accidental misuse.
2.  **Error Handling Abstraction:** The `fetchJson` utility should ideally include standardized error handling that differentiates between HTTP 401 (Unauthorized), 403 (Forbidden), and 404 (Not Found) responses, rather than just generic JSON parsing errors.
3.  **Role-Based Access Control (RBAC):** Instead of just passing ID strings, consider wrapping these functions with a high-level service function that checks the current user's role *before* making the API call, adding an extra layer of client-side safety check (though the backend must remain the ultimate gatekeeper).

---

## 📊 Security Vulnerability Ranking (Summary)

### 🟢 High Priority (Requires Immediate Backend Remediation)
*   **`getConsultantBookings(consultantId: string)`:** Critical IDOR risk. Must verify requester's rights to view this specific resource.
*   **`updateBookingStatus(id: string, status: "confirmed" | "cancelled")`:** Critical IDOR/Authorization risk. Must verify ownership of the booking ID (`id`).
*   **`deleteBooking(id: string)`:** Critical IDOR/Authorization risk. Must verify ownership of the booking ID (`id`).

### 🟡 Medium Priority (Requires Validation Logic Review)
*   **`createBooking(data: CreateBookingRequest)`:** Input validation risk. The backend must enforce strict schema validation to prevent mass assignment.

### 🟢 Low Priority
*   **`getMyTrips(userId: string)`:** Low risk, assuming middleware correctly enforces scope tied to the `userId`.
*   **`getPublicConsultantBookings(consultantId: string)`:** Lowest risk, as it is explicitly defined as a public endpoint, reducing the likelihood of unauthorized access attempts through this specific endpoint.