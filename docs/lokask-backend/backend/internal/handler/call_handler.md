# 🛠️ Real-Time Video Conferencing Handler Implementation

This documentation describes the core logic for managing virtual meeting rooms and handling real-time WebSocket connections for video calling within the system.

## 📋 Overview

This package provides a specialized handler (`VideoCallHandler`) designed to manage multiple simultaneous video call sessions (rooms). It uses a centralized hub (`VideoHub`) to organize sessions, where each session is represented by a `VideoRoom`. The system relies on WebSockets for persistent, bidirectional, real-time communication. When a user connects, they are identified by their `user_id` (expected from JWT claims) and placed into a specific `VideoRoom` determined by a `booking_id`. The handler manages user joining, message broadcasting, and proper cleanup when a user disconnects.

**Key Architectural Components:**

*   **`VideoHub`:** Acts as the central registry, holding all active `VideoRoom` instances, keyed by `booking_id`.
*   **`VideoRoom`:** Represents a single meeting session, managing the map of connected clients (`userID` to `*websocket.Conn`).
*   **Concurrency Control:** Both `VideoHub` and `VideoRoom` utilize `sync.RWMutex` to ensure thread-safe access and modification of shared maps.

## 🚀 Detail

### Core Structures

| Structure | Description | Purpose |
| :--- | :--- | :--- |
| **`VideoRoom`** | Holds the active participants for one specific call. | Tracks all connected users (`Clients`) in a single session. |
| **`VideoHub`** | The global container for all meeting rooms. | Ensures that multiple concurrent sessions can operate safely and are accessible by `booking_id`. |

### `VideoCallHandler(c *websocket.Conn)` Flow

1.  **Authentication & Initialization:**
    *   The handler first extracts the `user_id` from the connection's local context (implying upstream middleware, likely JWT validation).
    *   It retrieves the `booking_id` from the WebSocket query parameters.
    *   **Validation:** If `booking_id` is missing, the connection is immediately logged and terminated, preventing unassigned participation.
2.  **Room Management (Concurrency Safe):**
    *   The code acquires a write lock on `CallHub.mu`.
    *   It checks if a `VideoRoom` exists for the given `booking_id`. If not, a new `VideoRoom` is instantiated and added to `CallHub.Rooms`.
    *   The lock is released.
3.  **Joining the Room:**
    *   The user's connection (`c`) is added to the room's `Clients` map.
    *   Logging confirms successful joining and reports the current room occupancy.
4.  **Message Handling (The Loop):**
    *   The handler enters an infinite loop (`for {}`) to listen for incoming messages (`c.ReadMessage()`).
    *   **Reception:** When a message is received, the handler acquires a read/write lock on `room.mu`.
    *   **Broadcasting:** It iterates through *all* connections in the room. For every other user (`otherUserID != userID`), the received message (`msg`) is written/broadcasted using `otherConn.WriteMessage()`.
    *   **Disconnection:** The loop gracefully breaks if `c.ReadMessage()` returns an error, indicating that the connection was interrupted (e.g., client closed, network loss).
5.  **Cleanup:**
    *   Upon breaking the message loop (disconnection), the handler acquires a write lock on `room.mu` and deletes the user's entry from the `room.Clients` map, ensuring resource cleanup.

## 💡 Knowledge Base Assessment

*   **System Design:** Excellent implementation of the Hub-and-Spoke pattern for real-time communication. The use of mutexes indicates strong consideration for multi-threaded access, which is crucial for scalability.
*   **Infrastructure:** Relies heavily on the WebSockets protocol, making it appropriate for persistent, low-latency connections required for real-time media/chat.
*   **Cloud Components:** This logic is highly suitable for deployment in services like AWS IoT, Google Cloud Pub/Sub, or containerized microservices running on EKS/GKE, provided the load balancer/gateway supports WebSocket passthrough.
*   **Security Engineer:** The explicit reliance on `c.Locals("user_id")` strongly suggests a preceding middleware layer is responsible for JWT validation and identity extraction, which is a secure practice.

## ⚠️ Warning

The current implementation assumes that the `user_id` is reliably passed into the WebSocket connection via `c.Locals("user_id")`.

**Potential Vulnerability/Improvement:**
If this code were to be exposed without a robust upstream gateway/middleware (e.g., an API Gateway or specialized WebSocket proxy) that validates and injects the JWT claims, the `userID` could potentially be tampered with or logged as an empty string, leading to incorrect session management or spoofing.

## ❓ Note

**Resource Management:** The current cleanup mechanism only removes the user from the room's client map. If the overall `VideoRoom` becomes completely empty, the `VideoHub` currently retains a reference to the `VideoRoom` object in its `Rooms` map forever.

**Recommendation:** Consider adding a mechanism (e.g., a counter or a check upon cleanup) to the `VideoRoom` structure or within the `VideoCallHandler` to detect when `len(room.Clients)` falls to zero. If the room is empty, the handler should optionally clean up the entry from the global `CallHub.Rooms` map to prevent memory leaks and stale room objects.

## 🖼️ Generated Figure Concept: Data Flow Diagram

*(Since actual figure generation is not possible, a descriptive conceptual figure is provided.)*

**Conceptual Flow: User Joining/Messaging**

```mermaid
graph TD
    A[Client Initiates WS Connect] --> B(Gateway/Middleware: JWT Validation);
    B --> C{VideoCallHandler Start};
    C --> D[Extract user_id, booking_id];
    D --> E{Check VideoHub for Room by booking_id};
    E -- Room Exists --> F[Acquire Room Lock];
    E -- Room New --> G[Create New VideoRoom];
    G --> F;
    F --> H[Add User to Room Clients];
    H --> I[User Connected/Room Info Logged];
    I --> J{Listening Loop (ReadMessage)};
    J -- Message Received --> K[Acquire Room Lock];
    K --> L{Broadcast Message to ALL Other Users};
    L --> M[Release Room Lock];
    M --> J;
    J -- WS Error/Close --> N[User Leaves: Cleanup];
    N --> O[Delete User Entry from Room Clients];
    O --> P(End Session);
```