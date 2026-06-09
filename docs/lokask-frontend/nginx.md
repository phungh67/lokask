# Project Documentation: Lokask Web Server Configuration (Nginx)

This document provides a comprehensive technical overview and structural documentation for the provided Nginx server block configuration, which manages traffic routing, security, and application services for `lokask.se`.

---

## 📄 Overview

This configuration establishes a robust, high-availability web server using Nginx. Its primary function is to secure all incoming traffic by enforcing an HTTPS redirect (HTTP $\to$ HTTPS) and then serving content securely over TLS/SSL. It efficiently routes traffic for static assets, a RESTful API endpoint, and a dedicated WebSocket endpoint to specified backends, while optimizing performance using caching headers.

**Key Components:**
*   **Security:** Mandatory HTTP to HTTPS redirect (301).
*   **Ingress:** Handles traffic on ports 80 (HTTP) and 443 (HTTPS).
*   **Functionality:** Serves SPA content, proxies API requests, and manages long-lived WebSocket connections.

## ⚙️ Detailed Analysis

The configuration is divided into two distinct server blocks, each serving specific traffic handling roles.

### 1. HTTP to HTTPS Redirect Block

This block ensures all unsecured traffic is immediately redirected to the secure HTTPS equivalent.

| Directive | Value | Purpose | Security Impact |
| :--- | :--- | :--- | :--- |
| `listen 80` | | Listens for standard HTTP traffic. | Low (Transient). |
| `server_name` | `lokask.se`, `www.lokask.se` | Targets the primary domain names. | N/A |
| `return 301` | `https://$host$request_uri` | Issues a permanent redirect (301) to the HTTPS version of the requested URI. | **Crucial Security Layer.** Prevents man-in-the-middle attacks by forcing encryption. |

### 2. Primary Secure HTTPS Block

This block is the active application entry point, configured for HTTPS listening and advanced routing.

#### **A. SSL/TLS Setup (Cloud/Security)**
*   **Listening:** `listen 443 ssl` - Only accepts encrypted connections.
*   **Certificates:** Uses Let's Encrypt certificates (`fullchain.pem`, `privkey.pem`).
*   **Configuration:** Sets `client_max_body_size 20M` to accommodate large file uploads or payloads.

#### **B. Content Routing (Infrastructure/System Design)**

| Location Block | Purpose | Target Backend/Root | Key Functionality |
| :--- | :--- | :--- | :--- |
| **`/`** | **Frontend Root:** Serves the main Single Page Application (SPA) content. | `/usr/share/nginx/html` | `try_files` directive handles routing within the SPA, ensuring that all requests (e.g., `/about`, `/contact`) fall back to `index.html` for client-side routing. |
| **`/api/`** | **Backend API Gateway:** Proxies structured API requests. | `http://backend:8080` | Standard reverse proxy setup. Passes critical headers (`X-Real-IP`, `X-Forwarded-For`, `X-Forwarded-Proto`) to ensure the backend application is aware of the original client IP and protocol. |
| **`/ws/`** | **WebSocket Handler:** Manages stateful, persistent connections (e.g., video calls). | `http://backend:8080` | Requires specific headers (`Upgrade`, `Connection`) and timeouts (`proxy_read_timeout 3600s`) to keep the connection alive for extended periods, crucial for WebRTC applications. |
| **`~* \.(...)$`** | **Static Asset Cache:** Improves delivery speed for media and built files. | `/usr/share/nginx/html` | Uses regex matching to capture common asset extensions. Implements aggressive caching (`expires 6M`) and prevents logging for high-volume assets (`access_log off`). |

---

## 📝 Notes for Operations & Maintenance

### 💡 Backend Discovery
The configuration assumes the application backend service is running and discoverable via the DNS name `backend` on port `8080`. If the deployment architecture changes (e.g., moving to a specific load balancer IP or AWS ELB name), the `proxy_pass` directives must be updated.

### 💡 Frontend Architecture
The use of `try_files $uri $uri/ /index.html;` confirms this is a Single Page Application (SPA) architecture (e.g., React Router, Vue Router). Any change to the frontend build process (e.g., adding a server-side rendered route) might require modification here.

### 💡 Caching Strategy
The aggressive caching on static assets (`expires 6M`) is excellent for performance but means that any necessary changes to those files must be handled by implementing versioning (e.g., appending content hashes to file names, such as `app.js?v=2.1`).

## ⚠️ Warnings & Pending Items (To Do List)

### 🔴 Security Vulnerability/Enhancement: SSL Hardening
*   **Missing HSTS:** The configuration lacks HTTP Strict Transport Security (HSTS) headers. While the redirect handles the initial hop, adding HSTS headers forces client browsers to *only* connect via HTTPS, significantly improving resilience against protocol downgrade attacks.
    *   **Action:** Add `add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;` to the primary HTTPS block.
*   **Security Headers:** Consider adding robust security headers (e.g., `Content-Security-Policy`, `X-Frame-Options: SAMEORIGIN`) to mitigate common XSS and clickjacking attacks.

### 🟡 System Design/Code Improvement: Environment Variables
*   Hardcoding certificates paths (`/etc/letsencrypt/...`) is inflexible. It is best practice to manage these paths, and potentially the entire server block, via environment variables or a configuration management system (Ansible/Terraform).

### 🟡 Feature Limitation: Global HTTP/2 Support
*   The configuration does not explicitly enable HTTP/2 or HTTP/3 (QUIC). While Nginx can support these protocols, adding explicit directives ensures optimal performance and modern compatibility, especially for the SPA and static asset delivery.

---

## 🖥️ Structural Flow Diagram (Conceptual)

*(Self-correction: As an AI, I cannot generate a physical diagram, but I will describe the structure for perfect documentation purposes.)*

**Conceptual Figure: Request Flow Diagram**

**[Client Browser]** $\rightarrow$ **[Request (HTTP)]** $\rightarrow$ **[Nginx (Port 80)]** $\rightarrow$ **[301 Redirect]** $\rightarrow$ **[Client Browser]**

**[Client Browser]** $\rightarrow$ **[Request (HTTPS)]** $\rightarrow$ **[Nginx (Port 443)]** $\rightarrow$ **[TLS Termination]** $\rightarrow$ **[Route Decision Point]**

*   **If `/api/`:** $\rightarrow$ **[Reverse Proxy]** $\rightarrow$ **[Backend Service: 8080]**
*   **If `/ws/`:** $\rightarrow$ **[WebSocket Upgrade]** $\rightarrow$ **[Backend Service: 8080]**
*   **If `/*`:** $\rightarrow$ **[Serve Static HTML]** $\rightarrow$ **[Client Browser SPA Logic]**
*   **If Asset (`.js`, `.css`):** $\rightarrow$ **[Serve Cached Asset]** $\rightarrow$ **[Client Browser]**