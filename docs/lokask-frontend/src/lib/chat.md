# 📁 API Service Layer Documentation: Chat Interactions

This document provides a comprehensive technical summary of the `chatService` module. This layer encapsulates all interactions with the core messaging API endpoints (`/api/v1/`). Its primary function is to manage the lifecycle of conversations, from initiating a chat session to retrieving historical messages and tracking billing usage.

---

## 🚀 Overview

The module serves as the dedicated client-side API wrapper for the chat service. By abstracting direct HTTP calls, it provides a clean, promise-based interface for the application to handle all conversational flow logic.

**Key Responsibilities:**
1.  **Conversation Lifecycle Management:** Starting, retrieving, and managing messages within a chat context.
2.  **Data Consistency:** Ensuring that API calls adhere to defined data structures (`Conversation`, `ChatMessage`).
3.  **Operational Tracking:** Providing specific endpoints (e.g., session retrieval) necessary for billing and monitoring purposes.

**Dependencies:**
*   `./core`: Dependency for the `fetchJson` utility function (Handles structured JSON API requests).
*   `@/types/chat`: Defines necessary data contracts (`ChatMessage`, `Conversation`).

## ⚙️ Detailed Functionality Reference

The following functions map directly to the API endpoints available in the `/v1/` namespace.

### 1. `startChat(consultantId: string)`

Initiates a new, unique conversation session.

*   **Endpoint:** `POST /api/v1/conversations`
*   **Request Body:** `{ consultant_id: string }`
*   **Response:** `Promise<Conversation>` (The newly created conversation object).
*   **Mechanism:** Calls `fetchJson` with a POST method.
*   **Use Case:** Executed when a user begins interacting with the chat system for the first time in a given session.

### 2. `getChatHistory(conversationId: string)`

Retrieves all historical messages for a given conversation thread.

*   **Endpoint:** `GET /api/v1/conversations/:id/messages`
*   **Parameters:** `conversationId` (The specific conversation ID).
*   **Response:** `Promise<ChatMessage[]>` (An array of chat message objects).
*   **Mechanism:** Simple GET request, fetching data directly from the endpoint.

### 3. `sendMessage(conversationId: string, content: string)`

Sends a new message to the active conversation thread.

*   **Endpoint:** `POST /api/v1/conversations/:id/messages`
*   **Parameters:**
    *   `conversationId`: The ID of the target chat.
    *   `content`: The message text to be sent.
*   **Request Body:** `{ content: string }`
*   **Response:** `Promise<ChatMessage>` (The message object that was successfully posted).
*   **Mechanism:** Calls `fetchJson` with POST, ensuring the sent content is correctly serialized.

### 4. `getInbox()`

Retrieves a list of all active and past conversations associated with the user.

*   **Endpoint:** `GET /api/v1/conversations`
*   **Parameters:** None.
*   **Response:** `Promise<Conversation[]>` (An array listing various conversation summaries).
*   **Use Case:** Populating the main "Inbox" view in the application UI.

### 5. `getChatSession(conversationId: string)`

Checks the current billing and usage session status for a given conversation ID.

*   **Endpoint:** `GET /api/v1/conversations/:id/session`
*   **Parameters:** `conversationId` (The ID of the conversation being audited).
*   **Response:** `Promise<any>` (Details about the billing session, or `null`).
*   **Error Handling Focus:** This function contains explicit `try...catch` logic. It gracefully handles API errors (specifically HTTP 404 or explicit "No active session found" errors) by returning `null` instead of throwing, improving front-end resilience for billing checks.

---

## 💡 Notes & Architectural Insights

*   **API Versioning:** All endpoints are consistently prefixed with `/v1/`, which is a strong practice for allowing non-breaking future API changes.
*   **Data Integrity:** The module correctly passes the `consultantId` when initiating a chat, linking the session creator to the conversation record.
*   **Resilience:** The inclusion of robust error handling in `getChatSession` demonstrates an understanding of operational requirements (billing) where a missing session state should be handled as a *conditional state* (null) rather than a *fatal error* (exception).
*   **Time Management:** The `Conversation` interface includes `last_message_at`. It is assumed that the API endpoint generating the `Conversation` object automatically populates this field with a standardized, sortable time format (e.g., ISO 8601).

---

## ⚠️ Warnings & Outstanding Items (TODO List)

### 🚧 Infrastructure / Design Considerations

1.  **Rate Limiting & Retry Logic:** The current implementation does not account for transient network failures or API rate limits. A dedicated retry mechanism (e.g., using an exponential backoff strategy) should be implemented within `fetchJson` or surrounding the API calls to enhance reliability.
2.  **Error Propagation Standardization:** While `getChatSession` handles specific 404s, other functions (`getChatHistory`, `sendMessage`) rely on generic API failure handling. The module should implement a unified pattern to translate specific HTTP status codes (e.g., 400 Bad Request, 401 Unauthorized) into predictable, consumed application error objects.
3.  **Authentication/Authorization Scope:** The provided functions assume a functional authorization layer is active. It is unclear how the caller authenticates or provides scope (e.g., a Bearer token). This context needs to be explicitly added to the documentation or the `fetchJson` utility.

### 🐛 Code & Type Safety Concerns

1.  **Unused/Undefined Types:** The `ChatMessage` type is imported but its definition is not present. For complete documentation, the schema for `ChatMessage` (including fields like `sender_type`, `timestamp`, `content`) must be available.
2.  **Boolean Typing:** The `last_message_at` type in the `Conversation` interface is defined as `String` (with a capital S). In TypeScript, standard type usage suggests this should be `string` (lowercase). This potential type mismatch should be verified and corrected.
3.  **`getChatSession` Return Type:** The function returns `Promise<any>`. This is too broad. The return type should be explicitly defined (e.g., `Promise<{ status: string; usage_minutes: number } | null>`) to enforce type safety based on the expected billing schema.