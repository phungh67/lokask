[⬅ Return to Main Compendium](../../../../../README.md)

As a senior backend officer specializing in Go and robust backend logic, I have analyzed this client-side WebRTC implementation. While the code is written in React, its core functionality (WebRTC signaling, media handling, state synchronization) dictates strict contracts for the underlying backend services.

I will document the system architecture, focusing on the interfaces, data structures, and service patterns that a Go backend would implement to support this `CallRoom` component.

---

## 💻 `CallRoom` Component Analysis & Backend Architecture Design

The `CallRoom` component manages the entire real-time communication lifecycle. From a backend perspective, this requires three major components:
1.  **Signaling Service (WebSocket):** Handling connection state and exchanging WebRTC metadata (Offers, Answers, ICE Candidates).
2.  **Media Management/Gatekeeping:** Ensuring correct authentication and routing of calls based on `bookingId`.
3.  **State Persistence:** (Implicit) Ensuring the session state matches the booking status.

### 1. Core Logic Flow Documentation

#### **1.1. Initial Connection Flow (Signaling)**
1.  **Client Action:** `CallRoom` mounts, initiating `startCall()`.
2.  **Client Role:** Requests media permissions (using `getUserMedia`) and establishes a WebSocket connection (`ws://.../ws/video`).
3.  **Backend Expectation (Signaling Service):** The server must accept the connection, authenticate the user via the `token`, and tie the session to the `bookingId`.
4.  **WebRTC Negotiation:** The backend must be ready to receive the initial `user-joined` signal, allowing the peer to initiate the Offer/Answer exchange.
5.  **State Management:** The backend must maintain a map of active calls (`bookingId -> PeerContext`) and manage the sequence of connection events (Offer $\rightarrow$ Answer $\rightarrow$ ICE).

#### **1.2. Media Track Synchronization (ICE/WebRTC)**
*   **Client Side:** Tracks are added (`pc.addTrack`) and candidates are captured (`pc.onicecandidate`).
*   **Backend Role:** The WebSocket handler must treat incoming `ice-candidate` messages as high-priority signals. It must route this candidate payload immediately and reliably to the intended peer (the other end of the call).
*   **Pattern:** This is a classic **Pub/Sub** model, where the `bookingId` acts as the topic, and all candidates are published to it.

#### **1.3. State Management & Lifecycle**
| State Variable | Component Dependency | Backend Trigger/Action |
| :--- | :--- | :--- |
| `status` | Connection State | **Backend:** Sends periodic heartbeat/status updates if the peer fails to connect/disconnect gracefully. |
| `isMicOn`/`isCameraOn` | Local Media Tracks | **Backend:** No direct action. This is a client-side track manipulation. The backend relies on the standard WebRTC stream lifecycle, but robust systems should monitor if tracks are unexpectedly stopped/restarted. |
| `onClose` | Termination | **Client:** Sends a specific `leave` message over the WebSocket, allowing the backend to clean up the session state immediately. |

### 2. API Surfaces Definition (Go Implementation Focus)

The primary external interface is the persistent **WebSocket connection**. All other interactions are handled by structured JSON payloads over this single channel.

#### **A. Endpoint Signature**
*   **Type:** WebSocket Streaming Endpoint
*   **URI:** `/ws/video?booking_id={bookingId}&token={token}`
*   **Protocol:** `wss://` (must support TLS)

#### **B. Payload Structures (Go Structs)**

##### `SignalPayload` (The generic message type)
```go
// SignalPayload defines the contract for all data passed over the WebSocket.
type SignalPayload struct {
    Type  string          `json:"type"` // e.g., "user-joined", "offer", "answer", "ice-candidate", "leave"
    Data  json.RawMessage `json:"data"` // Raw message content based on Type
    // Optional Metadata: Source identifier, etc.
}
```

##### `IceCandidate` (Used for signaling metadata)
```go
// IceCandidate structure matching the STUN/TURN protocol format.
type IceCandidate struct {
    SDPMid    string `json:"sdpMid"`
    SDPMediaType string `json:"sdpMid"`
    Candidate string `json:"candidate"`
}
```

##### `SessionDescriptor` (Used for Offer/Answer)
```go
// SessionDescriptor encapsulates the WebRTC session description.
type SessionDescriptor struct {
    Type string `json:"type"` // "offer" or "answer"
    SDP  string `json:"sdp"`  // The full Session Description Protocol string
}
```

#### **C. WebSocket Message Contracts**

| `Type` (Payload Type) | Direction | Purpose | Required Data | Backend Action |
| :--- | :--- | :--- | :--- | :--- |
| `user-joined` | Client $\to$ Server | Signals intent to connect. | None (or client identity). | Acknowledge, establish session context, await peer join. |
| `offer` | Client $\to$ Server | Initiates the call negotiation. | `SessionDescriptor` (Offer) | Store offer locally, forward the SDP to the remote peer, and prepare to generate/send the answer. |
| `answer` | Client $\to$ Server | Finalizes the negotiation (response to offer). | `SessionDescriptor` (Answer) | Store answer locally, apply remote description to the `RTCPeerConnection` object. |
| `ice-candidate` | Client $\to$ Server | Exchanges network connectivity information. | `IceCandidate` | **High Priority:** Broadcast this candidate immediately to the peer's established WebSocket channel for the given `bookingId`. |
| `leave` | Client $\to$ Server | Gracefully ends the session. | None | Clean up all session resources: close the connection, delete the `bookingId` context, release any allocated TURN/STUN resources. |

### 3. Repository and Service Patterns

We must enforce separation of concerns. I recommend the following services and repository patterns written in Go.

#### **A. `ConnectionManager` (Service Layer)**
This service handles the lifecycle of the active session.

*   **Method:** `Connect(userID, meetingID)`
*   **Logic:** Authenticates the user, retrieves the session state from the database, and initializes a WebSocket connection handle.
*   **Key Responsibility:** Acts as the gateway between the WebSocket layer and the SessionState layer.

#### **`SessionStateRepository` (Data Access Layer)**
This repository manages the state of the virtual meeting room.

*   **Interface:** `GetSession(meetingID)`
*   **Methods:**
    *   `GetParticipant(meetingID, userID)`: Retrieves the current status (Connected, Muted, etc.).
    *   `UpdateParticipantStatus(meetingID, userID, status)`: Persists user changes.
    *   `FindOtherUsers(meetingID, excludingUserID)`: Retrieves connection details for broadcasting.

#### **`MessageRouter` (Message Handling/Bus)**
This component handles the broadcasting logic for signaling messages (e.g., "User X joined," "User Y muted").

*   **Principle:** Publish/Subscribe model.
*   **Mechanism:** When one client sends a signal (`"ACTION: MUTING"`) that affects others, the `MessageRouter` intercepts it, validates it against the `SessionStateRepository`, and fans out the message to *all other connected clients* in that meeting room.
*   **Why it's critical:** Prevents state inconsistency. If Client A signals an action, the `MessageRouter` ensures Client B receives the instruction, not just the raw message data.

---
**Summary of Implementation Focus:**

1.  **Reliability:** Use robust session state management (`SessionStateRepository`) to ensure that a client's local state matches the authoritative server state.
2.  **Scalability:** The `MessageRouter` must be highly optimized for fan-out broadcasts (e.g., utilizing Redis Pub/Sub or similar in-memory pub/sub system).
3.  **Security:** All incoming signaling messages must be authenticated and authorized against the `SessionStateRepository` before being processed or broadcast.