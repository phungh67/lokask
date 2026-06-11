
[⬅ Return to Main Compendium](../../README.md)

# 🏗️ Lokask API/Service Stack Infrastructure Definition

This document serves as the architectural blueprint and operational guide for the Lokask services stack, defined by the `docker-compose.yml` configuration. It outlines the relationships, dependencies, and technical implementation details for the core components: Database, Object Storage, Caching Layer, Backend API, and Frontend UI.

---

## 🧭 Overview

The Lokask application utilizes a modern, decoupled, and containerized microservices architecture. This setup uses Docker Compose to orchestrate five key services:

1.  **PostgreSQL/PostGIS (`db`):** Primary persistence layer for application and geospatial data.
2.  **MinIO (`minio`):** Highly available, S3-compatible object storage for assets (images, documents).
3.  **Redis (`redis`):** In-memory data structure store used for caching and session management.
4.  **Backend API (`backend`):** The core business logic layer (written in Go), responsible for interacting with all other services.
5.  **Frontend UI (`frontend`):** The client-side interface, responsible for user interaction and rendering.

The entire stack is designed to be highly resilient, utilizing `healthchecks` and `depends_on: service_healthy` to ensure services start only after their prerequisites are operational.

## 🔬 Detailed Component Breakdown

### 💾 1. Spatial Database: PostgreSQL + PostGIS (`db`)

*   **Role:** Primary data persistence. PostGIS extension enables advanced geospatial queries, critical for location-based services.
*   **Persistence:** Data is persisted using a named volume (`postgres_data`).
*   **Connectivity:** Accessible internally via the service name `db` on port `5432`.
*   **Health Check:** Uses `pg_isready` to ensure the database is accepting connections.
*   **Volume Initialization:** The volume mount (`./infra/db/init`) is intended to auto-execute schema setup scripts on first startup.

### ☁️ 2. Object Storage: MinIO (`minio`)

*   **Role:** Acts as the secure, durable storage for binary assets (e.g., user profile pictures, uploaded maps, etc.), simulating Amazon S3 behavior.
*   **Connectivity:**
    *   API Endpoint: `minio:9000` (Used by the `backend` service).
    *   Console Port: `minio:9001` (Used for manual management and debugging).
*   **Configuration:** Requires API CORS rules (`MINIO_API_CORS_ALLOW_ORIGIN: "*"`) to facilitate communication from external frontends.
*   **Health Check:** Verifies connectivity to the main API port (`9000`) using `curl`.

### ⚡ 3. Caching Layer: Redis (`redis`)

*   **Role:** Provides fast, in-memory key-value storage. Used primarily for caching expensive database queries, rate limiting, and managing session tokens.
*   **Connectivity:** Accessible internally via the service name `redis` on port `6379`.
*   **Persistence:** Data is persisted using a named volume (`redis_data`).
*   **Health Check:** Uses the standard `redis-cli ping` command.

### ⚙️ 4. Backend API: Go Service (`backend`)

*   **Role:** The primary application logic gateway. It orchestrates requests by connecting to the database, retrieving assets from MinIO, and using Redis for caching.
*   **Build Context:** Points to `./backend`, implying the Go source code resides in this directory.
*   **Dependency Management:** This service explicitly depends on both `db` and `redis`, waiting for both to be healthy before starting.
*   **Environment Variables:** Contains extensive environment variable mappings, defining how the service interacts with all external services (e.g., `DB_HOST: db`, `MINIO_ENDPOINT: minio:9000`).
*   **Cross-Reference (Coding Logic):**
    *   The authentication flow (`auth.go`) depends on correctly verifying user identity. This typically involves checking the session token stored in **Redis** (using `REDIS_ADDR`).
    *   User profile retrieval logic often relies on profile data managed by the `/middlerware/me` endpoints.

### 🖥️ 5. Frontend UI: Web Client (`frontend`)

*   **Role:** The client-side presentation layer. It makes requests to the `backend` API.
*   **Build Context:** Defined relative to the current location (`../lokask-frontend`), which makes the build process sensitive to file structure changes.
*   **Dependency:** Depends on the `backend` being running.
*   **Access:** Exposed directly on the host machine's port `80`.

## 📝 Notes & Best Practices

*   **Development Environment:** The use of dedicated services (PostGIS, MinIO, Redis) allows for simulating a cloud production environment locally, minimizing discrepancies between development and production.
*   **Service Discovery:** The networking relies entirely on Docker Compose service names (e.g., `db`, `minio`). These names are the canonical hostnames used within the container network.
*   **Initial Run:** When starting the stack, always use `docker compose up --build` to ensure the `backend` and `frontend` services are compiled with the latest code.
*   **Configuration Flow:** Credentials for all services must be managed via a separate `.env` file (not shown, but implied by `${VARIABLE}` usage) to keep the stack definition clean and secure.

## ⚠️ Warnings & Tech Debt Items

### ⚠️ Tech Debt / Unfinished Tasks (Priority: High)

1.  **Database Initialization Script:**
    *   **Issue:** The entry for `volumes` in the `db` service contains the comment `# TODO: create start-up script`.
    *   **Action:** A dedicated initialization script (e.g., a `.sql` or `.sh` file) must be placed in `./infra/db/init` to handle complex setup, indexing, and initial data loading, ensuring the database is fully ready before the `backend` connects.
2.  **Security: Secrets Management:**
    *   **Issue:** Critical credentials (`${DB_PASSWORD}`, `${MINIO_PASSWORD}`) are being loaded from the environment or a local `.env` file.
    *   **Action:** For any transition to staging or production, this pattern must be replaced with a dedicated secrets management solution (e.g., HashiCorp Vault, AWS Secrets Manager, or Kubernetes Secrets).
3.  **Security: MinIO Console Exposure:**
    *   **Issue:** Port `9001` (MinIO Console) is mapped directly to the host machine.
    *   **Action:** This port should be restricted or accessed only via a dedicated, authenticated internal debugging tunnel, as exposing the management console is a significant security risk.

### 🚨 Architectural Warnings (Priority: Medium)

*   **Build Context Brittle:** The `frontend` build context (`../lokask-frontend`) is highly relative. If the `docker-compose.yml` file is moved or structured differently, this path will break. Consider using absolute paths or relative paths based on the location of the repository root.
*   **Error Handling on Dependencies:** While `depends_on: service_healthy` is excellent for deployment, it does *not* guarantee application-level readiness. The `backend` service must implement robust retry logic with exponential backoff when connecting to dependent services (DB, MinIO) to handle transient network hiccups.
```