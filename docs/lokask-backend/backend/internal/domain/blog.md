```markdown
[⬅ Return to Main Compendium](../../README.md)

# Data Model: Blog Post Entity (`domain/Blog`)

This document describes the structure and purpose of the `Blog` domain model, which serves as the core data representation for a single blog post within the system.

## 📚 Overview

The `Blog` struct is a comprehensive representation of a blog article, encompassing not only the primary content fields (Title, Content, etc.) but also metadata required for sophisticated user interactions, such as geographical categorization (`City`, `Country`), author details (`AuthorName`, `AuthorAvatar`), and community engagement metrics (`Rating`, `ReviewCount`).

This model is designed to be used across various layers: the database persistence layer (via `db:` tags), the API serialization layer (via `json:` tags), and the application logic layer (for type safety and business validation).

## 📝 Detail Analysis

### `domain/Blog` Struct Definition

| Field | Type | Tags | Description | Purpose/Notes |
| :--- | :--- | :--- | :--- | :--- |
| `ID` | `uuid.UUID` | `db:"id" json:"id"` | Unique identifier for the blog post. | Primary Key. |
| `AuthorID` | `uuid.UUID` | `db:"author_id" json:"author_id"` | Foreign key linking the post to its creator. | Enforces ownership relation. |
| `Title` | `string` | `db:"title" json:"title"` | The main title of the article. | Required field (business validation needed). |
| `Summary` | `string` | `db:"summary" json:"summary"` | Short description or abstract of the content. | Optimized for listing views. |
| `Content` | `string` | `db:"content" json:"content"` | The full, rich-text body of the blog post. | Primary content storage. |
| `CoverImageURL` | `string` | `db:"cover_image_url" json:"cover_image_url"` | URL pointing to the featured image. | Used for graphical representation. |
| `City` | `string` | `db:"city" json:"city"` | Geographical location metadata (city). | Used for filtering and context. |
| `Country` | `string` | `db:"country" json:"country"` | Geographical location metadata (country). | Used for filtering and context. |
| `Rating` | `float64` | `db:"rating" json:"rating"` | Average rating given by users. | Calculated field. |
| `ReviewCount` | `int` | `db:"review_count" json:"review_count"` | Total number of reviews/ratings. | Counter/Aggregated field. |
| `CreatedAt` | `time.Time` | `db:"created_at" json:"created_at"` | Timestamp of record creation. | Audit/Chronology tracking. |
| `UpdatedAt` | `time.Time` | `db:"updated_at" json:"updated_at"` | Timestamp of last modification. | Audit/Change tracking. |
| `AuthorName` | `string` | `db:"author_name" json:"author_name,omitempty"` | Full name of the author. | Denormalized data for read speed (JOIN simulation). |
| `AuthorAvatar` | `string` | `db:"author_avatar" json:"author_avatar,omitempty"` | URL to the author's profile picture. | Denormalized data for read speed (JOIN simulation). |

### Architectural Notes (Relationship Management)

The inclusion of `AuthorName` and `AuthorAvatar` strongly suggests that this struct is intended to represent a **denormalized view** of the data, typically used in API responses or complex list queries that join the `blogs` table with the `users` table.

*   **Relationship Flow:**
    *   `Blog.AuthorID` $\rightarrow$ **Foreign Key** $\rightarrow$ `User.ID`
    *   The `AuthorName` and `AuthorAvatar` should be fetched by the service layer logic *after* retrieving the base `Blog` record, or via a single, optimized database JOIN query.

## 📌 Important Considerations (Notes)

1.  **Data Consistency:** Since `AuthorName` and `AuthorAvatar` are denormalized fields, a robust mechanism (e.g., database triggers or application service hooks) must be implemented to ensure these fields are updated whenever the actual author's name or avatar changes in the `User` table.
2.  **Service Abstraction:** The service layer must handle the logic of hydrating these denormalized fields. The repository should ideally only deal with the persistent fields (`ID`, `AuthorID`, `Title`, etc.), keeping the domain model clean of complex join logic.
3.  **Input Validation:** Input validation (e.g., ensuring `Title` is not empty, `Content` adheres to length limits) must be implemented in the service or controller layer *before* calling the repository.

## ⚠️ Technical Debt & Warnings (Warnings)

*   **Atomic Updates:** The `Rating` and `ReviewCount` are aggregated fields. Direct client-side updates to these fields are dangerous. The repository methods must wrap the logic for incrementing the count and recalculating the average rating *atomically* within a database transaction.
    *   *Action Item:* Refactor the rating update mechanism to use database-level aggregation functions (e.g., `UPDATE ... SET rating = ...`) instead of fetching, calculating, and saving in the application layer.
*   **Concurrency:** Consider implementing pessimistic locking or optimistic concurrency control (e.g., using a version column) when updating the `Content` to prevent lost updates during high write concurrency.
*   **Pagination/Filtering:** This model is currently comprehensive. When implementing list views, determine if all fields (`City`, `Country`, `AuthorName`, etc.) are necessary, or if a subset can be used to keep payload size minimal and query performance optimal.

***
*Knowledge Base Context:*
*   **System Design:** The model hints at a read-heavy data structure requiring denormalization for performance.
*   **Infrastructure:** Requires persistent storage capable of handling UUIDs and timestamps (`PostgreSQL/MySQL`).
*   **Security:** Review authorization checks to ensure that only the `AuthorID` or an Admin can modify the content.
*   **Cloud Components:** The `CoverImageURL` and `AuthorAvatar` imply integration with a dedicated Object Storage service (e.g., AWS S3, GCP Cloud Storage).
```