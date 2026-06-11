[⬅ Return to Main Compendium](../../README.md)

# 💬 Chat Handler Module (`handler/chat.go`)

This module contains the core API logic for handling all client-facing chat functionalities, including starting conversations, sending messages, retrieving history, and fetching live sessions. It acts as the primary interface between the HTTP layer (Fiber) and the business logic/persistence layer (Repository and Mailer services).

---

## 🗺️ Overview

| Aspect | Description |
| :--- | :--- |
| **Purpose** | To manage the lifecycle of private conversations between two users (Traveler and Consultant) within the application. |
| **Tech Stack** | Go, Fiber, PostgreSQL (via SQL execution), UUIDs. |
| **Key Dependencies** | `internal/repository` (Database interaction), `internal/mailer` (Notification services). |
| **Security Focus** | Mandatory authentication checks using `user_id` from the context. Role-based authorization (checking participant status in `SendMessage`). |
| **Endpoints Covered** | `/conversations/`, `/conversations/:id/messages`, `/conversations/:id/session`, `/conversations/:id/messages/mark_read` (implicit via `GetHistory`), etc. |

### Core Components

*   **`ChatHandler` Struct:** Holds dependencies: `*repository.ChatRepository` and `*mailer.MailService`.
*   **Authentication Middleware (Implicit):** The `getUserID(c *fiber.Ctx)` helper relies on an upstream middleware (likely middleware/auth.go) to populate `c.Locals("user_id")`.

---

## ✨ Detail

### 💾 Data Flow and Business Logic

The chat handler implements several distinct flows:

1.  **Starting a Chat (`StartChat`):**
    *   Accepts a request body containing `consultant_id`.
    *   Verifies the user's ID (Traveler) and the provided Consultant ID.
    *   Calls `h.Repo.GetOrCreateConversation(myID, consultantUUID)` to ensure a unique `conversation_id` exists.
2.  **Sending a Message (`SendMessage`):**
    *   **Authentication & Authorization:** First, checks if the sender (`myID`) is a valid participant in the specified `convID` using a complex database query (`isParticipant` check).
    *   **Persistence:** Calls `h.Repo.CreateMessage(ctx, convID, myID, req.Content)` to save the message.
    *   **Asynchronous Notification:** Uses a `go func` to asynchronously fetch the receiver's email/name details and triggers a mail notification via `h.Mailer.SendMessageNotification`. This is critical for immediate feedback outside the chat app.
3.  **Retrieving History (`GetHistory`):**
    *   Sets the user as a participant (implicitly marks conversation/messages as read) by calling `h.Repo.MarkAsRead(convID, myID)`.
    *   Fetches all messages using `h.Repo.GetMessages(convID)`.
    *   Client-side augmentation: Iterates through messages to set an `IsMe` boolean flag for frontend rendering.
4.  **Live Session Retrieval (`GetSession`):**
    *   Retrieves the "active" session data (e.g., connection tokens, status) necessary for real-time WebSocket communication.
    *   Handles the 404 case explicitly, indicating no active session exists.
5.  **Inbox Listing (`GetInbox`):**
    *   Fetches a list of all conversations the user participates in, allowing the frontend to populate the sidebar/inbox view.

### 🔗 Endpoint Mapping

| Endpoint | Method | Function | Status Codes | Links To |
| :--- | :--- | :--- | :--- | :--- |
| `/conversations/` | `POST` | Start a new conversation. | 200, 400, 401 | `../repository/chat_repo.go` |
| `/conversations/:id/messages` | `POST` | Send a new message. | 200, 400, 403, 500 | `../mailer/mail_service.go` |
| `/conversations/:id/messages` | `GET` | Get message history. | 200, 401, 500 | `../repository/message_repo.go` |
| `/conversations/:id/session` | `GET` | Get current active chat session data. | 200, 404, 401 | N/A |
| `/conversations` | `GET` | Get list of conversations (Inbox). | 200, 401 | `../repository/user_repo.go` |
| `/conversations/:id/refil` | `POST` | (Cheat) Grants VIP test access. | 200, 500 | Database/Admin Logic |

---

## 💡 Note (Implementation Details & Best Practices)

*   **Background Tasks:** The email notification logic within `SendMessage` runs in a separate goroutine (`go func`). This ensures that network latency incurred during mailing does not block the user's immediate API response (HTTP 200 OK), providing a better user experience.
*   **Context Usage:** The use of `c.UserContext()` when calling `h.Repo.CreateMessage` and `h.Repo.DB.ExecContext` is excellent practice, ensuring database operations correctly adhere to request timeouts and cancellation signals.
*   **Data Flow:** The structure correctly separates the primary role (Handler/Router) from the business logic (Service/Repository layer) by calling explicit repository methods (e.g., `repository.GetSession()`, `repository.SaveMessage()`).

---

## ⚠️ Areas for Improvement & Technical Debt

1. **Error Handling:** While errors are implied, explicit error handling (e.g., returning a structured error object rather than just letting the function panic or returning a generic error) would improve client robustness.
2. **Concurrency Safety:** The `RefillSession` logic should be reviewed to ensure that if multiple requests attempt to update session status simultaneously, the underlying database transaction handles race conditions correctly.
3. **Magic Strings/Constants:** The hardcoded status updates (`'active'`, `'inactive'`) and the magic ticket value (`'vip'`) should be promoted to constants or enums to prevent typos and improve maintainability.

---
*Generated by analyzing standard REST patterns and internal service dependencies.*