# 🔒 Route Protection Middleware (`Protect`)

This document provides a comprehensive guide and technical specification for the `Protect` middleware function. This middleware is responsible for authenticating incoming requests, validating the user's session token against a central data store (Redis), and ensuring the session is refreshed for active users.

## 💡 Overview

The `Protect` middleware implements a critical security layer for protected API routes. Its primary function is to extract a valid user token from multiple potential sources (HTTP Headers, Cookies, Query Parameters) and then verify the token's existence and validity in Redis. If successful, the middleware injects the user ID into the request context, allowing downstream handlers to access the authenticated user's details.

**Component:** Authentication/Authorization Middleware
**Knowledge Domains:** System Design, Security Engineering, Infrastructure (Caching/Redis)
**Technology Stack:** Go (fiber/v2), Redis

## 🛠️ Detailed Analysis

The middleware operates in three distinct phases: Token Extraction, Token Validation, and Session Management.

### 1. Token Extraction Strategy (The Fallback Logic)

The middleware employs a robust fallback mechanism to locate the authentication token in the following order:

1.  **Authorization Header:** Checks `c.Get("Authorization")`. It assumes a standard Bearer scheme and strips the initial characters (specifically `Bearer ` or similar prefix based on the `len(authHeader) >= 8` check).
2.  **Cookie:** Checks for a cookie named `session_id` using `c.Cookies("session_id")`.
3.  **Query Parameter:** Checks for a plain `token` parameter in the request query string (`c.Query("token")`).

*If none of the above yield a token, the request is rejected with HTTP 401.*

### 2. Token Validation (Redis Interaction)

Upon successful extraction, the middleware constructs a unique Redis key using the format: `session:{token}`.

1.  **Lookup:** It attempts to retrieve the `userID` associated with this key from `config.RedisClient`.
2.  **Failure Handling:** If Redis returns an error (e.g., connection timeout, key not found), the middleware assumes the session is invalid or expired and rejects the request with HTTP 401 ("Session expired").
3.  **Context Injection:** If the lookup succeeds, the retrieved `userID` is stored in the Fiber context using `c.Locals("user_id", userID)`.

### 3. Session Management (Heartbeat Refresh)

A key component of the security pattern is the automatic session renewal. After successfully validating the user token, the middleware executes:

```go
config.RedisClient.Expire(c.Context(), key, 6*time.Hour)
```

This action acts as a "session heartbeat," resetting the expiry time for the user's session in Redis to 6 hours, ensuring the user remains logged in for the duration of the session.

***

## 📝 Documentation Notes & Best Practices

*   **Idempotency:** This middleware is designed to be called early in the routing chain and should be applied globally or to specific groups of routes requiring authentication.
*   **Storage Pattern:** The implementation uses Redis as a **Session Store**. The token itself is used as the key identifier, and the value stored (`userID`) represents the authenticated user identity.
*   **Token Type Assumption:** The middleware assumes the tokens retrieved are session identifiers or opaque tokens (i.e., tokens that only grant validity when looked up against an internal session store like Redis), rather than self-contained formats like JWTs (which would typically validate signature locally without a database call).
*   **Middleware Order:** Ensure that services that need user context access (`user_id`) are placed *after* this `Protect()` middleware in the routing configuration.

## ⚠️ Warnings & Items Left Unfinished (TODOs)

### ❌ Security & Robustness
1. **Error Logging:** The use of `fmt.Printf` for logging (`[INFO] MIDDLEWARE: ...`) is not production-grade. It should be replaced with a structured logging library (e.g., `log/slog` or a company-specific wrapper) to ensure logs capture necessary context (request IP, route path, etc.).
2. **Input Validation:** The token extraction logic assumes specific prefixes (e.g., stripping 7 bytes from the `Authorization` header). A more robust check using regex or a dedicated library would prevent potential off-by-one errors or incorrect token parsing.
3. **Key Generation Security:** While using a private Redis instance mitigates exposure, the entire session life cycle relies on the secrecy of the Redis connection. Connection pooling and secret management (e.g., Vault) must be strictly enforced.

### ⏳ Development & Reliability
1. **Time Handling:** The `6*time.Hour` expiration is hardcoded. This constant should be extracted into a configuration struct (e.g., `config.SessionExpiryDuration`) to allow environmental changes without code modification.
2. **Context Key Collision:** While unlikely, if multiple middlewares use `c.Locals("user_id", ...)` without coordinating, a collision could occur. Defining a unique context key namespace (e.g., `UserContextKey`) would improve type safety and prevent conflicts.
3. **Rate Limiting Integration:** This middleware only validates *existence*. To mitigate brute-force attacks on expired sessions, integrating rate limiting (e.g., using a Redis counter to limit login attempts per IP address) should be implemented before the Redis lookup.

***
### ⚙️ Component Structure Diagram (Conceptual)

```mermaid
graph TD
    A[Incoming Request] --> B{Middleware: Protect()};

    subgraph Token Acquisition
        B --> B1{Check 1: Authorization Header};
        B1 --> B2{Check 2: Cookies (session_id)};
        B2 --> B3{Check 3: Query Param (token)};
        B3 --> C{Token Found?};
        C -- No --> D[Return 401: Missing Token];
        C -- Yes --> E{Construct Redis Key};
    end

    E --> F[Redis Client: GET UserID];
    F --> G{Key Found?};
    G -- No/Error --> H[Return 401: Session Expired];
    G -- Yes --> I[Action: Redis EXPIRE (6 Hrs)];
    I --> J[Set Context: user_id];
    J --> K[c.Next() -> Next Handler];
```