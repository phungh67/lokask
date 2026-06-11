# 🌐 NGINX Reverse Proxy Configuration (`nginx.conf`)

`[⬅ Return to Main Compendium](../../README.md)`

This document outlines the structure, logic, and operational considerations for the core NGINX reverse proxy configuration. This configuration acts as the single entry point (edge router) for all client traffic, directing requests to the appropriate backend services (Frontend SPA, Go API, WebSockets, and MinIO Object Storage).

---

## 📋 Overview

The NGINX configuration file is responsible for routing and load-balancing all incoming client traffic to various microservices running in the container orchestration environment (e.g., Docker Compose). It manages client-facing concerns such as CORS policy enforcement, SSL termination (implied, though not shown here), rate limiting, and efficient caching of static assets.

### Architectural Flow Diagram (Conceptual)

```mermaid
graph TD
    A[Client Browser] -->|HTTP/WS Request| B(NGINX Proxy);
    B --> |/| C[React Frontend SPA];
    B --> |/api/| D[Backend API (Go Container)];
    B --> |/ws/| D;
    B --> |/(user-avatars|...) | E[MinIO S3 Storage];

    C --> |Asset Calls| B;
    D --> |DB/Cache Calls| F(Internal Services);
    E --> |Object Retrieval| F;

    style A fill:#f9f,stroke:#333,stroke-width:2px
    style B fill:#ccf,stroke:#333,stroke-width:2px
```

---

## 🔎 Detail: Traffic Routing Logic

The configuration is segmented into four primary service handlers, each addressing a specific protocol and backend requirement.

### 1. Frontend Serving (`location /`)

This block handles all root-level requests, serving the Single Page Application (SPA) built with React.

*   **Mechanism:** `root /usr/share/nginx/html;` defines the static content root.
*   **Fallthrough:** `try_files $uri $uri/ /index.html;` ensures that regardless of the requested path, NGINX attempts to serve the file or directory first. If it fails, it defaults to `index.html`, enabling client-side routing (e.g., `/dashboard` is served by the React app, which then handles the route internally).

### 2. Backend API Proxy (`location /api/`)

This routes structured API calls (e.g., `POST /api/user/create`) to the main Go backend service.

*   **Proxy Pass:** `proxy_pass http://backend:8080;` routes traffic to the service named `backend` on port `8080`.
*   **Headers:** Crucial headers (`X-Real-IP`, `X-Forwarded-For`, `Host`) are set to ensure the backend service receives accurate client IP addresses and request host information, bypassing potential container networking issues.
*   **CORS Handling:** Robust CORS headers are set globally for this location. A dedicated `if ($request_method = 'OPTIONS')` block handles preflight requests (OPTIONS method), returning a `204 No Content` response, which is standard practice for API calls.
*   **Limit:** `client_max_body_size 20M;` sets a generous limit for API payloads.

### 3. WebSockets Proxy (`location /ws/`)

This specialized location handles persistent, stateful connections required for real-time communication (like WebRTC signaling).

*   **Protocol:** Unlike standard HTTP, WebSockets require an upgrade.
*   **Headers:** `proxy_http_version 1.1;`, `proxy_set_header Upgrade $http_upgrade;`, and `proxy_set_header Connection "Upgrade";` are mandatory headers that instruct the proxy and backend to switch protocols from HTTP to WebSocket.
*   **Timeouts:** `proxy_read_timeout 3600s;` and `proxy_send_timeout 3600s;` are extended to 1 hour (3600 seconds) to prevent long-lived video/signaling connections from timing out prematurely.

### 4. MinIO S3 API Proxy (`location ~ ^/(user-avatars|galleries|covers)/`)

This block intercepts requests destined for object storage buckets, preventing them from hitting the general API or frontend logic.

*   **Regex Matching:** `location ~ ^/(user-avatars|galleries|covers)/` uses a case-insensitive regex matching structure (`~`) to catch paths that start with the specified bucket prefixes.
*   **Proxy Pass:** `proxy_pass http://minio:9000;` routes the traffic to the MinIO service on its standard API port.
*   **Headers:** It specifically sets `proxy_set_header Host $http_host;` because MinIO often requires the original host header to function correctly when accessed via a proxy.
*   **CORS:** Dedicated CORS headers are included to ensure that browser-based uploads and client-side manipulations (e.g., loading a canvas element with an image) are not blocked by pre-flight errors.

### 5. Static Asset Caching (`location ~* \.(?:ico|css|js|gif|jpe?g|png|woff2?|eot|ttf|svg|mp4|webm)$`)

This final block is a performance optimization.

*   **Matching:** It uses a regex to match common static file extensions.
*   **Caching Headers:** `expires 6M;` and `add_header Cache-Control "public";` tell the client and intermediary proxies that these files are immutable and can be cached aggressively for 6 months, significantly reducing origin server load and improving perceived performance.

---

## 📝 Note & Best Practices

*   **Service Discovery:** The reliance on container names (`backend`, `minio`) assumes the use of a service mesh or orchestrated environment (like Docker Compose) where these names are resolvable via DNS within the network.
*   **CORS Management:** The configuration implements specific CORS headers for each location block. While effective, relying on `*` for `Access-Control-Allow-Origin` is generally less secure than specifying the exact allowed frontend origin (`https://your-domain.com`).
*   **Idempotency:** The structure correctly isolates API endpoints (`/api/`) from file resources (`/`) and storage buckets (`/user-avatars/`), which is key for a clean separation of concerns.

---

## ⚠️ Warning & Tech Debt

1.  **Single Point of Failure (SPOF):** The NGINX proxy itself is a critical SPOF. If this service fails, the entire application stack is unreachable. **Mitigation:** Implement a failover strategy (e.g., secondary ingress controller or health checks).
2.  **Hardcoded Timeouts:** The 1-hour WebSocket timeouts (`3600s`) are manually configured. If the application's real-time requirements change (e.g., requiring 12-hour video sessions), this section must be updated and tested.
3.  **MinIO Regex Coupling:** The bucket names (`user-avatars|galleries|covers`) are hardcoded into the NGINX configuration regex. If a new storage bucket is added, the NGINX config **must** be updated, otherwise, the new bucket will either fail to proxy or leak into the general API logic.
4.  **Error Handling:** The current configuration does not include explicit global `error_page` directives. Proper HTTP error handling (e.g., redirecting 404s to a custom page, or handling 50x errors) is necessary for a production-ready setup.

---

## 🧩 Related Logic Flow

To fully understand how the traffic is handled, the following modules are interconnected:

*   **API Logic:** The routing paths defined in `location /api/` and `location /ws/` directly map to the business logic housed within the Go backend code, specifically checking the file **(./backend/handlers/api.go)** for request validation and handling.
*   **Frontend Routing:** The `try_files` logic relies entirely on the client-side routing setup within the **(./frontend/src/App.jsx)** component to manage deep links.
*   **Storage Interaction:** All object uploads/downloads are mediated by the MinIO endpoint, which is accessed via **(./infrastructure/minio-client.py)** for programmatic interaction.