[⬅ Return to Main Compendium](../../README.md)

# File: `api.ts` - Core API Client Utility

**File Purpose:** This module encapsulates the primary API fetching logic (`fetchJson`) for client-side interactions, managing base URLs, token injection, and standardized error handling. It acts as the central gateway for all front-end requests.

## 🛡️ Security Verification Overview

This utility handles critical tasks like authentication token management and network requests. While the structure is clean, the reliance on `localStorage` for tokens represents a significant, inherent client-side security risk (XSS exposure). Furthermore, the logic for setting `Content-Type` when dealing with `FormData` is potentially flawed, leading to malformed API requests or incorrect server handling.

### 🚨 Vulnerability Summary & Ranking

| Element / Function | Vulnerable Aspect | Priority | Description |
| :--- | :--- | :--- | :--- |
| `localStorage.getItem("token")` | Token Storage/Exposure | **High** | Storing auth tokens in `localStorage` makes them highly susceptible to Cross-Site Scripting (XSS) attacks. |
| `fetchJson` (Headers logic) | `Content-Type` Mishandling | **Medium** | The logic manually sets `Content-Type: application/json` when it shouldn't (especially with `FormData`), which can break multipart form submissions. |
| `fetchJson` (Error Parsing) | Information Leakage | **Low** | While robust, the default error message (`API Error: ${res.statusText}`) might leak internal server details if not handled by the server. |
| `ApiError` class | None (Design) | N/A | Excellent use of custom error handling, promoting cleaner consumer code. |

***

## 📝 Detailed Analysis

### 🔵 Core Functionality

*   **`BASE_URL`:** Defines the root endpoint for all API calls, promoting maintainability.
*   **`ApiError`:** Custom error class for standardized handling of API failures, improving type safety and error clarity for consumers.
*   **`fetchJson<T>`:**
    1.  Retrieves the authentication token from `localStorage`.
    2.  Analyzes the `options` body to determine if it is a `FormData` object.
    3.  Constructs headers, injecting the `Authorization` Bearer token if available.
    4.  Performs the fetch request.
    5.  If the response status is not successful (`!res.ok`), it attempts to parse error details as JSON, falling back to an `ApiError` based on status text.
    6.  Returns the parsed JSON payload upon success.

### ⚙️ Technical Details & Flow

**A. Token Acquisition:**
The flow relies solely on `localStorage` for the token.
*   `const token = localStorage.getItem("token");`

**B. Header Construction:**
The logic attempts to detect the payload type to correctly set `Content-Type`.
*   If `FormData` is detected (`isFormData`), the system clears the JSON content type hint (`{...isFormData ? {} : { "Content-Type": "application/json" }}`).
*   If not `FormData`, it defaults to setting `Content-Type: application/json`.
*   The Bearer token is then added conditionally.

**C. Network Request:**
*   `await fetch(`${BASE_URL}${endpoint}`, { ...options, headers });`

***

## ⚠️ Security Warnings & Recommendations (MUST READ)

**1. 🛑 High Priority: XSS Risk via `localStorage` Token Storage**
*   **Issue:** Storing authentication tokens in `localStorage` is inherently dangerous. Any successful Cross-Site Scripting (XSS) attack on the client page grants the attacker immediate access to the token, allowing them to impersonate the user until the token expires or is manually revoked.
*   **Mitigation (Crucial):** Migrate token storage to secure, HttpOnly cookies. This prevents client-side JavaScript (even malicious scripts) from accessing the token, mitigating the vast majority of XSS-based theft attempts. The API backend must be configured to accept tokens from cookie headers.

**2. 🛠 Medium Priority: `Content-Type` Mismatch with `FormData`**
*   **Issue:** When a client uses `FormData`, the browser automatically sets the correct `Content-Type` boundary for `multipart/form-data`. By attempting to explicitly manage the headers, especially by potentially overriding existing header structures, or by simplifying the header object as done here, you risk sending incorrect or ambiguous `Content-Type` headers.
*   **Mitigation:** Simplify the header handling for `FormData` payloads. When `FormData` is used, *do not* specify the `Content-Type` in the header object, allowing the browser's native fetching mechanism to handle the boundary correctly.

**3. 🔍 Low Priority: Error Data Filtering (Backend Guardrail)**
*   **Issue:** The error parsing logic `await res.json().catch(() => null)` is good for resilience, but if the backend returns structured error payloads, ensure that only necessary, non-sensitive error codes or messages are returned to the client.
*   **Recommendation:** Implement robust backend validation to sanitize error responses and prevent information leakage (e.g., stack traces, database names, internal IP addresses) to the front end.

***

## 📚 Documentation Notes & Technical Debt

*   **Link to Token Management:** The token retrieval logic should be linked to the session or auth management files for architectural review: `../auth/sessionService.ts` (if such a service exists).
*   **Contextual Links:** If the API calls are specific to different modules, consider linking the calling file/module to this utility to trace usage: *e.g., For feature X requests, see also: `../components/FeatureX.tsx`*
*   **Typing Improvement:** The explicit casting `(headers as any)["Authorization"] = ...` is brittle. Consider using a dedicated helper function or library to ensure type safety when adding headers dynamically.

***

## 🔗 Cross-Reference Links

*   **Token Handling / State Management:** `../auth/apiAuth.ts` (Review token acquisition and storage methods).
*   **API Calling Context:** `../../README.md` (Back to main compendium).

***

### 🖼️ Flow Diagram (Conceptual)

*(Figure depicting the flow: Client $\rightarrow$ `fetchJson` $\rightarrow$ Token Check $\rightarrow$ Header Assembly $\rightarrow$ Fetch API $\rightarrow$ Error/Success Handling $\rightarrow$ Component)*