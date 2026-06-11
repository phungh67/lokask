
[⬅ Return to Main Compendium](../../README.md)

# Module: Image Proxy Handler (`handler/proxy.go`)

This module implements a robust HTTP handler designed to proxy image fetching requests. It allows external clients to provide a remote image URL, and the service fetches, reads, and returns the image content while ensuring proper headers and CORS policies are applied.

---

## 🌐 Overview

The `ProxyHandler` struct provides the `ProxyImage` method, which serves as an image proxy endpoint. Its primary function is to decouple the calling client from the source location of the image, enhancing security, centralized content management, and allowing for necessary header transformations (like setting cache control or ensuring correct CORS policies) before delivery.

**Key Functionality:**
1. Accepts a `url` query parameter.
2. Performs a GET request to the specified remote URL.
3. Reads the entire binary body of the remote response.
4. Re-routes the data to the client using the Fiber framework.
5. Handles basic error codes for missing parameters, invalid URLs, and fetch failures.

## 🛠️ Detail

### Component Structure

| Component | Description | Role |
| :--- | :--- | :--- |
| `ProxyHandler` | The struct containing the handler logic. | Encapsulation of proxy functionality. |
| `NewProxyHandler()` | Constructor function. | Standard initialization pattern. |
| `ProxyImage(c *fiber.Ctx)` | The core handler method. | Executes the HTTP fetching and proxying logic. |

### Execution Flow (`ProxyImage`)

1. **Input Validation:** Checks if the `url` query parameter is present. Returns 400 if missing.
2. **Request Setup:** Creates a new `http.Request` using the provided `targetURL`. Sets a mandatory `User-Agent` header (`LokaskBot/1.0`) for traceability/robot identification.
3. **Execution:** Uses a standard `http.Client` to execute the request (`client.Do(req)`). Handles connection failures (502).
4. **Data Capture:** Reads the entire response body into memory (`io.ReadAll`). This ensures the content can be processed and resent even if the initial stream is complex.
5. **Header Processing:**
    *   Retrieves the `Content-Type` from the remote response headers.
    *   Applies a fallback `image/jpeg` if the content type is missing.
    *   Sets critical proxy headers on the outgoing response: `Content-Type`, `Access-Control-Allow-Origin: *`, and `Cache-Control: public, max-age=86400`.
6. **Output:** Sends the captured binary data (`imgData`) to the client, matching the status code of the remote response.

### Code Flow Links

*   **[Image Proxy Logic Flow](../../handler/proxy.go#ProxyImage)** (Self-reference to demonstrate the full cycle)
*   **[Error Handling](../../utils/error.go):** *Links to standardized error response logic if implemented.*

## 💡 Note

*   **Efficiency Consideration:** Reading the entire body into memory (`io.ReadAll`) is simple and reliable for typical images, but for extremely large files (e.g., >100MB), streaming the data directly from `resp.Body` to the Fiber response writer would prevent potential memory exhaustion.
*   **Header Flexibility:** The current implementation hardcodes the cache control to `max-age=86400`. If source control logic suggests that the cache time should be dynamic or derived from the source's own headers, this section needs modification.

## 🚨 Warning (Critical & Tech Debt)

1. **Security (SSRF/Network):** This endpoint acts as a proxy and is highly susceptible to **Server-Side Request Forgery (SSRF)** attacks. An attacker could potentially provide internal IP addresses (e.g., `http://169.254.169.254/latest/meta-data/`) to exfiltrate internal cloud metadata or probe private networks.
    *   ***Mitigation Action:*** Implement strict network boundary checks (e.g., using an IP reputation or dedicated proxy IP list) to validate the `targetURL` before making the external request.
2. **Resource Management (Resource Limiting):** There is no rate limiting or resource usage capping. A denial-of-service (DDoS) attack using this endpoint could quickly exhaust bandwidth or system resources.
    *   ***Mitigation Action:*** Must integrate rate-limiting middleware (e.g., Redis-backed token bucket) at the router level.
3. **Timeouts:** The `http.Client` used currently has default timeouts. If the target server hangs or is slow, the handler will block indefinitely or until system default timeouts are hit.
    *   ***Mitigation Action:*** Explicitly configure the `http.Client` with defined timeouts (e.g., `http.Client{Timeout: 10 * time.Second}`).

---
**Dependencies/Components:** `net/http`, `io`, `github.com/gofiber/fiber/v2`
```