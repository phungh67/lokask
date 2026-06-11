# System Entry Point and Initialization Flow (`main.go`)

[⬅ Return to Main Compendium](../../README.md)

This module serves as the primary entry point for the backend API, responsible for initializing all major services (Database, Storage, Cache, Email), configuring middleware, and establishing all API routes using the Fiber framework. It follows a clean separation of concerns by managing dependency injection across various handlers and repositories.

## 🚀 Overview

The application is a multi-module backend system providing services for consulting platforms, user profiles, content blogging, real-time messaging, and appointment booking.

**Core Responsibilities:**
1.  Read and validate environment variables for configuration.
2.  Establish connections to PostgreSQL, Minio/S3 (for file storage), Redis, and SMTP (for mail services).
3.  Initialize all business logic handlers and inject necessary dependencies (Repositories, Storage Clients, etc.).
4.  Set up the Fiber web server instance, applying global middleware (Logging, CORS).
5.  Define and register all API endpoints, segmenting them into public, protected (authenticated), and WebSocket routes.

## 🏗️ Detail & Architecture

### 1. Initialization Flow

The `main()` function executes a sequential initialization process:

**a. Configuration & Connections:**
*   **Database:** Connects to PostgreSQL using connection strings derived from environment variables (`DB_HOST`, `DB_USER`, etc.).
*   **Storage:** Initializes the file storage service (`storage.FileStorage`). It detects the `DEPLOYMENT_MODE`:
    *   `dev`: Connects to Minio.
    *   `prod`: Connects to AWS S3.
*   **Cache:** Connects to Redis (via `rediscfg.ConnectRedis()`).
*   **Email:** Initializes the mailer service using SMTP credentials (from environment variables).

**b. Dependency Injection (DI):**
Repositories (e.g., `ConsultantRepository`, `UserRepository`) are instantiated first, taking the database connection (`*sqlx.DB`) as a dependency. Handlers (e.g., `ConsultantHandler`, `UserHandler`) are then instantiated, receiving the necessary repositories and global services (like `storageService`).

**c. API Setup:**
*   **Framework:** Uses `github.com/gofiber/fiber/v2` for robust routing.
*   **Global Middleware:** Applies `logger` (for request logging) and `cors` (to allow cross-origin requests).
*   **Route Grouping:** Routes are logically grouped:
    *   `/api/v1/`: General API endpoints.
    *   `/protected`: A middleware group secured by `middleware.Protect()`, ensuring authentication (JWT) is mandatory for most critical operations (e.g., messaging, booking, profile updates).

### 2. Key Routes Handled

| Endpoint | Method | Description | Access Level | Dependencies |
| :--- | :--- | :--- | :--- | :--- |
| `/api/v1/auth/register` | POST | User registration. | Public | `userRepo` |
| `/api/v1/auth/login` | POST | User login, generates tokens. | Public | `userRepo`, `consultantRepo` |
| `/api/v1/auth/me` | GET | Retrieves the authenticated user's profile. | Protected | `authHandler` |
| `/api/v1/conversations` | POST/GET | Managing chat sessions and retrieving inboxes. | Protected | `chatHandler` |
| `/api/v1/bookings` | POST/GET/DELETE/PATCH | Creating, viewing, updating, and canceling bookings/trips. | Protected | `bookHandler` |
| `/api/v1/blogs` | GET/POST | Listing and creating blog posts. | Mixed | `blogHandler` |
| `/api/v1/consultants` | GET | Listing consultants or fetching specific profiles. | Public | `consultantHandler` |
| `/ws/video` | WS | Real-time video call handling. | Protected | `VideoCallHandler` |

## 📝 Notes

*   **Testing Flow:** The structure is highly modular. To test a specific feature (e.g., booking), one only needs to verify the related handler (`bookHandler`) and its repository (`bookRepo`) without needing to run the entire application.
*   **Error Handling:** A custom `ErrorHandler` is implemented on the Fiber app to catch internal server errors, ensuring a consistent JSON response structure (`{"error": "message"}`).
*   **Proxy Handler:** A `proxyImageHandler` helper function was defined, demonstrating how to handle external resource fetching (like images) before this logic was commented out of the main routing.

## 🚨 Warning & Technical Debt

1.  **Hardcoded JWT Key:** The commented-out section for protected routes suggests a hardcoded `SigningKey: []byte("super_secret_jwt_key")`. **ACTION REQUIRED:** This key must be moved to and retrieved from a secure environment variable (e.g., `JWT_SECRET_KEY`).
2.  **CORS Configuration:** The `cors` configuration is set to `AllowOrigins: "*"` which is generally acceptable for local development but **should be restricted** in production to only the necessary front-end domain(s).
3.  **Dead/Commented Code:** Several handlers and routes (e.g., `proxyHandler`, `// avatar upload`, `// protected group definition`) are commented out. These sections must be either fully implemented or permanently removed to prevent confusion.
4.  **JWT Middleware Dependency:** The entire `/protected` route group relies heavily on `middleware.Protect()`. The stability and functionality of the entire API depend on the robustness of this external middleware implementation (Auth Flow).
5.  **`getEnv` Helper:** While functional, this helper function is basic. Consider using a dedicated configuration library (like `viper` or `cleanenv`) to validate and structure all environment variables upon startup, providing clearer startup failure messages.

## 🧩 Related Files & Flow Links

*   **[Internal/Middleware Logic]** Details of authentication and authorization flow (JWT token generation/validation): `../internal/middleware/protect.go` (Implied dependency for middleware protection).
*   **[Database/Models]** Data structures and models used across all services.
*   **[Services]** Logic handling business rules (e.g., `UserService`, `BookingService`).

---
*This structure suggests a clean separation of concerns, with network handling in the controllers (implied by route mapping) and core logic residing in the services/repositories.*