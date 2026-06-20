[⬅ Return to Main Compendium](../../README.md)

# 🚀 System Entry Point Analysis: `main.go`

This file serves as the main entry point (`main`) for the entire application, responsible for initializing all core services (Database, Storage, Redis, Mailer) and setting up the API router structure using Fiber. It defines the overall system architecture and exposes all primary endpoints.

## 🔎 Vulnerability Summary

| Component/Function | Payload/Object | Vulnerability Type | Priority | Description |
| :--- | :--- | :--- | :--- | :--- |
| `app.Get("/api/v1/test-email")` | `to` (Query Param) | Input Validation/Denial of Service (DoS) | Medium | Uses external email service; potential for rate limiting abuse or invalid format inputs. |
| `protected.Post("/users/avatar")` | File Upload (Payload) | Missing input sanitization/Storage Path Traversal | High | Handles user file uploads. Needs robust validation and sanitization before saving/using the file. |
| `protected.Post("/blogs")` | Content Body (Payload) | XSS/Injection (Blog Content) | High | Blog creation endpoint. User-provided content must be sanitized (especially HTML/rich text) to prevent XSS. |
| `protected.Post("/bookings")` | Booking Data (Payload) | Business Logic Flaw/Authorization Bypass | High | Booking creation. Relies on `bookHandler` for state management; ensure transaction isolation and strict authorization checks (e.g., cannot book for another user). |
| `protected.Delete("/bookings/:id")` | `id` (Path Param) | Authorization Flaw (IDOR) | High | Deleting a booking. Must strictly verify ownership before deletion, not just authentication. |
| `protected.Post("/consultant/media")` | File Upload (Payload) | File Type Validation/Misuse | Medium | Media upload. Similar to avatar upload, needs strict MIME type and size validation. |
| `proxyImageHandler` | `url` (Query Param) | SSRF (Server-Side Request Forgery) | High | Fetches external images based on a URL parameter. If not validated, an attacker could point it to internal services or sensitive network resources. |
| `protected.Patch("/updateprofile")` | Profile Data (Payload) | Data Integrity/Insufficient Authorization | Medium | Updating profile. Needs to ensure that the authenticated user can only modify their own profile data. |

***

## 💡 System Overview

**File:** `main.go`

The file demonstrates robust application scaffolding, separating concerns by initializing dedicated repositories, handlers, and services (`handler`, `repository`, `mailer`, `storage`). This adheres to good modular design principles. The use of `github.com/gofiber/fiber/v2` makes routing concise.

*   **Architecture:** Layered architecture (HTTP $\rightarrow$ Handlers $\rightarrow$ Repositories $\rightarrow$ Services/DB).
*   **Infrastructure Components:** Postgres (via `sqlx`), MinIO/S3 (via `storage`), Redis (via `rediscfg`), Email API (via `mailer`).

### ⚙️ Detailed Analysis

#### 1. Initialization and Configuration (`main` function)
*   **DB Connection:** Reads credentials from environment variables (`getEnv`). **Vulnerability Risk:** If credentials are leaked, the entire system is at risk.
*   **Storage Connection:** Supports development (MinIO) and production (S3) modes. Uses `log.Fatal` on failure, which is appropriate.
*   **Handler Setup:** Correctly injects dependencies (`Repo`, `Storage`, `Mailer`) into handlers. This is clean design.

#### 2. Middleware and Routing
*   **Rate Limiting:** Implemented for `/api/.env` using a custom key generator based on `c.IP()`. This mitigates basic scraping/DoS attempts.
*   **Authentication Middleware:** `middleware.Protect()` correctly groups sensitive routes.
*   **Special Endpoints:**
    *   `/api/v1/test-email`: Utility endpoint that uses user input (`toEmail`) directly with the `mailService`.
    *   `/api/v1/conversations/:id/cheat-code`: Hardcoded cheat code endpoint (`chatHandler.RefilSession`).

#### 3. Core Handlers and Logic
The `protected` group maps all business logic. The complexity and associated risks are concentrated here:
*   **Chat/Messaging:** `StartChat`, `GetInbox`, `SendMessage`, `GetHistory`. These endpoints involve sensitive communication data.
*   **Media/Profiles:** `UploadAvatar`, `Create`, `DeleteGalleryMedia`, `UpdateProfile`. These handle file uploads and PII modifications.
*   **Booking:** `CreateBooking`, `DeleteBooking`, `UpdateStatus`. These manage critical, transactional business state.

### 📝 Key Notes (Implementation Observations)

1.  **Dependency Management:** The initialization sequence is logical. Services are created before they are attached to handlers.
2.  **Missing Proxy Handler:** The `proxyHandler` is commented out but its existence suggests a known external interaction point that needs re-verification if implemented.
3.  **Cheat Code:** The hardcoded cheat-code path (`/conversations/:id/cheat-code`) should be removed or protected by extreme internal logic, as it bypasses normal flow.
4.  **Error Handling:** Error logging is done using `log.Printf` (e.g., in `/test-email`), which is generally fine for non-critical failures but should be reviewed to ensure sensitive error details are never leaked to the client.

### ⚠️ Critical Warnings and Tech Debt

1.  **SSRF Vulnerability (`proxyImageHandler`):** The dedicated `proxyImageHandler` function, though defined outside the main setup flow, presents a massive SSRF risk. An attacker can supply internal IPs or cloud metadata endpoints as the `url` parameter. **This must be secured immediately.**
2.  **Input Sanitization (XSS/Injection):** Multiple points accept user input (Blog content, Profile details, Chat messages). There is no visible framework-level sanitization. All user-generated data *must* be scrubbed before storage or rendering.
3. **Insecure Direct Object Reference (IDOR):** Any endpoint that takes an ID (e.g., fetching a conversation by ID) must validate that the *authenticated user* owns access to that resource. (This is an architectural concern, but highly relevant given the data types).

---
**Recommendations Summary:**

1.  **Rate Limiting:** Implement aggressive rate limiting on all endpoints that perform state changes (e.g., creating a chat, posting a message).
2.  **Input Validation:** Implement strict allow-listing validation for all incoming data types, lengths, and characters.
3.  **Security Context:** Ensure every handler checks the identity and permissions of the calling user.