[⬅ Return to Main Compendium](../../../../../README.md)

# 🔒 Security Review: `CallRoom` Component

**Role:** Senior Security Officer
**Expertise Areas:** Cloud Security, Architect Security, Programming Language Security (JavaScript/React/WebRTC)
**Component:** `CallRoom.tsx` (WebRTC/Video Calling Interface)
**Date:** October 26, 2023

---

## 📋 Executive Summary

The `CallRoom` component implements complex real-time media functionality using WebRTC, React, and WebSockets. Architecturally, the implementation follows standard WebRTC practices (ICE candidates, SDP offers/answers).

**Overall Security Posture:** Moderate.

The component exhibits strong defensive coding in managing local media streams and dynamically enabling/disabling audio/video tracks. However, critical security concerns exist regarding the handling of authentication tokens, WebSocket message validation, and the inherent trust placed on external signaling channels (the WebSocket backend).

The biggest risk surface area is **Injection/Tampering via the Signaling Channel** and **Client-Side Exposure of Sensitive Data**.

## 🔍 Detailed Analysis of Vulnerabilities and Vulnerable Payloads

### 1. Input Validation and Injection (Critical)

The component relies on data passed via props and accessed from `localStorage`.

| Area | Vulnerability | Description | Impact | Payloads/Data Flow | Mitigation/Recommendation |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **WebSocket URL Construction** | **Potential Data Leakage/MITM (Low-Risk)** | The `localStorage.getItem("token")` is appended directly to the WebSocket URL. While this is common for simple implementations, it exposes the token in the browser history and potentially in server logs if the URL is logged client-side or proxy-intercepted. | Authentication Bypass, Session Hijacking (if the token is intercepted). | `wsUrl = `${wsProtocol}//${wsHost}/ws/video?booking_id=${bookingId}&token=${token}`` | **CRITICAL:** Do not pass auth tokens or secrets in the URL query parameters. Instead, use HTTP headers (if initiating the connection through a dedicated gateway) or, ideally, perform the authentication handshake *after* the WebSocket connection is established (e.g., sending a token message payload immediately after `ws.onopen`). |
| **WebSocket Message Handling** | **Missing Schema/Type Validation (Critical)** | The `ws.onmessage` handler uses `JSON.parse(event.data)` and assumes the structure based on `message.type`. There is no validation that `message.candidate` or `message.offer`/`message.answer` contain valid, well-formed WebRTC data structures. | **DoS, Remote Code Execution (RCE) via Malformed Data:** An attacker sending malformed JSON or invalid WebRTC candidates could crash the JavaScript runtime, lead to unhandled exceptions, or overload the `RTCIceCandidate` constructor. | `message.type`, `message.candidate`, `message.offer`, `message.answer` | **CRITICAL:** Implement strict schema validation on all incoming WebSocket messages. All required fields (`type`, and type-specific payloads) must be validated against an expected schema before using the data in WebRTC APIs (e.g., checking if `candidate` is a valid string format before passing it to `new RTCIceCandidate()`). |
| **Props Usage** | **Trusting External Inputs** | The component uses `bookingId` and `serviceType` from props. While props are generally controlled by the parent component, if this component were ever called without proper prop validation, improper `serviceType` could lead to unexpected media behavior or logic errors. | Logic Flaw, UI Compromise. | `bookingId`, `serviceType` | Ensure the parent component validates these props server-side and passes controlled values. The use of `serviceType: Booking["service_type"]` (TypeScript) helps mitigate this, but runtime checks are still advised. |

### 2. Resource Management and Memory (Medium)

The component manages multiple, complex real-time resources (MediaStream, RTCPeerConnection, WebSocket).

| Area | Vulnerability | Description | Impact | Payloads/Data Flow | Mitigation/Recommendation |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Cleanup Hooks (`useEffect` return)** | **Potential Resource Leak (Minor)** | The cleanup function correctly stops tracks and closes connections (`localStream.getTracks().forEach((track) => track.stop())`, `pc.close()`, `ws.close()`). However, if an unhandled exception occurs *during* the setup phase (`try/catch` block), some cleanup resources might not be properly initialized or cleaned up, leading to lingering connections or memory bloat. | Resource Depletion, Connection Hangs. | N/A | **RECOMMENDATION:** Wrap the entire setup process (WebRTC setup and WebSocket initialization) in careful `try...finally` blocks within the `useEffect` to guarantee resource closure even upon unexpected failures. |

### 3. Architect & Logic Flaws (Medium)

| Area | Vulnerability | Description | Impact | Payloads/Data Flow | Mitigation/Recommendation |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Media Stream Control** | **Client-Side Trust for Media Disconnection** | The `toggleMic` and `toggleVideo` functions correctly manipulate `track.enabled`. This is fundamentally a client-side control. An attacker controlling the client browser could manually manipulate the underlying stream or bypass these React controls. | Circumvention of Local Controls, Data Leakage. | N/A | This is inherent to client-side web applications. **Mitigation:** Ensure the signaling server enforces the *state* based on an authorized action (e.g., "Mute request received from User A," which the server validates and relays). The client UI controls should remain the primary mechanism. |
| **Service Type Dependency** | **Implicit Trust on `isVideoCall`** | The camera visibility and control are entirely dependent on `isVideoCall`. This logic is robust but relies 100% on the initial prop value being correct. | Logic Bypass, Incorrect UI State. | `isVideoCall` | **Mitigation:** Use a state machine or guard clause at the component root to manage the component's operational modes (VoiceOnly, VideoOnly, VideoAndAudio) instead of relying solely on one boolean flag derived from props. |

---

## 🛡️ Recommendations & Remediation Checklist

### 🟢 Critical Fixes (Must Implement)

1. **Fix Token Transmission:** **NEVER** pass authentication or secret tokens in the URL query parameters. Update the connection logic to use secure headers (e.g., Authorization: Bearer Token) when establishing the WebSocket connection.
2. **Implement Robust Schema Validation:** Before parsing any incoming messages from the WebSocket, validate the payload structure against an expected schema. This prevents unexpected data types or missing fields from crashing the client or allowing unexpected functionality.

### 🟠 High Priority Improvements

1. **Input Sanitization:** While this client-side, if any metadata (e.g., user names displayed in a chat overlay) is pulled from the network, it must be sanitized to prevent XSS when rendered to the DOM.
2. **Error Handling & Visibility:** Implement detailed, user-friendly error logging for network failures (e.g., "Could not connect to the signaling server. Please check your internet connection.") rather than relying only on cryptic console errors.

### ✅ General Best Practices

* **Principle of Least Privilege:** Ensure the client code only makes the minimum necessary network requests to function.
* **Client/Server Boundary:** Always assume the signaling server (WebSocket) is compromised or compromised by user input. Never trust any data sent from the server without client-side validation or server-side re-validation.