# 📚 API Service Layer: Consultant Data Management

This document provides a comprehensive overview and technical detail of the `consultantService` module, which handles all API interactions and data transformations related to consultant profiles, niches, and user management.

## 🌐 Overview

This service module acts as a unified data access layer (DAL) or repository pattern, abstracting the complexities of interacting with various backend API endpoints. Its primary function is to fetch, filter, and transform complex, nested data structures (like consultant profiles, reviews, and badges) retrieved from the API into standardized, type-safe JavaScript/TypeScript objects usable by the frontend components.

The system components managed include:
*   **Data Retrieval:** Handling pagination and filtering for large datasets.
*   **Data Mapping:** Standardizing attribute names and ensuring data consistency despite variations in backend JSON structures.
*   **File Upload:** Managing secure media uploads (covers, galleries).
*   **User Profile Management:** Facilitating the update of the authenticated user's profile.

### 🧩 Architectural Flow

`Frontend Component` $\rightarrow$ `ConsultantService (This Module)` $\rightarrow$ `fetchJson()` $\rightarrow$ `Backend API Endpoint` $\rightarrow$ `Raw JSON` $\rightarrow$ `mapConsultant()` $\rightarrow$ `Typed Data`

---

## 🔬 Detail

### 📂 Data Structures & Interfaces

| Interface | Purpose | Key Fields | Notes |
| :--- | :--- | :--- | :--- |
| `ConsultantFilters` | Defines criteria for searching and listing consultants. | `city`, `niche[]`, `languages[]`, `minRating`, `maxPrice`, `page`, `limit` | Used to construct URL query parameters for efficient filtering. |
| `PaginatedConsultants` | Standardized return type for list queries. | `data[]`, `total_count`, `page`, `limit` | Ensures the calling function receives necessary pagination metadata. |
| `Niche` | Represents a specific professional category/tag. | `id`, `slug`, `display_name` | Used to populate searchable filter options. |
| `Consultant` | The final, mapped, standardized object for a consultant profile. | `id`, `name`, `rating`, `bio`, `reviews[]`, `badges[]` | This is the core, processed data structure used throughout the application. |

### ✨ Core Functionality Breakdown

#### 1. Data Mapping Utility (`mapConsultant`)
The `mapConsultant` function is critical. It serves as an anti-corruption layer, accepting a potentially inconsistent raw JSON object and mapping it to the highly structured `Consultant` interface.

**Key Transformation Logic:**
*   **Field Normalization:** Handles multiple possible JSON key names (e.g., `c.rating_avg` OR `c.rating`).
*   **Fallback Logic:** Provides default values (e.g., `display_name` fallback to `full_name` or `name`).
*   **Complex Structure Mapping:** Iterates through nested arrays for `badges` and `reviews`, normalizing their structure (e.g., mapping `icon_name` to `iconName` for consistency).
*   **Image Handling (`getAvatar`):** Ensures that a placeholder URL (`ui-avatars.com`) is generated if no avatar URL is provided, maintaining UI stability.

#### 2. API Functions

| Function | Endpoint/Method | Input | Output | Description |
| :--- | :--- | :--- | :--- | :--- |
| `getConsultants` | `GET /consultants` | `ConsultantFilters` | `Promise<PaginatedConsultants>` | Fetches a paginated list of consultants. Automatically constructs query parameters from the filters provided. |
| `getConsultantById` | `GET /consultants/:id` | `string` (ID) | `Promise<Consultant>` | Fetches the complete, detailed profile for a single consultant. |
| `getNiches` | `GET /niches` | None | `Promise<Niche[]>` | Retrieves the list of all available professional niches (tags). |
| `getLanguages` | `GET /languages` | None | `Promise<string[]>` | Retrieves a list of supported languages. |
| `uploadConsultantMedia` | `POST /consultant/media` | `File`, `"cover" | "gallery"` | `Promise<any>` | Handles the multi-part form data upload for media files, requiring both the file and the intended `type`. |
| `updateConsultantProfile` | `PATCH /updateprofile` | `Partial<UpdateProfileRequest>` | `Promise<any>` | Updates the currently authenticated user's profile information. |

---

## ⚠️ Warning & Considerations

### 🚨 Data Integrity and Type Coercion
The `mapConsultant` function relies heavily on type coercion (e.g., `Number(c.rating_avg) || Number(c.rating) || 0`). While this provides resilience to slight API changes, it masks potential backend data quality issues. If a major data source begins returning non-numeric data for ratings, this fallback logic might silently fail or incorrectly default to `0`.

### 🛡 Security: Input Validation
When constructing the URL for `getConsultants`, the input filters are directly appended to `URLSearchParams`. While this prevents basic injection, all input values (`city`, `niche`, etc.) coming from the frontend **must** be rigorously sanitized and validated before being passed to this service layer to prevent XSS or query parameter manipulation attacks.

### 💾 State Management
Since this module is primarily for API calls, the consuming components must be prepared to handle:
1.  **Loading States:** Display appropriate loading indicators during all `await` calls.
2.  **Error States:** Implement robust `try...catch` blocks to handle network errors or 4xx/5xx API responses.

---

## 📝 Notes & Recommendations

### 🛠️ Refactoring Opportunity (System Design)
Consider centralizing the mapping and utility functions related to the `Consultant` profile into a dedicated utility module (e.g., `consultantUtils.ts`) to improve separation of concerns. The service layer should only be responsible for API communication, while the mapping logic handles the data transformation.

### 🗺️ Infrastructure Improvement (Type Safety)
While the current implementation uses `any` for the fetch results (`fetchJson<any>`), implementing more precise TypeScript generics for every possible API response payload (especially for `data` in `getConsultants`) would significantly boost developer confidence and catch errors at compile time.

### 🚀 Optimization (Caching)
The endpoints `getNiches()` and `getLanguages()` return relatively static data. To improve performance and reduce unnecessary API calls, these services should implement a client-side caching mechanism (e.g., using React Query or a global state store) to store the results and prevent redundant network requests during component lifecycle events.