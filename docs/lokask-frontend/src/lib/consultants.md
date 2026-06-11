```markdown
[⬅ Return to Main Compendium](../../README.md)

# 💼 Consultant Service Layer Module

This module (`consultant-api.ts`) serves as the dedicated service layer for interacting with the Consultant endpoints of the backend API. Its primary responsibility is to standardize, transform, and manage the retrieval of consultant data, ensuring client-side consistency regardless of minor inconsistencies in the backend JSON structure.

---

## ⚙️ Overview

The Consultant Service Layer manages all interactions related to viewing, searching, profile management, and media handling for consultant profiles. It encapsulates the logic for constructing API request parameters (especially for complex filtering) and, critically, normalizes raw API responses into predictable TypeScript interfaces.

### Key Focus Areas:

1.  **Data Normalization:** Implementing `mapConsultant` to reconcile inconsistent field names and data types (e.g., handling `full_name` vs. `name`).
2.  **State Management:** Handling paginated retrieval using filtering parameters.
3.  **Resource Management:** Providing functions for media upload and profile updates.

---

## 🛠️ Detailed Implementation Guide

### 📂 1. Data Models & Interfaces

This module defines several critical interfaces used for strong typing and data structure guarantees:

| Interface | Purpose | Description |
| :--- | :--- | :--- |
| `ConsultantFilters` | Search Query | Defines optional parameters for filtering consultant search results (city, niche, language, pricing, etc.). |
| `PaginatedConsultants` | Search Response | Standardized structure for paginated list retrieval (contains `data`, `total_count`, `page`, `limit`). |
| `Niche` | Reference Data | Structure for listing available professional niches. |
| `Consultant`, `Badge`, `Review` | Data Mapping | Core types used in the final normalized data structures. |

### 💡 2. Core Logic: Data Mapping (`mapConsultant`)

The `mapConsultant` function is the single most critical piece of business logic in this file. It acts as a robust data adapter, accepting an arbitrary raw API object (`c: any`) and transforming it into a consistent `Consultant` object.

**Transformation Logic Highlights:**

*   **Field Aliasing:** It handles multiple potential field names for the same data point (e.g., `c.full_name || c.name || "User"`).
*   **Type Coercion:** It explicitly converts types where necessary (e.g., `Number(c.rating_avg) || ... || 0`, `Boolean(c.is_online)`).
*   **Composite Data:** It structures complex arrays like `badges` and `reviews`, ensuring deep mapping (e.g., normalizing `review_name` vs. `author_name`).

```typescript
// Conceptual Flow:
// Raw API Object (Any) -> mapConsultant() -> Standardized Consultant Object
```

### 🚀 3. API Interaction Functions

| Function | Endpoint/Action | Description | Usage Flow |
| :--- | :--- | :--- | :--- |
| `getConsultants(filters?)` | `/consultants` | Fetches a paginated list of consultants. Builds `URLSearchParams` dynamically based on provided filters. | `await getConsultants({ city: '...', niche: ['A'] })` |
| `getConsultantById(id)` | `/consultants/:id` | Fetches a single consultant's comprehensive profile using their UUID. | `await getConsultantById('uuid-123')` |
| `getNiches()` | `/niches` | Retrieves the complete list of available niche categories. | N/A |
| `getLanguages()` | `/languages` | Retrieves a list of supported languages. | N/A |
| `uploadConsultantMedia(file, type)` | `/consultant/media` (POST) | Handles file uploads for profile cover or gallery images. Uses `FormData` for multi-part encoding. | `await uploadConsultantMedia(file, 'cover')` |
| `deleteConsultantMedia(imageUrl)` | `/consultant/media` (DELETE) | Deletes media resources based on the provided image URL. | `await deleteConsultantMedia(url)` |
| `updateConsultantProfile(data)` | `/updateprofile` (PATCH) | Updates the authenticated user's profile information. Sends data as a JSON body. | `await updateConsultantProfile({ bio: 'New Bio' })` |

### 💾 4. Helper Components

*   **`getAvatar(url, name)`:** A utility function responsible for generating a standardized avatar URL. If an explicit URL is provided, it uses it; otherwise, it generates a placeholder using `ui-avatars.com`.

---

## 📝 Notes & Best Practices

1.  **Consistency is Key:** Always treat the output of the `mapConsultant` function as the definitive source of truth for any consultant data within the application. Do not rely on the raw API response structure outside of this mapping function.
2.  **Filter Parameter Handling:** When calling `getConsultants`, ensure that array types (like `niche` or `languages`) are correctly joined into comma-separated strings before being passed to the function.
3.  **Media Handling:** When uploading or deleting media, always check the API documentation for the required format (e.g., confirming the `type` enum for uploads or the JSON payload structure for deletions).
4.  **Typing:** Utilize the exported interfaces (`ConsultantFilters`, `PaginatedConsultants`) on the calling components to ensure compile-time safety.

### 🔗 Related Code Flow Links

*   **Profile Display Component:** This service layer feeds data into the `ConsultantDetail.tsx` component.
*   **Search/Listing Component:** The `getConsultants` function is utilized by the main directory search view.
*   **User Settings:** The `updateConsultantProfile` function is directly mapped to the user profile editing module.

---

## ⚠️ Warnings & Tech Debt

The following items represent potential areas of instability, poor practice, or required future refinement.

### 🔴 Critical Tech Debt

1.  **Fragile Data Mapping Logic (High Priority):** The `mapConsultant` function relies heavily on multiple JavaScript logical OR (`||`) fallbacks (`c.full_name || c.name || "User"`). This suggests an underlying issue with the API contract.
    *   **Recommendation:** Work with backend engineering to enforce a single, consistent field name for key attributes (e.g., always use `full_name`) to drastically simplify the mapper and improve resilience.
2.  **Type Casting (Medium Priority):** Explicitly casting fields like `Number(c.rating_avg) || Number(c.rating) || 0` introduces potential runtime bugs if the API structure changes.
    *   **Recommendation:** Implement stricter runtime checks or schema validation (e.g., using Zod or similar validation library) instead of relying purely on fallback numeric operations.

### 🟡 Security & Infrastructure Concerns

1.  **Direct Profile Update Exposure (Medium Priority):** The `updateConsultantProfile` function uses a generic PATCH endpoint. While necessary, ensure that the backend strictly validates and sanitizes *all* incoming data to prevent Over-posting or unauthorized field changes.
2.  **Circular Dependency Risk:** If multiple client components rely directly on the raw `map` structure, any change in the backend model could break the client. Consider creating a dedicated Adapter or Service Layer to mediate between the UI and the Data Access Layer.

---
*Generated documentation based on existing service definitions.*