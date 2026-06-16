```markdown
[⬅ Return to Main Compendium](../../README.md)

# Video Call Handling (`handler/video_call.go`)

## 📜 Overview

This module handles the WebSocket connection logic for a video call system. It maintains global state management for video rooms (`VideoHub`) and individual rooms (`VideoRoom`), mapping bookings IDs to sets of connected users. The primary function, `VideoCallHandler`, manages user joining, message broadcasting, and resource cleanup upon disconnection.

**Dependencies:**
*   `github.com/gofiber/contrib/websocket`: Used for handling WebSocket connections.
*   `sync`: Used for protecting shared map resources (mutexes).

---

## 🔎 Vulnerability Assessment

The current implementation exhibits several critical security and reliability flaws related to authentication, resource leakage, and concurrency management.

### ⚠️ Warning (Tech Debt / Priority Focus)

1.  **Global State Management:** Using global variables like `CallHub` is difficult to test, scale, and manage in a highly concurrent environment. A service struct or dependency injection pattern should be adopted.
2.  **Lack of Room Cleanup:** When a room becomes empty (i.e., all users disconnect), the `VideoRoom` object remains permanently stored in `CallHub.Rooms`, leading to memory leaks and stale state.
3.  **Error Handling:** The `log.Printf` statements are insufficient. Critical connection failures or improper data type assertions should trigger robust error handling, potentially disconnecting the user and alerting monitoring systems.

### 🚨 High Priority Vulnerabilities (Must Fix)

| Function/Object | Vulnerability | Description | Impact |
| :--- | :--- | :--- | :--- |
| `c.Locals("user_id")` | **Insecure/Missing Authentication Check (AuthN/AuthZ)** | The `userID` is retrieved directly from `c.Locals("user_id")` without validating the underlying JWT or session token. If the preceding middleware is bypassed or compromised, an attacker can impersonate any user. | **High.** Complete account impersonation; critical for all subsequent actions. |
| `VideoCallHandler` (Cleanup) | **Resource Leak / Denial of Service (DoS)** | When the last user leaves a room, the `VideoRoom` object persists in `CallHub.Rooms`. This constitutes a memory leak and eventually causes the hub to fail when accessing the map. | **High.** System instability and memory exhaustion under high traffic. |
| `VideoCallHandler` (Logic) | **Missing Authorization Check** | The code assumes any user with a valid `bookingID` can join. There is no check to ensure the user is *actually* authorized or paid for participation in that specific `bookingID`. | **High.** Unauthorized access to private/paid resources. |

### 🟡 Medium Priority Vulnerabilities (Should Fix)

| Function/Object | Vulnerability | Description | Impact |
| :--- | :--- | :--- | :--- |
| `VideoCallHandler` (Concurrency) | **Race Condition in Room Joining** | While mutexes are used, the sequence of checks (e.g., `if CallHub.Rooms[bookingID] == nil`) followed by operations is prone to race conditions if other handlers interact with `CallHub` simultaneously. | **Medium.** Intermittent connectivity issues or incorrect state reporting. |
| `room.mu.Lock()` / `room.Clients` | **Broadcast Vulnerability** | The broadcasting logic uses `range room.Clients`. If another goroutine modifies `room.Clients` (e.g., another user connects/disconnects) while the loop is running, it could cause a panic or data race. | **Medium.** System crash (panic) under concurrent connection changes. |

### 🟢 Low Priority Vulnerabilities (Nice to Fix)

| Function/Object | Vulnerability | Description | Impact |
| :--- | :--- | :--- | :--- |
| `VideoCallHandler` | **Logging Detail** | The logging is basic. Incorporating structured logging (JSON) or adding context identifiers (e.g., request ID) would improve operational visibility. | **Low.** Maintainability and debugging effort. |

---

## 💡 Implementation Details & Flow Analysis

### `VideoRoom` Struct
*   `Clients`: Stores active connections (`map[string]*websocket.Conn`).
*   `mu`: Read/Write mutex protecting access to the `Clients` map.

### `VideoHub` Struct
*   `Rooms`: Global map of active video rooms (`map[string]*VideoRoom`).
*   `mu`: Read/Write mutex protecting access to the `Rooms` map.

### Key Function: `VideoCallHandler`

1.  **Input Acquisition:** Extracts `userID` (from context/locals) and `bookingID` (from query params).
2.  **Room Initialization (Critical Section):** Uses `CallHub.mu` lock to ensure thread-safe creation and retrieval of the `VideoRoom` object based on `bookingID`.
3.  **User Joining:** Uses `room.mu` lock to safely add the new connection (`c`) to `room.Clients`.
4.  **Message Loop:**
    *   Reads incoming messages (`c.ReadMessage()`).
    *   If successful: Locks `room.mu`, iterates over all other connections, and broadcasts the message (`otherConn.WriteMessage`).
    *   If failure (`err != nil`): Logs disconnection and exits the loop.
5.  **Cleanup (On Exit):** Locks `room.mu` to remove the user from `room.Clients`. **(NOTE: The room itself is NOT removed from `CallHub.Rooms`)**.

---

## 🔗 Internal Navigation Links

| Component | Link | Purpose |
| :--- | :--- | :--- |
| Video Call Logic Flow | [../middlerware/auth_middleware.go](../middlerware/auth_middleware.go) | *Check:* Ensure `c.Locals("user_id")` is reliably set by validating JWT tokens here. |
| Global State Management | [../model/hub.go](../model/hub.go) | *Review:* Consider refactoring `CallHub` into a properly managed, injectable service instance rather than a global variable. |
| Connection Management | [../util/websocket_manager.go](../util/websocket_manager.go) | *Refactor:* Implementing a dedicated `Room.AddClient()` and `Room.RemoveClient()` method that automatically checks for zero clients and signals the calling hub to perform cleanup. |

---

## 📈 Conceptual Diagram: Call Hub Lifecycle

```mermaid
graph TD
    A[Client Connects WebSocket] --> B{VideoCallHandler};
    B --> C{Auth Check & ID Extraction};
    C -- Fail --> Z[Reject Connection];
    C -- Success --> D{Lock CallHub.mu};
    D --> E{Check/Create VideoRoom(bookingID)};
    E --> F{Lock VideoRoom.mu};
    F --> G[Add User ID to Clients Map];
    G --> H[Start Message Loop];
    H --> I{Read Message};
    I -- Success --> J[Broadcast to All Other Clients];
    I -- Fail (User Disconnects) --> K[Cleanup: Remove User From Clients];
    K --> L{Is Room Empty?};
    L -- Yes --> M[Cleanup CallHub: Delete Room from Global Map];
    L -- No --> N[Wait for Next Message];
```
*Self-Correction:* The current code only handles step K (remove user) but skips step M (remove room from global map). This diagram highlights the necessary addition.
```