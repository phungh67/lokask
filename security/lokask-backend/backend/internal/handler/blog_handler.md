# 📂 Blog Handler (`handler/blog.go`) Verification Report

[⬅ Return to Main Compendium](../../README.md)

---

## 💡 Overview

This handler package, `handler`, implements the core HTTP logic for managing blog posts (CRUD operations). It utilizes the `fiber` framework for request handling, coordinates with the `repository` layer for database interactions, and the `storage` service for handling file uploads (specifically cover images).

The handler assumes that user identification (`user_id`) has already been processed and injected into the request context via middleware. It handles data extraction from form values and query parameters.

**Related Files/Logic:**

*   [**Domain Model**](../../internal/domain) - Defines the `Blog` structure.
*   [**Repository Layer**](../../internal/repository) - Handles persistence (CRUD operations).
*   [**Storage Service**](../../internal/storage) - Manages physical file uploads.
*   [**Middleware Link**](../../middleware/auth) - *Assumed* middleware responsible for setting `user_id` in `c.Locals()`.

---

## 📝 Detail Analysis

### 🟢 `Create(c *fiber.Ctx)`

*   **Function:** Handles the creation of a new blog post.
*   **Flow:** Retrieves `user_id` from context $\rightarrow$ Extracts text fields (`title`, `content`, etc.) $\rightarrow$ Attempts file upload (`cover_image`) $\rightarrow$ Constructs `domain.Blog` object $\rightarrow$ Persists object via `h.Repo.Create()`.
*   **Key Logic:** The file upload process is critical here, as it involves an external storage dependency. Input fields are basic string extractions, requiring comprehensive validation.

### 🟡 `List(c *fiber.Ctx)`

*   **Function:** Retrieves a list of blog posts with optional filtering.
*   **Flow:** Reads filtering criteria (`city`, `country`, `author_id`) from query parameters $\rightarrow$ Constructs `repository.BlogFilter` object $\rightarrow$ Calls `h.Repo.List()` $\rightarrow$ Returns JSON array of blogs.
*   **Key Logic:** Input validation is limited to type checking (e.g., UUID for `author_id`), but sanitation for string content is absent.

### 🔵 `Get(c *fiber.Ctx)`

*   **Function:** Retrieves a single blog post by its unique ID.
*   **Flow:** Extracts ID from URL parameters $\rightarrow$ Validates ID format (UUID) $\rightarrow$ Calls `h.Repo.GetByID()` $\rightarrow$ Returns single blog object.
*   **Key Logic:** Uses UUID parsing which is robust against simple string injections, but lacks authorization checks (can any user view any blog?).

---

## 🚨 Security Vulnerability Report

| Function/Object | Vulnerable Component | Vulnerability | Priority | Details & Remediation |
| :--- | :--- | :--- | :--- | :--- |
| `Create` | `h.Storage.UploadBlogCover` | **Unvalidated File Upload (RCE/DDoS)** | **High** | No validation on file type (MIME/extension), size, or content. An attacker could upload malicious executables or massive files. **Remediation:** Implement strict allow-listing of MIME types and enforce size limits in the `storage` service. |
| `Create` | `title`, `content`, etc. | **Lack of Sanitization (XSS)** | **High** | Input values are passed directly into the `domain.Blog` object and eventually to the database. If the database allows HTML/rich text and the frontend renders it unsafely, it leads to Stored XSS. **Remediation:** Sanitize all user inputs (HTML/script tags) before assigning them to the domain model. |
| `List` | `c.Query(...)` $\rightarrow$ `h.Repo.List()` | **Injection Risk (SQL/NoSQL)** | **Medium** | Filtering parameters are passed directly to the repository layer. If `h.Repo.List` builds queries using string concatenation instead of parameterized queries, it risks injection. **Remediation:** Ensure all database interaction in the `repository` layer uses prepared statements or ORM input binding. |
| `Get`, `Create`, `List` | All Endpoints | **Missing Authorization (Horizontal/Vertical)** | **High** | The code assumes that simply being authenticated is enough. It lacks checks for ownership (e.g., Can a user read a private blog?) or role-based access control (RBAC). **Remediation:** Implement dedicated middleware checks *before* handler logic executes, checking if `user_id` is authorized to access the requested resource or perform the action. |
| `Create` | `err.Error()` | **Information Disclosure** | **Low** | Returning raw error details (`"detail": err.Error()`) in the JSON response can leak internal information (DB connection strings, library errors, stack traces). **Remediation:** Catch specific errors in the handler and return generic, non-informative error messages to the client. |
| `List` | Global | **Lack of Rate Limiting** | **Medium** | Publicly accessible endpoints (`List`, `Get`) are susceptible to brute-forcing or DoS attacks. **Remediation:** Implement robust rate limiting (e.g., Leaky Bucket or Token Bucket algorithm) at the gateway or middleware level. |

---

## ⚠️ Technical Debt, Notes, and Warnings

### 1. Context Handling Dependency (Warning)
The reliability of `Create` heavily depends on the middleware that sets `c.Locals("user_id")`. There is no explicit error handling or fallback if the middleware fails or if `user_id` is missing.

*   **Action:** Add a check immediately after retrieving `userIDStr` to ensure the `user_id` context variable was set, and fail early with a `401 Unauthorized` error if missing.

### 2. Input Validation Depth (Tech Debt)
While basic mandatory checks are present (`title`, `content`), the handler treats all other fields (`summary`, `city`, `country`) as optional strings. There is no validation on format (e.g., email format for a country field) or length limits.

*   **Action:** Define a strong validation structure (e.g., using a dedicated validation library) for the `domain.Blog` object *before* it is passed to the repository layer.

### 3. File Key Duplication (Note)
In the `Create` function, the line `coverImageKey = key` appears twice in succession after the assignment. This is redundant and should be cleaned up.

*   **Cleanup:**
    ```go
    // Original:
    // coverImageKey = key
    // coverImageKey = key 
    // Should be:
    coverImageKey = key
    ```

### 4. API Response Consistency (Note)
The `Create` function returns `c.Status(201).JSON(blog)` (the fully constructed object), while `List` returns `c.JSON(blogs)` and `Get` returns `c.JSON(blog)`. While all are correct, standardizing the return structure (e.g., wrapping the data in a standard response object `{ "data": blog, "status": "success" }`) improves client-side robustness.

---
***Generated Figure Concept: Data Flow Diagram***

*(A diagram illustrating the flow from Fiber Request $\rightarrow$ Handler Logic $\rightarrow$ Storage Service / Repository $\rightarrow$ Database would be highly valuable here. The diagram would highlight the input points where sanitation and validation must occur.)*