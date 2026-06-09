# 📂 Lokask Repository Infrastructure Documentation

**System:** Lokask Microservices Stack
**Date:** 2024-05-28
**Author:** Documentation Engineering Team
**Knowledge Base:** System Design, Infrastructure, Cloud Components, Security

## 🚀 Overview

This document details the infrastructure composition for the Lokask application suite. The system utilizes a containerized, microservices architecture deployed using Docker Compose principles. It consists of four core services: a spatial PostgreSQL database, a Redis cache, a backend API layer, and a frontend web client.

The infrastructure is designed for high availability and leverages persistent volumes for stateful services (`db`, `redis`). Inter-service communication is managed via a dedicated internal network (`travel_net`), allowing service discovery by container names.

---

## ⚙️ Detail Analysis (Service Breakdown)

### 1. 💾 Database Service (PostgreSQL + PostGIS)
*   **Service Name:** `db`
*   **Image:** `postgis/postgis:16-3.4-alpine`
*   **Purpose:** Core persistent data storage. The inclusion of PostGIS indicates that the application relies heavily on geographical or spatial data types (e.g., location tracking, boundary storage).
*   **Connectivity:** Accessible internally via the service name `db` on port 5432.
*   **Persistence:** Data is persisted using the `postgres_data` volume.
*   **Initialization:** Custom initialization scripts located at `./infra/db/init` are executed on container startup, ensuring schema migrations and initial data seeding.
*   **Health Check:** Robust health check is implemented using `pg_isready`, ensuring dependent services do not attempt to connect until the database is fully operational.

### 2. ⚡ Caching Service (Redis)
*   **Service Name:** `redis`
*   **Image:** `redis:alpine`
*   **Purpose:** Provides a fast, in-memory data store for caching frequently accessed data, managing sessions, and rate limiting.
*   **Connectivity:** Accessible internally via the service name `redis` on port 6379.
*   **Persistence:** State is maintained using the `redis_data` volume.
*   **Health Check:** A standard `redis-cli ping` is used to verify service availability.

### 3. 💻 Backend Service (API Gateway/Business Logic)
*   **Service Name:** `backend`
*   **Image:** `huyhoangph99/lokask-repository:backend-latest`
*   **Purpose:** Hosts the primary business logic and API endpoints. This service mediates between the frontend, database, and external services (e.g., AWS S3, Mail API).
*   **Dependencies:** This service explicitly requires both the `db` and `redis` services to be in a healthy state before starting, enforcing proper startup order.
*   **Cloud Integration:** Uses environment variables for AWS configuration (`AWS_DEFAULT_REGION`, `AWS_S3_AVATAR_BUCKET`, etc.), noting the architectural best practice of handling keys via **EC2 Instance Profile** rather than directly in configuration.
*   **Environment Variables:** Highly dependent on external configuration via multiple environment variables (DB credentials, Mail settings, AWS settings).

### 4. 🌐 Frontend Service (Client Presentation Layer)
*   **Service Name:** `frontend`
*   **Image:** `huyhoangph99/lokask-repository:frontend-latest`
*   **Purpose:** Serves the user interface (UI) to the end-user.
*   **Connectivity:** Exposes ports 80 (HTTP) and 443 (HTTPS) to the external network.
*   **Dependencies:** Depends on the `backend` service being active to fetch required data.
*   **Certificate Management:** The service mounts the local directory `/home/lokask-service/ssl-cert` to `/etc/letsencrypt:ro`, indicating it expects pre-fetched or externally managed SSL certificates for HTTPS operation.

---

## 📝 Documentation Notes

### ℹ️ Configuration Management
1.  **Environment Variables:** The entire stack relies on a comprehensive `.env` file (or equivalent secret management system) to populate all necessary variables (`DB_USER`, `DB_PASSWORD`, `MAIL_API_KEY`, etc.).
2.  **Security Best Practice (AWS):** The backend configuration correctly notes that AWS credentials should ideally be managed by an EC2 Instance Profile role rather than being hardcoded or passing them entirely through environment variables.
3.  **Service Discovery:** All communication between internal services (e.g., `backend` connecting to `db`) utilizes container service names (`db`, `redis`) over IP addresses, which is the correct practice for container orchestration environments.

### 🕰️ Dependency Flow and Startup Sequence
1.  **Order:** Services generally start: `db` $\rightarrow$ `redis` $\rightarrow$ `backend` $\rightarrow$ `frontend`.
2.  **Health Checks:** The use of `depends_on: service_healthy` (instead of just `depends_on`) is crucial, as it ensures the API layer waits for a verifiable operational state of its dependencies.

---

## ⚠️ Warnings and Future Improvements

### 🛑 Security Warnings
1.  **Credential Exposure:** While utilizing ENV variables is standard, storing sensitive variables (like passwords and API keys) directly in the codebase or even a local `.env` file represents a significant risk. **Recommendation:** Implement a dedicated secrets management tool (e.g., HashiCorp Vault, AWS Secrets Manager) to inject these values at runtime.
2.  **Networking:** The `frontend` exposing ports 80 and 443 suggests it is the entry point. For production, an external, dedicated reverse proxy (like Nginx or Traefik) should manage these ports and handle TLS termination, keeping the `frontend` container itself behind the proxy layer.

### 📉 Scalability and Resilience Concerns
1.  **Horizontal Scaling (Stateful Services):** The current setup does not specify a mechanism for scaling the database (`db`) or the cache (`redis`) beyond a single instance. For true production scalability, consider implementing a robust database clustering solution (e.g., Patroni for PostgreSQL) and a Redis Cluster architecture.
2.  **SSL Certificate Management:** The certificate mount point is a passive volume mount. The system lacks an automated mechanism (like Certbot/Let's Encrypt container integration) to renew these certificates, which will lead to service downtime when certificates expire.
3.  **Resource Limits:** No CPU or memory limits are defined for the containers. In a shared infrastructure environment, this could lead to resource exhaustion and instability (noisy neighbor problem). **Recommendation:** Implement resource limits and quality of service (QoS) classes.

### 🛠️ Development Notes
*   **Logging:** Add standardized centralized logging (e.g., using the ELK stack or cloud-native logging services) to capture logs from all containers for unified monitoring and debugging.
*   **Graceful Shutdown:** Consider implementing readiness probes in addition to health checks to allow the container graceful time to finish active requests before shutting down.