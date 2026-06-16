[⬅ Return to Main Compendium](../../README.md)

# 🛡️ `main.go` Security Verification & Design Review

**File:** `main.go`
**Description:** Main entry point for the web application, handling database connection, service initialization, middleware setup, and route registration using Fiber.
**Verification Engineer:** Documentation-Security Verification Engineer

---

## 🔍 Overview

The `main.go` file serves as the application's bootstrap module. It initializes critical components—database connection (PostgreSQL), caching (Redis), file storage (Minio/S3), and third-party services (Mailer). It sets up middleware (Logger, CORS, Authentication Protection) and defines all API routes.

**Overall Security Posture:** The file demonstrates good practice by separating concerns into handlers, repositories, and middleware. However, several configuration choices and exposed routes present significant security risks or represent significant technical debt that needs addressing.

### 🚨 Vulnerability Summary Table

| Component/Function | Vulnerable Element | Risk Level | Reason |
| :--- | :--- | :--- | :--- |
| **CORS Configuration** | `AllowOrigins: "*"` | **High** | Allows any domain to interact with the API, potentially bypassing frontend origin checks. |
| **Environment Variable Handling** | `getEnv` usage (Implicit) | **High** | If database credentials (DB\_*, MAIL\_*) are not properly masked/secured in production environment variables, they are at risk. |
| **Error Handling (Fiber)** | Custom `ErrorHandler` | **Medium** | Returning `err.Error()` directly exposes internal details (stack traces, database connection errors) to the client. |
| **Auth Routes** | `/auth/login` | **High** | Potential exposure to credential stuffing, brute-force attacks, and lack of explicit rate limiting. |
| **Public Routes** | `/public/:id` (`bookHandler.PublicGetConsultantSchedule`) | **Medium** | Accessing core scheduling data without any authentication/authorization check. |
| **Proxy Handler** | `proxyImageHandler` | **Medium** | Lack of input validation or URL sanitization when fetching external content could lead to SSRF or DoS attacks. |
| **Unprotected Routes** | `/consultants`, `/blogs` | **Low** | Data retrieval endpoints should ideally require some form of minimum authentication/user context. |

---

## ⚙️ Detailed Analysis

### 🔵 Components & Services (Initialization Logic)

The initialization logic for DB, storage, and mailers is structurally sound, following the pattern of failing fast (`log.Fatal`).

**Critical Observation:** The use of `getEnv` is crucial. All sensitive inputs (passwords, keys) must be handled securely (e.g., using Vault, KMS) rather than relying solely on OS environment variables.

### 🟢 Middleware and Routing

1. **CORS Configuration:**
   ```go
   app.Use(cors.New(cors.Config{
       AllowOrigins: "*", // <--- HIGH RISK
       // ...
   }))
   ```
   *   **Vulnerability:** `AllowOrigins: "*"` is excessively permissive. This weakens the security boundary by allowing any malicious website to make cross-origin requests to the API, potentially assisting in CSRF or other client-side attacks if session management is weak.
   *   **Remediation:** Replace `*` with a defined list of allowed origins (e.g., `http://localhost:3000, https://my-client-domain.com`).

2. **Protected Routes Group:**
   ```go
   protected := api.Group("/", middleware.Protect())
   ```
   *   This correctly wraps the core API logic, ensuring authentication is required.
   *   **Dependency Check:** This relies heavily on `middleware.Protect()` correctly implementing JWT validation and context setting (e.g., `c.Locals("user_id")`).

3. **Error Handling:**
   ```go
   ErrorHandler: func(c *fiber.Ctx, err error) error {
       log.Printf("Server error: %v", err)
       return c.Status(500).JSON(fiber.Map{
           "error": err.Error(), // <--- RISK
       })
   }
   ```
   *   **Vulnerability:** Directly returning `err.Error()` exposes detailed internal server errors (e.g., SQL exceptions, internal file system errors, stack traces) to the client. This information is invaluable for attackers.
   *   **Remediation:** The handler must sanitize the error message, returning generic messages (e.g., "Internal Server Error") to the client, while logging the detailed error on the backend.

### 🟡 Exposed Endpoints & Business Logic

| Endpoint | Handler Function | Vulnerability Focus | Priority |
| :--- | :--- | :--- | :--- |
| `POST /auth/login` | `authHandler.Login` | **Brute Force/Credential Stuffing.** No visible rate limiting. | **High** |
| `POST /users/avatar` | `userHandler.UploadAvatar` | **Payload Attack.** Requires robust file type/size validation to prevent LFI/RCE or DoS via oversized files. | **High** |
| `GET /public/:id` | `bookHandler.PublicGetConsultantSchedule` | **Broken Access Control (BAC).** Data is public, but this schedule data could contain sensitive availability patterns. Consider if a minimum session token is needed. | **Medium** |
| `GET /consultants/:id` | `consultantHandler.GetProfile` | **Information Disclosure.** Ensure the profile endpoints do not leak overly sensitive PII (e.g., internal IDs, private contact details) unless explicitly required. | **Medium** |
| `POST /consultant/media` | `consultantHandler.UploadMedia` | **Storage Security.** Must validate media type and size before passing to `storageService`. | **Medium** |

---

## 📝 Technical Notes & TODOs

### 🔗 Code Flow Links (Documentation Links)

*   **Auth Flow:** `auth.go` $\rightarrow$ `../middleware/auth.go` (Session/Token validation)
*   **Profile Management:** `user/profile.go` $\rightarrow$ `../services/profile_service.go` (Data layer interaction)
*   **File Handling:** `media/upload.go` $\rightarrow$ `../utils/file_uploader.go` (Abstracted file operations)

### 🚀 Action Items / Next Steps

1.  **Rate Limiting:** Implement global rate limiting middleware, especially around login, password reset, and profile fetching endpoints.
2.  **Input Validation:** Ensure robust server-side validation for all incoming payloads (e.g., maximum string length, format checks) to mitigate injection attacks.
3.  **Logging:** Implement structured, centralized logging for all failed authentication attempts and access attempts to sensitive endpoints.

---
---

## 🛡️ Security Remediation Summary

### 🐛 Vulnerability Findings

1.  **Missing Rate Limiting (Authentication):** Attackers can brute-force credentials without delay.
2.  **Overly Permissive CORS/Access Control:** If the service is publicly exposed, stricter origin checks are needed.
3.  **Unsanitized Input (Potential):** Although not explicitly shown, all database interactions must use parameterized queries to prevent SQL Injection.

### ✨ Recommendations

*   **Implement Rate Limiting:** Apply rate limiting middleware to `/login`, `/register`, and `/forgot-password`.
*   **Strict Storage Policies:** For file uploads, implement strict content type checking on the server side (not just relying on the client) and ensure file names are sanitized.
*   **Principle of Least Privilege:** Review database access roles to ensure that microservices only have the minimum read/write permissions required for their function.