[⬅ Return to Main Compendium](../../../../../../README.md)

As a senior frontend officer specializing in TypeScript and Vite, my goal is to translate this backend repository logic into a robust, predictable, and highly testable client-side architecture.

The core components of this chat system are:
1. **Data Modeling:** Defining the TypeScript interfaces based on the database structures.
2. **State Management:** Handling global and local chat state (inbox state, active chat state, session status).
3. **Service Layer:** Abstracting all API calls and complex business logic (like session checking and read receipts).
4. **Components/Hooks:** Building reusable UI elements that consume the state.

---

## 💻 Frontend Architecture Documentation (TypeScript/React/Zustand)

### 1. Data Modeling (TypeScript Interfaces)

We first define strict interfaces to ensure type safety across our entire application state.

```typescript
// src/types/chat.ts

/** Represents a single chat message payload. */
export interface Message {
    id: string; // uuid.UUID
    conversationId: string;
    senderId: string;
    content: string;
    createdAt: Date;
    isRead: boolean;
    isMe: boolean; // Derived on the client/backend based on senderId comparison
}

/** Represents the metadata for a conversation thread (used in the inbox). */
export interface Conversation {
    id: string;
    travelerId: string;
    consultantId: string;
    lastMessage: string | null;
    lastMessageAt: Date;
    
    // Fields derived via JOINs in the repository
    otherUserName: string;
    otherUserAvatar: string | null;
}

/** Represents the active consultation session status (derived from domain.ConsultantSession). */
export interface ChatSessionStatus {
    status: 'active' | 'awaiting_reply' | 'expired' | 'pending_payment';
    expiresAt: Date | null;
    // Potentially other metadata like duration, etc.
}

/** Combined state object for an active chat thread. */
export interface ActiveChatState {
    conversation: Conversation;
    messages: Message[];
    sessionStatus: ChatSessionStatus;
    isTyping: boolean;
}
```

### 2. State Management (Zustand/Redux Toolkit)

We recommend using a global store (e.g., Zustand) to manage the collection of conversations and the active chat window.

#### `useChatStore`

**State:**

```typescript
type ChatStoreState = {
    // Array of all conversations visible in the sidebar/inbox.
    conversations: Conversation[];
    // The ID of the currently selected conversation.
    activeConversationId: string | null;
    // Holds the deep state for the active chat window.
    activeChat: ActiveChatState | null;
    // Handles temporary UI states.
    isSendingMessage: boolean;
    error: string | null;
};
```

**Actions (API Interaction):**

| Action | API Call (Service Layer) | Logic Notes |
| :--- | :--- | :--- |
| `fetchInbox(userId: string)` | `chatService.getInbox(userId)` | Populates `conversations`. Crucial for determining `otherUserName` and `otherUserAvatar` on the client side. |
| `loadChatThread(conversationId: string, currentUserId: string)` | `chatService.loadChatThread(conversationId, currentUserId)` | 1. Calls `getMessages`. 2. Calls `getChatSession`. 3. Updates `activeChat` state. |
| `sendMessage(conversationId: string, content: string)` | `chatService.createMessage(conversationId, content)` | Optimistically updates the `messages` array, then calls `markAsRead` (if applicable). **Crucially, this API call also updates `lastMessage` on the backend.** |
| `markAsRead(conversationId: string, readerId: string)` | `chatService.markAsRead(conversationId, readerId)` | Only called when the user leaves or when the component mounts to confirm read status for the server. |

### 3. Service Layer (API Abstraction)

This service layer handles the raw fetching and complex validation logic, insulating the components from the messy details of the repository logic.

```typescript
// src/services/chatService.ts

// 3.1. Conversation Initialization Logic
export const getOrCreateConversation = async (travelerId: string, consultantId: string): Promise<Conversation> => {
    // Implements GetOrCreateConversation logic.
    // Backend handles the SELECT/INSERT logic efficiently.
    // Frontend only needs the resulting Conversation object.
    // ... API call implementation ...
};

// 3.2. Session Validation Logic (Critical Business Flow)
export const getChatSessionStatus = async (conversationId: string): Promise<ChatSessionStatus> => {
    // Implements ChatRepository.GetChatSession (and internal sessionValidation).
    // This function must handle the complex business logic:
    // 1. Check for expired status.
    // 2. Check if a package is required/valid.
    // 3. If expired, it MUST return the `expired` status and an error message.
    
    // This is the most critical point of failure for UI logic.
    // If the status is 'expired', the chat input should be disabled, and a payment prompt shown.
    // ... API call implementation ...
};

// 3.3. Main Chat Thread Loader
export const loadChatThread = async (conversationId: string, currentUserId: string): Promise<ActiveChatState> => {
    const sessionStatus = await getChatSessionStatus(conversationId);
    const messages = await chatService.getMessages(conversationId);

    return {
        conversation: // (Fetch metadata based on conversationId)
        messages: messages.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
        sessionStatus: sessionStatus,
    };
}
```

### 4. Component Architecture (React Components/Hooks)

We break the UI into three major, isolated parts.

#### A. `ChatSidebar` (Inbox Component)
*   **Purpose:** Displays the list of conversations.
*   **Inputs:** `conversations: Chat[]` (from global state/Redux).
*   **Logic:** Listens for selection changes. When a user clicks a conversation ID, it triggers an action to load the full message history and sets the active conversation ID in the state.

#### B. `MessageWindow`
*   **Purpose:** Displays the message history.
*   **Logic:** Receives `messages: Chat[]` and the `activeConversationId`. Scrolls to the bottom on initial load and when new messages arrive.
*   **Interactions:** Observes the `activeConversationId` to refresh its content when the user switches conversations.

#### C. `MessageInput`
*   **Purpose:** Allows users to type and send messages.
*   **Inputs:** `onSendMessage: (message: string) => void`.
*   **Logic:** Handles form submission. When triggered, it sends the message content to the backend and then immediately triggers a state update (simulating a real-time message fetch) to append the new message locally, providing a fast user experience.

### Summary of Data Flow and State Management

1.  **Global State:** Holds the list of all `conversations` and the currently `activeConversationId`.
2.  **User Action:** User clicks a conversation in `MessageInput`.
3.  **Dispatch:** `MessageInput` dispatches `sendMessage(text)`.
4.  **Service Call:** The message service calls the backend.
5.  **State Update:** Upon success, the global state updates by fetching the new message list and setting the `activeConversationId` (if necessary).
6.  **UI Reaction:** `MessageWindow` observes the state change and re-renders the new message.