# 🖼️ User Avatar Upload Handler (`handler/user_handler.go`)

This document provides a comprehensive technical summary and documentation for the `UserHandler` component, responsible for managing user profile image uploads within the application.

---

## 🚀 Overview

The `UserHandler` implements the business logic for allowing a user to upload and update their profile avatar. It acts as an intermediary layer, coordinating file handling with external storage services and persistence with the internal data repository. The process flow involves extracting the user's ID from the request context, receiving the file via the Fiber framework, uploading the file to designated cloud storage, and finally updating the user record in the database with the resulting file URL.

**Component Responsibility:**
*   Handling HTTP POST requests for file uploads.
*   Validating and retrieving the associated `user_id`.
*   Orchestrating the file upload process (Request $\rightarrow$ Storage $\rightarrow$ Database).

## 💻 Detail Analysis

### 📚 Technical Structure

The handler uses Dependency Injection (DI) pattern, requiring instances of `repository.UserRepository` and `storage.FileStorage` upon initialization.

**Key Structures:**

```go
type UserHandler struct {
	Repo    *repository.UserRepository
	Storage storage.FileStorage
}
```

**Primary Method: `UploadAvatar(c *fiber.Ctx) error`**

| Step | Action | Dependency Used | Status Codes Handled |
| :--- | :--- | :--- | :--- |
| 1. **Context Retrieval** | Extract `user_id` from `c.Locals("user_id")`. | `github.com/google/uuid` | N/A (Assumes context is set) |
| 2. **File Extraction** | Get the file header using `c.FormFile("avatar")`. | `github.com/gofiber/fiber/v2` | 400 Bad Request (No file uploaded) |
| 3. **File Upload** | Call `h.Storage.UploadProfilePicture` to store the file and receive a URL. | `storage.FileStorage` | 500 Internal Server Error (Storage failure) |
| 4. **DB Update** | Call `h.Repo.UpdateAvatar` to persist the new URL for the user. | `repository.UserRepository` | 500 Internal Server Error (DB failure) |
| 5. **Response** | Return the successful `avatar_url` and confirmation message. | `github.com/gofiber/fiber/v2` | 200 OK |

### 🌐 System Workflow Diagram

```mermaid
graph TD
    A[Client Request: POST /upload/avatar] --> B{UserHandler.UploadAvatar};
    B --> C{Extract user_id from Context};
    C --> D{Retrieve File Header ("avatar")};
    D -- Success --> E[Storage Service: UploadProfilePicture];
    D -- Error (Missing file) --> F[Return 400: No file uploaded];
    E -- Success (URL generated) --> G[Repository Service: UpdateAvatar(userID, URL)];
    E -- Error (Storage failed) --> H[Return 500: DB uploaded failed];
    G -- Success --> I[Log Successful Upload];
    G -- Error (DB failed) --> J[Return 500: Failed to update profile];
    I --> K[Return 200: Success];
```

### 🛠️ Dependencies and Interfaces

| Dependency | Type/Interface | Function | Purpose |
| :--- | :--- | :--- | :--- |
| `storage.FileStorage` | Interface | `UploadProfilePicture(header, userID)` | Handles physical storage (e.g., AWS S3, MinIO). Returns the accessible URL. |
| `repository.UserRepository` | Interface | `UpdateAvatar(userID, url)` | Handles database persistence. Writes the new profile URL into the user table. |
| `fiber.Ctx` | Fiber Context | `c.Locals()`, `c.FormFile()` | Provides access to request metadata (user ID) and multipart form data (the file). |

## 🧠 Knowledge Base Integration

### System Design
The handler adheres to the **Controller/Service pattern**. It is deliberately decoupled from infrastructure concerns (Storage, DB) by depending on interfaces (`storage.FileStorage`, `repository.UserRepository`). This makes the system highly testable, as mocks can be easily injected for unit testing.

### Infrastructure & Cloud Components
The use of `storage.FileStorage` abstracts the physical location of the file. In a cloud environment, this component would typically interface with:
1.  **Amazon S3:** Highly scalable object storage.
2.  **Google Cloud Storage (GCS):** Alternative object storage solution.
3.  **MinIO:** Often used for local testing parity with cloud services.

The returned `url` must be a publicly accessible, immutable, and correctly signed URL (if using signed URLs for security).

### Security Engineering
1. **Authentication/Authorization:** The handler relies on `c.Locals("user_id")`, implying that the middleware *before* this handler has already successfully authenticated the user and injected their ID into the context.
2. **Input Validation:** Basic file existence validation is present (checking `c.FormFile`).
3. **Security Risk:** File size and MIME type validation are currently missing. Malicious files could overload storage or introduce vulnerabilities if not sanitized at the storage layer.

## 📝 Notes & Warnings

### ⚠️ Warnings (Areas Needing Immediate Attention)

1. **Error Handling for UUID Parsing:** The line `userID, _ := uuid.Parse(userIDStr)` ignores potential parsing errors. If `c.Locals("user_id")` contains an invalid UUID string, the code will proceed using a zero UUID, leading to silent data corruption or incorrect user updates. **Action:** Implement explicit error checking for `uuid.Parse`.
2. **Missing Input Validation:** The handler does not validate the uploaded file's actual size, dimensions, or MIME type. This is a critical security gap. **Action:** Enforce file size limits (e.g., max 5MB) and implement client/server-side MIME type checks.
3. **Error Mapping (DB Failure):** When `h.Repo.UpdateAvatar` fails, the system returns a generic 500 error. The calling function should categorize the database error (e.g., concurrency failure, constraint violation) to provide more meaningful feedback to the client.

### 💡 Notes (Enhancements & Improvements)

1. **Concurrency:** Consider implementing a retry mechanism or a transaction scope if the `Storage` and `Repo` operations are critical and should fail atomically.
2. **Cleanup Logic:** If the database update fails after a successful upload to storage, the allocated file URL/object must be deleted from the cloud storage bucket to prevent orphaned data and unnecessary costs.
3. **Idempotency:** The current flow is not inherently idempotent. If the client retries the request, it will simply overwrite the URL. This is acceptable for avatar updates, but document this behavior clearly.