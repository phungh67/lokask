```markdown
[⬅ Return to Main Compendium](../../README.md)

# 🔌 API Client Utility Module (`api-client.ts`)

**Module Purpose:** This module serves as the single source of truth for all frontend communication with the backend API. It abstracts the complexities of HTTP requests, handles authentication headers, and standardizes both success and failure responses, ensuring robust and predictable client-side data fetching.

**Knowledge Domain Focus:** Client Infrastructure, System Integration, Security Best Practices (Authentication).

---

## 🏗️ Overview

The `api-client.ts` module encapsulates the global API base URL (`BASE_URL`) and provides two key utilities: a custom error class (`ApiError`) and the core fetching function (`fetchJson`).

Its primary responsibility is to standardize the request lifecycle: intercepting tokens, constructing necessary headers (including handling `multipart/form-data` correctly), executing the network call, and meticulously parsing the response to throw predictable, actionable errors upon failure.

**Key Consumers:** All components requiring server interaction (e.g., `AuthService.ts`, `UserProfileService.ts`, etc.).

---

## 🧠 Detail Analysis

### 1. Core Constants and Error Handling

*   **`BASE_URL`**: Defines the root endpoint for the API (`/api/v1`). This centralized constant allows for future backend migrations or versioning changes (e.g., v2) without modifying dozens of calling functions.
*   **`ApiError`**: This custom class extends the native `Error` object. By including the HTTP `status` code, it allows consuming components to handle specific API failures (e.g., unauthorized access, validation failures) programmatically, rather than relying solely on generic error messages.

### 2. The `fetchJson<T>` Function (The Core Logic)

This function is a powerful abstraction layer over the native `fetch` API.

**A. Authentication Flow (Security):**
1. It first attempts to retrieve the JWT token from `localStorage`.
2. If a token exists, it dynamically adds the `Authorization` header in the format `Bearer [token]`.

**B. Content Type Handling (Resilience):**
1. It checks if the provided options body is an instance of `FormData`.
2. **Crucially**, if it detects `FormData` (which is used for file uploads), it intentionally omits setting the `Content-Type: application/json` header, preventing the client from incorrectly overriding the boundary-based MIME type required by the backend for file transfers.
3. For all other requests, it enforces `Content-Type: application/json`.

**C. Execution and Error Parsing:**
1. It constructs the final URL: `${BASE_URL}${endpoint}`.
2. It executes the `fetch` call using the assembled options and headers.
3. **Error Path Handling:** If `res.ok` is `false` (meaning the HTTP status code is 4xx or 5xx):
    *   It attempts to parse the response body as JSON.
    *   If parsing fails (e.g., a server error that returns plain text), it falls back to creating a generic `ApiError` using the `res.statusText`.

**💡 Related Components/Flows:**
*   This utility must be imported and used wherever network logic is required.
*   When performing actions requiring authentication, the consuming service must ensure the API call is routed through this client. (e.g., `src/services/user/profileService.ts` $\rightarrow$ calls `fetchJson`).

---

## ⚠️ Security & Architectural Warnings (Highest Priority)

1.  **`localStorage` Dependency (Critical Security Concern):** Storing JWT tokens in `localStorage` makes the application vulnerable to Cross-Site Scripting (XSS) attacks. If any part of the application is compromised by an attacker-controlled script, they can read the token and use it until it expires.
    *   **Recommendation:** Review feasibility of migrating token storage to secure, HttpOnly cookies. If this is not immediately possible, implement rigorous Content Security Policy (CSP) headers across the entire application.
2.  **Type Casting (`any`):** The line `(headers as any)["Authorization"] = ...` uses a type assertion (`as any`) to force the inclusion of the Authorization header. This is a code smell and bypasses TypeScript's type safety.
    *   **Recommendation:** Update the `HeadersInit` interface definition or use a more explicit header assignment mechanism to improve type safety.
3.  **Error Handling Blind Spot:** The current error handling assumes that if `res.ok` is false, the body *might* contain JSON error details. If the backend returns a 500 status but sends non-JSON text (e.g., a stack trace), the `await res.json().catch(() => null)` block handles it, but consuming components should be aware that the structure of `errorData` is not guaranteed.

---

## 🚧 Notes & Tech Debt (Future Improvements)

1.  **HTTP Interceptor Pattern:** Instead of passing authentication logic directly into `fetchJson`, consider refactoring this into a dedicated Request Interceptor (e.g., using an Axios instance, or a middleware pattern). This would clean up the primary function body and make the authentication injection a configurable hook rather than hardcoded logic.
2.  **Context/State Management:** The reliance on global `localStorage` is problematic for testing and scalability. For larger applications, passing the token (or the entire request context) through a dependency injection system or a centralized state management store (like Redux/Zustand) would be architecturally superior.
3.  **Retry Logic:** The module currently offers no built-in resilience. Implementing a retry mechanism (e.g., retrying upon specific 503 Service Unavailable status codes) would dramatically improve the reliability of the client service.
```