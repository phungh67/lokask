# Data Model Specification: User and Consultant Profiles

## 📋 Overview

This document defines the core data structures (interfaces) used for representing user profiles, specialized credentials (Badges), user feedback (Reviews), and the data payload for profile updates within the system. These interfaces serve as crucial data contracts for API development, frontend state management, and backend service implementation.

The model primarily focuses on the `Consultant` entity, aggregating related data such as their credentials, ratings, and professional details.

## 💡 Detail

The following sections detail each defined interface:

### 1. `Badge`
Represents a professional credential or achievement badge awarded to a consultant.

| Field | Type | Description | Notes |
| :--- | :--- | :--- | :--- |
| `id` | `string` | Unique identifier for the badge. | Primary key candidate. |
| `icon_name` | `string` | The name used to reference the badge's icon (e.g., matching a Go JSON tag or defined icon set). | Must conform to the defined icon naming convention. |
| `title` | `string` | The formal name displayed for the badge (e.g., "Top Tier Expert"). | |
| `description` | `string` | A detailed explanation of what the badge signifies. | |

### 2. `Review`
Represents a single feedback submission given by a user to a consultant.

| Field | Type | Description | Notes |
| :--- | :--- | :--- | :--- |
| `id` | `string` | Unique identifier for the review. | |
| `review_name` | `string` | The name displayed with the review. | |
| `review_avatar` | `string` | URL or identifier for the reviewer's profile picture. | |
| `rating` | `number` | Numerical rating given (e.g., 1 to 5). | Should be constrained to an integer or float range. |
| `comment` | `string` | The textual feedback provided by the reviewer. | |
| `verified_stay` | `boolean` | Indicates if the reviewer confirms they used the service or stayed in a verified manner. | Important for credibility scoring. |
| `date` | `string` | The date the review was posted (ISO 8601 format recommended). | |

### 3. `Consultant`
The primary entity structure representing a professional consultant's full profile.

| Field | Type | Description | Notes |
| :--- | :--- | :--- | :--- |
| `id` | `string` | Unique identifier for the consultant profile. | |
| `name` | `string` | The consultant's full legal name. | |
| `displayName` | `string` | The name preferred for public display. | |
| `city` | `string` | The city of practice. | |
| `country` | `string` | The country of practice. | |
| `tag` | `string` | A short, concise professional tag used in compact cards. | Optimized for limited display space. |
| `tags` | `string[]` | An array of more detailed professional tags/keywords. | Used in main profile cards. |
| `quote` | `string` | A professional quote or motto associated with the consultant. | |
| `rating` | `number` | Average calculated rating derived from all reviews. | Should be calculated/aggregated upon update. |
| `helpedCount` | `number` | Total count of services or consultations provided. | Metric for professional experience. |
| `avatarUrl` | `string` | URL for the consultant's profile avatar. | |
| `coverUrl` | `string` | URL for the consultant's background or cover image. | |
| **Optional Fields:** | | | |
| `isHighlyTrusted?` | `boolean` | Indicates a special status or verification level. | Read-only or managed by an internal system flag. |
| `bio?` | `string` | The detailed professional biography. | |
| `languages?` | `string[]` | Array of languages spoken by the consultant. | |
| `responseTime?` | `string` | Expected or typical response time (e.g., "2 hours"). | |
| `isOnline?` | `boolean` | Real-time status indicating availability. | Requires system integration (e.g., WebSockets). |
| `galleryImages?` | `string[]` | Array of URLs for supplementary images (e.g., portfolio). | |
| `badges?` | `Badge[]` | Array of professional credentials the consultant possesses. | Relationship to `Badge` model. |
| `reviews?` | `Review[]` | Array of recent or representative reviews. | Relationship to `Review` model. |

### 4. `UpdateProfileRequest`
Defines the specific payload structure used when a consultant submits data to modify their profile.

| Field | Type | Description | Notes |
| :--- | :--- | :--- | :--- |
| `full_name` | `string` | The consultant's full name for updating the record. | |
| `display_name` | `string` | The public-facing display name. | |
| `city_id` | `number \| null` | The ID reference for the consultant's current city. | Use ID referencing instead of raw strings for consistency. |
| `quote` | `string` | The updated professional quote. | |
| `bio` | `string` | The updated detailed biography. | |
| `languages` | `string[]` | List of languages spoken. | |
| `main_niche_id` | `number \| null` | The primary professional category ID. | Used for data routing and classification. |
| `tags` | `string[]` | The list of professional tags for the profile. | |

***

## ⚠️ Warning

1. **Data Consistency and Normalization:** The `UpdateProfileRequest` uses `city_id` (a numeric ID), while the `Consultant` structure uses plain `city` (a string). **Action Required:** When designing the API endpoint for updates, the system must prioritize using ID references (`city_id`) for all foreign keys to ensure data integrity and avoid discrepancies.
2. **Input Validation:** All fields, especially `rating` (must be numeric and within acceptable bounds, e.g., 1-5) and `id` (must be present and unique), require robust validation (server-side) before processing.
3. **State Management (Online Status):** The `isOnline` field requires persistent system integration (e.g., WebSockets or heartbeat mechanism). This status should **never** be merely set by the client; it must be verified by the server or a dedicated presence service.

## 📝 Note

1. **Time Zone Handling:** For the `Review.date` field, it is highly recommended that the system uses a standardized format like **ISO 8601** and explicitly stores the time zone offset (e.g., `YYYY-MM-DDTHH:MM:SSZ`) to prevent global display inconsistencies.
2. **Database Mapping:** For the `Consultant` model, consider implementing a dedicated lookup table or service for validating `tag` and `main_niche_id` values. This prevents the profile from storing arbitrary, unmanageable strings.
3. **API Workflow Recommendation:** The `Consultant` profile structure is complex (deeply nested arrays). When querying the API, developers should consider whether the entire `Consultant` object, including all nested `reviews` and `badges`, is necessary. Optimal performance suggests fetching these related entities (Reviews, Badges) via separate, optimized endpoint calls (e.g., `/consultant/{id}/reviews`, `/consultant/{id}/badges`).

## 💻 Generated Figure: Data Flow Mapping

While I cannot generate a physical image, I provide a structured textual flow map that represents how these models relate within a typical service architecture diagram.

```mermaid
graph TD
    A[Client/UI] -->|POST/PUT Data| B(API Gateway / Profile Service);

    subgraph Data Structures (Models)
        B --> |Input Payload| C{UpdateProfileRequest};
        B --> |Read Payload| D{Consultant};
        D --> D1[Badge];
        D --> D2[Review];
        D1 --> D1_A(ID);
        D1 --> D1_B(Title, Description);
        D2 --> D2_A(ID);
        D2 --> D2_B(Rating, Comment, Date);
    end

    C -->|Validation/Validation| E(Service Layer);
    E -->|Data Persistence| F[Database (SQL/NoSQL)];

    F -->|Retrieval| D;
```