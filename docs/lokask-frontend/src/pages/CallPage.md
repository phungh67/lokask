```markdown
[⬅ Return to Main Compendium](../../README.md)

# 📞 Call Page Component (`CallPage`)

This document outlines the structure, functionality, and integration points for the `CallPage` React component. This component serves as the entry point for users accessing a call session, utilizing parameters passed through the URL to determine session context (e.g., meeting ID, call type).

## 🔍 Overview

The `CallPage` component is responsible for intercepting incoming call requests via React Router DOM. It extracts two critical parameters from the URL: the `roomId` (identifying the specific meeting or booking) and the `serviceType` (determining if the call is a video or voice session). If these parameters are missing, it renders an informative error screen. Otherwise, it passes the extracted context down to the primary `CallRoom` component for rendering the actual communication interface.

### Code Snippet

```jsx
import { useParams, useSearchParams } from "react-router-dom";
import CallRoom from "@/components/CallRoom";

const CallPage = () => {
  const { roomId } = useParams();
  const [searchParams] = useSearchParams();
  const serviceType = searchParams.get("type") as "video_call" | "voice_call";

  if (!roomId || !serviceType) {
    return (
      <div className="p-8 text-white bg-slate-950 h-screen">
        Invalid Call Link
      </div >
    );
  }

  return (
    <CallRoom
      bookingId={roomId}
      serviceType={serviceType}
      onClose={() => window.close()}
    />
  );
};

export default CallPage;
```

***

## 📄 Details

### 1. Component Logic Flow

1.  **Parameter Retrieval:** Uses `useParams()` to capture `roomId` from the URL path and `useSearchParams()` to capture `serviceType` from the query string (`?type=...`).
2.  **Validation:** Implements mandatory checks (`!roomId || !serviceType`). If validation fails, it renders a hardcoded "Invalid Call Link" error message, preventing the rendering of the core call logic.
3.  **Call Room Initialization:** If valid, it passes the following props to `CallRoom`:
    *   `bookingId`: The unique identifier for the session (used for API calls and state management within `CallRoom`).
    *   `serviceType`: Defines the modality (`"video_call"` or `"voice_call"`), which dictates the features and setup of the `CallRoom`.
    *   `onClose`: A handler that uses `window.close()`, indicating that the call session is designed to run in a self-contained or popup window environment.

### 2. Dependency Structure

| Component/Hook | Purpose | Related Area |
| :--- | :--- | :--- |
| `useParams()` | Extracts path parameters (e.g., `/call/:roomId`). | React Router / Frontend Routing |
| `useSearchParams()` | Extracts query parameters (e.g., `?type=...`). | React Router / Frontend Routing |
| `CallRoom` | Primary rendering component for the call experience. | `../components/CallRoom` (Core Feature) |

### 3. Structural Flow (Calling Logic)

The lifecycle of this component is critical for maintaining session context:

**Link to Related File:** The flow relies heavily on the `CallRoom` component. Ensure that `CallRoom` handles the received `bookingId` and `serviceType` to correctly initialize WebRTC connections or API calls.
*   [👉 `../components/CallRoom` - Call Session Rendering](../components/CallRoom.jsx)

***

## 💡 Notes

*   **Window Context:** The implementation of `onClose={() => window.close()}` strongly suggests that this page is intended to be loaded in a dedicated popup window or iframe session. This should be documented in the overall system design for call routing.
*   **Type Safety:** The type assertion (`as "video_call" | "voice_call"`) provides strong TypeScript safety but assumes that the service type passed via the URL is always one of the expected values. Client-side validation is good, but server-side validation is mandatory for robustness.
*   **Error Handling:** While the current error handling is simple (displaying a message), consider expanding this to include detailed logging or redirection to a specific error page (`/error/invalid-link`).

***

## ⚠️ Warnings & Tech Debt

### 🛑 Highest Priority: Error Handling (Validation)
The current failure state only displays a generic `Invalid Call Link` message. It does not differentiate *why* the link is invalid (Is `roomId` missing? Is `serviceType` missing? Is the `roomId` structurally invalid?).

**Action Required:** Implement specific checks and feedback for:
1.  `roomId` missing.
2.  `serviceType` missing or invalid (e.g., `?type=unknown`).
3.  Best Practice: Check the existence of `roomId` and `serviceType` and potentially trigger a client-side API call to validate the booking immediately upon loading, rather than relying solely on presence checks.

### 🚧 System Integration (Backend Dependency)
This frontend component assumes that a valid `roomId` and `serviceType` guarantee an active session. **We must ensure that the corresponding backend services (e.g., an API endpoint `/api/bookings/:roomId/validate`) are used to confirm the session's existence and availability before mounting `CallRoom`**. Without this, the system could hang or fail silently if the booking was cancelled but the link was not updated.

### ♻️ Code Optimization (Readability)
The use of `if (!roomId || !serviceType) { ... }` is concise, but abstracting the validation logic into a dedicated `useCallParams()` hook or utility function would improve component reusability and adherence to separation of concerns.
```