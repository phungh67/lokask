# README: Consultant Handler Module

This document provides a comprehensive summary and technical review of the `ConsultantHandler` module. This module serves as the primary API endpoint handler responsible for managing consultant profiles, listings, and associated media uploads within the application ecosystem.

## 🏗️ Overview

The `ConsultantHandler` implements the business logic layer for interacting with consultant data. It uses the **Repository pattern** (`*repository.ConsultantRepository`) to abstract database operations and a **File Storage interface** (`storage.FileStorage`) to manage media assets (e.g., cover images, gallery photos).

The module exposes several API endpoints (GET, PUT/PATCH) covering:
1. Retrieving a specific consultant profile by UUID.
2. Updating the profile information for a user.
3. Listing and filtering consultants (paginated list).
4. Fetching auxiliary data (Niches, Languages, Cities).
5. Handling media uploads, integrating both file storage and database updates.

### 🧩 Architectural Diagram Concept

A conceptual sequence diagram would illustrate the request flow:

**[User Request] $\rightarrow$ [Router] $\rightarrow$ [ConsultantHandler] $\rightarrow$ [Repo Layer] $\rightarrow$ [Database/Storage] $\rightarrow$ [Response]**

**(Figure Concept: A simple flow chart showing the request passing through the Handler to the Repository, interacting with both a 'Database' service and a 'Cloud Storage' service.)*

---

## 🔍 Detailed Analysis (System Design & Infrastructure)

### 1. Service Layer Responsibilities

The `ConsultantHandler` acts as the controller/service layer in a layered architecture. It handles:

*   **Input Validation:** Validating UUID formats (`uuid.Parse`), extracting parameters, and parsing request bodies (`c.BodyParser`).
*   **Security Context:** Retrieving and validating user identity (e.g., `c.Locals("user_id")`) to ensure proper authorization scope before performing updates or uploads.
*   **Business Flow Orchestration:** Coordinating actions across multiple components (e.g., for `UploadMedia`, it must first upload the file to storage, then update the database with the resulting object key).
*   **Error Handling:** Mapping internal errors (database errors, file system errors) into standardized HTTP status codes (400, 401, 404, 500) with useful client feedback.

### 2. Core Functionality Breakdown

| Method | Endpoint/Function | Purpose | Key Infrastructure Interactions | Status Codes Handled |
| :--- | :--- | :--- | :--- | :--- |
| `GetProfile` | `GET /api/v1/consultants/:id` | Retrieves a profile by public UUID. | `Repository` (Read) | 400, 500 |
| `UpdateProfile` | `PATCH /api/v1/consultants` | Updates the logged-in user's profile. | `Repository` (Write), Auth Context | 401, 400, 500 |
| `List` | `GET /api/v1/consultants` | Filters and paginates the consultant list. | `Repository` (Query/Filter) | 500 |
| `GetConsultantByUserID` | `GET /api/v1/users/:id` | Checks if a user is a consultant. | `Repository` (Read) | 400, 404, 200 |
| `GetNiches`, `GetLanguages`, `GetCities` | Auxiliary Endpoints | Fetch predefined reference data (Niches, Languages, Cities). | `Repository` (Read, Static Data) | 500 |
| `UploadMedia` | `POST /api/v1/media` | Handles file upload and associated metadata storage. | `FileStorage` (Cloud), `Repository` (Write) | 400, 500 |

### 3. Security Engineering Focus

*   **Principle of Least Privilege (PoLP):** The handler correctly uses `c.Locals("user_id")` for updates, ensuring a user can only modify their own profile, rather than modifying an arbitrary ID passed in the payload.
*   **Input Validation:** Mandatory validation of UUIDs prevents basic injection or malformed parameter attacks.
*   **Role Check:** The `GetConsultantByUserID` function implicitly performs a functional role check: if the user exists but isn't a consultant, it returns a 404, providing controlled failure feedback to the client.
*   **Storage Segregation:** Media uploads use structured object keys (`covers/%s/%s`, `galleries/%s/%s`), which is critical for managing permissions and cleanup in cloud storage buckets.

---

## 💡 Notes (Best Practices & Improvements)

1. **Centralized Error Formatting:** While error handling is generally good, the different JSON structures for errors (e.g., `{"error": "...", "details": "..."}` vs `{"error": "...", "message": "..."}`) are inconsistent. Implementing a standardized global error response struct (e.g., `{"status": 400, "code": "INVALID_INPUT", "message": "..."}`) would improve client robustness.
2. **API Versioning:** The current endpoints use `/api/v1/`. This is good practice. Consider adding explicit routing mechanisms (e.g., passing the version in the request header) if multiple major API versions are anticipated.
3. **Data Transfer Objects (DTOs):** For public endpoints (like `GetProfile`), it is highly recommended to use DTOs instead of passing the raw `domain.ConsultantProfile` object directly. This decouples the API contract from the database schema, allowing schema changes without breaking the public API.
4. **Pagination Consistency:** The `List` endpoint handles pagination well. Ensure all other list-type endpoints (if created) follow the same pattern (page number, limit, total count) for consistency.

---

## ⚠️ Warning (Areas for Completion/Review)

1. **HTTP Method Specification:** The documentation should explicitly state the required HTTP methods for each function (e.g., `GetProfile` must be called with `GET` and `UpdateProfile` with `PATCH`).
2. **Error Logging Detail:** When returning a 500 error in `GetProfile` and `UpdateProfile`, the handler logs the error (`log.Printf(...)`) but then returns a generic message to the client (`"details": "Check backend terminal..."`). For critical production systems, a correlation ID (request ID) should be generated and returned to the client alongside the error to allow support staff to trace the failure in the production logs.
3. **Concurrency in UploadMedia:** While the code assumes synchronous database writes, if multiple users upload media simultaneously, the repository methods (`UpdateCoverImage`, `AddGalleryImage`) must be confirmed to handle potential race conditions (e.g., using transactions or optimistic locking).
4. **Interface Dependency Injection:** The use of `*repository.ConsultantRepository` and `storage.FileStorage` is excellent. Ensure these dependencies are mocked effectively during unit testing to prevent coupling to external services (database, cloud storage).

---

## 🛠️ Technical Checklist

### Dependencies & Interfaces

*   **Dependencies:** `github.com/gofiber/fiber/v2` (implied router framework).
*   **Dependencies:** `storage.Storage` interface (critical for testing and decoupling storage logic).
*   **Dependencies:** `repository.Repository` interface (critical for decoupling data access logic).

### Testing Considerations

*   **Unit Tests:** Must mock the storage and repository layers to test handler logic in isolation.
*   **Integration Tests:** Should spin up a temporary database container to verify end-to-end flows (e.g., successful save -> successful retrieval).
*   **Edge Case Testing:** Test empty results, invalid IDs, and unauthorized access attempts (requires adding authentication middleware).