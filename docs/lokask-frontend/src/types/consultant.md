[⬅ Return to Main Compendium](../../README.md)

# 💾 Data Models: Consultant & Profile Schemas

This document defines the core TypeScript interfaces used throughout the application to structure data related to professional profiles, consultant credentials, and profile updates. These models serve as the foundational contract for API payloads, database schema mapping, and frontend state management.

---

## 💡 Overview

This schema group provides type definitions for four primary entities:
1. **`Badge`**: Defines specific qualifications or achievements displayed on a consultant's profile.
2. **`Review`**: Captures detailed feedback provided by users regarding a consultant's service.
3. **`Consultant`**: The primary model defining the comprehensive data structure for a professional's public and private profile.
4. **`UpdateProfileRequest`**: Defines the input payload structure for updating a consultant's profile details.

The consistency of these models is critical for reliable data serialization and client-server communication.

## 🔍 Detail

### `Badge` Interface
Defines a credential badge.

| Field | Type | Description | Notes |
| :--- | :--- | :--- | :--- |
| `id` | `string` | Unique identifier for the badge. | Must be non-empty. |
| `icon_name` | `string` | Key used to retrieve the appropriate icon asset (e.g., from an icon library or CDN). | Used for visual representation. Matches Go JSON tag standard if using `snake_case`. |
| `title` | `string` | The visible name of the badge (e.g., "Top Rated Expert"). | |
| `description` | `string` | Detailed explanation of the badge's criteria. | |

### `Review` Interface
Defines a user-submitted review.

| Field | Type | Description | Notes |
| :--- | :--- | :--- | :--- |
| `id` | `string` | Unique identifier for the review. | |
| `review_name` | `string` | The name of the person who left the review. | |
| `review_avatar` | `string` | URL pointing to the reviewer's avatar. | |
| `rating` | `number` | The rating given (typically 1-5). | |
| `comment` | `string` | The textual feedback provided by the reviewer. | |
| `verified_stay` | `boolean` | Indicates if the reviewer confirms participation/service. | Important for trust scoring. |
| `date` | `string` | Timestamp of when the review was submitted. | Standardized date format (ISO 8601 recommended). |

### `Consultant` Interface (Core Model)
The main profile entity, combining biographical and performance metrics.

| Field | Type | Description | Mandatory/Optional |
| :--- | :--- | :--- | :--- |
| `id` | `string` | Unique identifier for the consultant. | Mandatory |
| `name` | `string` | Consultant's full legal name. | Mandatory |
| `displayName` | `string` | Name used for display (e.g., "John Doe, PE"). | Mandatory |
| `city` | `string` | Consultant's current city. | Mandatory |
| `country` | `string` | Consultant's current country. | Mandatory |
| `tag` | `string` | Short, compact tag used for summarized cards. | Mandatory |
| `tags` | `string[]` | Array of searchable skill tags. | Mandatory |
| `quote` | `string` | A professional quote or motto. | Mandatory |
| `rating` | `number` | Overall calculated rating. | Mandatory |
| `helpedCount` | `number` | Total number of users helped. | Mandatory |
| `avatarUrl` | `string` | URL to the primary profile picture. | Mandatory |
| `coverUrl` | `string` | URL to the profile cover image/banner. | Mandatory |
| `isHighlyTrusted` | `boolean` | Status indicator for high trust rating. | Optional |
| `bio` | `string` | Detailed professional biography. | Optional |
| `languages` | `string[]` | List of languages the consultant speaks. | Optional |
| `responseTime` | `string` | Expected response time (e.g., "Within 2 hours"). | Optional |
| `isOnline` | `boolean` | Current online/availability status. | Optional |
| `galleryImages` | `string[]` | Array of URLs for portfolio or professional gallery images. | Optional |
| `badges` | `Badge[]` | List of earned qualifications and badges. | Optional |
| `reviews` | `Review[]` | List of associated user reviews. | Optional |

### `UpdateProfileRequest` Interface
Defines the structure for updating profile information, enforcing explicit field mapping.

| Field | Type | Description | Mapping Notes |
| :--- | :--- | :--- | :--- |
| `full_name` | `string` | The consultant's full legal name. | Maps to `Consultant.name`. |
| `display_name` | `string` | The preferred display name. | Maps to `Consultant.displayName`. |
| `city_id` | `number \| null` | ID of the consultant's city. | Requires lookup/validation against `City` service. |
| `quote` | `string` | New professional quote. | |
| `bio` | `string` | Updated biography text. | |
| `languages` | `string[]` | List of languages. | |
| `main_niche_id` | `number \| null` | Primary specialization area ID. | Requires dedicated Niche Service. |
| `tags` | `string[]` | Array of searchable skill tags. | |

## 📝 Note (Implementation/Best Practices)

1. **Date Handling:** For both `Review` and any internal logging, ensure that timestamps (`date` field) are strictly handled as ISO 8601 format (`YYYY-MM-DDTHH:MM:SSZ`) to avoid timezone discrepancies.
2. **Validation Layer:** While these are type definitions, the backend service layer (e.g., `consultant.service.ts`) *must* implement comprehensive validation (e.g., ensuring `rating` is between 1 and 5, `id` is UUID format, and required fields like `avatarUrl` are present).
3. **Data Flow:** When a profile is created, the system should ideally separate the `name` (full legal name) and `displayName` to accommodate regional display preferences while maintaining core identity data.

## ⚠️ Warning (Tech Debt / Action Items)

1. **API Consistency:** The use of `camelCase` (`displayName`, `avatarUrl`) vs. `snake_case` (`full_name`, `review_name`, `icon_name`) is inconsistent across the models. **Action:** Standardize all fields either to `camelCase` for JavaScript/TS or `snake_case` for database consistency and update the interfaces accordingly.
2. **City/Niche Linking:** The `city_id` and `main_niche_id` fields are raw IDs (`number | null`). This implies an external lookup service is required (e.g., `CityService`). These dependencies should be explicitly managed in the dependency graph documentation to prevent data silo failures.
3. **Schema Versioning:** Since these models are foundational, consider implementing a versioning strategy (`v1`, `v2`) in the API documentation to handle mandatory structural changes without breaking existing client integrations.

---

### 🔗 Related Components & Logic Flow

*   **Profile Read Flow:** `[../handlers/consultant.handler.ts]` (Retrieves `Consultant` data using the full profile schema.)
*   **Profile Update Logic:** `[../services/consultant.service.ts]` (Consumes `UpdateProfileRequest` payload; handles complex field updates like `city_id` and `tags`.)
*   **Badge/Review Logic:** `[../middlerware/review.middleware.ts]` (Handles submission and validation of `Review` payloads.)
*   **API Definitions:** `[../api/consultant-routes.go]` (Defines the expected HTTP contract using these models.)