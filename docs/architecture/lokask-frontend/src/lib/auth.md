[⬅ Return to Main Compendium](../../../../../README.md)

As a Senior Software Solution Architect, I have reviewed the provided client-side API interaction module. This module currently acts as a service layer responsible for all authentication network calls.

While the module is functional, from an architectural standpoint, we need to define clear boundaries, introduce robust patterns for handling external dependencies (like networking and state), and significantly improve the encapsulation to ensure resilience and maintainability as the application grows.

Here is the documentation of the overarching design patterns and system boundaries.

---

## 🏛️ Architectural Design Patterns

The system should adopt several patterns to ensure clean separation of concerns, predictable state management, and robust error handling.

### 1. Repository Pattern (Conceptual)
*   **Goal:** Isolate the business logic (the application layer) from the specific mechanism of data retrieval (the API calls).
*   **Implementation:** The existing file functions are essentially a "Service Client" layer. We should encapsulate these into a dedicated `AuthRepository` (or `AuthApiGateway`).
*   **Benefit:** If the backend API moves from REST to GraphQL, or if we switch from `fetchJson` to a specialized HTTP client library, only the implementation within the Repository needs to change. The rest of the application logic remains untouched.

### 2. Factory Pattern (Data Construction)
*   **Goal:** Centralize the complex process of constructing request bodies.
*   **Problem Area:** The `registerTraveller` and `registerConsultant` functions currently duplicate the structure building (`{ full_name: data.fullName, email: data.email, ... }`).
*   **Solution:** Implement a `PayloadFactory` or a `AuthPayloadBuilder`. This builder takes the raw data objects and generates the correct, highly typed JSON body required by the specific endpoint, thereby preventing typos or inconsistencies in the request payload.

### 3. Adapter Pattern (The Fetch Layer)
*   **Goal:** Standardize interaction with external, non-application components (e.g., the networking layer, the backend schema).
*   **Concept:** The `fetchJson` function acts as an internal adapter. If the underlying network mechanism changes (e.g., implementing interceptors for OAuth tokens or handling custom headers), the adapter layer shields the calling function from these changes.
*   **Refinement:** This adapter must be responsible for **all** error mapping (NetworkError $\rightarrow$ `ClientError` $\rightarrow$ `HttpError`).

### 4. State Pattern / Dependency Injection (Application Layer)
*   **Goal:** Decouple the calling component (e.g., a Login Component in React) from the synchronous execution of the service layer.
*   **Recommendation:** The application component should **inject** the `AuthRepository` interface, rather than calling the functions directly. This makes unit testing trivial, as a mocked repository can be provided during testing.

---

## 🌐 System Boundaries and Layers

We must define distinct boundaries to enforce modularity and clear responsibility.

| Boundary / Layer | Responsibility | Components Involved | Data Flow Control |
| :--- | :--- | :--- | :--- |
| **1. Presentation Layer** (UI Components) | Displays state, captures user input. **Knows nothing about API endpoints.** | Login Form, Register Form, Navigation Components. | Calls methods on the `AuthService`. |
| **2. Service Layer** (The Module Provided) | Orchestrates the business workflow (e.g., "User tries to log in"). Calls the Repository. Handles local state processing. | `AuthService.loginUser()` | Coordinates workflow. |
| **3. Repository/Gateway Layer** (Proposed `AuthRepository`) | Translates business domain objects into network-specific payloads. Calls the Adapter. Handles API contracts. | `registerTraveller()`, `login()` | Interacts solely with the Network Adapter. |
| **4. Network Adapter Layer** (`fetchJson` / Core) | Handles all HTTP mechanics: request formation, network transport, JSON serialization/deserialization, and global error trapping. | `fetchJson` | Deals only with raw `fetch` API calls. |

**Key Improvement Focus:** The existing code resides too close to the network layer. By creating an explicit **Service Layer** wrapper over this module, we improve testability and allow for business logic checks (e.g., "Is the user already registered before attempting a sign-up?").

---

## 🛡️ Resilience and Robustness Strategies

Given this is an authentication module, resilience against network failure, incorrect data, and unexpected server responses is paramount.

### 1. Defensive Programming (Input Validation)
*   **Strategy:** All public functions must accept highly validated data.
*   **Implementation:** Introduce a helper that validates `RegisterData` (e.g., ensuring email format validity, checking minimum password length) **before** invoking the repository/API call. This prevents unnecessary network traffic for invalid data.

### 2. Circuit Breaker Pattern (System Level)
*   **Strategy:** If the authentication backend endpoint (`/auth/login`) starts failing repeatedly (e.g., 5 times in 30 seconds), the client must temporarily stop calling it.
*   **Benefit:** Prevents resource exhaustion on both the client and the server, and allows the server time to recover.
*   **Implementation Note:** This pattern should wrap the `AuthRepository` class, not individual functions.

### 3. Exponential Backoff and Retry Mechanism (Network Level)
*   **Strategy:** For transient network failures (e.g., timeout, 503 Service Unavailable), the client should not fail immediately. It should retry the request with increasing delays.
*   **Implementation:** This logic belongs within the Network Adapter (`fetchJson`), specifically designed to handle temporary errors while respecting a maximum retry limit (e.g., 3 attempts).

### 4. Comprehensive Error Mapping
The `fetchJson` utility must be enhanced to handle the following explicit error categories and map them into a single, consumable application exception class:

| HTTP Status Code | Error Type | Recommended Action |
| :--- | :--- | :--- |
| $400$ Bad Request | `ValidationError` | Display specific field errors to the user. |
| $401$ Unauthorized | `AuthenticationError` | Clear local tokens/state, redirect to login. |
| $403$ Forbidden | `AuthorizationError` | Notify user of insufficient permissions. |
| $429$ Too Many Requests | `RateLimitError` | Inform user of rate limit and expected reset time. |
| $5xx$ Server Error | `ServiceUnavailableError` | Trigger Retry/Circuit Breaker logic. |

---

### Summary of Required Code Refactoring (Architectural View)

1.  **Create `AuthRepository.ts`:** This class encapsulates the current functions, making it injectable.
2.  **Implement `AuthPayloadBuilder.ts`:** Utility class to standardize payload creation.
3.  **Refine `fetchJson`:** Upgrade to handle retries, circuit breaker logic, and comprehensive error mapping.
4.  **Introduce `AuthService.ts`:** This high-level service uses the `AuthRepository` and handles local business logic and state management before interacting with the network.

***
*this content was created by AI, but the coding and underlying logic are not.*