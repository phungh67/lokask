# 🚀 Application Gateway API (v1) Documentation

## Overview

This document serves as the architectural guide and technical specification for the primary API Gateway service. This service is built using Go and the Fiber framework. Its core function is to orchestrate interactions between various internal services, manage business logic execution flow, handle authentication, and provide a unified endpoint for client consumption (e.g., Flutter Web client).

The application is highly dependency-driven, initializing multiple external systems (Database, Storage, Caching, Email) before establishing API endpoints.

---

## 🏗️ System Architecture & Infrastructure Components

### 💾 Data Persistence & State Management

| Component | Technology | Purpose | Connection Details |
| :--- | :--- | :--- | :--- |
| **Primary Database** | PostgreSQL (`sqlx`, `lib/pq`) | Stores structured data for users, consultations, bookings, and blog content. | Connects via environment variables (`DB_HOST`, `DB_USER`, etc.). |
| **File Storage** | MinIO/AWS S3 | Handles persistent storage for user avatars, media, and images. | Dynamically switches between MinIO (Development) and S3 (Production) based on `DEPLOYMENT_MODE`. |
| **Caching/Queue** | Redis | Used for caching, session management, and potential message queueing (implied). | Initialized via `rediscfg.ConnectRedis()`. |
| **Email Service** | SMTP (Mailtrap/Generic) | Handles all outgoing communication, such as booking confirmations or chat notifications. | Configured via SMTP credentials (`MAIL_SERVER`, `MAIL_USERNAME`, etc.). |

### 🔐 Security & Middleware Flow

The API utilizes a layered approach to security:

1.  **CORS:** Implemented globally, allowing unrestricted origins (`*`) for frontend compatibility.
2.  **Request Logging:** Standard request logging is applied globally.
3.  **Authentication Gate:** The `protected` group ensures that all sensitive routes (chat, bookings, profile updates) require a valid, active authentication token (JWT). The `middleware.Protect()` function encapsulates this enforcement logic.
4.  **Websocket Security:** The dedicated video call endpoint (`/ws/video`) also requires explicit protection via `middleware.Protect()`.

---

## ⚙️ Initialization and Setup Detail

The `main()` function follows a strict initialization order:

### 1. Configuration Loading (ENV Variables)
All critical connection details (DB credentials, S3/MinIO endpoint, Mail SMTP) are read from environment variables using `getEnv()`, providing clear fallbacks for local development.

### 2. Service Initialization
*   **Database:** Establishes the initial connection pool to PostgreSQL. Failure to connect halts the application (`log.Fatalf`).
*   **Storage:** Uses conditional logic based on `DEPLOYMENT_MODE` to correctly initialize the file storage client (MinIO or S3).
*   **Dependencies (DI):** Repositories (e.g., `ConsultantRepository`) are instantiated and receive the required `*sqlx.DB` handle. Handlers (e.g., `ConsultantHandler`) are instantiated and receive dependencies (Repositories, Storage service) to enforce the Dependency Injection pattern.

### 3. Fiber App Setup
*   The application (`app`) is configured with a custom `ErrorHandler` to catch and log internal server errors, returning a standardized 500 JSON response to the client.
*   **Middleware Application Order (Top to Bottom):**
    1.  `logger.New()`
    2.  `cors.New()`
    3.  Route-specific middleware (e.g., `middleware.Protect()` or `websocket.New()`)

---

## 🎯 API Endpoints & Functionality Mapping

| Endpoint Group | Method | Purpose | Protection Level | Key Components Involved |
| :--- | :--- | :--- | :--- | :--- |
| `/api/` (General) | GET/POST | Core application business logic. | Varies (Unprotected/Auth Required) | Repositories, Handlers |
| `/chat` | *N/A* | Handles real-time communication. | Middleware/Auth | WebSocket Handler |
| `/users` | GET/POST | Profile and user management. | Middleware/Auth | User Repository |
| `/resources` | GET/POST | Media/file uploads (Storage interaction). | Middleware/Auth | Storage Service |
| `/api/v1/profile` | GET/PUT | User profile interaction. | Middleware/Auth | User Repository |

### Core Dependencies Injection:

The architecture relies heavily on the injection of configured services:

*   **Database Connection:** Used by all repository layers.
*   **Storage Client:** Used by the resource handling layer.
*   **Auth Token Validator:** Implicitly used before accessing protected endpoints.

## ⚠️ Critical Observations & Recommendations

1.  **Inconsistent Error Handling:** While the structure is robust, ensure centralized error handling (e.g., using a middleware wrapper) to catch and format errors consistently across all routes.
2.  **API Key Management:** Review how authorization tokens are validated. If this service handles sensitive data, consider moving away from basic token passing toward robust OAuth 2.0 or JWT management.
3.  **Code Duplication:** The initialization of the API routes and middleware application should be factored out into dedicated router files to improve readability and maintainability.

---
*(End of Document)*