[⬅ Return to Main Compendium](../../README.md)

# 💬 Chat Service API Client (`api/client/chat.ts`)

This module encapsulates all client-side logic for interacting with the core Chat and Conversation APIs. It provides typed, reusable functions to manage the lifecycle of a conversation, including starting a chat, fetching history, sending messages, and checking billing sessions.

***

## 🧭 Structural Navigation

*   [📂 Overview](#-overview)
*   [🛠️ Details](#-details)
    *   [Functions & Endpoints](#functions--endpoints)
    *   [Type Definitions](#type-definitions)
*   [📝 Notes](#-notes)
*   [⚠️ Warnings & Tech Debt](#-warnings--tech-debt)

***

## 💡 Overview

This file acts as the dedicated client layer for the Chat service. Its primary responsibility is to abstract the HTTP requests made to the `/api/v1/conversations` endpoint group.

It uses a centralized `fetchJson` utility (from `./core`) to ensure consistent handling of request methods, JSON body serialization, and error parsing across all chat interactions. This separation of concerns keeps the application logic clean and focused on calling domain services rather than networking details.

## 🛠️ Details

### Functions & Endpoints

| Function | Endpoint | Method | Description | Usage Context |
| :--- | :--- | :--- | :--- | :--- |
| `startChat` | `/conversations` | `POST` | Initiates a new chat session using the provided consultant's ID. | Authentication/User Flow |
| `getChatHistory` | `/conversations/:id/messages` | `GET` | Retrieves the entire message history for a given conversation ID. | UI Rendering/State Loading |
| `sendMessage` | `/conversations/:id/messages` | `POST` | Sends a new message to the specified conversation. | User Interaction/Message Sending |
| `getInbox` | `/conversations` | `GET` | Fetches a list of all conversations (the user's inbox). | Dashboard/Listing View |
| `getChatSession` | `/conversations/:id/session` | `GET` | Checks if an active billing session exists for the conversation. | Billing/Analytics Check |

#### 📖 Code Flow Example (Sending Message)

The flow for sending a message involves:
1. Calling `sendMessage(conversationId, content)`.
2. The function constructs the payload `{ content }`.
3. `fetchJson` executes the `POST` request to `/conversations/:id/messages`.
4. The API handles the message persistence and returns the `ChatMessage` object.

### Type Definitions

This module relies on shared types for strong typing:

*   `Conversation`: Represents the metadata structure of a chat session (`id`, `traveler_id`, `consultant_id`, etc.).
*   `ChatMessage`: Represents a single message object (content, sender, timestamp, etc.).

## 📝 Notes

1.  **Separation of Concerns:** By isolating all API calls here, any future changes to the API endpoint structure (e.g., moving from v1 to v2) only require modifications within this file.
2.  **Error Handling (`getChatSession`):** The `getChatSession` function includes specific try-catch logic to handle expected 404 or "No active session found" errors gracefully, returning `null` rather than throwing an exception, which is crucial for stable client behavior in billing/analytics checks.
3.  **Payload Handling:** Notice how `sendMessage` requires the `content` to be stringified in the body, whereas `startChat` handles the `consultant_id` serialization. Consistency here is important.

## ⚠️ Warnings & Tech Debt

*   **Missing Authentication Context:** The current functions assume that the `fetchJson` utility handles the necessary authorization headers (e.g., JWT tokens) correctly. If authentication context is required for every call, it should be explicitly verified and passed down or injected into the client layer.
*   **Strict Typing for `getChatSession`:** The return type of `getChatSession` uses `Promise<any>` internally due to the broad `try...catch` structure. While the intention is to return `null` or a specific session object, defining a clearer union type (e.g., `Promise<Session | null>`) would improve robustness and IDE support.
*   **Inconsistent `last_message_at` Type:** The `Conversation` interface defines `last_message_at?: String` (with capital 'S'). While TypeScript often coerces this, best practice dictates using primitive types (`string` or `Date`) consistently.

***

### 🔗 Related Files & Flow Links

*   **[Core Utility Link](./core):** This module relies heavily on the `fetchJson` utility from `./core` to handle network requests uniformly.
*   **[Type Definitions Link](@/types/chat):** Defines `ChatMessage` and `Conversation`, ensuring data consistency across the entire application.
*   **[Middleware Check](../middlerware/chat):** If the chat API endpoint requires specific request body validation or authentication middleware, this file should link to the relevant middleware implementation.
*   **[API Route Definition](../../api/routes/chat.routes.ts):** The actual API definition for these endpoints should be documented here to validate the endpoint behavior.