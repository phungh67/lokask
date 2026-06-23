[⬅ Return to Main Compendium](../../../../../../README.md)

As a senior backend officer specializing in Go and robust backend architectures, I analyze this component not purely as a UI piece, but as the *Presentation Layer Interface* for a core business entity—the active communication session with a `Consultant`.

The primary function is to consolidate and display the state and metadata of the current chat session, allowing the user to manage (minimize/close) the connection.

---

### 🧠 Core Logic Documentation (Service Layer Abstraction)

The logic governing the `ChatHeader` relies on fetching, validating, and presenting three key pieces of information: the `Consultant` profile data, the current `Session Status`, and the necessary `Action Handlers`.

#### 1. Data Derivation Logic (`Consultant` State Aggregation)
The system must derive several derived states from the raw `Consultant` object:

*   **Display Name:** Must handle the fallback logic (`consultant.displayName` $\rightarrow$ `consultant.name`).
*   **Presence Indicator:** Boolean check (`consultant.isOnline`) must dictate the visibility and styling of the green status dot.
*   **Status Text:** The accompanying text must only append "Online now" if `consultant.isOnline` is true.
*   **Avatar Fallback:** If `consultant.avatarUrl` is missing or invalid, a deterministic fallback logic must execute (e.g., `ui-avatars.com` based on the consultant's name).

**Pseudocode (Conceptual Go Service Logic):**

```go
// GetDisplayInfo processes the Consultant struct into a validated, display-ready object.
func GetDisplayInfo(c *models.Consultant) models.ChatHeaderDisplay {
    if c == nil {
        return models.ChatHeaderDisplay{
            IsLoading: true,
            Avatar:      "",
            Name:        "Loading...",
            Subtitle:    "",
        }
    }

    // 1. Determine Name
    displayName := c.DisplayName
    if displayName == "" {
        displayName = c.Name
    }

    // 2. Determine Presence Status
    isOnline := c.IsOnline
    statusText := ""
    if isOnline {
        statusText = "Online now"
    }

    // 3. Construct the final display object
    return models.ChatHeaderDisplay{
        AvatarURL:   c.AvatarURL,
        Name:        displayName,
        Subtitle:    fmt.Sprintf("%s %s", c.City, statusText), // Concatenation logic
        IsOnline:    isOnline,
        IsLoading:   false,
    }
}
```

#### 2. State Management Logic (Component Initialization)
The component must handle the transition between initial loading/uninitialized states and fully loaded states.

*   **Initial State (Loading/Null):** If `consultant` data is null or unset, the header must render a skeletal/skeleton loading view (`animate-pulse` blocks) to prevent layout shifts and improve perceived performance.
*   **Stable State:** Once data is available, the standard header components (avatar, name, status, controls) are rendered.

---

### 🌐 API Surfaces (Function Contracts)

While this component doesn't define a REST endpoint, it defines several critical functional contracts (APIs) that must be respected by the surrounding application state manager (e.g., a Redux store or a Go handler managing the chat context).

| API Function | Input Parameters | Output/Action | Description |
| :--- | :--- | :--- | :--- |
| `HandleMinimize(SessionID)` | `sessionID: UUID` | State update: `SessionStatus: Minimized` | Should collapse the chat header/view, but keep the session active in the background. Requires updating the local view state. |
| `HandleClose(SessionID)` | `sessionID: UUID` | API Call: `POST /sessions/{sessionID}/disconnect` | Gracefully disconnects the user. Should trigger cleanup: clear the chat view, reset the session state to `Inactive`. |
| `FetchConsultantStatus(ConsultantID)` | `consultantID: UUID` | `Consultant` object or `Error` | Must be called on mount or at defined intervals to update `isOnline` and potentially `lastSeen`. |

---

### 🏛️ Repository Patterns (Data Access Layer)

The `Consultant` object represents a composite view of data sourced from multiple logical repositories.

#### 1. `ConsultantRepository`
*   **Purpose:** Manages core profile data for the consultant.
*   **Methods:**
    *   `GetByUserID(userID UUID) (models.Consultant, error)`: Fetches name, city, and core details.
    *   `GetAvatarURL(userID UUID) (string, error)`: Fetches or generates the avatar URL.

#### 2. `PresenceService` (Internal/Streaming)
*   **Purpose:** Handles real-time availability and connection status. This is usually managed via WebSockets or a dedicated streaming service (like Redis Pub/Sub).
*   **Methods:**
    *   `StreamStatus(userID UUID) (<-chan models.PresenceUpdate)`: Establishes a persistent connection to receive `online`/`offline`/`away` status updates, which directly feeds the `isOnline` property.

#### 3. `SessionRepository`
*   **Purpose:** Manages the active state of the conversation.
*   **Methods:**
    *   `IsActive(sessionID UUID) (bool, error)`: Determines if a conversation is currently ongoing or minimized.
    *   `InitiateSession(userA, userB) (models.SessionID, error)`: Creates the primary session record.

---
*this content was created by AI, but the coding and underlying logic are not.*