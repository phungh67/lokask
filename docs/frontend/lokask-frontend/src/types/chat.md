[⬅ Return to Main Compendium](../../../../../README.md)

## 📐 Frontend Architecture Documentation & UI Logic Blueprint

**Role:** Senior Frontend Officer (TypeScript / Vite Specialist)
**Focus:** Defining robust, scalable, and type-safe component architecture and state management for chat, scheduling, and dashboard features.

---

### 📋 I. Core Architectural Principles

Our architecture will strictly follow the container/presentation pattern. All business logic (data fetching, state transformations, status checks) must live in **Container Components** (or custom Hooks/Services), while **Presentation Components** (or UI Elements) must be purely dumb, receiving all necessary data and callbacks via props.

**Goal:** Maximum reusability, minimal coupling, and complete type safety enforced by TypeScript.

**Technology Stack Foundation:**
*   **Framework:** React (using functional components).
*   **Bundler:** Vite (for optimal hot module reloading and build speed).
*   **Language:** TypeScript (mandatory).
*   **State Management:** Zustand (or similar lightweight store) for global state management.

---

### ⚙️ II. State Management Strategy (Using Zustand/RTK)

We must abstract the raw API payloads into predictable state slices to ensure components do not rely on mutable data or complex data fetching logic.

#### A. Global State Slice: `useConversationStore`

This store will manage the active conversation state, handling the confluence of messages, summaries, and related booking information.

| State Key | Type | Source Interfaces | Description |
| :--- | :--- | :--- | :--- |
| `currentChatId` | `string` | N/A | ID of the conversation currently viewed. |
| `messages` | `ChatMessage[]` | `ChatMessage` | Ordered array of displayed messages (needs sorting/filtering). |
| `summary` | `ConversationSummary` | `ConversationSummary` | The AI-derived, actionable summary of the chat. |
| `scheduledCall` | `ScheduledCall | null` | `ScheduledCall` | The state of the potential/booked meeting associated with this chat. |
| `isLoading` | `boolean` | N/A | Flag for API activity (e.g., fetching messages, calculating summary). |

**Actions Required:**
1.  `fetchMessages(conversationId: string)`: Fetches chat history and populates `messages`.
2.  `addMessage(message: ChatMessage)`: Adds new messages to the end of the `messages` array (optimized for chat scrolling).
3.  `updateCallStatus(callId: string, newStatus: ScheduledCall['status'])`: Updates the scheduling status and triggers potential UI warnings.
4.  `setSummary(summary: ConversationSummary)`: Overwrites/updates the AI summary data.

#### B. Handling Complex Types (Date & Time)

*   **Standardization:** All date/time representations used in the frontend state *must* be converted to JavaScript `Date` objects immediately upon reception from the API (which provides ISO strings).
*   **Interface Adaptation:** When fetching data, utility functions must handle the conversion: `ChatMessage.created_at` (string) $\rightarrow$ `ChatMessage.timestamp` (Date).

---

### 🧩 III. Component Architecture Breakdown

We will define specialized components to ensure single responsibility and maintainability.

#### 1. Chat Module Components (`/components/chat/`)

| Component | Props Required | Logic Handled | Notes |
| :--- | :--- | :--- | :--- |
| **`ChatContainer` (Container)** | `conversationId: string` | *Hooks:* `useConversationStore` (Fetching, State updates). Manages message scroll position. | Fetches and aggregates all state data. |
| **`MessageList` (Container/List)** | `messages: ChatMessage[]` | Renders messages, calculates alignment (left/right) based on `sender`. | Must handle pagination and infinite scroll logic. |
| **`ChatMessageBubble` (Presentation)** | `message: ChatMessage` | Renders the content based on `message.type`. Handles display logic for maps, text, and images. | Key logic: If `type === "map"`, render `MapCard` instead of raw text. |
| **`MessageInput` (Presentation)** | `onSend: (content: string) => void` | Local state for text input. Sends payload to `useConversationStore`. | Focus management and validation logic belong here. |

#### 2. Scheduling/Call Module Components (`/components/schedule/`)

| Component | Props Required | Logic Handled | Notes |
| :--- | :--- | :--- | :--- |
| **`CallSummaryCard` (Presentation)** | `call: ScheduledCall` | Displays status badge and date info. Determines visual severity (e.g., warning color for `pending` status). | Responsible for displaying the primary call details. |
| **`StatusFlowIndicator` (Utility)** | `currentStatus: ScheduledCall['status']` | Renders conditional UI based on status (e.g., disabled button and specific text if `cancelled`). | Crucial for enforcing UI based on state flow. |
| **`BookingFlowForm` (Container)** | `onBook: (data: ScheduleData)` | Handles complex validation (time slot, availability). Calls the API to confirm/update status. | This component owns the mutable business logic for the booking. |

#### 3. AI Summary/Dashboard Components (`/components/dashboard/`)

| Component | Props Required | Logic Handled | Notes |
| :--- | :--- | :--- | :--- |
| **`SummaryModule` (Presentation)** | `summary: ConversationSummary` | Iterates over the arrays (`preferences`, `placesmentioned`, etc.) and renders dedicated, actionable chips/cards. | Displays AI output cleanly. Components should handle empty arrays gracefully. |
| **`NextStepsList` (Presentation)** | `nextSteps: string[]` | Renders actionable list items. May link directly to tasks or calendar invites. | Focus on clear, actionable text display. |

---

### ⚠️ IV. TypeScript Implementation Details & Typing Enforcement

To enforce type safety across all components, we must define utility types and strict component props.

#### A. Utility Types & Enhancements

```typescript
// Utility type to enforce exclusivity of data types
export type MessageContent = 
  | { type: "text"; content: string } 
  | { type: "image"; imageUrl: string } 
  | { type: "map"; mapData: ChatMessage['mapData'] };

// Updated interface for internal state handling
export interface ChatMessageDisplay {
  id: string | number;
  sender: "user" | "consultant" | "traveler";
  timestamp: Date; // Mandatory Date object for frontend use
  type: MessageContent['type'];
  contentData: MessageContent; // Mandatory typed content payload
}

// Props interface for the main Chat Bubble component
export interface ChatBubbleProps {
  message: ChatMessageDisplay;
  isOutgoing: boolean; // Helper prop for left/right alignment
}
```

#### B. Logic Flow Enforcement: `ScheduledCall`

The state machine for the `ScheduledCall` status must be strictly adhered to:

1.  **Initial State:** `pending` (Waiting for confirmation/details).
2.  **Transition to:** `confirmed` (Success, visible date/time).
3.  **Transition to:** `cancelled` (Irreversible state, UI must show cancellation reason and prevent booking changes).
4.  **Final State:** `completed` (Historical data, view-only).

All buttons within the `BookingFlowForm` must use a state guard (`if (status === "cancelled") { return <Disabled /> }`) to prevent invalid user actions.

---
*this content was created by AI, but the coding and underlying logic are not.*