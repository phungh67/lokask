[⬅ Return to Main Compendium](../../../../../../README.md)

# 🏗️ Backend Service Blueprint & Architecture Analysis

As a senior backend officer specializing in Go and high-throughput systems, I have reviewed the provided `main.go` file. This file serves as the primary entry point, coordinating initialization, dependency injection, and API routing.

The current structure demonstrates a solid layered architecture:
1.  **Bootstrap Layer (`main`):** Handles environment configuration, service initialization (DB, Redis, Storage, Mailer), and dependency wiring.
2.  **Repository Layer (`repository`):** Abstracts database interactions.
3.  **Service/Handler Layer (`handler`):** Contains business logic and manages HTTP request/response cycles.
4.  **Middleware/Infrastructure:** Handles cross-cutting concerns (Authentication, Rate Limiting, Logging, Storage).

The overall logic is sound, but the initialization phase is very dense. For maintainability, consider wrapping the `app := fiber.New(...)` section and all route registrations into a separate `router.go` package/function, making `main` purely responsible for initialization orchestration.

---

## 💻 Core Logic Documentation

### 1. Initialization Flow (`main`)

The application bootstrap follows a critical sequence of initialization checks. The system relies heavily on environment variables (`getEnv`) to ensure deployment flexibility.

**Initialization Steps:**

1.  **Database Connection:** Establishes an `sqlx.DB` connection to PostgreSQL. This connection is fundamental and must be available for almost all components.
2.  **Storage Service Setup:** Determines the storage back-end (`dev` $\to$ Minio, `prod` $\to$ S3) based on `DEPLOYMENT_MODE`. This abstraction is crucial for environment-specific deployments.
3.  **Caching/Messaging:** Initializes the Redis connection (`rediscfg.ConnectRedis()`).
4.  **External Services:** Initializes the `MailerService` using API keys.
5.  **Dependency Injection (DI):** Components are initialized by passing their dependencies (e.g., `consultantHandler` receives `consultantRepo` and `storageService`).

**Key Observational Points:**
*   **Error Handling:** The use of `log.Fatal` during critical service setup (DB, Storage) correctly prevents the application from running in an indeterminate state.
*   **Scope Management:** `defer db.Close()` ensures graceful database disconnection.

### 2. Dependency Graph

The system maintains a clear dependency graph:

| Component | Dependency | Role |
| :--- | :--- | :--- |
| `ConsultantHandler` | `ConsultantRepository`, `FileStorage` | Manages consultant CRUD operations and media uploads. |
| `UserHandler` | `UserRepository`, `FileStorage` | Manages user profiles and avatar uploads. |
| `BlogHandler` | `BlogRepository`, `FileStorage` | Handles blog post lifecycle (CRUD). |
| `ChatHandler` | `ChatRepository`, `MailerService` | Manages real-time conversations and notification emails. |
| `BookingHandler` | `BookingRepository`, `ConsultantRepository`, `sqlx.DB` | Manages scheduling, trip creation, and status updates. |
| `AuthHandler` | `UserRepository`, `ConsultantRepository`, `MailerService`, `sqlx.DB` | Handles authentication, registration, and email verification. |
| `Fiber App` | All Handlers/Repositories | The transport layer; routes requests to the appropriate handlers. |

---

## 🔗 API Surface Definition (Routing)

The API is structured under `/api/v1` and utilizes middleware groups effectively.

### 1. Middleware & Grouping

| Endpoint/Path | Middleware | Functionality | Notes |
| :--- | :--- | :--- | :--- |
| `/api/v1/test-email` | None | Utility check for email sending. | Quick testing endpoint for the `mailer` service. |
| `/api/v1/consultants` | None | List all consultants. | Public access. |
| `/api/v1/blogs` | None | List all blogs. | Public access. |
| `/api/v1/cities` | None | Get consultant geographical filters. | Public, lookup data. |
| `/api/v1/public/:id` | None | View public booking/schedule details. | Read-only, non-auth. |
| `/api/v1/new/verify` | None | Email verification endpoint. | Requires a token/ID, public access. |
| **`/api/v1` (Protected Group)** | `middleware.Protect()` | Requires valid authentication (JWT/Session). | Encapsulates all critical, user-specific endpoints. |
| `/ws/video` | `middleware.Protect()` | WebSocket endpoint for video calls. | Dedicated, authenticated, real-time communication channel. |

### 2. API Endpoints Summary

| Feature Area | Method | Path | Handler | Description |
| :--- | :--- | :--- | :--- | :--- |
| **Authentication** | POST | `/auth/register` | `authHandler` | User registration. |
| | POST | `/auth/login` | `authHandler` | User login and token generation. |
| | POST | `/auth/logout` | `authHandler` | Invalidates session/token. |
| | GET | `/auth/me` | `authHandler` | Retrieves the currently logged-in user's profile. |
| **Consultants** | GET | `/consultants/:id` | `consultantHandler` | View a specific consultant's public profile. |
| | PATCH | `/updateprofile` | `consultantHandler` | Update user profile details. |
| | POST | `/consultant/media` | `consultantHandler` | Upload gallery media files. |
| **Blogs** | GET | `/blogs/:id` | `blogHandler` | Retrieve a specific blog post. |
| | POST | `/blogs` | `blogHandler` | Create a new blog post (Protected). |
| **Bookings/Scheduling**| GET | `/bookings/my-trips` | `bookHandler` | View user's past and scheduled trips. |
| | GET | `/bookings/consultant/:id` | `bookHandler` | View a consultant's public schedule/availability. |
| | POST | `/bookings` | `bookHandler` | Book a new session/trip (Protected). |
| | PATCH | `/bookings/:id/status` | `bookHandler` | Update booking status (e.g., Confirmed, Cancelled). |
| **Chat/Messaging** | POST | `/conversations` | `chatHandler` | Initiate a new conversation (Protected). |
| | GET | `/conversations` | `chatHandler` | View user's conversation inbox. |
| | POST | `/conversations/:id/messages`| `chatHandler` | Send a message within a conversation. |
| | GET | `/conversations/:id/messages`| `chatHandler` | Retrieve conversation message history. |
| **Media/Avatar** | POST | `/users/avatar` | `userHandler` | Upload user's profile avatar image. |

---

## 🧱 Repository Pattern Analysis

The implementation correctly utilizes the Repository Pattern, abstracting the data source (PostgreSQL via `sqlx`) from the business logic (Handlers).

### 1. Purpose
*   **Decoupling:** The handlers do not need to know *how* data is fetched or persisted; they only interact with the repository interface methods (e.g., `GetUsersByEmail`, `CreateMessage`).
*   **Testability:** This separation allows for easy mocking of database interactions during unit testing.

### 2. Key Repositories Implemented:

*   **`UserRepository`:** Handles user authentication and profile retrieval.
*   **`MessageRepository`:** Manages the persistence of chat messages.
*   **`BookingRepository`:** Manages the lifecycle and retrieval of scheduled appointments/sessions.

### 3. Improvement Considerations (Advanced):

For a production system, consider adding interface definitions for all repositories (e.g., `interface UserRepository {...}`). This formalizes the contract and guarantees that any future database implementation (e.g., moving from PostgreSQL to a NoSQL backend) only requires satisfying the existing Go interface.

## Summary of Best Practices Followed

1.  **Separation of Concerns (SoC):** Clear division between presentation/routing logic, business logic (handlers), and data access (repositories).
2.  **Dependency Injection (DI):** Dependencies (Repositories) are passed into the handlers/services rather than being instantiated internally, improving testability.
3.  **Structured Error Handling:** While not explicitly shown, the pattern allows for centralized, standardized error wrapping and response generation.