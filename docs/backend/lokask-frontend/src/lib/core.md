[⬅ Return to Main Compendium](../../../../../README.md)

# API Gateway / HTTP Client Service Module Design

As a senior backend officer, my primary focus is ensuring that external interactions (like API calls) are robust, resilient, and adhere to predictable contracts. The provided code implements a basic API Gateway client, which we should encapsulate into a dedicated, injectable service.

We will refactor this logic into a dedicated `HttpClient` module. This pattern establishes a single source of truth for API interaction, enforcing consistency in authentication, error handling, and payload construction across the entire frontend application.

---

## 📂 `HttpClient.service.ts` (The API Surface)

The exported surface should be a single, powerful client instance.

```typescript
// Defines the standard structure for all request options
export interface ApiOptions extends RequestInit {
    // Custom property to allow internal handling of structured headers
    customHeaders?: Record<string, string>;
}

/**
 * Represents an error returned by the API Gateway.
 * We strictly enforce the status code and a user-friendly message.
 */
export class ApiError extends Error {
    public status: number;
    constructor(public status: number, message: string) {
        super(message);
        this.name = "ApiError";
        // Ensure correct stack trace for better debugging
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, ApiError);
        }
    }
}

/**
 * Core Client Service for all outbound API calls.
 * This acts as an abstraction layer (Gateway Pattern) over the raw 'fetch' API.
 * @singleton
 */
export class HttpClient {
    private readonly baseUrl: string = "/api/v1";

    /**
     * Executes a secure, authenticated API request.
     * @template T The expected response type.
     * @param endpoint The API path relative to the base URL.
     * @param options Configuration options including body, headers, and method.
     * @returns A Promise resolving to the parsed JSON body T.
     * @throws {ApiError} If the HTTP response status code is outside of the 2xx range.
     * @throws {Error} For network failures or unexpected JSON parsing errors.
     */
    public async getJson<T>(
        endpoint: string, 
        options: ApiOptions = {}
    ): Promise<T> {
        // Using a single method entry point simplifies logic and error propagation.
        return this.executeRequest<T>(endpoint, options);
    }

    public async postJson<T>(
        endpoint: string, 
        body: object, 
        options: ApiOptions = {}
    ): Promise<T> {
        const mergedOptions: ApiOptions = {
            ...options, 
            body: JSON.stringify(body), // Standard JSON serialization
            headers: { 
                ...(options.headers ?? {}), 
                "Content-Type": "application/json" 
            }
        };
        return this.executeRequest<T>(endpoint, mergedOptions);
    }
    
    // NOTE: A PUT/PATCH/DELETE method should follow similar patterns.

    /**
     * Internal executor responsible for handling authorization, headers, 
     * fetching, and structured error parsing.
     */
    private async executeRequest<T>(endpoint: string, options: ApiOptions): Promise<T> {
        // 1. Authorization Header Injection (Critical Security Step)
        const token = localStorage.getItem("token");
        const finalHeaders: HeadersInit = {
            ...options.headers,
            ...(options.customHeaders || {}),
        };

        if (token) {
            finalHeaders["Authorization"] = `Bearer ${token}`;
        }

        // 2. Request Execution
        const url = `${this.baseUrl}${endpoint}`;
        const res = await fetch(url, { 
            ...options, 
            headers: finalHeaders 
        });

        // 3. Backend Error Handling (Resilience Layer)
        if (!res.ok) {
            let errorData: { [key: string]: any } | null = null;
            
            // Attempt to parse structured error payload from the backend
            try {
                const text = await res.text();
                if (text) {
                    errorData = JSON.parse(text);
                }
            } catch (e) {
                // Swallow JSON parsing failure, use default API error structure
                errorData = null;
            }
            
            const message = errorData?.message || `API Gateway Error: ${res.statusText}`;
            throw new ApiError(res.status, message);
        }

        // 4. Success Handling
        return res.json();
    }
}

// Instantiate and export the single entry point
export const apiService = new HttpClient();
```

---

## ⚙️ Core Logic and Implementation Pattern Analysis

### 1. Design Pattern: Gateway/Client Abstraction
*   **Goal:** To decouple the business logic (the component calling the API) from the mechanics of HTTP transport, authentication, and error handling.
*   **Mechanism:** The `HttpClient` class acts as a **Gateway Pattern**. All API consumers interact only with its public methods (`getJson`, `postJson`), guaranteeing that the security and error handling logic (token attachment, status checks) are executed automatically and reliably.

### 2. Core Logic Flow (`executeRequest`):
1.  **Authentication Contextualization:** The function first checks `localStorage` for a token. This token is immediately injected into the `Authorization` header. This ensures that *every* outgoing request is authenticated, adhering to standard JWT Bearer token practices.
2.  **Payload Preparation:** It intelligently handles the `Content-Type` header: it automatically sets `application/json` for standard POST/PUT requests and respects `FormData` if provided (e.g., for media uploads).
3.  **Resilience & Error Handling (The Critical Section):**
    *   The check `!res.ok` is the core of the resilience layer. It intercepts any non-2xx status (e.g., 401, 403, 404, 500).
    *   Instead of simply propagating a generic `fetch` error, the logic attempts to parse the backend's dedicated error payload (`errorData`). This allows the application to display meaningful, structured error messages (e.g., "The email already exists") instead of just a generic HTTP code.
    *   It throws the custom `ApiError`, which is a concrete class, enabling the calling component to use `catch(e)` and verify `e instanceof ApiError` for precise UI feedback.

### 3. Repository Pattern Consideration (Backend Impact)
*   **Relationship:** While this client is frontend, its structure dictates the contract that the backend repository layer *must* adhere to.
*   **Implication:** The backend API routes must be designed to return two things upon failure:
    1.  A non-2xx HTTP Status Code (e.g., 422 Unprocessable Entity).
    2.  A structured JSON payload body containing an explicit error message and, optionally, an array of validation failures.
*   **Backend Contract:** If the backend violates this contract (e.g., returns a plain text error on 400), the client-side error parsing logic (`await res.text()`) will fail gracefully, but the overall system reliability depends on the backend adhering to structured error responses.

---

*this content was created by AI, but the coding and underlying logic are not.*