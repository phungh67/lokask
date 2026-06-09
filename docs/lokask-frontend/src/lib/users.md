# API Utility Layer - `api-client.ts`

## 🗺️ Overview

This module serves as a dedicated client layer responsible for abstracting core API interactions required by the application. It encapsulates domain-specific logic for fetching reference data (e.g., city options) and handling complex data uploads, such as user avatars.

By centralizing these network calls, the module ensures type safety, consistent error handling, and decouples the calling components from the raw network implementation details. This approach significantly improves maintainability and testability within the client application's architecture.

***

## ⚙️ Detail & Functionality Reference

### 🏛️ Data Structure Definitions

#### `CityOption`
Defines the standardized data structure used for selecting location options, ensuring consistency across the application when displaying dropdowns or forms.

| Property | Type | Description |
| :--- | :--- | :--- |
| `id` | `number` | Unique identifier for the city. |
| `name` | `string` | The common name of the city. |
| `country` | `string` | The country the city belongs to. |

### 🌐 API Functions

#### 1. `getCities(): Promise<CityOption[]>`

Retrieves a comprehensive list of available city options from the backend service.

*   **Endpoint:** `/cities`
*   **Method:** GET
*   **Success Response:** An array conforming to the `CityOption` interface.
*   **Error Handling:** If the network request or data parsing fails, the function gracefully returns an empty array (`[]`), preventing application crashes due to missing data.

#### 2. `uploadAvatar(file: File): Promise<any>`

Handles the complex task of uploading a binary file (like a profile picture) to the dedicated user resource endpoint.

*   **Endpoint:** `/users/avatar`
*   **Method:** POST
*   **Input:** A standard JavaScript `File` object (e.g., obtained from an `<input type="file">`).
*   **Mechanism:** The function utilizes `FormData` to correctly format the request body, which is critical for sending multi-part binary data over HTTP POST, as opposed to standard JSON payloads.

***

## 🗒️ Technical Notes & Design Decisions

### 📚 Infrastructure & Dependency Management

1.  **`fetchJson` Dependency:** This module is heavily dependent on a utility function `fetchJson` (imported from `./core`). It is assumed this function handles underlying mechanisms such as base URL construction, request headers (e.g., `Authorization` tokens), and fundamental JSON parsing.
2.  **Type Safety:** The use of TypeScript interfaces (`CityOption`) enforces rigid data contracts, significantly reducing runtime type errors.
3.  **API Abstraction:** By keeping the full API path (`/cities`, `/users/avatar`) within this module, any required endpoint changes can be contained to a single file, adhering to the Single Responsibility Principle (SRP).

### 🚀 Architectural Consideration (Performance)

*   **Caching:** For `getCities()`, if the city data is static or rarely changes, consider implementing an in-memory cache or utilizing a service layer cache (like Redis) on the backend to minimize redundant API calls and improve overall perceived performance.

***

## ⚠️ Warnings & Security Considerations

**🚨 Security Engineer Review:** The file upload mechanism is the highest risk component in this module and requires strict backend enforcement.

1.  **Input Validation (Mandatory):** The client code assumes the input `File` is valid, but the backend *must* perform exhaustive validation:
    *   **MIME Type Check:** Only allow specific file types (e.g., `image/jpeg`, `image/png`). Do not trust the client-side `File` object.
    *   **Size Limit:** Enforce a maximum file size (e.g., 5MB) on the server side to mitigate resource exhaustion attacks (Denial of Service via large payloads).
2.  **Cross-Site Scripting (XSS):** The backend must sanitize the uploaded image data and its metadata before storage or serving to prevent attackers from injecting malicious content.
3.  **Authentication:** Both endpoints (`/cities` and `/users/avatar`) must be protected by robust authentication and authorization checks to ensure only logged-in, permitted users can access or modify resources.
4.  **Error Handling Granularity:** While `getCities()` provides a fallback `[]`, the error handling for `uploadAvatar` is currently minimal. The implementation should wrap the call in a `try...catch` block to provide meaningful error feedback (e.g., "Failed to upload avatar: Invalid file format").

***

## 🖼️ Generated Figure: API Flow Diagram

This figure illustrates the two primary data flows managed by this client module.

```mermaid
graph TD
    A[Component Layer] -->|1. Request List| B(getCities);
    B -->|GET /cities| C[API Gateway / Backend];
    C -->|Returns JSON Array| B;
    B -->|Success: CityOption[]| A;

    D[Component Layer] -->|2. Select File| E(uploadAvatar);
    E -->|Construct FormData| F[Client HTTP Request];
    F -->|POST /users/avatar| C;
    C -->|Processes & Stores File| G(Storage Backend);
    C -->|Returns Status/URL| E;
    E -->|Success: Confirmation| D;
```