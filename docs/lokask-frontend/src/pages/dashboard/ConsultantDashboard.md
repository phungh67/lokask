This document provides a comprehensive technical overview of the `Dashboard` component. This component serves as the main dashboard for the consultant user, integrating profile management, real-time chat functionality, and critical service billing gates.

---

# 💻 `Dashboard` Component Technical Specification

## 🎯 Overview

The `Dashboard` component is the central hub for the consultant user experience. It orchestrates the display of essential information—including the consultant's profile, active conversations, and pending actions—while enforcing strict service gate logic to ensure the user's consultation service is active and paid for.

**Key Responsibilities:**
1.  Managing the lifecycle and state of active conversations.
2.  Displaying and facilitating the update of the consultant's public profile.
3.  Implementing a mandatory **Service Gate** check upon mount or significant state change.
4.  Handling the real-time display and sending of chat messages.

## 🏗️ Architecture & Dependencies

This component is highly stateful and relies on several external services and hooks for its functionality.

| Area | Mechanism | Description | Dependencies |
| :--- | :--- | :--- | :--- |
| **State Management** | React Hooks / Context | Manages the active conversation, profile data, and loading states across the board. | Global `AuthContext`, `ProfileProvider` |
| **Real-time Chat** | `useEffect` + WebSockets | Subscribes to and listens for messages within the `activeConversationId`. Manages initial message load. | `useWebSocketHook` (or similar service hook) |
| **Service Billing** | Lifecycle Hooks (`useEffect`) | Executes checks for service activation status. **This is the first piece of logic executed.** | `useBillingStatus` hook, `api/billing/status` endpoint |
| **UI/Layout** | Component Composition | Composes three main panels: Sidebar (Navigation), Chat Area, and Profile Editor. | `UserProfileCard`, `ChatWindow`, `ServiceGateModal` |

## ⚙️ Props and Inputs (Required)

The component expects several key inputs, typically sourced from the parent page context or router parameters.

| Prop Name | Type | Description | Required? |
| :--- | :--- | :--- | :--- |
| `consultantProfile` | `object` | The complete profile object of the logged-in consultant. | Yes |
| `initialConversationId` | `string` | The ID of the conversation to load upon dashboard mount. | No |
| `onProfileUpdate` | `function` | Callback executed when the consultant successfully updates their profile information. | Yes |

## 🚀 Core Logic Flow (Step-by-Step Execution)

The execution flow is critical and must be understood in the order it runs:

1.  **Initialization (`useEffect` Mount):**
    *   The component first calls the **Service Gate Check**.
    *   **IF** the service is inactive or expired: The rendering stops, and the `ServiceGateModal` is displayed, blocking all other functionality.
    *   **ELSE:** The component proceeds to load the initial conversation data using `initialConversationId`.
2.  **Conversation Loading:**
    *   The `useWebSocketHook` subscribes to the conversation room (`activeConversationId`).
    *   It executes a REST call to fetch the message history for the given conversation.
    *   The `ChatWindow` receives the initial payload and displays messages.
3.  **User Interaction:**
    *   **Sending Messages:** A user action triggers the `sendMessage` function, which updates the local state immediately (optimistic update) and sends the payload via the WebSocket.
    *   **Profile Update:** When the user submits the profile form, the local state is passed to the `onProfileUpdate` prop, triggering the asynchronous API call.
4.  **Real-time Updates:**
    *   The WebSocket listener catches incoming messages, updates the message array state, and triggers a re-render of the `ChatWindow`.

## ⚠️ Critical Business Logic: The Service Gate

This is the most critical piece of business logic. The application cannot function fully if the service is not paid for.

*   **Mechanism:** A dedicated `useEffect` hook monitors the billing status.
*   **Failure Condition:** If `useBillingStatus()` returns `isServiceActive: false`, the component *must* render `ServiceGateModal` and neutralize all other handlers (e.g., `onClick` handlers on buttons or forms).
*   **Success Condition:** The modal is hidden, and normal dashboard operations resume.

## 🧱 Component Breakdown (Internal Structure)

The component logically divides into the following self-contained sub-components:

1.  **`Sidebar`:**
    *   Handles navigation links (Dashboard, Profile, Settings).
    *   Displays a summary of the active conversation thread.
2.  **`UserProfileEditor`:**
    *   A controlled form component.
    *   Receives `consultantProfile` as props.
    *   Handles form state and calls `onProfileUpdate` on successful submission.
3.  **`ChatWindow`:**
    *   Responsible for displaying messages.
    *   Manages the local message array state.
    *   Exposes a `sendMessage` handler connected to the WebSocket service.
4.  **`ServiceGateModal` (Conditional Render):**
    *   A blocking modal that prevents interaction with underlying content.
    *   Must be dismissed by an external trigger (e.g., the payment portal success callback).

## 🛠️ Development & Usage Notes

### 🟢 Best Practices

*   **Error Boundaries:** Wrap the entire dashboard rendering logic within an Error Boundary component to gracefully handle unexpected API failures without crashing the entire page.
*   **State Separation:** Keep the state related to *authentication/billing* entirely separate from the state related to *UI layout/chat messages*.
*   **Optimistic Updates:** For message sending, always implement an optimistic UI update to provide immediate feedback to the user, followed by a rollback mechanism if the API call fails.

### 🔴 Known Limitations / Warnings

1.  **Styling Isolation:** Due to the high complexity, potential CSS conflicts are common. Ensure all styling within this component uses CSS-in-JS or scoped CSS modules to prevent leakage into other parts of the application.
2.  **WebSocket Cleanup:** **Crucially,** ensure that the `useWebSocketHook` subscription is properly cleaned up within the `useEffect` return function to prevent memory leaks when the component unmounts.
3.  **Loading States:** The component needs robust loading feedback for **three** different asynchronous operations: Billing Check, Conversation History Load, and Profile Save. These loading states must be clearly communicated to the user.