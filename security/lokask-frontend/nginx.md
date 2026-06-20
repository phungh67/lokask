[⬅ Return to Main Compendium](../../README.md)

# Nginx Reverse Proxy & SSL Configuration Review (`nginx.conf` logic)

## Overview

This Nginx configuration file acts as the primary entry point (reverse proxy) for the `lokask.se` application. It handles secure HTTPS termination, enforces HTTP to HTTPS redirection, serves static assets, and routes dynamic traffic to an internal backend service on port 8080.

The configuration is robust, incorporating essential security features like SSL enforcement and advanced header management for proxying, including dedicated handling for WebSocket connections.

## Detail

### Functionality Breakdown

| Block | Port | Protocol | Function | Details |
| :--- | :--- | :--- | :--- | :--- |
| **HTTP Redirect** | 80 | HTTP | Redirect | Forces all HTTP traffic to HTTPS (301 permanent redirect). |
| **HTTPS Primary** | 443 | HTTPS | Termination/Routing | Handles SSL termination using Let's Encrypt. |
| **`/` (Root)** | 443 | HTTPS | Static/SPA Fallback | Serves the root directory (`/usr/share/nginx/html`) and uses `try_files` for Single Page Application (SPA) routing. |
| **`/api/`** | 443 | HTTPS | Backend Proxy | Routes API calls to `http://backend:8080`. Sets standard proxy headers. |
| **`/ws/`** | 443 | HTTPS | WebSocket Proxy | Routes WebSocket traffic to `http://backend:8080`. Implements mandatory WebSocket upgrade headers and extended timeouts. |
| **Static Assets** | 443 | HTTPS | Caching | Serves common assets (`.jpg`, `.css`, `.js`, etc.) from the root directory, enabling aggressive browser caching (`expires 6M`). |

### Security Flow Diagram (Conceptual)

```mermaid
graph TD
    A[Client HTTP (Port 80)] -->|Redirect 301| B{Nginx};
    C[Client HTTPS (Port 443)] -->|Request| B;
    B -->|Static Asset Match| D[Root Directory];
    B -->|/api/ Match| E[Proxy to backend:8080];
    B -->|/ws/ Match| F[Proxy to backend:8080 (WebSocket)];
    D -->|Serve Assets| G(Client);
    E -->|Response| G;
    F -->|Bidi Stream| G;
```

## Vulnerability Assessment

### 🔴 High Priority

*   **Missing Hardened SSL Settings (Protocol Downgrade/Weak Ciphers):** The configuration specifies certificates but fails to enforce modern, hardened TLS standards (e.g., requiring TLS 1.2+ and disabling weak ciphers like RC4 or 3DES). This leaves the connection vulnerable to downgrade attacks and potential interception if weak ciphers are allowed.
    *   **Remediation:** Implement `ssl_protocols TLSv1.2 TLSv1.3;` and utilize `ssl_ciphers` directives with strong, modern cipher suites.

### 🟠 Medium Priority

*   **Header Manipulation/Host Spoofing (Proxy Block):** While proxy headers are generally correct, setting `proxy_set_header Host $host;` on the `/api/` block allows the upstream backend to potentially rely on the original external host (`$host`) instead of the internally configured host. This could be risky if the backend needs strict host validation for authorization or internal routing.
    *   **Recommendation:** Consider using `proxy_set_header Host backend:8080;` if the backend expects the internal service hostname, or ensure the backend service is hardened against unexpected `Host` headers.

### 🟡 Low Priority

*   **No Rate Limiting Implementation:** The configuration does not implement rate limiting (e.g., using `limit_req_module`). A lack of limiting exposes the service to brute-force attacks, DDoS attempts, or resource exhaustion via excessive API calls.
    *   **Recommendation:** Implement a rate limiting block, especially for `/api/` and login/authentication endpoints.

---

## ⚙️ Technical Debt & Notes

### 📝 Notes (Best Practices)

1.  **SPA Routing:** The use of `try_files $uri $uri/ /index.html;` is the standard best practice for SPAs (like React/Vue/Angular) to ensure that client-side routing handles all paths, preventing Nginx from generating a 404 error for deep links.
2.  **Caching:** Setting aggressive caching (`expires 6M`) for static assets significantly improves performance and offloads strain from the server, provided the assets are versioned/fingerprinted during the build process.
3.  **WebSocket Handling:** The correct implementation of `Upgrade` and `Connection` headers, along with long timeouts (`3600s`), ensures reliable, persistent connections required for real-time communication.

### ⚠️ Warning (Missing Security Enhancements)

The configuration is missing critical hardening directives common in enterprise environments, specifically:

1.  **HSTS (HTTP Strict Transport Security):** The `Strict-Transport-Security` header must be added to enforce the use of HTTPS across all client browsers, preventing man-in-the-middle attempts that might force the client back to HTTP.
2.  **Security Headers:** Implementing headers like `X-Content-Type-Options: nosniff` and `X-Frame-Options: DENY` at the root level mitigates common client-side XSS and clickjacking vectors.
3.  **Client IP Validation:** While `X-Forwarded-For` is passed, the configuration should ideally validate or sanitize the incoming headers to prevent spoofing if the network path is untrusted.

### 🛠️ Unfinished/Pending Tasks

1.  **Centralized SSL Policy:** The SSL hardening directives (protocols, ciphers, HSTS) should be extracted into an `include` file (e.g., `/etc/nginx/snippets/ssl.conf`) and referenced globally to ensure consistency across all future blocks.
2.  **Resource Quotas:** Implement server-level limits (`client_max_body_size` is present, but rate limits are missing) to prevent a single attacker or process from consuming excessive memory or bandwidth.

***

### Related Configuration Files

*   [./snippets/ssl.conf](snippets/ssl.conf) - *Required file for hardening directives (HSTS, minimum TLS version, ciphers).*
*   [./nginx.conf](nginx.conf) - *Reference to the primary configuration file.*
*   [../backend/backend_service.yml](backend/backend_service.yml) - *Review the backend deployment configuration to ensure it expects proxy headers (e.g., `X-Forwarded-For`).*