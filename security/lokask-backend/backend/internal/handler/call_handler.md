[⬅ Return to Main Compendium](../../README.md)

# 📺 Video Calling Handlers Analysis

## 📄 Overview

This module handles real-time video call connectivity and message passing using WebSockets. It manages rooms based on a `bookingID` and allows multiple clients to join, read messages, and broadcast them to others in the same room. The core logic resides in `VideoCallHandler`.

The design uses global maps (`CallHub.Rooms`) protected by mutexes (`sync.RWMutex`) to manage room state and client connections.

---

## 🔍 Security Vulnerability Summary

| Resource/Function | Vulnerable Component | Vulnerable Payload/Object | Priority | Description |
| :--- | :--- | :--- | :--- | :--- |
| `VideoCallHandler` | Client Authentication/Authorization | `c.Locals("user_id")` | **HIGH** | Reliance on `c.Locals("user_id")` without explicit JWT validation means the `user_id` can be spoofed or manipulated, bypassing authentication checks. |
| `VideoCallHandler` | Resource Management | `bookingID` (Query Param) | **MEDIUM** | Lack of input validation/sanitization on `bookingID` could lead to room enumeration or potential resource misuse if the ID format is predictable. |
| `VideoCallHandler` | Concurrency/Data Safety | `room.Clients` map | **MEDIUM** | While mutexes are used, the sequence of locking/unlocking, especially around reading/writing/deleting connections, must be meticulously reviewed to prevent deadlocks or race conditions. |
| `VideoCallHandler` | Message Handling | `msg` (ReadMessage payload) | **LOW** | Messages are broadcast without content validation (e.g., rate limiting, size limits, malicious content checking). |

---

## 🧩 Detailed Analysis

### File: `handler/video_call_handler.go`

#### 🚀 Component Details

1.  **`VideoRoom` Struct:** Manages connections (`Clients`) for a single call room, protected by `mu` (RWMutex).
2.  **`VideoHub` Struct:** Manages all active rooms (`Rooms`), protected by `mu` (RWMutex).
3.  **`CallHub`:** Global instance of `VideoHub`.
4.  **`VideoCallHandler(c *websocket.Conn)`:** The main handler logic. It performs connection joining, message reading, message broadcasting, and eventual cleanup.

#### 🗒️ Code Flow / Logic Walkthrough

1.  **Authentication & Setup:** Extracts `user_id` from `c.Locals()` and `bookingID` from query params. **Crucial flaw:** Trusting `c.Locals()` without verification.
2.  **Room Initialization:** Locks `CallHub`, checks if the room exists for the given `bookingID`, and initializes it if necessary.
3.  **Client Join:** Locks `room` and adds `user_id` to `room.Clients`.
4.  **Listening Loop (`for {}`):** Enters a continuous loop reading messages (`c.ReadMessage()`).
5.  **Broadcast:** Acquires `room` lock. Iterates over all clients. If the sender is not the recipient, it writes the message to the other connection.
6.  **Cleanup:** Upon connection error (break), it acquires `room` lock, removes the sender's ID from the room's client map.

#### 💡 Implementation Notes

*   **Concurrency:** The use of `sync.RWMutex` is appropriate for protecting shared maps (`Clients` and `Rooms`).
*   **Error Handling:** The loop correctly breaks when `c.ReadMessage()` fails (indicating disconnection).
*   **Global State:** Using a global variable (`CallHub`) makes testing difficult and increases the risk of unexpected state contamination in a multi-threaded environment if the initialization or shutdown is not handled properly.

#### ⚠️ Warnings & Tech Debt

1.  **Global State Management:** Relying on the global `CallHub` is poor practice. The application should implement a proper lifecycle manager (e.g., an `Init()` or `Shutdown()` method) to gracefully close connections and clean up all resources when the application exits.
2.  **Lock Granularity:** While locks are used, the scope of the `room` lock during the broadcast loop (`room.mu.Lock()`/`room.mu.Unlock()`) is quite wide. If `WriteMessage` is blocking, it could potentially hold the lock longer than necessary, impacting concurrency for other clients joining or leaving the room.
3.  **Type Assertions:** The line `userID := c.Locals("user_id").(string)` uses a dangerous type assertion. If `c.Locals("user_id")` is missing or holds a different type, the application will panic. Defensive programming (e.g., `v, ok := c.Locals("user_id").(string); if !ok { ... }`) is required.

#### 🛡️ Security Vulnerabilities

##### 🔴 High Priority: Authentication and Authorization Bypass
*   **Vulnerability:** The `userID` is extracted from `c.Locals("user_id")` without any backend validation (like checking a secure JWT or session cookie attached to the request context).
*   **Impact:** An attacker could potentially intercept or craft a WebSocket message that makes the server believe they are a different user, allowing them to impersonate others within the room, leading to privacy breaches or targeted harassment.
*   **Mitigation:** The handler MUST require a robust middleware that validates the connection token (e.g., JWT) and securely injects the validated `user_id` into the connection context, ensuring that the context data cannot be manipulated.

##### 🟡 Medium Priority: Input Validation (Room ID)
*   **Vulnerability:** The `bookingID` (derived from `c.Query("booking_id")`) is used directly to key the room map. If the ID is not validated for format (e.g., UUID, alphanumeric constraints), or if there are rate limits on room creation, it could lead to resource exhaustion or enumeration.
*   **Impact:** Minor resource drain or ability to test room IDs sequentially if they follow a predictable pattern.
*   **Mitigation:** Implement strict validation on `bookingID` (e.g., regex matching) and possibly restrict the source of these IDs to an authenticated API endpoint rather than allowing them directly through query parameters.

##### 🟡 Medium Priority: Concurrency Safety
*   **Vulnerability:** The cleanup logic (`delete(room.Clients, userID)`) happens *after* the main function scope exits due to an error/disconnect. While guarded by locks, race conditions could occur if the room map structure is modified concurrently by other parts of the system (e.g., a dedicated "Room Manager" service).
*   **Mitigation:** Ensure that the cleanup logic is atomic and that the entire resource teardown process (including notifying other clients that the user left) is managed by a dedicated, well-locked service layer, rather than relying solely on the handler exit scope.

---

### 🔗 Reference Links

*   **Authentication Flow:** Check for required middleware validation logic in `../middleware/auth.go` (Needs to ensure JWT validation).
*   **Room Management Service:** Logic for room creation and destruction should be centralized in a dedicated package, e.g., `../../service/room_manager.go`.

***

## 📊 Conceptual Diagrams

### Data Flow: WebSocket Connection & Message Broadcast

*(A simple flow diagram would be highly beneficial here, illustrating the flow through `VideoCallHandler`)*

1.  **(Client A)** sends message $\rightarrow$
2.  **`VideoCallHandler`** reads message $\rightarrow$
3.  **`VideoCallHandler`** acquires `room.mu` lock $\rightarrow$
4.  **`VideoCallHandler`** iterates over `room.Clients` $\rightarrow$
5.  **`VideoCallHandler`** writes message to all other clients $\rightarrow$
6.  **`VideoCallHandler`** releases `room.mu` lock.

*(This diagram would visually highlight the critical section protected by `room.mu`.)*