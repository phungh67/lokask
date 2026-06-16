[⬅ Return to Main Compendium](../../README.md)

# 🐳 Infrastructure & Service Definition (`docker-compose.yml`)

This file defines the entire microservices architecture using Docker Compose. It outlines the necessary components (PostgreSQL, MinIO, Redis, Backend API, Frontend Web) and their interdependencies, establishing the core runtime environment for the application.

## 📝 Overview

This infrastructure setup is robust, encompassing dedicated services for database (PostgreSQL/PostGIS), object storage (MinIO), caching (Redis), and the core application logic (Backend/Frontend). The use of containerization ensures consistent environments across development, testing, and potentially production stages. However, several configurations regarding security practices (SSL, CORS, secrets management) need immediate attention to elevate the overall security posture from a development-ready state to a secure production standard.

---

## 🔍 Security Vulnerability Assessment

### 🔴 Vulnerable Functions/Objects/Payloads

| Service/Object | Vulnerable Component | Priority | Reason/Impact |
| :--- | :--- | :--- | :--- |
| `minio` | `MINIO_API_CORS_ALLOW_ORIGIN: "*"` | **HIGH** | Allows any origin to interact with the API, bypassing potential security checks for frontend interaction. Should be restricted to known domain origins. |
| `backend` | Environment Variables (`${*}`) | **HIGH** | Reliance on external environment variables for sensitive credentials (`DB_PASSWORD`, `MINIO_PASSWORD`, etc.). If the `.env` file is leaked or not managed by a vault system, credentials are immediately compromised. |
| `backend` | `MINIO_USE_SSL: "false"` | **HIGH** | Communicating with object storage over unencrypted HTTP is a major man-in-the-middle (MITM) risk, exposing object metadata and potentially content. |
| `db` | Volume Mount (`./infra/db/init`) | **MEDIUM** | Mounts local initialization scripts directly into the container entrypoint. If the host system's development scripts are not sanitized, they could introduce unwanted or insecure schema changes on startup. |
| `db` | Startup Script Handling | **MEDIUM** | The dependency on a manual, non-containerized startup script (`# TODO: create start-up script`) introduces potential race conditions or inconsistent initialization if not fully integrated. |

### 📄 Detail Breakdown

**1. MinIO (Object Storage)**
*   **Concern:** The use of `MINIO_API_CORS_ALLOW_ORIGIN: "*"` is overly permissive.
*   **Mitigation:** This must be restricted in a production environment to only the specific domain(s) where the frontend application will be hosted (e.g., `https://frontend.example.com`).

**2. Backend Services (Go Application)**
*   **Concern:** The configuration sets `MINIO_USE_SSL: "false"`.
*   **Mitigation:** All data transmission between microservices, especially sensitive data like file metadata or credentials stored in the object store, *must* use SSL/TLS. This requires updating both the MinIO service configuration and the application code to enforce HTTPS connections.
*   **Concern:** The handling of secrets via environment variables is standard for development but insufficient for production.
*   **Mitigation:** Implement a dedicated secret management system (e.g., HashiCorp Vault, AWS Secrets Manager) to dynamically inject credentials at runtime, ensuring they never reside in plaintext files.

**3. PostgreSQL Database (`db`)**
*   **Concern:** The volume mount point `volumes: - ./infra/db/init:/docker-entrypoint-initdb.d` is noted as having a `TODO`.
*   **Impact:** If the startup script isn't finished, the schema initialization might be incomplete, leading to runtime failures or data integrity issues.
*   **Mitigation:** The initialization process needs to be containerized or scripted to guarantee idempotent execution and proper dependency checking.

---

## 💡 Notes & Warnings

### 📌 Notes (Things that are currently functional but require attention)

*   **Network Segmentation:** The service setup correctly uses the `travel_net` network, which is good practice for isolating services.
*   **Health Checks:** Comprehensive `healthcheck` definitions are implemented for all services (`db`, `minio`, `redis`), which is crucial for robust deployment and dependency management.
*   **Container Dependency:** The `backend` service correctly uses `depends_on: condition: service_healthy`, ensuring the application waits until its required infrastructure components are fully operational before starting.

### ⚠️ Warning (Critical Action Items / Tech Debt)

1.  **Production Readiness Gap (SSL/Secrets):** The combination of hardcoded `MINIO_USE_SSL: "false"` and relying solely on environment variables for credentials constitutes the single largest security risk. **This must be fixed before any consideration of staging or production deployment.**
2.  **Missing Startup Script:** The `TODO: create start-up script` for the database must be completed immediately. This script is vital for ensuring the schema is created reliably, securely, and idempotently.
3.  **Infrastructure-as-Code (IaC):** While Docker Compose is excellent for local development, the entire setup should be reviewed to determine if a dedicated IaC tool (like Terraform or CloudFormation) would provide more controlled, auditable, and scalable deployments for production environments.

---

## 🧑‍💻 Code Logic & Flow Diagram

The flow is linear: Frontend $\rightarrow$ Backend $\rightarrow$ (Database/Cache/Storage).

```mermaid
graph LR
    subgraph Architecture
        FE[Frontend (Port 80)] -- HTTP/S Calls --> BE
        BE[Backend (Port 8080)] -- 1. Read/Write Data --> DB(PostgreSQL/PostGIS)
        BE -- 2. Cache/Rate Limit --> REDIS(Redis Cache)
        BE -- 3. Store Assets --> MINIO(MinIO Object Storage)
    end

    style FE fill:#cce5ff,stroke:#333
    style BE fill:#d4edda,stroke:#333
    style DB fill:#fff3cd,stroke:#333
    style REDIS fill:#fff3cd,stroke:#333
    style MINIO fill:#fff3cd,stroke:#333

    click DB "File: ./infra/db/init/ (Check script for security and completeness)"
    click MINIO "File: env variables for MINIO credentials (Must enforce SSL)"
    click BE "File: backend/ (Review API endpoints and secret usage)"
```

**Cross-Reference Links:**
*   **Database Initialization:** `[./infra/db/init/]` - *Review required script.*
*   **Backend API Logic:** `[./backend/]` - *Review code for credential usage and SSL enforcement.*
*   **MinIO Configuration:** `[./.env]` - *Review for secret storage best practices.*