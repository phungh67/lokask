# 📁 API Client Core Module (`apiClient.ts`)

## 🌟 Overview

This module serves as the centralized and robust API communication layer for the front-end application. Its primary purpose is to standardize all network requests, abstracting away repetitive logic such as token handling, constructing base URLs, and advanced error catching.

By using this module, development teams can ensure consistent authentication headers, reliable JSON parsing, and uniform error handling across the entire codebase, regardless of the specific API endpoint or data format being exchanged.

**Knowledge Domain:** System Design, Infrastructure, Cloud Components, Security Engineering

## 📐 Technical Details

### 🧩 Components

#### 1. `BASE_URL` (Constant)

*   **Type:** `string`
*   **Value:** `/api/v1`
*   **Description:** Defines the root endpoint for all API calls. This allows the API version or base domain to be changed in a single location.

#### 2. `ApiError` (Custom Class)

*   **Inherits from:** `Error`
*   **Properties:**
    *   `status` (`number`): The HTTP status code received from the server (e.g., 401, 404).
    *   `message` (`string`): A descriptive message about the failure.
*   **Purpose:** Provides a predictable and structured way to throw API-related exceptions, allowing calling functions to catch specific API failures rather than generic network errors.

#### 3. `fetchJson<T>(endpoint: string, options?: RequestInit): Promise<T>` (Core Function)

This asynchronous, generic function is responsible for executing the API call.

**Parameters:**

| Parameter | Type | Description | Required |
| :--- | :--- | :--- | :--- |
| `endpoint` | `string` | The specific API path (e.g., `users/profile`). | Yes |
| `options` | `RequestInit` | Standard fetch options (e.g., `method`, `body`, `headers`). | No |

**Core Logic Flow:**

1.  **Token Retrieval:** Attempts to read the authentication token from `localStorage`.
2.  **Content-Type Handling:** Detects if the request body is an instance of `FormData` (indicating a file upload).
    *   If `FormData`, the `Content-Type` header is omitted or handled by the browser to allow multiple content types.
    *   Otherwise, `Content-Type: application/json` is explicitly set.
3.  **Header Construction:** Combines user-provided headers (`options.headers`) with the necessary `Authorization` header.
    *   If a token exists, the header `Authorization: Bearer [token]` is added.
4.  **Execution:** Performs the actual `fetch` request to `${BASE_URL}${endpoint}`.
5.  **Success Handling:** If `res.ok` (status 200-299), the response body is parsed as JSON and returned.
6.  **Error Handling:**
    *   If `!res.ok`, the function attempts to parse the error response body as JSON.
    *   If JSON parsing fails, a standard `ApiError` is thrown using the status code and `res.statusText`.

### 📝 Usage Example (Conceptual)

```typescript
import { fetchJson, ApiError } from './apiClient';

// Example 1: Simple GET request
async function getUserProfile(userId: string) {
    try {
        const user = await fetchJson<User>(`users/${userId}`);
        return user;
    } catch (e) {
        if (e instanceof ApiError) {
            console.error(`API Error (${e.status}): ${e.message}`);
        } else {
            console.error("Network failure:", e);
        }
    }
}

// Example 2: File Upload (Requires FormData)
async function uploadMedia(file: File) {
    const formData = new FormData();
    formData.append("mediaFile", file);
    
    try {
        const result = await fetchJson<UploadResult>("media/upload", {
            method: 'POST',
            body: formData
        });
        return result;
    } catch (e) {
        // Handle upload error
    }
}
```

## ⚙️ Development Notes

*   **Consistency:** This module enforces a single point of truth for API access, significantly reducing boilerplate code and improving maintainability.
*   **Generics:** The use of generics (`<T>`) ensures compile-time type checking for the expected response structure, improving developer safety.
*   **FormData Detection:** The logic specifically checking for `FormData` is critical for supporting file uploads without breaking the standard JSON content-type convention.

## ⚠️ Warnings and Technical Debt

**Security Risk (Critical): Local Storage Token Storage**
Using `localStorage` to store authentication tokens is highly vulnerable to Cross-Site Scripting (XSS) attacks. If any part of the front-end application is compromised by XSS, the attacker can easily read the token and hijack the user session.
**Recommendation:** Migrate token handling to secure, HttpOnly cookies, or utilize a short-lived token approach combined with a secure refresh token mechanism.

**Type Safety Concern: Header Casting**
The header assignment `(headers as any)["Authorization"] = ...` forces a type cast (`as any`). While functional, this sacrifices type safety.
**Recommendation:** Refactor the header construction logic to use a more strictly typed mechanism if TypeScript definitions allow, or ensure the type assertion is clearly documented and justified.

**API Error Parsing Robustness:**
The error handling relies on `await res.json().catch(() => null)` which is robust, but if the API returns a non-JSON payload (e.g., plain text or HTML error pages) on failure, the error capture mechanism might fail gracefully but silently lose useful context.
**Recommendation:** Consider adding a fallback to read the error body as plain text *before* attempting JSON parsing to capture debugging information.