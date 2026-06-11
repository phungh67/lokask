[⬅ Return to Main Compendium](../../README.md)

# 🛡️ Authentication Middleware: Session Protection (`middleware/protect.go`)

This document details the implementation of the `Protect` middleware, which is crucial for securing API routes by validating user sessions against a centralized Redis store.

## 📋 Overview

The `Protect` function acts as a gatekeeper middleware for routes that require an authenticated user. It implements a layered approach to retrieving the session token from multiple possible sources (Authorization Header, Cookies, or Query Parameters). Upon successful token retrieval, it validates the session using Redis. If valid, it refreshes the session expiry time and attaches the `user_id` to the request context for downstream handlers to use.

**Knowledge Base Focus:** Security Engineering, Infrastructure (Redis), Middleware Design.

## 🔍 Detail Analysis

### 1. Token Retrieval Logic
The middleware prioritizes token detection in the following order:

1.  **Authorization Header:** Checks the `Authorization` header (expects a Bearer token structure, extracting everything after the 7th character).
2.  **Cookies:** Checks for a cookie named `session_id`.
3.  **Query Parameters:** Checks for a `token` parameter in the URL query string.

If no token is found after these checks, the request is immediately rejected with a `401 Unauthorized` status.

### 2. Session Validation (Redis Interaction)
1.  **Key Construction:** A unique Redis key is constructed using the format `session:{token}`.
2.  **Data Fetch:** It attempts to retrieve the associated `user_id` from Redis using the client (`config.RedisClient`).
3.  **Failure Handling:** If Redis returns an error (indicating the key does not exist or the connection failed), the session is considered expired, and the request is rejected with a `401 Unauthorized` status ("Session expired").
4.  **Session Refresh:** If the token is successfully validated, the `RedisClient.Expire()` method is called to extend the session validity by **6 hours**, ensuring the user remains logged in during the active session time.
5.  **Context Enrichment:** The retrieved `userID` is attached to `c.Locals("user_id", userID)`, making it accessible to the subsequent handler logic.

### 🔗 Related Files and Flow

*   **`main.go` / `router.go`**: This middleware must be applied globally or to specific route groups within the main application router setup.
*   **`config/redis.go`**: Dependency injection relies heavily on the global `config.RedisClient` singleton for all database interactions.
*   **`handler/user.go` (Conceptual)**: Any downstream handler function must assume the `user_id` is available via `c.Locals("user_id")` to process protected endpoints.

## 💡 Notes & Best Practices

*   **Centralized Security:** Utilizing Redis for session storage is a robust pattern, decoupling session management from the application server and ensuring high availability and consistency across scaled instances.
*   **Token Layering:** The prioritized checking (Header > Cookie > Query) provides flexibility for clients and enhances usability by allowing different authentication methods to function while maintaining a clear priority structure.
*   **Efficiency:** The middleware design ensures that validation and refresh happen in a single request cycle, minimizing latency for authenticated users.

## ⚠️ Warnings & Tech Debt

### 🚨 Critical Security/Design Concern (High Priority)
**Hardcoded Token Extraction:** The line `token = authHeader[7:]` assumes the `Authorization` header always follows a fixed `Bearer ` prefix (7 characters). If the client sends a different scheme (e.g., `CustomToken ` or no scheme), this logic will fail silently or incorrectly extract the token.

*   **Recommendation:** Use `strings.SplitN` or regular expressions to reliably parse the token based on the scheme (e.g., checking for "Bearer ").

### 🧩 Infrastructure/Maintainability Concern (Medium Priority)
**Global Dependency:** The reliance on `config.RedisClient` makes unit testing difficult as the middleware cannot be easily mocked without affecting the global configuration state.

*   **Recommendation:** Refactor the `Protect` function to accept the Redis client dependency as an argument (or wrap the middleware logic in a struct that holds the client) to enable dependency injection and proper mocking for testing.

### 🐛 Functionality Gap (Low Priority)
**Error Message Specificity:** The error message `"Session expired"` is generic. While the middleware detects the key absence, a clearer distinction between "Token not found (Missing)" and "Token found but invalid/expired" would improve client-side error handling.

*   **Recommendation:** Consider checking the Redis error type (e.g., `redis.Nil`) to differentiate between a missing key and a connection failure.