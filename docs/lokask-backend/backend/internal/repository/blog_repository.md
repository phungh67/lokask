# 📄 Blog Repository Documentation

This document provides a comprehensive summary and technical specification for the `BlogRepository` package. This repository implements the data access layer for managing blog post entities, adhering to the Repository Pattern, and interacts directly with the database using `sqlx`.

---

## 🌐 Overview

The `BlogRepository` struct is responsible for encapsulating all database logic related to blog posts. It abstracts the data source details from the business logic layer, making the application more maintainable and testable.

**Primary Functions:**
1.  **CRUD Operations:** Implementing Create, Read, Update, and Delete functionality for blog records.
2.  **Authorization:** Integrating checks (e.g., during Update and Delete) to ensure the authenticated user is authorized to modify or delete the specified resource (author verification).
3.  **Advanced Querying:** Providing complex filtering and pagination capabilities for listing multiple blog posts.

**Dependencies:**
*   `github.com/jmoiron/sqlx`: Used for robust database interaction (handling named queries and result sets).
*   `github.com/google/uuid`: Used for generating and handling unique identifiers (UUIDs).
*   `asklocal/internal/domain`: Contains the `domain.Blog` structure, defining the data model.

## 💡 Detail

### 🧱 System Structure

| Component | Type | Purpose |
| :--- | :--- | :--- |
| `BlogRepository` | Struct | Holds the `*sqlx.DB` connection and provides all data access methods. |
| `NewBlogRepository` | Constructor | Initializes the repository instance with a live database connection. |
| `BlogFilter` | Struct | A query parameter object used to gather various search criteria (City, Country, AuthorID, Limit, Offset). |

### 🧩 Method Breakdown

#### `Create(blog *domain.Blog) error`
*   **Functionality:** Inserts a completely new blog record into the `blogs` table.
*   **Mechanism:** Uses `NamedExec` to safely map the `domain.Blog` struct fields to database columns.
*   **Database Action:** `INSERT`

#### `GetByID(id uuid.UUID) (*domain.Blog, error)`
*   **Functionality:** Retrieves a single blog post by its UUID.
*   **Enhancement:** Performs a `JOIN` with the `users` table (`u`) to enrich the returned blog object with author details (`author_name`, `author_avatar`) in addition to the blog data.
*   **Database Action:** `SELECT` (with JOIN)

#### `List(filter BlogFilter) ([]*domain.Blog, error)`
*   **Functionality:** Lists multiple blogs based on flexible criteria (pagination, filtering).
*   **Mechanism:** This method is highly dynamic. It constructs the SQL query string and accumulates arguments (`args`) dynamically based on which fields in the `BlogFilter` struct are provided.
*   **Query Logic:** It handles `WHERE` clauses for City, Country, and AuthorID, followed by dynamic `LIMIT` and `OFFSET` clauses for pagination.
*   **Database Action:** `SELECT` (dynamic WHERE/JOIN/LIMIT/OFFSET)

#### `Update(blog *domain.Blog) error`
*   **Functionality:** Modifies an existing blog post.
*   **Security/Validation:** The query is scoped by both `id` **and** `author_id`. This critical security check ensures that a user can only update a blog if their `author_id` matches the `author_id` associated with the blog.
*   **Database Action:** `UPDATE`

#### `Delete(id uuid.UUID, authorID uuid.UUID) error`
*   **Functionality:** Permanently removes a blog post.
*   **Security/Validation:** Similar to `Update`, the deletion operation requires matching both the blog `id` and the provided `authorID`, preventing unauthorized deletion.
*   **Database Action:** `DELETE`

---

## 📝 Technical Analysis

### Database Design Consideration (Schema Implication)
The repository assumes the following relationships and columns exist:

1.  **`blogs` table:** Must contain `id`, `author_id`, `title`, `summary`, `content`, `city`, `country`, and timestamp fields.
2.  **`users` table:** Must contain `id`, `full_name`, and `avatar_url`.
3.  **Foreign Key:** `blogs.author_id` must reference `users.id`.

### Security Engineering Focus (Authorization)
The repository successfully implements **resource-level authorization** on write operations (`Update` and `Delete`). By requiring both the resource ID and the current user's ID (`author_id`), it prevents an attacker from guessing or directly manipulating resources owned by other users.

### Infrastructure / Cloud Considerations
*   **Database Connection:** Requires secure handling of the database connection string (e.g., retrieved via environment variables or AWS Secrets Manager).
*   **Connection Pooling:** Using `*sqlx.DB` implies standard connection pooling is managed underneath, which is crucial for performance in a high-traffic environment.

## 🚧 Note

*   **Error Handling for Write Operations:** In `Update` and `Delete`, the code correctly checks `rows.RowsAffected() == 0`. This is an excellent pattern that translates a potential SQL execution error into a specific, actionable application error (`"blog not found or unauthorized"`), enhancing client-side error handling.
*   **Case Sensitivity:** The use of `ILIKE` in the `List` function suggests the database is configured to handle case-insensitive comparisons for the `city` column, which is a good practice for user-facing search fields.

## ⚠️ Warning (Areas for Improvement / Unfinished Logic)

1.  **Type Consistency in `BlogFilter`:** The `BlogFilter` struct defines `AuthorID` as a `string`. When passing this through the logic, it is compared against UUID primary keys (which are `uuid.UUID` type in the function signature). **It is necessary to explicitly validate and parse `filter.AuthorID` from string to `uuid.UUID` within the repository layer to ensure type safety and prevent runtime panics.**
2.  **Transaction Management:** The `List` operation, while functional, involves many potential steps (query building, execution). If future logic requires multiple related writes (e.g., updating a blog *and* logging the change), **the repository methods should be wrapped in explicit database transactions (`r.DB.BeginTx`) to ensure atomicity (ACID compliance).**
3.  **Validation Layer:** The repository assumes that the incoming `domain.Blog` object passed to `Create` or `Update` is already valid. **A dedicated validation method (e.g., `blog.Validate()`) should be implemented on the `domain.Blog` structure and called at the start of the `Create`/`Update` methods to ensure required fields (Title, Content) are present.**

---

## 🗺️ Conceptual Diagram: Data Flow

```mermaid
graph TD
    A[Client/Service Layer] -->|Request Blog Data (UUID, Filters)| B(BlogRepository);
    B -->|Build Dynamic SQL Query| C{SQL Executor};
    C -->|Execute SELECT| D[PostgreSQL/SQL Database];
    D -->|Return Blog Records| C;
    C -->|Format & Return Blog []*domain.Blog| B;
    B -->|Return Data| A;

    subgraph Security Enforcement
        E[User ID] -->|Authorize| F{Update/Delete Methods};
        F -->|Check Ownership (AuthorID)| D;
    end
```