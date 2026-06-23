[⬅ Return to Main Compendium](../../../../../README.md)

# 🌐 Component Documentation: `CallRoom`

As a senior frontend officer specializing in TypeScript and high-performance state management (React/Vite ecosystem), I have reviewed the `CallRoom` component. This component is mission-critical as it handles real-time, complex media streaming logic (WebRTC).

The current implementation is functional but needs refinement in how WebRTC setup and permissions are managed, especially concerning dependency arrays and cleanup, to prevent potential memory leaks or race conditions.

## 💻 Code Analysis & Refactoring Highlights

### 1. Architecture & Separation of Concerns
The component currently mixes media fetching, WebRTC signaling, and UI rendering. This is acceptable for a contained, complex hook-based component, but the WebRTC logic is tightly coupled within `useEffect`.

**Refactoring Suggestion:** The core WebRTC setup and management (WebSocket handling, `RTCPeerConnection` lifecycle) should ideally be encapsulated within a custom hook (e.g., `useWebRTCConnection`) to keep `CallRoom` clean and highly readable. For this review, I will document the necessary structure assuming this complexity remains inside `CallRoom`.

### 2. Type Safety and TypeScript Enhancements
The use of `MediaStream` casting (`stream.getVideoTracks().forEach(...)`) is slightly risky. While functional in this context, we should ensure stream access is type-safe where possible.

**Improvement:** Explicitly handle `MediaStream` manipulation within the `toggle` functions to guarantee that the track exists before trying to set `enabled`.

### 3. State Management Review
*   **State:** `isCameraOn`, `isMicOn`, `status` are managed correctly.
*   **Dependencies:** The `useEffect` dependency array `[bookingId, isVideoCall]` is correct, ensuring the entire WebRTC lifecycle restarts only when necessary.

### 4. Performance & Cleanup
The cleanup function is robust, ensuring that `localStream` tracks are stopped and `RTCPeerConnection` and `WebSocket` are closed, preventing resource leaks. This is critical for real-time applications.

---

## 📋 Detailed Documentation

### 📁 Component: `CallRoom`
**Purpose:** Manages the entire user interface and underlying logic for a real-time peer-to-peer video/audio call session.
**Inputs (Props):**
| Prop | Type | Description | Constraints |
| :--- | :--- | :--- | :--- |
| `bookingId` | `string` | Unique ID associated with the call session. Used for WebSocket signaling. | Required. |
| `serviceType` | `Booking["service_type"]` | Determines if the call is `video_call` (full functionality) or `voice_call` (audio-only). | Determines UI visibility (e.g., local video feed). |
| `onClose` | `() => void` | Callback executed when the user leaves the room. Must clean up resources. | Mandatory for state cleanup. |

### 🔄 State Management (React Hooks)

| State Variable | Type | Initial State | Role/Mutation Logic |
| :--- | :--- | :--- | :--- |
| `localMediaRef` | `useRef<HTMLVideoElement>` | `null` | References the local video element (self-feed). |
| `remoteMediaRef` | `useRef<HTMLVideoElement>` | `null` | References the remote video element (other party's feed). |
| `wsRef` | `useRef<WebSocket>` | `null` | Stores the active WebSocket connection for signaling (ICE candidates, Offers/Answers). |
| `peerConnectionRef`| `useRef<RTCPeerConnection>`| `null` | The WebRTC connection object, managing the peer state. |
| `isCameraOn` | `useState<boolean>` | `isVideoCall` | Controls the visual state of the local camera feed. Defaulted based on `serviceType`. |
| `isMicOn` | `useState<boolean>` | `true` | Controls the audio transmission state. |
| `status` | `useState<string>` | `"Initializing media..."` | Displays connection status (e.g., "Waiting for user," "Connected!"). |

### 🚀 Core Lifecycle Logic (The `useEffect` Hook)

This effect orchestrates the entire WebRTC session and should be understood as the component's life cycle handler.

1.  **Permission Handling (`getUserMedia`):**
    *   **Logic:** Determines required media tracks dynamically based on `isVideoCall`. If `false`, it requests audio only (`video: false, audio: true`).
    *   **Key:** Uses the `localMediaRef` to attach the stream object.
2.  **WebRTC Setup:**
    *   Initializes `RTCPeerConnection` using STUN servers (`ICE_SERVERS`).
    *   Adds all local tracks (video/audio) to the `RTCPeerConnection`.
    *   **Event Listener (`pc.ontrack`):** Captures remote streams and assigns them to `remoteMediaRef`, triggering status updates.
3.  **Signaling Setup (WebSocket):**
    *   Establishes a secure WebSocket connection to the backend (`/ws/video`).
    *   **`ws.onmessage` Handler (The WebRTC Dance):** This is the central logic flow:
        *   **`user-joined`:** Triggers the caller to create an Offer, set it locally, and send it over the WS.
        *   **`offer`:** Receives an offer, sets it as the remote description, creates an Answer, sets it locally, and sends it back.
        *   **`answer`:** Receives an answer and sets it as the remote description, completing the connection.
        *   **`ice-candidate`:** Processes and adds remote ICE candidates to the peer connection.
4.  **Cleanup (`return` function):**
    *   **Critical:** Stops all local tracks (`track.stop()`) to release hardware resources.
    *   Closes the `RTCPeerConnection` and the `WebSocket` connection gracefully.

### 🖱️ Component Methods (UI Logic)

#### 1. `toggleVideo()`
*   **Precondition:** Must only run if `serviceType === "video_call"`.
*   **Mechanism:** Iterates through the video tracks (`stream.getVideoTracks()`) associated with the local stream.
*   **Action:** Toggles the state of the video track (muted/unmuted, active/inactive). *Note: In a standard WebRTC context, this usually means swapping the local video source or toggling the track's `enabled` property.*
*   **Goal:** Provides local video control to the user.

#### 2. `toggleAudio()` (Implicit/Missing but necessary)
*   *Self-Correction/Suggestion:* A function to manage the audio track (muting/unmuting) should be implemented for robust UI control, mirroring the video toggle.

### Summary of Controls & State Management

| Element | State Dependency | Trigger | Action Taken |
| :--- | :--- | :--- | :--- |
| **`toggleVideo()`** | Local `MediaStream` | Button Click | Toggles video track visibility/state. |
| **`WebSocket`** | Connection Status | Connection Event | Handles initial setup, incoming/outgoing ICE candidates. |
| **`WebSocket`** | Received Message | Incoming Message | Updates the local media state or signals connection change. |
| **`cleanup()`** | Component Unmount | Unmount Event | Closes local tracks and WebSocket connections to prevent memory leaks. |