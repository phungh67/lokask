[⬅ Return to Main Compendium](../../README.md)

# 📞 Real-Time Video Call Handling Service

This module (`handler`) implements the core logic for managing real-time, multi-user video conference rooms using WebSockets. It handles user joining, room synchronization, message broadcasting, and graceful disconnection cleanup.

---

## 📂 Module Structure & Navigation

*   [Overview](#overview)
*   [Detailed Implementation](#detailed-implementation)
    *   [Components](#components)
    *   [VideoCallHandler Flow](#videocallhandler-flow)
*   [⚠️ Development Notes & Technical Debt](#⚠️-development-notes--technical-debt)
*   [🛠️ Deployment & Usage](#deployment--usage)

---

## 💡 Overview

The `VideoCallHandler` serves as the primary WebSocket entry point for video call participation. It utilizes a central `VideoHub` to manage multiple independent video rooms, where each room corresponds to a unique `bookingID`.

The service ensures that connection state is managed concurrently using Go's synchronization primitives (`sync.RWMutex`). Upon successful connection, the user is registered in the corresponding room, and the handler enters a message consumption loop, broadcasting every received message to all other active participants in that room.

**Related Components:**
*   Authentication Middleware (`../middleware/jwt`): Required to validate `user_id` context.
*   Booking Service (`../service/booking`): Used to confirm the existence and validity of the `booking_id`.

---

## ⚙️ Detailed Implementation

### Components

#### `VideoRoom`
Represents a single video conference room (tied to one `bookingID`).

| Field | Type | Description | Purpose |
| :--- | :--- | :--- | :--- |
| `Clients` | `map[string]*websocket.Conn` | Map storing active connections. Key is the User ID. | Tracks who is currently in the room. |
| `mu` | `sync.RWMutex` | Read/Write Mutex. | Ensures safe concurrent access to `Clients`. |

#### `VideoHub`
The central registry for all active video rooms.

| Field | Type | Description | Purpose |
| :--- | :--- | :--- | :--- |
| `Rooms` | `map[string]*VideoRoom` | Map where the key is the `bookingID`. | Allows quick retrieval of the correct room based on the booking. |
| `mu` | `sync.RWMutex` | Read/Write Mutex. | Ensures safe concurrent access to the entire `Rooms` map. |

### 🖥️ `VideoCallHandler` Flow

This function manages the entire lifecycle of a user in a video room.

1.  **Context Extraction & Validation:**
    *   Retrieves the `userID` from the WebSocket connection's locals (requires preceding middleware).
    *   Extracts the `bookingID` from the WebSocket query parameters.
    *   **Fails early** if `bookingID` is missing, logging an error and closing the connection.
2.  **Room Initialization & Acquisition:**
    *   Acquires a lock on the global `CallHub`.
    *   Checks if a `VideoRoom` exists for the given `bookingID`. If not, it initializes one.
    *   Releases the global lock.
3.  **Client Registration:**
    *   Acquires a lock on the specific `VideoRoom`.
    *   Registers the incoming `userID` and connection (`c`) into the room's `Clients` map.
    *   Logs the join event and the current room capacity.
4.  **Message Loop (`for {}`):**
    *   The handler enters an infinite loop, blocking until a message is received or an error occurs (disconnection).
    *   **Message Handling:** Upon receiving a message (`msg`), it acquires the room lock. It iterates through all other connections in the room and broadcasts the message to each participant, *except* the sender.
5.  **Cleanup:**
    *   When the loop breaks (due to error/disconnection), the handler acquires the room lock and explicitly removes the user's entry from the `Clients` map, ensuring the room state is accurate.

### 🖼️ Conceptual Flow Diagram: User Join & Message Broadcast

*(Since I cannot generate a figure, I will describe the required flow visualization)*

**Diagram Title: Video Call Lifecycle**

1.  **Start:** `User Connects (WebSocket)` $\rightarrow$
2.  **Middleware:** Checks JWT $\rightarrow$ Gets `user_id` $\rightarrow$
3.  **Input:** Reads `booking_id` $\rightarrow$
4.  **Hub Interaction (Locking):** Check `CallHub.Rooms[bookingID]` $\rightarrow$ (If Null) Create Room $\rightarrow$
5.  **Room Interaction (Locking):** Add User ID to `Room.Clients` $\rightarrow$
6.  **[LOOP]** `c.ReadMessage()` (Wait for Message) $\rightarrow$
7.  **[BROADCAST]** Acquire `Room.mu` $\rightarrow$ Iterate `Clients` $\rightarrow$ Write to `otherConn` $\rightarrow$ Release `Room.mu` $\rightarrow$
8.  **End:** `Error/Disconnect` $\rightarrow$ Acquire `Room.mu` $\rightarrow$ `delete(Clients, userID)` $\rightarrow$ **Exit.**

---

## ⚠️ Development Notes & Technical Debt

### Most Important Concerns (Priority ⚡)

*   **Authentication Gap:** The code assumes `c.Locals("user_id")` is populated. *It is critically important that the preceding middleware correctly sets this context.* If this middleware fails, the application cannot reliably identify the user, leading to security holes or incorrect logging.
*   **Error Handling in Broadcast:** The current broadcast loop (`for otherUserID, otherConn := range room.Clients`) does not handle write errors on the receiving end. If one client connection fails to write (e.g., network partition), the loop will continue, potentially failing silently or crashing the handler thread if the error is not caught. **Recommendation: Implement `defer` or local error checks within the broadcast loop.**
*   **Resource Leakage:** While cleanup happens on disconnection, if the server process terminates unexpectedly, the `VideoHub` map of rooms will leak state until process restart. This is inherent to global state but should be noted for scaled environments.

### Technical Debt (Refactoring Suggestions)

1.  **Connection/Disconnection Channel:** Instead of relying solely on `c.ReadMessage()` error to detect disconnection, it is highly recommended to establish a separate mechanism (e.g., a dedicated `sync.WaitGroup` or a dedicated "disconnect" channel) to manage the room state change gracefully, especially when implementing heartbeat checks.
2.  **Type Assertions:** The use of direct type assertion (`userID := c.Locals("user_id").(string)`) is brittle. It should be wrapped in an explicit type assertion check and fallback mechanism to prevent runtime panics if the middleware fails or the context is modified.
3.  **Broadcast Function:** The broadcast logic is duplicated and buried within the handler. Extracting a private method, such as `room.Broadcast(senderID, message, messageType)`, will significantly clean up the `VideoCallHandler` method and improve testability.

---

## 🛠️ Deployment & Usage

The handler requires the following dependencies and environmental setup:

1.  **Dependencies:**
    *   `gofiber/contrib/websocket` (Provided by the framework).
    *   A working JWT middleware that populates `c.Locals("user_id")`.
2.  **Execution Context:**
    *   This handler must be the final consumer of the WebSocket connection, running *after* authentication middleware has executed.
3.  **Testing:**
    *   Unit tests should focus on concurrent access to `VideoHub` and `VideoRoom` to verify mutex integrity under simulated simultaneous joins and departures.
    *   Integration tests must simulate network interruptions to confirm proper cleanup.