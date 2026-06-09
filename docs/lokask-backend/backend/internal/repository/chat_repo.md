# Chat Repository Documentation

## 🌐 Overview

This repository provides data access layer (DAL) functionality for managing chat conversations and messages between users (Travelers) and consultants. It implements the core logic for retrieving conversation histories, creating new messages, and maintaining the state of user sessions/packages required for active chat communication.

The `ChatRepository` struct interacts with a SQL database (using `sqlx`) to manage three primary entities: `conversations`, `messages`, and `consultation_sessions`. A critical function of this repository is validating the active session status before allowing a message to be sent, ensuring that users have purchased or maintained an active package.

### Core Components

| Component | Description | Usage |
| :--- | :--- | :--- |
| `Conversation` | Represents a persistent chat thread between two specific users. | Used for indexing chats in an inbox list. |
| `Message` | Represents a single message within a conversation thread. | Used to fetch and display message history. |
| `ChatRepository` | Contains methods for all database interactions related to chat. | Dependency injection for database access. |

## ⚙️ Detail

### 💾 Data Models (Structs)

The repository defines the following database models:

#### `Conversation`
Defines the structure of a chat thread. It includes fields for the two participants (`TravelerID`, `ConsultantID`) and metadata about the last exchange.

| Field | Type | Description | DB Source | Notes |
| :--- | :--- | :--- | :--- | :--- |
| `ID` | `uuid.UUID` | Unique identifier for the conversation. | Primary Key | |
| `TravelerID` | `uuid.UUID` | ID of the traveler user. | | |
| `ConsultantID` | `uuid.UUID` | ID of the consultant user. | | |
| `LastMessage` | `*string` | Content of the last message sent. | | Used for quick inbox previews. |
| `OtherUserName` | `string` | Display name of the contact (dynamically joined). | Derived | |
| `OtherUserAvatar` | `*string` | Profile avatar URL of the contact. | Derived | |

#### `Message`
Defines the structure of a single chat message.

| Field | Type | Description | DB Source | Notes |
| :--- | :--- | :--- | :--- | :--- |
| `ID` | `int` | Unique primary key for the message. | Primary Key | |
| `ConversationID` | `uuid.UUID` | Foreign key linking to the conversation. | | |
| `SenderID` | `uuid.UUID` | ID of the user who sent the message. | | |
| `Content` | `string` | The actual message text. | | |
| `IsRead` | `bool` | Status indicating if the message has been read by the recipient. | | |
| `IsMe` | `bool` | Helper flag for frontend UI differentiation. | Local/Ignored | Not stored in DB, client-side logic only. |

### 🚀 Key Functionality (Methods)

#### 1. Conversation Management
*   **`GetOrCreateConversation(travelerID, consultantID)`**: Checks the database for an existing conversation thread. If found, it retrieves the details; otherwise, it creates a new record and returns the ID.
*   **`GetInbox(userID)`**: Retrieves a list of conversations for a given `userID`. This method is critical as it dynamically determines whether the user is the Traveler or the Consultant to correctly join and display the contact's name and avatar, ensuring a unified inbox experience.

#### 2. Message Handling
*   **`GetMessages(conversationID)`**: Fetches all messages for a specified conversation, ordered by creation date (ascending).
*   **`MarkAsRead(conversationID, readerID)`**: Updates messages within a conversation to mark them as read. It intelligently ignores messages sent *by* the `readerID` to prevent self-marking.

#### 3. Messaging and Session Control (The Core Logic)
*   **`sessionValidation(ctx, conversationID)`**: This is an internal method responsible for validating the user's chat capability. It checks the `consultation_sessions` table.
    *   It rejects chats if `Status` is `pending_payment`.
    *   It treats any session marked `expired` as a failure, optionally updating the session status in the database.
*   **`CreateMessage(ctx, conversationID, senderID, content)`**: This complex transactional method handles the creation of a message and several related updates:
    1.  **Pre-check:** It first validates the chat session using `sessionValidation`.
    2.  **Transaction:** It starts a database transaction (`tx`).
    3.  **Session Extension (Conditional):** If the current session status is `awaiting_reply` AND the sender is the `Consultant`, the session is activated (`status = 'active'`) and its `expires_at` time is recalculated and updated.
    4.  **Message Insertion:** Inserts the new message into the `messages` table.
    5.  **Conversation Update:** Updates the `conversations` table with the `content` and current timestamp, ensuring the inbox preview is accurate.
    6.  **Commit:** Commits all changes atomically.

## ⚠️ Warning

### Session and Payment Dependency
The chat functionality is critically dependent on the state of the `consultation_sessions` table. The `CreateMessage` method implicitly relies on the concept of purchased packages. **If the underlying business logic or transaction isolation levels change, the session extension logic within `CreateMessage` must be reviewed immediately.** Failure to manage the state transition (e.g., from `awaiting_reply` to `active`) correctly will result in chat breakage or data inconsistencies.

### Transaction Scope
The `CreateMessage` method executes multiple database operations (session update, message insert, conversation update) within a single transaction. If any single step fails, the entire transaction rolls back. This strong transactional guarantee is good for data integrity but requires robust error handling upstream.

## 💡 Note

### High Coupling Between Layers
This repository implementation exhibits strong coupling between the Data Access Layer (DAL) and the Business Logic Layer (BLL). Specifically, the `sessionValidation` logic and the session extension logic within `CreateMessage` are housed within the repository.

*   **Recommendation:** For better separation of concerns, the core session validation/extension policy (`if session.Status == "awaiting_reply" && senderID == conv.ConsultantID`) should ideally be moved up to a dedicated Service/Use Case layer (e.g., `ChatService`) which dictates *when* and *how* the database is updated. The repository should only expose functions like `UpdateSessionStatus(id, status, expiresAt)` and `GetSessionStatus(id)`.

### Database Mapping and Fields
The use of `db:"..."` tags and manual SQL joins (e.g., in `GetInbox`) suggest that some fields (`OtherUserName`, `OtherUserAvatar`) are calculated or materialized views rather than being stored directly in the `conversations` table. Developers should be aware that changes to the underlying join logic in `GetInbox` may impact front-end display logic.

## Usage Example (Conceptual)

```go
// service.go
func SendMessage(ctx context.Context, sessionRepo *SessionRepository, senderID, receiverID string, content string) error {
    // 1. SessionRepo handles session checks, updates, and sends the message.
    err := sessionRepo.CreateMessage(ctx, senderID, receiverID, content)
    if err != nil {
        return fmt.Errorf("failed to send message: %w", err)
    }

    // 2. The core business logic is encapsulated in the repository layer.
    return nil
}

// repository.go
func (r *Repository) CreateMessage(ctx context.Context, senderID, receiverID, content string) error {
    // This function encapsulates the session checks and the actual DB write.
    return r.db.ExecContext(ctx, 
        `INSERT INTO messages (sender_id, receiver_id, content) VALUES (?, ?, ?)`,
        senderID, receiverID, content,
    )
}
```