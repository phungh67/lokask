[⬅ Return to Main Compendium](../../../../../../README.md)

As a Senior Frontend Officer specializing in TypeScript and Vite, I've analyzed the core logic flow defined by the `VideoCallHandler`.

While this handler defines robust backend state and connectivity logic, our goal on the frontend is to encapsulate this complexity into predictable, reactive state streams and modular components. We need to abstract the raw WebSocket interaction into a clean service layer that feeds changes into our global state store.

Here is the proposed documentation for the client-side architecture.

---

## 💻 Client-Side Architecture Documentation (TypeScript / Vite)

The video call system relies heavily on real-time, unidirectional state updates. We will adopt a **Service Layer** pattern combined with a central **State Management** solution (e.g., Zustand or Redux Toolkit) to manage the presence and communication state.

### 1. ⚛️ State Management (Global Store)

The `VideoHub` and `VideoRoom` concepts must be translated into an observable, centralized state slice. This single source of truth will manage connectivity, user presence, and the message history for the currently viewed room.

**State Shape (`VideoState`):**

```typescript
// src/store/videoStore.ts
interface ConnectionStatus {
  isConnected: boolean;
  isJoinedRoom: boolean;
  error?: string;
}

interface RoomClient {
  userId: string;
  // Timestamp when user joined/last was seen
  lastSeen?: number; 
}

export interface VideoState {
  // Global connection status for the current user
  connection: ConnectionStatus; 
  
  // The unique ID of the room the user is in (derived from bookingID)
  currentRoomId: string | null; 
  
  // Map of all users confirmed present in this room
  roomClients: Record<string, RoomClient>; 
  
  // History of messages exchanged in this specific room
  messageHistory: Message[]; 
}

// Initial State Implementation
// (Using a library like Zustand or similar)
```

**Key State Actions:**

| Action | Triggered By | Corresponds to Backend Logic | Effect |
| :--- | :--- | :--- | :--- |
| `initializeConnection(bookingId, userId)` | Component Mount | Joining the room, initial `CallHub` room creation. | Sets `currentRoomId`, sets `connection.isConnected = true`. |
| `userConnected(userId)` | WS Message/Heartbeat | Adding `userID` to `room.Clients`. | Updates `roomClients` map in state. |
| `userLeft(userId)` | WS Disconnect/Cleanup | User disconnects (`c.ReadMessage` fails). | Removes `userId` from `roomClients`. Triggers cleanup logic. |
| `handleIncomingMessage(message)` | WS `onmessage` event | Broadcasting a message to the client. | Appends the message to `messageHistory`. |
| `sendMessage(message)` | User Input (Component Action) | Writing a message to the socket. | Optimistically updates local state, sends payload to service. |

### 2. 🔌 Service Layer (WebSocket Management)

We must abstract the entire WebSocket connection lifecycle into a dedicated TypeScript service. This service handles the raw connectivity, error handling, and data formatting, emitting structured events that the state store consumes.

**File:** `src/services/WebSocketService.ts`

**Responsibilities:**

1.  **Connection & Reconnection:** Manages the connection URI (`/video-call?booking_id=...`) and implements exponential backoff for reconnection attempts.
2.  **Event Mapping:** Translates raw WebSocket events (`onopen`, `onmessage`, `onerror`, `onclose`) into typed events.
3.  **Message Dispatch:** Listens for incoming messages and immediately dispatches a state update action (e.g., `dispatch(handleIncomingMessage(payload))`).

**Implementation Flow (Conceptual):**

```typescript
export class VideoService {
  private ws: WebSocket | null = null;

  constructor(private readonly bookingId: string, private readonly userId: string) {}

  connect(): Promise<void> {
    // 1. Establish connection and set up event listeners.
    this.ws = new WebSocket(`ws://localhost:8080/video-call?booking_id=${this.bookingId}`);

    this.ws.onopen = () => {
      // Dispatch: Success/Connected state
      // stateStore.dispatch(ConnectionStatus.CONNECTED);
    };

    this.ws.onmessage = (event) => {
      const payload = JSON.parse(event.data);
      // We need to validate who the message is from and how to route it
      if (payload.type === 'MESSAGE') {
        // Dispatch: Message received for history
        // stateStore.dispatch(handleIncomingMessage(payload));
      } else if (payload.type === 'PRESENCE_UPDATE') {
        // Dispatch: User presence update
        // stateStore.dispatch(handlePresenceUpdate(payload));
      }
    };
    
    this.ws.onclose = (event) => {
      // Dispatch: Disconnection/Cleanup state
      // stateStore.dispatch(ConnectionStatus.DISCONNECTED);
    };
  }

  sendMessage(message: string): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const payload = { type: 'MESSAGE', content: message };
      this.ws.send(JSON.stringify(payload));
    }
  }
}
```

### 3. 🖼️ Component Architecture (UI Logic)

Components should be entirely **dumb** and purely responsible for rendering based on the received `VideoState`. They should never interact directly with the WebSocket or state store; they only use selectors provided by the store.

| Component | Role | Dependencies (State Selectors) | Logic/Flow |
| :--- | :--- | :--- | :--- |
| **`<VideoRoomView />`** (Container) | Orchestrator, Manages connection lifecycle. | `connection`, `currentRoomId` | 1. Calls `VideoService.connect()` on mount. 2. Passes `currentRoomId` to children. 3. Cleans up connection on unmount. |
| **`<PresenceList />`** | Renders who is in the room. | `roomClients` | Iterates over `roomClients` map. Displays user avatars/names. **Reactive:** Re-renders whenever a user joins or leaves (state change). |
| **`<MessageHistory />`** | Renders the chat stream. | `messageHistory` | Iterates over `messageHistory` array. Optimized rendering (virtualized lists) for performance. **Reactive:** Scrolls to bottom whenever a new message is added. |
| **`<MessageInput />`** | Handles user input. | None (Pure input component) | 1. Collects text input. 2. On submit, calls `VideoService.sendMessage(text)` (initiates state change). |

### 📚 Summary of Logic Flow

1.  **Mount:** `<VideoRoomView>` mounts $\rightarrow$ calls `VideoService.connect()`.
2.  **Connect:** `VideoService` opens WebSocket $\rightarrow$ `VideoState` updates connection status.
3.  **Presence Update:** Backend broadcasts presence $\rightarrow$ `VideoService` dispatches `handlePresenceUpdate` $\rightarrow$ `<PresenceList>` re-renders.
4.  **User Action:** User types message $\rightarrow$ `<MessageInput>` triggers `VideoService.sendMessage()` $\rightarrow$ Message is sent over WS.
5.  **Message Receipt:** Remote user sends message $\rightarrow$ `VideoService` receives WS payload $\rightarrow$ `VideoState` dispatches `handleIncomingMessage` $\rightarrow$ `<MessageHistory>` appends the message and re-renders.
6.  **Unmount:** `<VideoRoomView>` unmounts $\rightarrow$ calls `VideoService.disconnect()` $\rightarrow$ `VideoState` updates connection status, informing all components that the session has ended.

***
*this content was created by AI, but the coding and underlying logic are not.*