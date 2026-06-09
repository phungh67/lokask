# 🛡️ WebSocket Authentication Middleware (`WebSocketInterceptor`)

**File:** `middleware/websocket_interceptor.go`
**Knowledge Base Focus:** Security Engineering, Infrastructure, System Design
**Version:** 1.0

***

## 💡 Overview

This middleware component, `WebSocketInterceptor()`, is designed to enforce necessary authentication and context setting specifically for incoming WebSocket upgrade requests within the application using the `gofiber` framework.

Its primary function is to act as a gatekeeper, ensuring that:
1. The incoming request is intended to upgrade to a WebSocket connection.
2. The request includes a required authorization token in the query parameters.
3. The necessary `user_id` context is available (usually injected by a preceding authentication middleware).

If any of these requirements fail, the connection is immediately rejected, preventing unauthorized access to the WebSocket endpoint.

## ⚙️ Detailed Implementation Analysis

The function returns a `fiber.Handler` which intercepts the request lifecycle.

### Execution Flow Diagram (Conceptual)

```mermaid
graph TD
    A[Incoming Request] --> B{Is WebSocket Upgrade?};
    B -- No --> C[Return fiber.ErrUpgradeRequired (426)];
    B -- Yes --> D{Token Present in Query?};
    D -- No --> E[Return 401 Unauthorized (Missing Token)];
    D -- Yes --> F{User ID Available in Locals?};
    F -- No --> G[Potential Panic/Error (User ID Missing)];
    F -- Yes --> H[Set/Verify User ID in Locals];
    H --> I[Proceed to Next Handler (c.Next())];
```

### Function Signature

```go
func WebSocketInterceptor() fiber.Handler { ... }
```

### Step-by-Step Logic Breakdown

1. **Protocol Check:**
   - `websocket.IsWebSocketUpgrade(c)`: Verifies if the request headers signal an intention to upgrade to the WebSocket protocol. If not, the request is dropped with `fiber.ErrUpgradeRequired`.

2. **Authentication Check (Token):**
   - `tokenString := c.Query("token")`: Attempts to retrieve the token from the URL query parameters (e.g., `ws?token=xyz`).
   - **Failure Path:** If `tokenString` is empty, the handler returns an explicit `401 Unauthorized` response, indicating missing credentials.

3. **Context Dependency (User ID):**
   - `userID := c.Locals("user_id").(string)`: This line assumes that a **preceding** middleware has successfully extracted and placed the authenticated `user_id` into the request context locals.
   - `c.Locals("user_id", userID)`: The retrieved `userID` is explicitly re-set into the context. While potentially redundant if the retrieval was successful, this action guarantees that the variable remains available for subsequent handlers, mitigating potential scope issues.

4. **Success:**
   - `return c.Next()`: If all checks pass, the request is allowed to proceed down the middleware chain to the final WebSocket handler.

## ⚠️ Security & System Considerations (Security Engineer Review)

### Security Flaws / Missing Logic (Critical)

The current implementation performs a **token presence check** but *does not validate the token*.

1. **Token Validation Gap:** The middleware merely checks if the `token` query parameter exists (`tokenString != ""`). It does *not* send this token to an authentication service (e.g., an Auth server or JWT library) to ensure it is valid, unexpired, or belongs to an active user.
2. **Authentication Dependency:** This middleware critically relies on the preceding logic to correctly populate `c.Locals("user_id")`. If the user ID is missing, a runtime panic will occur when attempting the type assertion `.(string)`.

### Infrastructure Recommendations

1. **Upstream Middleware Chain:** This middleware must be placed **after** any primary authentication middleware (e.g., a `JWTValidationMiddleware`) but **before** the final WebSocket handling logic.
2. **Context Naming:** Standardize the key used for the user ID across all middleware (e.g., always use `context:user_id` instead of `user_id` to prevent conflicts).

## 📝 Usage Notes & Best Practices

*   **Placement is Key:** Due to its dependency on `c.Locals("user_id")`, ensure the full middleware stack sequence is: `[Primary Authentication Middleware] -> [WebSocketInterceptor] -> [WebSocket Handler]`.
*   **Error Handling:** The explicit `SendString("Missing token")` is non-standard. For professional corporate APIs, the error message should be replaced with a standardized, non-descriptive message like "Authentication Failed" to avoid leaking implementation details to potential attackers.

## 🔔 Warnings / To-Do Items (To Be Completed)

| Item | Priority | Description | Owner |
| :--- | :--- | :--- | :--- |
| **Token Validation** | 🔴 Critical | The middleware must be updated to consume the `tokenString` and perform actual validation (e.g., JWT parsing, database lookup) to verify the token's integrity and expiration status. | Security Team |
| **Error Message Abstraction** | 🟡 High | Replace the literal error message "Missing token" with a generic, security-by-design response body to prevent information leakage. | Dev Team |
| **Null/Type Safety** | 🟡 Medium | Implement robust nil/type checks around `c.Locals("user_id")` to gracefully handle scenarios where the upstream middleware fails to populate the context. | Dev Team |
| **Logging** | 🔵 Low | Add structured logging (e.g., using `slog` or a dedicated logging library) whenever an authorization failure (401) occurs, noting the IP and failure reason. | Infrastructure Team |