[⬅ Return to Main Compendium](../../README.md)

# Service: Frontend Web Application Deployment (Nginx Container)

## Overview

This document provides technical specifications and operational details for the containerized deployment pipeline of the frontend web application. The architecture uses a multi-stage Docker build process to efficiently compile the application and serve the static assets using Nginx.

The core function of this service is to:
1. Install necessary dependencies (`package.json`, lock files).
2. Build the production-ready static assets (`npm run build`).
3. Containerize the assets within an Nginx-based image for secure, efficient serving on port 80.

---

## 🛠 Detail & Technical Specification

### 1. Architecture Flow (Conceptual Figured)

The deployment follows a standard build-and-serve pattern using Docker's multi-stage build capabilities.

```mermaid
graph TD
    A[Source Code & Dependencies] --> B{Stage 1: Builder};
    B --> C[Install Dependencies (npm ci)];
    C --> D[Build Assets (npm run build)];
    D --> E{Stage 2: Runner (Nginx)};
    E --> F[Copy Assets (/app/dist to /usr/share/nginx/html)];
    E --> G[Copy Nginx Config (nginx-dev.conf)];
    G --> H[Expose Port 80];
    H --> I[Execute Nginx Daemon];
```

### 2. Dockerfile Analysis

| Stage | Base Image | Purpose | Key Commands |
| :--- | :--- | :--- | :--- |
| **Builder** | `node:20-alpine` | Compiling and bundling the frontend code. | `npm ci`, `npm run build` |
| **Runner** | `nginxinc/nginx-unprivileged:alpine3.23-perl` | Serving the finalized static assets securely. | `COPY --from=builder`, `COPY nginx-dev.conf` |

**Operational Steps:**

1. **Dependency Installation:** Uses `npm ci --silent` to ensure deterministic and reliable dependency installation, crucial for CI/CD environments.
2. **Asset Transfer:** The entire contents of the `dist` folder from the `builder` stage are copied to the Nginx web root (`/usr/share/nginx/html`).
3. **Configuration:** A dedicated configuration file, `nginx-dev.conf`, is mounted into the container, overriding the default Nginx settings.
4. **Entry Point:** The container executes `nginx -g "daemon off;"`, ensuring Nginx runs in the foreground, which is required for Docker container health checks.

### 3. Configuration Links

*   **Nginx Configuration:** `nginx-dev.conf`
    *   *Review Logic:* This file dictates routing, caching headers, and potentially API proxying rules. Ensure proper path mappings are maintained if the application structure changes.
    *   *Related Link:* See configuration file definitions in `[../../config/nginx-dev.conf]`

---

## 📝 Note (Operational Best Practices)

1. **Security Context:** The use of `nginxinc/nginx-unprivileged` is a strong security practice, ensuring Nginx runs with minimized privileges, reducing the attack surface area.
2. **Cache Control:** The `nginx-dev.conf` must be audited to implement proper HTTP caching headers (e.g., `Cache-Control`, `Expires`) to minimize load on the backend APIs and improve perceived performance for end-users.
3. **Environment Variables:** While not visible in the Dockerfile, consider passing build-time environment variables (e.g., API endpoints, feature flags) during the `npm run build` phase to ensure the static assets are correctly configured for the target environment (Dev, Staging, Prod).

---

## 🚨 Warning & Tech Debt (Action Items)

### 🔴 Critical Security/Infrastructure Issues

1. **Hardcoded Credentials:** Verify that the `nginx-dev.conf` does not contain any hardcoded secrets, API keys, or internal endpoint credentials. These must be sourced from secure configuration maps or secrets managers (e.g., Kubernetes Secrets, AWS Secrets Manager).
2. **Health Check:** The Docker Compose or Kubernetes deployment definition MUST include a robust readiness and liveness probe targeting `/` or `/healthz` endpoint, confirming that Nginx is both running and capable of serving content.

### 🟡 Tech Debt / Improvement Suggestions

1. **Image Optimization (Multi-Stage):** While the current setup is good, if the application uses specific system libraries (like image processing or specialized fonts) that bloat the `node:20-alpine` builder image, consider replacing it with a minimal Alpine base that pre-installs only necessary build tools (e.g., `alpine/git`, `alpine/build-base`).
2. **Build Artifact Verification:** Implement a step *before* the `COPY` command in the builder stage to run a linting/validation tool against the generated `dist` folder. This ensures the build output is structurally sound before attempting deployment.
3. **State Management Linkage:** If the frontend depends on specific backend endpoints or authentication flows, ensure the relevant service links are documented.
    *   *Example:* If the client needs to interact with user data, the link to the API gateway middleware should be included: `[User Auth Flow Logic](../../src/auth.go)` (Linking to the related API logic definition).