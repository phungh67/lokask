[⬅ Return to Main Compendium](../../../../../../README.md)

## Security Code Review: ConsultantHandler

**Reviewer:** Senior Security Officer (Cloud, Architecture, Language Expert)
**Target File:** `handler/consultant_handler.go`
**Overall Assessment:** The code structure is generally clean, utilizing standard Go practices and the Fiber framework. However, several functions handle external inputs (paths, queries, bodies, files) that introduce potential vulnerabilities related to data validation, resource handling, and injection, particularly when interacting with file systems (S3/storage) or databases.

---

### 🔍 Vulnerability Analysis

#### 1. `GetProfile(c *fiber.Ctx)`
*   **Input:** `idStr` (UUID from URL parameters).
*   **Risk:** Low to Medium (Input validation, data leakage).
*   **Analysis:**
    *   The use of `uuid.Parse(idStr)` provides strong type checking for the ID, mitigating general injection risks related to ID format.
    *   **Architectural Concern:** The error handling returns a generic 500 error with a message (`"details": "Check backend terminal for full trace"`) while exposing the underlying error (`err.Error()`) in the response body. While the detail message is good practice, logging the full stack trace and returning the raw error string to the client increases the information disclosure surface area.
*   **Recommendations:**
    *   **Information Disclosure:** When an internal 500 error occurs, do not pass the underlying database/system error message to the client. Use a generic, non-descriptive error message (e.g., "Internal server error. Please try again later.") and rely solely on structured logging for debugging.

#### 2. `UpdateProfile(c *fiber.Ctx)`
*   **Input:** `tokenUserID` (from `c.Locals`), `payload` (JSON body).
*   **Risk:** Low (Authentication/Authorization flow, serialization).
*   **Analysis:**
    *   **Auth/Authz:** The function relies on `c.Locals("user_id")` being correctly set by middleware. Assuming this middleware performs robust validation (e.g., checking token validity and scope), the risk is mitigated. However, the function only checks if the token is a valid UUID, not if the user associated with the ID is authorized to update the profile (e.g., is it owned by them?).
    *   **Data Validation:** The code relies on `c.BodyParser()` to handle serialization. If the `repository.UpdateProfilePayload` struct does not include validation tags (e.g., `validate:"required,max=50"`), the system could accept excessively long or improperly formatted data, potentially leading to database constraints or unintended logic paths.
*   **Recommendations:**
    *   **Stronger Authorization:** Explicitly verify that the `userID` retrieved from the token *matches* the user profile being updated, if applicable (though here it seems they are updating *their own* profile).
    *   **Input Validation:** Implement struct validation using libraries like `go-playground/validator` on the `payload` struct to enforce business constraints (max length, format, allowed values) before calling the repository layer.

#### 3. `List(c *fiber.Ctx)`
*   **Input:** `cityFilter`, `countryFilter`, `nicheFilter` (Query parameters), `page` (Query parameter).
*   **Risk:** Medium (SQL Injection, Injection via filter parameters).
*   **Analysis:**
    *   **SQL Injection (Primary Concern):** The query parameters (`cityFilter`, `countryFilter`, `nicheFilter`) are passed directly to the repository layer (`h.Repo.ListConsultants`). If the repository implementation constructs SQL queries using string concatenation or unsafe methods, a malicious user could inject SQL commands (e.g., passing `' OR 1=1 --` as a filter value).
    *   **Type Coercion:** The page number uses `strconv.Atoi`, which is robust for type conversion.
*   **Recommendations:**
    *   **Mandatory Parameterization:** Ensure that the `repository.ListConsultants` function *exclusively* uses parameterized queries (prepared statements) for all inputs derived from the HTTP request (`cityFilter`, `countryFilter`, `nicheFilter`). Never concatenate user-supplied strings directly into the SQL query.
    *   **Input Sanitization:** For filter inputs, consider whitelisting acceptable character sets or ensuring that filters are treated as full-text search parameters rather than raw SQL fragments.

#### 4. `GetConsultantByUserID(c *fiber.Ctx)`
*   **Input:** `userIDParam` (UUID from URL parameters).
*   **Risk:** Low, as it only reads a UUID-formatted string. The primary risk is if the underlying database query implementation is vulnerable to improper type handling, but generally, UUID passing is safe.

#### 5. `DeleteGalleryMedia` (Implied Functionality)
*No specific endpoint/function was provided for deletion, but if such a function exists, it must use proper transaction handling and implement comprehensive authorization checks (Is the user deleting their own content?).*

#### 6. `UploadGalleryMedia` (Implied Functionality)
*Similarly, file uploads require stringent content-type validation, size restrictions, and secure storage mechanisms.*

---

### Critical Security & Logic Review (Focusing on File Handling)

The most sensitive operations involve file upload and deletion (implied by the context of "GalleryMedia").

1.  **File Upload (`UploadGalleryMedia`):**
    *   **Validation:** Must validate file extensions against an allow-list (e.g., `.jpg`, `.png`, `.webp`). **Never** rely solely on the MIME type provided by the client, as this is trivially spoofable.
    *   **Sanitization:** If the image is passed through a library (e.g., Pillow in Python) for processing, ensure that the library strips all metadata (EXIF data) and re-encodes the image to prevent XSS or script execution payloads embedded in image headers.
    *   **Storage:** Store files in a secure, non-publicly accessible directory, and serve them only through a controlled, authenticated endpoint.

2.  **File Deletion (`DeleteGalleryMedia`):**
    *   **Authorization:** Must check if the authenticated user has the right to delete the resource (e.g., ownership check).
    *   **Atomic Operation:** Deletion should be atomic: if the metadata deletion succeeds but the file system deletion fails, or vice versa, a rollback or clear error must occur.

---

### Deep Dive: `UploadGalleryMedia` (Focus on Robustness)

If this function interacts with the file system, the following best practices must be followed:

*   **Path Traversal Prevention:** When constructing the storage path from user input (e.g., `user_id/media/{filename}`), strictly sanitize the filename to prevent path traversal attacks (`../../../etc/passwd`). Only allow alphanumeric characters, dashes, and underscores.
*   **Unique Naming:** Generate a cryptographic random filename (e.g., UUID) upon upload, and only use the provided filename for metadata indexing. This prevents malicious users from guessing paths or overwriting critical system files.

---

### Summary of Actionable Recommendations

| Area | Vulnerability/Weakness | Recommendation | Priority |
| :--- | :--- | :--- | :--- |
| **Input Handling** | Path Traversal (Implied file ops) | **Always** sanitize file names/paths; use UUIDs for stored file names. | Critical |
| **File Upload** | Client-side MIME spoofing, XSS payload in metadata. | Implement strict server-side file type validation (allow-list extensions) and metadata stripping during re-encoding. | Critical |
| **Authorization** | Missing ownership checks (Implied deletion). | Implement rigorous checks on every write/delete endpoint to ensure the user owns the resource. | Critical |
| **Error Handling** | Exposed internal details on failure. | Implement generic, user-friendly error messages for failed transactions (e.g., "Operation failed. Please try again."). | High |
| **Data Integrity** | Inconsistent state on failure. | Use database transactions for multi-step operations (e.g., save metadata $\rightarrow$ save file $\rightarrow$ update index). | High |