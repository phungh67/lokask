[⬅ Return to Main Compendium](../../../../../../README.md)

# Backend Service Documentation: Blog Handler

As a senior backend officer, I have reviewed the `BlogHandler`. This component is responsible for managing all HTTP interactions related to blog posts, adhering to the standard pattern of handling request/response mapping while delegating business logic and data persistence to the service and repository layers.

The implementation demonstrates good use of Dependency Injection (via the `BlogHandler` struct) and clear separation of concerns between request handling, domain structuring, and persistence/storage operations.

## 🧠 Core Logic Analysis

The `BlogHandler` acts as the primary controller layer for blog functionalities. Its core responsibility is to:

1.  **Validate Inputs:** Ensure mandatory fields (like `title` and `content`) and formats (like UUIDs for IDs) are correct before proceeding.
2.  **Orchestrate Side Effects:** Manage multi-step operations, such as uploading a file (`cover_image`) and *then* persisting the resulting metadata (the `key`) alongside the blog post data.
3.  **Map HTTP to Domain:** Translate incoming `fiber.Ctx` data (form values, query parameters, path parameters) into robust `domain.Blog` objects suitable for persistence.
4.  **Error Handling:** Map potential storage, validation, or database errors into appropriate HTTP status codes (400, 404, 500).

**Key Logic Observation (Create):** The creation flow correctly implements a transactional dependency: the cover image must be successfully uploaded to storage *before* the blog entry is saved with the resulting file key.

## 🌐 API Surfaces Documentation

This section details the exposed API endpoints, required inputs, and expected outputs.

### 1. `Create` (POST /blogs)

**Function:** Handles the creation of a new blog post. This method is responsible for validating required text fields, managing the file upload, and persisting the final `domain.Blog` object.

**HTTP Method:** `POST`
**Endpoint:** `/blogs`
**Dependencies:** Requires the `user_id` to be available in `c.Locals()`.

**Request Body (Form Data):**
| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `title` | string | Yes | The title of the blog post. |
| `content` | string | Yes | The main body content of the blog post. |
| `summary` | string | No | Short summary/excerpt. |
| `city` | string | No | Location city. |
| `country` | string | No | Location country. |
| `cover_image` | file | No | The cover image file. |

**Success Response (Status 201 Created):**
Returns the newly created `domain.Blog` object, including the generated `ID` and `CoverImageURL`.
```json
{
    "ID": "...",
    "AuthorID": "...",
    "Title": "...",
    "Summary": "...",
    "Content": "...",
    "CoverImageURL": "...",
    "City": "...",
    "Country": "...",
    "CreatedAt": "...",
    "UpdatedAt": "..."
}
```

**Error Responses:**
*   **400 Bad Request:** Missing `title` or `content`, or invalid `user_id` format.
*   **500 Internal Server Error:** Failed file upload (`h.Storage.UploadBlogCover`) or database persistence failure.

### 2. `List` (GET /blogs)

**Function:** Retrieves a list of blog posts, supporting filtering and pagination (although the handler currently hardcodes the limit).

**HTTP Method:** `GET`
**Endpoint:** `/blogs`

**Query Parameters:**
| Parameter | Type | Description | Default |
| :--- | :--- | :--- | :--- |
| `city` | string | Filter by city. | None |
| `country` | string | Filter by country. | None |
| `author_id` | string | Filter by specific author ID. | None |

**Success Response (Status 200 OK):**
Returns an array of `domain.Blog` objects matching the filter criteria.
```json
[
    { /* blog object 1 */ },
    { /* blog object 2 */ },
    // ...
]
```

**Error Response:**
*   **500 Internal Server Error:** Failure during data retrieval from the repository.

### 3. `Get` (GET /blogs/:id)

**Function:** Fetches the details of a single blog post using its unique UUID identifier.

**HTTP Method:** `GET`
**Endpoint:** `/blogs/{id}`

**Path Parameters:**
| Parameter | Type | Description |
| :--- | :--- | :--- |
| `id` | string | The UUID of the blog post to retrieve. |

**Success Response (Status 200 OK):**
Returns the single `domain.Blog` object.
```json
{
    "ID": "...",
    "AuthorID": "...",
    // ... full blog object
}
```

**Error Responses:**
*   **400 Bad Request:** The provided `id` parameter is not a valid UUID.
*   **404 Not Found:** No blog post found matching the provided ID.

## 🏗️ Repository and Pattern Review

### Dependency Injection (DI)
The handler utilizes DI effectively by requiring `*repository.BlogRepository` and `storage.FileStorage` in its constructor. This makes the handler highly testable, as we can mock the repository and storage interfaces when testing the handler logic in isolation.

### Separation of Concerns (SoC)
1.  **Handler (`BlogHandler`):** Concerns itself solely with HTTP request parsing, input validation, coordinating the workflow (Storage $\rightarrow$ Repo), and formatting HTTP responses.
2.  **Domain (`domain.Blog`):** Holds the canonical structure of the data.
3.  **Repository (`BlogRepository`):** Handles the Data Access Layer (DAL) specifics (e.g., SQL queries, NoSQL operations). The handler does not know *how* the data is saved, only that it *can* be saved via `h.Repo.Create(blog)`.
4.  **Storage (`FileStorage`):** Abstracts the external file handling mechanism (e.g., AWS S3, local disk), keeping the handler clean of SDK details.

### Improvement Suggestion (Minor Refactoring)
In the `Create` method, the file key assignment is duplicated:
```go
// Original code snippet
key, uploadErr := h.Storage.UploadBlogCover(file, newBlogID.String())
// ...
coverImageKey = key
coverImageKey = key // This line is redundant
```
This is purely cosmetic but confirms the logic is sound: the resulting key is used immediately.

*this content was created by AI, but the coding and underlying logic are not.*