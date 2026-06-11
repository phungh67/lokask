```markdown
[⬅ Return to Main Compendium](../../README.md)

# Auth Client Services API Layer

This module encapsulates all client-side logic necessary to interact with the authentication service endpoints. It provides typed functions for registration (Traveler & Consultant), login, and retrieving the currently authenticated user's details.

## 🗂️ File Structure & Navigation
*   [Authentication Client Services](AUTH_CLIENT/README.md) *Current File*
*   `../core`: Utility function for making JSON requests (`fetchJson`).
*   `../middlerware/auth`: (Conceptual link) Location where the server-side authentication middleware is implemented.

---

## 🌟 Overview

This file serves as the single source of truth for consuming authentication APIs from the client side. By using dedicated functions like `registerTraveller` or `login`, we ensure type safety and consistent request formatting, abstracting away the details of `fetchJson` calls and request bodies.

**Key Components:**
1.  **Interfaces:** Strongly type the data required for registration, login, and the expected response structure.
2.  **Service Functions:** Asynchronous functions that handle API calls to specific endpoints (`/auth/register`, `/auth/login`, `/auth/me`).

## 📜 Detail Analysis

### 💡 Data Interfaces

| Interface | Purpose | Fields | Notes |
| :--- | :--- | :--- | :--- |
| `RegisterData` | Base data for any user registration. | `fullName`, `email`, `password` | Core credential set. |
| `RegisterConsultantData` | Extended data for Consultant registration. | `...RegisterData`, `city` | Adds location specificity for consultants. |
| `LoginData` | Data required for user authentication. | `email`, `password` | Minimal set of credentials needed for login. |
| `AuthResponse` | Standardized successful response format. | `token`, `user` (object) | Contains the JWT token and user profile details. |

### 🚀 Client Service Functions

| Function | Endpoint | Method | Description | Inputs | Output |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `registerTraveller(data)` | `/auth/register` | POST | Registers a new user with the "traveler" role. | `RegisterData` | `AuthResponse` |
| `registerConsultant(data)` | `/auth/register` | POST | Registers a new user with the "consultant" role. | `RegisterConsultantData` | `AuthResponse` |
| `login(data)` | `/auth/login` | POST | Authenticates an existing user and retrieves a token. | `LoginData` | `AuthResponse` |
| `getMe()` | `/auth/me` | GET | Retrieves the profile of the currently logged-in user. | None | `AuthResponse` (Partial User Data) |

***Conceptual Flow Logic:***
1.  **Registration:** Calls `/auth/register` with role-specific data.
2.  **Login:** Calls `/auth/login` with credentials.
3.  **Session Management:** `getMe()` is critical for refreshing user data or checking token validity without re-logging in (e.g., on page load or tab switch).

## 🗒️ Note (Implementation Insights & Best Practices)

1.  **`fetchJson` Utility:** The dependency `fetchJson` from `./core` is assumed to handle request execution, JSON stringification/parsing, and basic error handling (e.g., status code checks).
2.  **Role Separation:** The separation of `registerTraveller` and `registerConsultant` functions is excellent practice, ensuring that the correct and necessary data payload is always sent based on the user type.
3.  **`getMe` Use Case:** The comment indicates `getMe()` is intended to "keep session between F5 or switch tabs." In a production system, this call should be integrated into a background refresh mechanism (e.g., using an interval or listener) to proactively detect token expiry before the user attempts to access a protected resource.

## ⚠️ Warning (Tech Debt & Action Items)

1.  **Error Handling:** All service functions currently assume success. **Critical Improvement Needed:** Implement comprehensive `try...catch` blocks within these functions (or within `fetchJson`) to handle network failures, API 4xx errors (e.g., bad credentials), and 5xx errors gracefully.
2.  **Token Management:** The client code receives the `token` in `AuthResponse`. There is no observable logic for where or how this token is stored (e.g., `localStorage`, secure cookie). **Action Item:** Define and enforce a secure, standardized pattern for token storage and attachment to outgoing headers (e.g., `Authorization: Bearer <token>`).
3.  **Type Safety for `getMe`:** The `getMe` function uses `fetchJson<any>("/auth/me")`. This sacrifices type safety. **Correction:** The expected return type for `getMe` should be explicitly defined, likely mirroring or being a subset of the user object within `AuthResponse`.

---
***Internal API Linkage Detail:***
*   The backend endpoint definitions for `/api/v1/auth/register`, `/api/v1/auth/login`, and `/api/v1/auth/me` must align perfectly with the intended request body structure, especially regarding the required `role` field and the `city` field.
```