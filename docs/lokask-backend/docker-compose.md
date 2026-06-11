[⬅ Return to Main Compendium](../../README.md)

# 🏗️ Service Stack Infrastructure Configuration (`docker-compose.yml`)

This document serves as the architectural guide for the core service deployment stack, defining the infrastructure components, their interdependencies, and operational parameters using Docker Compose. This setup manages the full life cycle from persistent storage to the presentation layer.

---

## 🖼️ System Diagram

The application follows a standard layered microservice pattern.

**Fig 1: Service Interaction Flow**
*(A visual representation showing the data flow)*

```mermaid
graph TD
    A[Client Browser] -->|HTTPS (443)| B(Frontend/Web UI);
    B -->|Internal HTTP (8080)| C(Backend API);
    C -->|Read/Write Data| D[PostgreSQL + PostGIS];
    C -->|Cache Operations| E[Redis Cache];
    D & E -->|Infrastructure Services| F(AWS Services);

    subgraph Networking
        B -- travel_net --> C;
        C -- travel_net --> D;
        C -- travel_net --> E;
    end
```

---

## 📑 Overview

The application stack is designed to be highly available and scalable, utilizing Docker Compose for orchestration. It comprises four main components:

1.  **`db`**: A robust PostgreSQL instance with PostGIS extensions for advanced spatial database capabilities.
2.  **`redis`**: An in-memory data store utilized for caching sessions, tokens, and rate-limiting data, drastically reducing database load.
3.  **`backend`**: The core RESTful API service responsible for business logic, authentication, and interaction with AWS resources (S3).
4.  **`frontend`**: The client-side web interface, configured to handle SSL/TLS termination.

## ✨ Detail: Component Breakdown

### 💾 1. Spatial Database (`db`)
*   **Image:** `postgis/postgis:16-3.4-alpine`
*   **Role:** Primary source of truth for all persistent application data, optimized for geospatial queries (PostGIS).
*   **Configuration Highlights:**
    *   Uses persistent volume (`postgres_data`) ensuring data survives container restarts.
    *   Implements a `healthcheck` to ensure the database is reachable and accepting connections before dependent services start.
    *   Initial data population occurs via volumes mounted in `./infra/db/init`.
*   **Connections:** The `backend` service connects using the service name `db` and port `5432`.

### ⚡ 2. Caching Service (`redis`)
*   **Image:** `redis:alpine`
*   **Role:** High-speed caching layer. Essential for performance optimization by offloading frequent, read-heavy queries from the primary database.
*   **Configuration Highlights:**
    *   Uses persistent volume (`redis_data`).
    *   A robust `healthcheck` confirms Redis availability (`redis-cli ping`).
*   **Connections:** The `backend` service connects using the service name `redis` and port `6379`.

### ⚙️ 3. Backend API (`backend`)
*   **Image:** `huyhoangph99/lokask-repository:backend-latest`
*   **Role:** Handles all business logic, request routing, and external integrations (Email, S3).
*   **Dependencies:** Critically depends on both `db` and `redis` being reported as `service_healthy` before startup.
*   **Environment Variables:** Receives detailed configuration for database credentials, email services, and AWS configuration.
    *   ***Security Note:*** AWS credentials are correctly assumed to be handled by the EC2 Instance Profile, which is a strong security practice.
*   **Cross-Referencing:** The logic governing endpoints and data interaction within this service must adhere to the established structures in the following modules:
    *   Authentication/Middleware: [`../middlerware/auth.go`](../middlerware/auth.go)
    *   Business Logic: [`../services/user_service.go`](../services/user_service.go)

### 🌐 4. Frontend Web UI (`frontend`)
*   **Image:** `huyhoangph99/lokask-repository:frontend-latest`
*   **Role:** The user-facing presentation layer.
*   **Configuration Highlights:**
    *   Exposes standard web ports (`80` and `443`).
    *   Volume mount at `/etc/letsencrypt` indicates that SSL/TLS certificates are externally managed and injected, ensuring secure communication.
*   **Dependencies:** Depends on the `backend` service to initialize and communicate with the API endpoints.

---

## 💡 Note: Architectural Best Practices & Considerations

*   **Network Isolation:** The services are explicitly placed on the `travel_net` network, ensuring that inter-service communication is isolated and names-resolved via service names (e.g., `db`, `redis`) rather than fragile IP addresses.
*   **Health Checks:** The use of explicit `healthcheck` blocks is excellent practice, enforcing strict startup dependency management. The dependent services (`backend`) will wait until the prerequisites are fully operational.
*   **Cloud Integration:** The configuration correctly abstracts AWS credentials away from environment variables (relying on Instance Profiles), adhering to the principle of least privilege and improving security posture.
*   **Port Mapping:** Exposing `443` and `80` on the `frontend` service indicates proper load balancer/reverse proxy integration, handling TLS termination before traffic reaches the container.

---

## ⚠️ Warning: Potential Technical Debt & Improvements

The following points are flagged for immediate review by the infrastructure or security team:

### 🔒 1. Secrets Management (Highest Priority)
*   **Issue:** Database credentials (`DB_USER`, `DB_PASSWORD`, etc.) are defined using simple environment variables (`${VAR}`). While acceptable in simple development environments, this is a significant security risk in production.
*   **Recommendation:** Migrate secrets storage to a dedicated solution such as **AWS Secrets Manager** or **HashiCorp Vault**, and utilize Kubernetes Secrets or similar mechanism for injection at runtime, rather than relying on `.env` files.

### 🏷️ 2. Image Tag Stability
*   **Issue:** Services use the `:latest` tag (e.g., `backend-latest`).
*   **Recommendation:** Never rely on `:latest` in production infrastructure. Use specific, semantic version tags (e.g., `v1.2.3`) to ensure predictable deployments and reliable rollbacks.

### 🧱 3. Volume Ownership
*   **Issue:** The management and cleanup process for persistent volumes (`postgres_data`, `redis_data`) is not detailed.
*   **Recommendation:** Implement documented procedures for volume archival, backup restoration, and explicit removal to prevent orphaned data or resource leakage.

### 🧩 4. Code Structure Linking
*   **Issue:** The document mentions required links for code flow (e.g., `auth.go`), but these dependencies are not explicitly mapped back into the `docker-compose` definition.
*   **Action Item:** When refactoring the service definition, consider adding an `environment` variable or configuration key that explicitly lists the module paths it interacts with, improving deployability traceability.

---
***Disclaimer:*** *This documentation is based solely on the provided infrastructure configuration file and assumes the functional existence and stability of the linked code modules.*