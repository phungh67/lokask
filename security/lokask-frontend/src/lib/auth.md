[⬅ Return to Main Compendium](../../README.md)

# 🔐 Authentication Client Utilities (`src/client/auth/auth.ts`)

## 📋 Overview

This module provides client-side helper functions to interact with the core authentication endpoints (`/auth/register`, `/auth/login`, `/auth/me`). It handles data preparation (payload construction) and calling the centralized `fetchJson` utility. The file defines structured interfaces for input data (`RegisterData`, `LoginData`) and expected responses (`AuthResponse`).

The functions cover the primary user flows:
1. **Traveller Registration:** (`registerTraveller`)
2. **Consultant Registration:** (`registerConsultant`)
3. **Login:** (`login`)
4. **Get User Profile:** (`getMe`)

***

## 🔎 Security & Vulnerability Analysis

### 🛡️ Detail

#### Identified Vulnerabilities/Risks

| Function/Object | Vulnerability/Risk | Description | Priority |
| :--- | :--- | :--- | :--- |
| `registerData` / `registerConsultantData` | **Plaintext Password Transmission** | Passwords are sent directly over the wire (even if HTTPS is assumed). While secure transport is assumed, the client layer should ideally utilize secure mechanisms like OAuth flows or dedicated password hashing handling (though this is usually a backend concern). | Medium |
| `registerConsultant(data)` | **Lack of City Validation/Sanitization** | The `city` field is treated as a simple string. If this data is passed through multiple systems, insufficient validation on the client side (e.g., format, enumeration check) could lead to unexpected or malformed data in the database. | Low |
| `getMe()` / All Functions | **Trust Boundary Assumption** | The functions assume successful response typing (e.g., `AuthResponse`). Failure handling (network failure, unauthorized access, invalid token) must be robustly implemented in the consuming service to prevent unexpected runtime errors. | Medium |
| All functions | **Error Handling (Missing)** | The `fetchJson` utility likely swallows network or API-level errors. The calling functions should incorporate explicit `try...catch` blocks to handle API failures gracefully (e.g., invalid credentials, server down, rate limiting). | High |

#### Payload/Object Vulnerabilities

*   **`AuthResponse`:** The inclusion of `consultant_id?` suggests potentially different user ID types depending on the role. If the backend is susceptible to ID format manipulation (e.g., SQL injection via ID usage, although unlikely here), the client should strictly type-check these fields.

### ⚠️ Warning (Critical Issues/Missing Logic)

1. **Authentication Mechanism:** This client structure is highly dependent on a working token mechanism. **The implementation does not show where the returned token from `login()` is stored or passed to subsequent protected calls (like `getMe()`).** The `getMe()` function must therefore rely on an implicit cookie, local storage, or HTTP header management system that is not visible in this scope. This is the most critical logic gap.
2. **State Management:** This file only contains API wrappers. The consumption logic for tokens and user state must be documented and handled by a dedicated state management layer (e.g., React Context, Redux store) to prevent session hijacking or accidental token misuse.

### 📝 Note (Tech Debt & Improvement Suggestions)

*   **Dedicated API Client:** As the application grows, abstracting these endpoints into a dedicated `AuthClient` class/module would improve encapsulation and allow for centralized interceptors (e.g., attaching the access token header automatically to *all* requests, including `getMe()`).
*   **Environment Specificity:** Consider separating development/staging/production API endpoints using environment variables instead of hardcoding the assumption that `/api/v1/` is correct.
*   **Password Handling:** While not strictly a client-side vulnerability, best practice dictates minimizing the use of client-side code that handles raw passwords.

***

## 🛠️ Technical Implementation Details

### 🚀 Functions Detailed Analysis

#### `registerTraveller(data: RegisterData)`
*   **Flow:** POST request to `/auth/register`.
*   **Payload Check:** Successfully maps `data` fields plus `role: "traveler"`.
*   **Linking:** Needs to link to the backend implementation, likely located at `../api/v1/auth/register-traveller-handler.go` or similar.

#### `registerConsultant(data: RegisterConsultantData)`
*   **Flow:** POST request to `/auth/register`.
*   **Payload Check:** Correctly handles the extra `city` field and sets `role: "consultant"`.
*   **Linking:** Needs to link to the backend implementation, likely located at `../api/v1/auth/register-consultant-handler.go`.

#### `login(data: LoginData)`
*   **Flow:** POST request to `/auth/login`.
*   **Payload Check:** Simple and effective for credential transmission.
*   **Linking:** Needs to link to the backend authentication logic, e.g., `../middleware/auth-login-checker.go`.

#### `getMe()`
*   **Flow:** GET request to `/auth/me`.
*   **Dependencies:** **Crucially depends on the middleware to extract the authentication token from headers or cookies.**
*   **Linking:** Must explicitly link to the middleware/handler responsible for user context retrieval: `../middleware/auth-context-extractor.go`.

***

## 📊 Summary of Vulnerability Priority

| Priority | Scope | Details |
| :--- | :--- | :--- |
| **High** | Error Handling (`*`) | Missing robust `try...catch` and explicit API failure handling across all calling functions. |
| **Medium** | `getMe()` / All functions | Critical dependency on unseen state management for token passing (Auth Context). |
| **Medium** | Data Transmission (`*`) | Direct transmission of raw passwords (potential interception risk if transport is mishandled). |
| **Low** | `registerConsultant` | Insufficient client-side validation for non-critical attributes like `city`. |