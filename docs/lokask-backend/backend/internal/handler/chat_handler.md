# `handler/chat_handler.go` - Chat Service API Handler

## 📜 Overview

This handler package (`ChatHandler`) is responsible for implementing the API logic layer for the core real-time chat functionality of the application. It utilizes the `gofiber/fiber` framework to handle HTTP requests and delegates business logic and data persistence to the injected `repository.ChatRepository` and `mailer.MailService`.

The service handles key chat operations including starting conversations, sending messages (with associated notifications), retrieving message history, fetching active chat sessions, and managing the general inbox view.

**Target Domain:** System Design, API Layer Implementation, Messaging Infrastructure.

---

## ⚙️ Detailed Implementation Guide

### 1. Structure and Dependencies

The `ChatHandler` struct encapsulates the necessary external dependencies:

*   `Repo`: An instance of `repository.ChatRepository`, responsible for all database interactions related to conversations and messages.
*   `Mailer`: An instance of `mailer.MailService`, responsible for sending asynchronous email notifications.

**Authentication Flow:** All protected endpoints rely on a pre-authenticated context variable, `user_id`, which is retrieved from `c.Locals("user_id")`.

### 2. Endpoint Functionality Mapping

| Method | Endpoint Pattern | Function | Role / Description | Security Notes |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/conversations` | `StartChat` | Initiates a new chat conversation between the authenticated user (Traveler) and a specified consultant. Creates or retrieves the conversation record. | Requires valid `ConsultantID` in the body. |
| `POST` | `/conversations/:id/messages` | `SendMessage` | Sends a message within a specific conversation ID. **Asynchronously triggers email notifications.** | **Participant Check:** Strictly validates if the sender is a participant in the conversation. |
| `GET` | `/conversations/:id/messages` | `GetHistory` | Retrieves the message history for a conversation ID. **Marks the conversation as read** for the authenticated user. | Updates conversation metadata (`MarkAsRead`). |
| `GET` | `/conversations/:id/session` | `GetSession` | Fetches the active chat session data, typically used for real-time client rendering (e.g., WebSocket initialization). | Returns HTTP 404 if no active session is found. |
| `GET` | `/conversations` | `GetInbox` | Retrieves a list of all conversations associated with the authenticated user (the user's inbox). | Core listing endpoint. |
| `POST` | `/conversations/:id/session/refill` | `RefillSession` | *Hidden/Admin:* Manually grants a "VIP Ticket" (session) to a conversation for testing/admin purposes. | **Highly restricted endpoint.** |

### 3. Key Logic Breakdown

#### A. `SendMessage` (The Core Feature)

1.  **Validation:** Performs strict authorization checks:
    *   Verifies the user is logged in (`myIDStr`).
    *   Parses the conversation ID (`convID`).
    *   **Participation Check:** Executes a database query (`SELECT EXISTS...`) to confirm that the authenticated user (`myID`) is listed as either the traveler or the consultant associated with the `convID`. If not, it returns a `403 Forbidden`.
2.  **Message Storage:** Writes the content to the database using `h.Repo.CreateMessage`.
3.  **Asynchronous Notification (Critical):**
    *   A Go routine (`go func(...)`) is spawned immediately after saving the message.
    *   This background task fetches the necessary receiver details (Email, Name) by joining the `conversations`, `users`, and `consultants` tables.
    *   It calls `h.Mailer.SendMessageNotification` to send the email preview notification to the recipient, ensuring the main API thread does not block on external network I/O.

#### B. `GetHistory`

1.  Before fetching messages, it calls `h.Repo.MarkAsRead(convID, myID)`, updating the conversation's status in the database.
2.  It fetches all messages and performs in-memory processing to set a boolean flag (`IsMe`) on each message object, improving client-side rendering efficiency.

---

## 💡 Notes & Architectural Considerations

1.  **Separation of Concerns (SoC):** The handler layer is well-designed, acting purely as the intermediary. It handles HTTP request/response lifecycle, validation, and context management, while delegating all complex business rules and data access to the `repository` and `mailer` packages.
2.  **Context Handling:** The use of `c.UserContext()` ensures that database operations (especially in background goroutines) can access the transaction context of the incoming request, aiding in tracing and transaction management.
3.  **Efficiency in History Retrieval:** Marking the message ownership (`IsMe`) in memory post-fetch is a clever optimization that reduces the number of fields the database needs to handle during the primary `GetMessages` query.
4.  **Non-Blocking I/O:** The use of a background goroutine in `SendMessage` is critical for maintaining a responsive user experience. The API response confirms the message was "sent" immediately, even if the email notification takes time to process.

## ⚠️ Warnings & Areas for Improvement

1.  **Error Handling in Background Tasks (Improvement):** The email sending logic runs inside a fire-and-forget goroutine. If the application crashes *after* the message is saved but *before* the goroutine completes, the email may never be sent, and the failure is only logged locally (`log.Printf`).
    *   **Recommendation:** Consider implementing a robust queuing system (e.g., Redis/RabbitMQ, AWS SQS) to decouple the message sending from the API request, ensuring delivery guarantees and better failure handling.
2.  **Concurrency and Race Conditions:** The logic for fetching receiver details in `SendMessage` is complex (multiple joins on `users` and `consultants`). If the underlying `repository.DB` connection pooling or transaction isolation is not perfectly managed, concurrent sends could lead to stale data or unexpected join results.
3.  **Security - Exposed Admin Endpoint:** The `RefilSession` endpoint is a "cheat code" and grants administrative privileges (VIP ticket generation) via a simple POST request.
    *   **Mitigation:** This endpoint must be protected by strict authorization checks (e.g., role-based access control) to ensure only authorized service accounts or administrators can call it.
4. **Error Handling Consistency:** While network/database errors are expected, the code assumes success on the network level. Explicit error handling around the external mail service integration would make the system more robust.