# 🌐 WebSocket WebSocketInterceptor Middleware

This middleware intercepts incoming HTTP requests specifically designed to handle WebSockets. It ensures that the connection attempts are legitimate upgrades and that necessary authorization parameters (like the JWT token and user context) are present before allowing the request to proceed to the main WebSocket handler logic.

[⬅ Return to Main Compendium](../../README.md)

---

## ✨ Overview

The `WebSocketInterceptor` is a crucial layer of defense (middleware) responsible for gating WebSocket connections. Its primary function is twofold: first, to verify that the client is attempting a WebSocket protocol upgrade, and second, to validate that authentication artifacts (specifically, a JWT token and a pre-fetched `user_id`) are present within the request context and query parameters.

This interceptor acts as an early exit point. If the request is not a WebSocket upgrade, or if the required credentials are missing, the connection is immediately rejected with an appropriate HTTP status code, preventing unauthorized access or protocol misuse.

### Code Snippet

```go
package middleware

import (
	"github.com/gofiber/contrib/websocket"
	"github.com/gofiber/fiber/v2"
)

func WebSocketInterceptor() fiber.Handler {
	return func(c *fiber.Ctx) error {
		if websocket.IsWebSocketUpgrade(c) {

			// take the JWT token
			tokenString := c.Query("token")
			if tokenString == "" {
				return c.Status(fiber.StatusUnauthorized).SendString("Missing token")
			}

			userID := c.Locals("user_id").(string)

			c.Locals("user_id", userID)

			return c.Next()
		}

		return fiber.ErrUpgradeRequired
	}
}
```

---

## 🔬 Detail Analysis

### 1. Protocol Check (`if websocket.IsWebSocketUpgrade(c)`)
The middleware first determines the nature of the incoming request. `gofiber/contrib/websocket` provides a utility function to check if the client is requesting an HTTP upgrade to the WebSocket protocol.
*   **Success:** If true, the logic proceeds to authentication steps.
*   **Failure:** If false, the function immediately returns `fiber.ErrUpgradeRequired`, signaling that the client must use a WebSocket handshake.

### 2. Token Validation (Query Parameter Check)
The code retrieves the token from the URL query parameters (`c.Query("token")`).
*   If `tokenString` is empty, the middleware fails fast, returning `401 Unauthorized` and instructing the client that the token is missing.
*   *Note: While the token is read, no actual validation (expiration, signature check) occurs in this middleware; this implies validation happens elsewhere or is skipped for simplicity.*

### 3. Context Retrieval and Redundancy
1.  **Retrieve User ID:** The `user_id` is retrieved from the request context locals (`c.Locals("user_id").(string)`). This strongly suggests that a preceding middleware (like a general authentication middleware or token parser) has successfully processed the request and populated the `user_id`.
2.  **Set User ID:** The middleware then explicitly sets `c.Locals("user_id", userID)`. While functionally correct, this step is redundant if the value was successfully retrieved from `c.Locals()`, but it serves as a safeguard or a clear declaration of the expected context state for the downstream handler.

### 4. Flow Continuation
If all checks pass (WebSocket, Token present, User ID present), `c.Next()` is called, allowing the request to proceed to the main WebSocket connection handler.

---

## 📘 Technical Context & Dependencies

*   **Dependencies:** This middleware relies heavily on two preceding mechanisms:
    1.  **Initial Authentication Middleware:** A middleware must run *before* this one to successfully execute `c.Locals("user_id")`. This service is responsible for validating the initial token and populating the context. *(See: `../middleware/auth.go`)*
    2.  **Client Implementation:** The client must correctly pass the JWT token via the URL query parameter (`?token=...`) during the WebSocket connection handshake.

*   **Error Handling Flow:**
    *   Unauthorized (Missing Token): $\rightarrow$ Returns `401`.
    *   Protocol Mismatch: $\rightarrow$ Returns `426 Upgrade Required` (`fiber.ErrUpgradeRequired`).

---

## ⚠️ Warnings and Tech Debt (Action Items)

### 🚩 1. Security Concern: Token Transmission via Query Params
**High Priority:** Passing JWT tokens in query parameters (`?token=...`) is insecure because the token may be logged in server access logs, proxy caches, or browser history.
**Recommendation:** The token should ideally be passed via a more secure method during the initial handshake, such as a custom HTTP header (e.g., `X-Auth-Token`).

### 🚩 2. Missing Token Validation Logic
The middleware checks for the *existence* of the token, but it **does not validate its integrity, expiration, or signature**.
**Recommendation:** If this middleware is the designated point for authentication checks, it should call an external token service or library to perform full JWT validation *before* proceeding to `c.Next()`.

### 🚩 3. Context Redundancy
The lines retrieving and then resetting `user_id` are redundant:
```go
userID := c.Locals("user_id").(string) // Read
c.Locals("user_id", userID)             // Write (using the same value)
```
While harmless, this suggests the context handling flow could be simplified, or the comment should explicitly state *why* this value is being re-asserted.

---

## 💡 Notes and Design Decisions

*   **Scope:** This middleware is narrowly scoped only to WebSockets. It will explicitly reject non-WebSocket traffic, making its usage precise but requiring careful placement within the routing chain.
*   **Efficiency:** The structure utilizes `if/else` checks for protocol type, ensuring that resource-intensive authentication logic is only executed if `websocket.IsWebSocketUpgrade(c)` returns true.
*   **Coupling:** This middleware demonstrates tight coupling with the preceding authentication middleware, as its core functionality (`user_id` retrieval) is entirely dependent on the successful execution of another component in the chain.

### Related Logic Flow Diagram

(Conceptual Figure: This diagram illustrates the required execution order.)

```mermaid
graph TD
    A[Client Request] -->|Initial HTTP Handshake| B{WebSocketInterceptor};
    B -->|Is WebSocket Upgrade?| B_check{Yes};
    B -->|Is WebSocket Upgrade?| B_fail{No};
    B_fail --> C[Return 426 Error];
    B_check --> D{Token Present?};
    D -->|No| E[Return 401 Error];
    D -->|Yes| F{User ID in Locals?};
    F -->|No| E;
    F -->|Yes| G[Set/Confirm User ID Context];
    G --> H[Call c.Next()];
    H --> I[WebSocket Handler Logic];
```

---
**Related Files:**

*   **Authentication Flow (Prerequisite):** `../middleware/auth.go` (Responsible for setting `c.Locals("user_id")`)
*   **Core WebSocket Handlers:** `../../handlers/websocket_handler.go` (The function that executes after this middleware passes)