[⬅ Return to Main Compendium](../../../README.md)

### Backend System Architecture and Contract Definition (Go Focus)

As a senior backend engineer, my focus is on defining the immutable contract that the Go service must adhere to. The provided NGINX configuration acts as the gateway, defining three critical entry points: the synchronous REST API (`/api/`), the asynchronous WebSockets channel (`/ws/`), and the external object store handler (`/user-avatars*`).

The Go application layer must be designed as a multi-protocol server, separating concerns between HTTP handling, WebSocket management, and database persistence.

---

### I. API Surface Contracts

#### 1. RESTful API Surface (Protocols: HTTP/HTTPS)
**Endpoint:** `/api/{resource}`
**Protocol:** REST, JSON payload required.
**Purpose:** Primary data manipulation (CRUD) for user data, session management, and business logic execution.
**Headers to Handle:**
*   `Authorization`: Mandatory Bearer Token validation (JWT/OAuth).
*   `Content-Type`: Must strictly enforce `application/json`.
*   `Access-Control-Request-Method`: Must handle preflight `OPTIONS` requests gracefully, returning 204.

**Key Resource Endpoints (Conceptual):**

| Resource | Method | Description | Request Body | Response Body |
| :--- | :--- | :--- | :--- | :--- |
| `/api/v1/users` | `POST` | Register new user. | `UserRegistrationPayload` | `UserResponse` |
| `/api/v1/users/{id}` | `GET` | Retrieve user profile details. | N/A | `UserResponse` |
| `/api/v1/galleries` | `POST` | Create a new gallery/album. | `GalleryCreationPayload` | `GalleryResponse` |
| `/api/v1/galleries/{id}/items` | `POST` | Add media item to a gallery. | `MediaItemPayload` | `ItemResponse` |
| `/api/v1/chats/signal` | `POST` | Initial chat state signaling (Non-WS fallback). | `SignalPayload` | `{status: "waiting"}` |

#### 2. WebSocket Surface (Protocols: WS/WSS)
**Endpoint:** `/ws/`
**Protocol:** WebSockets.
**Purpose:** Real-time, persistent connection handling. Specifically designed for WebRTC signaling and continuous status updates.

**Go Implementation Notes:**
1.  **Upgrade Handler:** The HTTP handler must be responsible for recognizing the `Upgrade` header and gracefully transitioning the connection from HTTP to WS.
2.  **Hub Pattern:** The core logic must employ a centralized **Hub** pattern (or similar manager) to register and manage active client connections (e.g., `client.send <- message`, `client.receive <- message`).
3.  **Data Flow:** The connection handler must manage message routing:
    *   Client $\rightarrow$ Server: Receives signaling data (SDP offers/answers, ICE candidates).
    *   Server $\rightarrow$ Client: Broadcasts state changes or targeted messages.

#### 3. Object Storage Interaction (External Service Dependency)
**Interaction Point:** MinIO (S3 API)
**Mechanism:** The Go service **must not** handle file uploads directly. It must use an S3 client library (e.g., `minio-go`) to abstract the upload process.
**Logic Flow:**
1.  Client $\rightarrow$ `/api/v1/galleries/{id}/items` (POST).
2.  Go Service receives the metadata for the item and the object location (e.g., `user-avatars/{uuid}.jpg`).
3.  Go Service uses the S3 client library to *upload* the data chunk/stream *directly* to the MinIO endpoint.
4.  Go Service returns only the metadata, including the secure URL/key, to the client.

---

### II. Core Backend Logic and Domain Modeling

#### 1. Authentication and Authorization Layer
*   **Goal:** Implement robust middleware for token validation.
*   **Logic:** Every request hitting `/api/` must pass through a middleware that extracts the Bearer token from the `Authorization` header.
*   **Action:** Middleware must validate the token's signature, check expiration, and extract the unique `User ID` and relevant roles/scopes, attaching this context to the request object (`*http.Request`).

#### 2. Data Persistence Layer (Repository Pattern)
The application must enforce the Repository pattern to decouple business logic from database specifics.

**A. Repository Interfaces (Go Idiom):**
Define interfaces that represent collections of data access methods.

```go
// UserRepository defines the contract for user data storage.
type UserRepository interface {
    FindByID(ctx context.Context, userID string) (*models.User, error)
    FindByEmail(ctx context.Context, email string) (string, error) // Returns ID
    Create(ctx context.Context, user *models.User) error
}

// GalleryRepository defines the contract for gallery data storage.
type GalleryRepository interface {
    GetGalleryByID(ctx context.Context, galleryID string) (*models.Gallery, error)
    SaveItemsToGallery(ctx context.Context, galleryID string, itemIDs []string) error
}
```

**B. Service Layer (Business Logic):**
The service layer uses the repositories to execute complex business rules.

*Example:* When creating a gallery, the service layer must:
1. Call `userRepo.FindByID` to validate the requesting user.
2. Generate a UUID for the gallery.
3. Call `galleryRepo.Create` with the authenticated user's ID.
4. This separation ensures that if we switch from PostgreSQL to MongoDB, only the concrete repository implementation needs updating, not the core business logic.

#### 3. WebRTC/Signaling Logic
The Go service acts purely as the **Signaling Server**. It does not handle the media stream itself.

*   **State Management:** The Go service must maintain a map of active connections and their respective peer identifiers.
*   **Mechanism:** When a client needs to call another client, the signaling process involves:
    1. Client A sends a `{"action": "offer", "target": B, "payload": SDP}` to the server.
    2. The Go server broadcasts this message (or routes it directly) to Client B's established WebSocket connection.
    3. Client B receives the signal, processes it, and sends an answer back through the server.

---

### III. Technical Implementation Guidelines (Go/GoRouter)

**Context Management:**
Always pass `context.Context` as the first argument to all repository and service methods. This is crucial for passing request-scoped values (like `UserID` and `TraceID`) and enabling graceful cancellation/timeouts.

**Error Handling:**
Utilize standard Go error wrapping (`fmt.Errorf("%w", originalError)`) to ensure the caller understands *why* a function failed, differentiating between validation failures, database connectivity issues, and internal server errors.

**Concurrency:**
*   **WebSockets:** Use `sync.WaitGroup` and buffered channels within the Hub to manage concurrent reading and writing across many connections.
*   **API:** Use Go's native concurrency model (`go func()`) sparingly, primarily within background workers or queue processing routines, and rely on the HTTP request handler structure for request isolation.

*this content was created by AI, but the coding and underlying logic are not.*