# 📚 Project Lokask Infrastructure Documentation

## 🚀 Overview

This document provides a comprehensive overview and technical specification for the Lokask Microservices Stack. This infrastructure stack is designed for building a modern, resilient, and scalable web application, incorporating specialized services for persistence, caching, and object storage.

The system is composed of five interconnected services:
1. **PostgreSQL/PostGIS:** Primary relational database for structured, geospatial data.
2. **Minio:** S3-compatible object storage for handling unstructured assets (e.g., images, documents).
3. **Redis:** In-memory data store used for high-speed caching and session management.
4. **Lokask Backend (API):** The core application logic layer (Go service).
5. **Lokask Frontend (Web UI):** The client-side presentation layer.

### Architecture Diagram (Conceptual Flow)

```mermaid
graph LR
    subgraph Client Layer
        FE[Frontend (Port 80)]
    end

    subgraph Application Layer
        BE[Backend API (Port 8080)]
    end

    subgraph Infrastructure Layer
        DB[PostGIS Database]
        MIN[MinIO Object Storage]
        RED[Redis Cache]
    end

    FE --> BE
    BE --> DB
    BE --> MIN
    BE --> RED

    DB --> PG((PostgreSQL/PostGIS))
    MIN --> S3((S3 Endpoint))
    RED --> MEM((In-Memory Cache))
```

---

## 🔍 Detailed Service Components

The stack utilizes Docker Compose for orchestration, defining persistence volumes and networking rules to ensure service independence and reliability.

### 💾 1. PostgreSQL with PostGIS (`db`)
*   **Role:** System of record for structured data. The inclusion of PostGIS ensures native support for complex geospatial queries, critical for location-aware services.
*   **Configuration:** Uses persistent volume (`postgres_data`) to ensure data survives container restarts.
*   **Networking:** Exposes port `5432` and is accessible internally by the `backend` service.
*   **Healthcheck:** Implements a robust health check using `pg_isready` to guarantee the service is accepting connections before other dependent services attempt connection.

### ☁️ 2. Object Storage (MinIO - `minio`)
*   **Role:** Provides S3 API compatibility for storing large binary files (e.g., user uploaded images, map tiles). This abstracts the storage mechanism away from the primary database.
*   **Configuration:** Uses persistent volume (`minio_data`). The API port (`9000`) is exposed for internal application use, while the Console port (`9001`) is exposed for developer login.
*   **Healthcheck:** Verifies service availability by calling a dedicated health endpoint (`/minio/health/live`).
*   **Security Note:** Access keys (`MINIO_USER`, `MINIO_PASSWORD`) must be securely managed via environment variables.

### ⚡ 3. Redis Cache (`redis`)
*   **Role:** Provides ultra-low latency key-value storage. Used primarily by the backend for caching expensive query results, managing rate limits, and storing temporary session data.
*   **Configuration:** Uses persistent volume (`redis_data`).
*   **Healthcheck:** Basic `redis-cli ping` check ensures the cache service is responsive.

### ⚙️ 4. Lokask Backend API (`backend`)
*   **Role:** The business logic core. It acts as the intermediary, receiving requests from the frontend, performing validation, calling the appropriate infrastructure service (DB, Cache, Storage), and returning structured JSON responses.
*   **Dependencies:** Explicitly configured with `depends_on` to wait until `db` and `redis` report healthy status, minimizing startup race conditions.
*   **Networking:**
    *   Exposes port `8080` (mapping to the host's `8080`).
    *   Crucially, it uses **service names** (`db`, `minio`, `redis`) as network hostnames for reliable internal communication.
*   **Environment Variables:** Requires connection credentials for all three major infrastructure services (DB, MinIO, Redis) as well as external services (SMTP credentials for emails).

### 🖥️ 5. Lokask Frontend (`frontend`)
*   **Role:** The User Interface layer, responsible for rendering the client experience and consuming the API endpoints exposed by the backend.
*   **Configuration:** Built from a separate context (`../lokask-frontend`).
*   **Networking:** Exposed on the host's standard HTTP port `80`.

---

## 🛠️ Deployment and Operation Details

### 🟢 Operational Procedure

To bring the entire stack online, the deployment must adhere to the following steps:

1. **Prerequisites:** Ensure all required environment variables are set (see **Notes**).
2. **Run Command:** Execute the Docker Compose command:
    ```bash
    docker compose up --build
    ```
3. **Startup Sequence:** The system will automatically handle dependencies:
    *   Redis and Minio start first (minimal dependencies).
    *   PostGIS starts, waits for connection validation.
    *   The Backend starts, waits for DB and Redis healthchecks.
    *   The Frontend starts, assuming the Backend is operational.

### 🔴 Environment Variable Dependencies

The stability of the system relies entirely on defining the following credentials in the environment or a `.env` file:

| Variable Name | Service Dependent | Description | Example/Usage |
| :--- | :--- | :--- | :--- |
| `${DB_USER}` | `db`, `backend` | PostgreSQL Username | `lokask_user` |
| `${DB_PASSWORD}` | `db`, `backend` | PostgreSQL Password | *Must be strong* |
| `${DB_NAME}` | `db`, `backend` | Primary Database Name | `lokask_db` |
| `${MINIO_USER}` | `minio`, `backend` | MinIO Access Key | `minioadmin` |
| `${MINIO_PASSWORD}` | `minio`, `backend` | MinIO Secret Key | `minioadmin` |
| `${MAIL_SERVER}` | `backend` | SMTP Email Server Host | `smtp.sendgrid.net` |
| `${MINIO_ENDPOINT}` | `backend` | MinIO Internal Hostname | `minio:9000` |

---

## ⚠️ Warnings and Considerations

*   **[WARNING] Database Initialization Script Missing:** The PostgreSQL service includes a volume mount (`./infra/db/init:/docker-entrypoint-initdb.d`), but the initialization script is noted as unfinished (`TODO: create start-up script`). **ACTION REQUIRED:** A dedicated SQL script must be created and placed in this path to define schema structure and populate initial data integrity constraints.
*   **[WARNING] Service Dependency Flow:** The `backend` relies on the `db` and `redis` services being actively healthy. If these services fail or are restarted improperly, the backend will fail to initialize correctly.
*   **[WARNING] Localhost Access:** The `backend` environment variable `MINIO_PUBLIC_URL: "http://localhost"` is hardcoded for local development. This must be updated to the actual deployment URL (e.g., `https://api.lokask.com`) before production deployment to prevent incorrect URL generation for asset links.

## 📝 Notes

*   **Networking Scope:** All connectivity *within* the stack (e.g., `backend` to `db`) must use the Docker service names (`db`, `minio`, `redis`), not `localhost`.
*   **Port Conflict Potential:** Due to the exposure of multiple ports (80, 8080, 9000, 9001), developers must ensure that these ports are available on the host machine and are not running other applications.
*   **Container Strategy:** Using `restart: on-failure` is ideal for preventing single-point failure restarts, but monitoring the underlying cause of failure is crucial for proactive maintenance.

## ✨ To Be Completed (Future Scope)

*   **Automated Database Migration:** Implement a tool (e.g., Flyway or Alembic) within the containerized workflow to manage database schema versioning instead of relying on manual initialization scripts.
*   **Centralized Configuration Management:** Migrate all environment variables from direct use in Docker Compose to a dedicated configuration management tool (e.g., HashiCorp Vault) for enhanced security and auditability.
*   **Scaling Strategy:** Define and implement scaling strategies for high-load services, particularly adding read replicas for the PostgreSQL database.