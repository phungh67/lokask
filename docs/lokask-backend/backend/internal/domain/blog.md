# 💾 Domain Model Documentation: `Blog`

***

### Overview

This document describes the `Blog` domain model structure, defined within the `domain` package. This structure represents the canonical data entity for a blog post within the application's core services. It is designed to serve as the primary data transfer object (DTO) and the representation of the entity within the system's persistence layer.

The model incorporates fields for core content, metadata (e.g., timestamps, location), and aggregated data (e.g., ratings, author presentation details).

### 🛠️ Detail Specification

The `Blog` struct is designed to map directly to a database table, utilizing Go struct tags for defining database column names (`db`) and API serialization (`json`).

#### Core Identification and Linking
| Field | Type | Description | Constraints/Notes |
| :--- | :--- | :--- | :--- |
| `ID` | `uuid.UUID` | Unique primary identifier for the blog post. | Must be globally unique (UUID v4 recommended). |
| `AuthorID` | `uuid.UUID` | Foreign key linking the post to the author entity. | Links to the `users` or `authors` table. |
| `Title` | `string` | The headline or main title of the article. | Mandatory field. |
| `Summary` | `string` | A short, concise description of the content (used for listings/previews). | |
| `Content` | `string` | The full, rich-text body content of the article. | Should handle markdown or HTML formatting. |
| `CoverImageURL` | `string` | URL pointing to the primary featured image. | Should adhere to cloud storage URL formats (e.g., S3). |

#### Location and Metadata
| Field | Type | Description | Constraints/Notes |
| :--- | :--- | :--- | :--- |
| `City` | `string` | The primary city associated with the content/author. | Optional. |
| `Country` | `string` | The primary country associated with the content/author. | Optional. |
| `Rating` | `float64` | The calculated average rating of the post. | Range: typically 0.0 to 5.0. |
| `ReviewCount` | `int` | The total number of user reviews submitted for the post. | Derived/Aggregated counter. |
| `CreatedAt` | `time.Time` | Timestamp indicating the initial creation time of the post. | Automatically set upon insertion. |
| `UpdatedAt` | `time.Time` | Timestamp indicating the last time the post content was modified. | Automatically updated on every save/write operation. |

#### Presentation Layer Fields (Denormalization)
These fields are included for convenience, reducing joins during read operations (e.g., in a feed listing).

| Field | Type | Description | Source/Notes |
| :--- | :--- | :--- | :--- |
| `AuthorName` | `string` | The display name of the author. | **Denormalized.** Populated by joining with the Author/User table. |
| `AuthorAvatar` | `string` | URL pointing to the author's profile picture. | **Denormalized.** Populated by joining with the Author/User table. |

---

### 💡 Engineering Notes & Architectural Considerations

1.  **UUID Usage:** The exclusive use of `uuid.UUID` for primary keys ensures distributed readiness and collision avoidance, which is standard practice in modern microservice architectures.
2.  **Denormalization Trade-offs:** The inclusion of `AuthorName` and `AuthorAvatar` significantly improves Read performance by avoiding a `JOIN` during common read paths (like fetching a feed). However, this introduces **data redundancy**. The service layer consuming this struct *must* implement logic to keep these fields synchronized whenever the author's name or avatar changes.
3.  **Time Management:** Using `time.Time` for lifecycle tracking is critical. The persistence layer (e.g., database migration or ORM hooks) must be configured to automatically populate `CreatedAt` (on insert) and `UpdatedAt` (on update).
4.  **Data Integrity:** The `Rating` and `ReviewCount` fields imply a complex interaction with a separate `Review` entity. The service layer should encapsulate the business logic for updating these fields atomically to prevent race conditions (e.g., ensuring that a review submission increments `ReviewCount` and recalculates `Rating` in a single transaction).

### ⚠️ Warning (Incomplete/Action Items)

The current domain model is comprehensive, but several critical business logic components require immediate attention and completion:

1.  **Input Validation Logic:** The struct itself does not enforce constraints (e.g., minimum character length for `Title`, required format for `CoverImageURL`). Dedicated validation service layers must be implemented before the data is passed to the repository.
2.  **Denormalization Sync Mechanism:** The critical dependency on `AuthorName` and `AuthorAvatar` needs a clear, idempotent mechanism. Consider implementing a **Domain Event** (e.g., `AuthorNameUpdatedEvent`) that triggers asynchronous updates to the `Blog` records that reference the changed author.
3.  **API Response Mapping:** The `json` tags are defined, but the corresponding API handler/controller logic must be documented to ensure proper error handling and data transformation when this struct is returned to clients.

### 📝 Future Considerations (To Be Implemented)

*   **Tagging/Categorization:** Consider adding an array of foreign keys or a dedicated association table to link `Blog` to multiple `Category` entities.
*   **SEO Fields:** Adding structured metadata fields like `Slug` (URL-friendly identifier) and `Keywords` would enhance discoverability.
*   **Author Relationship:** If the blog post is meant to support collaboration, the model might need an association list for co-authors.