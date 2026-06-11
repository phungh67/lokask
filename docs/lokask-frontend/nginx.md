```markdown
[⬅ Return to Main Compendium](../../README.md)

# 🌐 Edge Web Server Configuration (Nginx Proxy)

**File:** `nginx.conf` (or equivalent site configuration)
**Component:** Infrastructure / Edge Services / Reverse Proxy
**Knowledge Base:** System Design, Infrastructure, Security Engineering

---

## 📂 Overview

This configuration file defines the primary, secure entry point (edge layer) for the application, running on Nginx. Its core function is to implement a secure reverse proxy setup that ensures all incoming HTTP traffic is immediately redirected to HTTPS. It routes three distinct types of traffic:

1.  **Static Content:** Serves the Single Page Application (SPA) files (HTML, CSS, JS) with aggressive caching.
2.  **REST API:** Proxies structured JSON API calls to an internal backend microservice.
3.  **WebSockets:** Handles persistent, bidirectional connections required for real-time features (e.g., live chat, video), ensuring proper WebSocket protocol negotiation.

The configuration ensures high availability, implements SSL termination, and manages specialized header forwarding crucial for proper logging and client IP tracking.

## ⚙️ Detail and Implementation Analysis

### 🛡️ Security & Redirect (HTTP $\to$ HTTPS)

The first `server` block is critical for security and SEO best practices.

*   **Logic:** Listens on port 80.
*   **Action:** Uses `return 301` to permanently redirect all requests from `http://lokask.se` or `http://www.lokask.se` to their secure `https://` counterparts.
*   **Security Impact:** Guarantees that no traffic hits the main application stack over unencrypted HTTP, mitigating Man-in-the-Middle (MITM) attacks.

### 🔗 Primary Secure Service (HTTPS Block)

The second, main `server` block handles all secure traffic on port 443.

*   **SSL Termination:** Configured using `/etc/letsencrypt/live/lokask.se/fullchain.pem` and the corresponding key. This offloads SSL cryptographic computation from the backend services to Nginx, improving performance.
*   **Client Body Limit:** `client_max_body_size 20M;` sets a maximum acceptable payload size, preventing basic denial-of-service attacks via large file uploads.

#### 🧱 Location Handling

| Location | Purpose | Backend Target | Key Details |
| :--- | :--- | :--- | :--- |
| `/` | **Frontend Root** | `/usr/share/nginx/html` | Standard SPA serving. `try_files $uri $uri/ /index.html;` ensures that deep links (e.g., `/profile/123`) are routed back to `index.html` for the client-side router (React/Vue) to handle. |
| `/api/` | **REST API Proxy** | `http://backend:8080` | General HTTP/HTTPS traffic proxy. **Crucial Headers:** Sets `X-Forwarded-*` headers (`Host`, `X-Real-IP`, `X-Forwarded-For`, `X-Forwarded-Proto`) to ensure the backend application stack receives accurate client IP, original hostname, and scheme information, regardless of how many proxies sit in front of it. |
| `/ws/` | **WebSocket Proxy** | `http://backend:8080` | Handles real-time connections. Requires specific headers and longer timeouts (`3600s`) to maintain persistent, long-running connections (vital for video/chat). |
| `~* \.(?:ico|css|js|...)` | **Static Assets** | `/usr/share/nginx/html` | Uses a regex location block to catch common asset extensions. Implements aggressive caching (`expires 6M`) and bypasses access logging for efficiency. |

## 📌 Engineering Notes (Best Practices)

*   **Cache Control:** The implementation of `expires 6M` for static assets is excellent for performance, as it tells the client browser to cache these resources for six months, drastically reducing load on the edge server and backend.
*   **Robustness:** The setup is highly robust, correctly handling the differences between standard HTTP proxies (`/api/`) and stateful protocols like WebSockets (`/ws/`).
*   **Clarity:** Explicitly defining the service names (`backend:8080`) makes the configuration highly readable and testable within a containerized environment (e.g., Docker Compose/Kubernetes).

## ⚠️ Warning and Tech Debt

*   **Health Checks:** The configuration lacks explicit health check endpoints for the backend service. If the `backend:8080` service is down, Nginx will simply fail silently or return a generic 502 error.
    *   **Recommendation:** Implement an additional `location /health/` block and use Nginx upstream directives with failover/readiness checks.
*   **Rate Limiting:** There are no rate-limiting mechanisms defined. In a high-traffic public system, the API endpoints (`/api/`) are vulnerable to brute force or basic DDoS attacks.
    *   **Recommendation:** Integrate `limit_req_zone` directives in the `/api/` block.
*   **Secret Management:** While the SSL cert paths are defined, in a truly cloud-native setup (e.g., AWS ALB, Cloudflare), these sensitive certificates should ideally be retrieved via a Secret Manager service, rather than being statically pointed to file paths.

## 🧩 Internal Linkages (Coding Flow Mapping)

This proxy layer directs all traffic to the core business logic. It is essential to map the request flow to the respective service layers:

*   **REST API Logic:** Incoming `/api/` requests are processed by the core business logic in the backend.
    *   *Related Backend Code:* `../backend/controllers/user_controller.go`
    *   *Related Authentication Logic:* `../middlerware/auth_middleware.go`
*   **WebSocket Logic:** Real-time connection upgrades are managed by the dedicated WebSocket handling service.
    *   *Related Backend Code:* `../backend/websocket/hub.go`

## 📐 Suggested Implementation Figured

### 💡 Data Flow Diagram (Conceptual)

```mermaid
graph LR
    A[Client Browser] -->|HTTP (80)| B(Nginx Edge Server);
    B -->|301 Redirect| C[Client Browser];
    C -->|HTTPS (443)| B;
    B -->|Static Assets| D{File System: /usr/share/nginx/html};
    B -->|REST API /api/*| E[Backend Service: 8080];
    B -->|WebSocket /ws/*| E;
    E --> F[Database / External Services];
```
***
*Documentation Engineered by: [Your Name/Team Name]*
*Date: [Current Date]*
```