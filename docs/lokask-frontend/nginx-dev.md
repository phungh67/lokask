# 🌐 Infrastructure Configuration README: Nginx Reverse Proxy Setup

This document provides a comprehensive summary and technical documentation for the provided Nginx configuration file, which acts as a multi-functional reverse proxy and entry point for a modern web application stack.

## ✨ Overview

This Nginx configuration serves as the primary load balancer and entry point for a distributed application. It is configured to handle four distinct traffic patterns: serving the client-side Single Page Application (SPA) frontend, routing API requests to a dedicated backend service (Go), managing persistent WebRTC signaling traffic via WebSockets, and proxying object storage requests to a MinIO-compatible service.

The setup ensures robust separation of concerns, allowing different services (Frontend, API, Object Storage) to operate independently while presenting a unified, cohesive public endpoint on port 80.

## 🛠️ Detail Analysis

The configuration is structured using multiple `location` blocks to intelligently route incoming HTTP traffic based on the request path.

### 1. Frontend Serving (SPA)
*   **Location:** `/`
*   **Function:** Serves static assets for the React client.
*   **Mechanism:** Uses `root` and `index` directives. The critical line is `try_files $uri $uri/ /index.html;`, which ensures that all requests that don't match a physical file or directory are redirected back to `index.html`. This is standard practice for client-side routing in SPAs.

### 2. Backend API Proxy (HTTP/REST)
*   **Location:** `/api/`
*   **Function:** Routes all backend API calls to the `backend` service (running on port 8080).
*   **Headers:** Properly propagates standard headers (`Host`, `X-Real-IP`, `X-Forwarded-For`) to maintain accurate client IP address logging on the backend.
*   **Security/UX:** Includes extensive CORS handling. It specifically manages pre-flight `OPTIONS` requests (`if ($request_method = 'OPTIONS')`) to ensure cross-domain access is permitted without requiring the client to perform a complex request.

### 3. WebSockets Proxy (WebRTC Signaling)
*   **Location:** `/ws/`
*   **Function:** Manages persistent, stateful connections required for WebRTC signaling (e.g., STUN/TURN coordination, session setup).
*   **Critical Headers:** Uses `proxy_http_version 1.1` and sets `Upgrade` and `Connection` headers. These are mandatory for Nginx to correctly upgrade the underlying HTTP connection to a WebSocket protocol.
*   **Timeouts:** Sets generous `proxy_read_timeout` and `proxy_send_timeout` (3600s) to keep the connection alive during long-duration calls.

### 4. Object Storage Proxy (MinIO S3)
*   **Location:** `location ~ ^/(user-avatars|galleries|covers)/` (Regex matching)
*   **Function:** Directs file storage requests (e.g., image uploads, retrieval) to the dedicated MinIO container.
*   **Headers:** Crucially sets `proxy_set_header Host $http_host;` as some object storage services are sensitive to the original `Host` header.
*   **CORS:** Provides necessary MinIO-specific CORS headers to prevent client-side image manipulation (e.g., in a React canvas) from failing due to cross-origin security policies.

### 5. Static Asset Caching
*   **Location:** `location ~* \.(?:ico|css|js|gif|jpe?g|png|woff2?|eot|ttf|svg|mp4|webm)$`
*   **Function:** Improves performance by serving common static files with aggressive caching headers.
*   **Optimization:** `expires 6M;` tells the client (browser) that these assets can be cached for six months, reducing repeated requests to the server.

---
## 📝 Documentation Notes

### Architecture and Best Practices
*   **Decoupling:** This setup successfully decouples the frontend, API, and object storage into separate, dedicated services (pods/containers), which is a hallmark of microservice architecture.
*   **Idempotency:** The use of `try_files` ensures the frontend is always served correctly, regardless of the client-side routing depth.
*   **Performance:** The dedicated static asset location block significantly improves perceived load time by minimizing server processing for assets.

### Cloud and System Considerations
*   **Scaling:** If the API or WebRTC load increases dramatically, the `proxy_pass` target (e.g., `http://backend:8080`) should be updated to point to a Kubernetes Service name or an external Load Balancer IP/Hostname to enable horizontal scaling.
*   **TLS/HTTPS:** While the provided config runs on HTTP (Port 80), in production, a mandatory layer (like an AWS ALB, Cloudflare, or Nginx's `listen 443 ssl`) must be added to enforce TLS encryption.
*   **Rate Limiting:** Implementing `limit_req_module` within the API or MinIO locations is highly recommended to prevent DoS attacks or abuse of the endpoints.

## ⚠️ Security and Implementation Warnings

*   **CORS Wildcard (`*`):** Using `'*'` for `Access-Control-Allow-Origin` is convenient but insecure. In a production environment, if the client application is deployed on a specific domain (e.g., `app.company.com`), the header should be restricted to only that domain to mitigate potential CSRF/XSS vulnerabilities.
*   **Service Discovery Dependency:** The entire configuration relies on the services (`backend`, `minio`) being resolvable via the service discovery mechanism (e.g., Docker Compose, Kubernetes DNS). If these service names change, the Nginx configuration must be immediately updated.
*   **Credential Exposure:** While this configuration handles routing, any sensitive logic (like authentication validation) must be handled *after* the request hits the appropriate backend service, not solely in the proxy layer.
*   **Max Body Size:** The `client_max_body_size 20M` limits are critical. If a user attempts to upload an object larger than 20MB, the connection will fail at the Nginx layer, preventing potential memory exhaustion issues. Review this limit if larger files are expected.

---
## 📊 Generated Figure (Conceptual Flowchart)

```mermaid
graph LR
    A[Client Browser] -->|HTTP Request (Port 80)| B(Nginx Proxy Server);

    subgraph Nginx Routing Logic
        B -->|/| C(React Frontend: index.html);
        B -->|/api/| D{API Proxy: Go Backend};
        B -->|/ws/| E{WebSockets Proxy: Go Backend};
        B -->|/(user-avatars|/galleries)/| F{S3 Proxy: MinIO};
        B -->|Static Assets (*.js, .css)| G(Cache: Direct Serve);
    end

    D --> D_Service[Go Service];
    E --> E_Service[Go Service];
    F --> F_Service[MinIO Container];
```