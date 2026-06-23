[⬅ Return to Main Compendium](../../../../../../README.md)

# 🏗️ Backend Service Analysis & Frontend Integration Plan

**Service:** `ConsultantHandler`
**Purpose:** Handles all API interactions related to consultant profiles, listings, media management, and user data retrieval.
**Target Consumption:** React/Vue/Svelte frontend application (consuming via TypeScript services/hooks).
**Architecture Assessment:** The service is robustly structured using the Handler pattern, effectively separating concerns between HTTP request handling (`fiber.Ctx`), business logic execution (passing to the `repository`), and persistence details (`storage`).

---

## 💡 Frontend Perspective & API Contract Definition

As a senior frontend officer, I view this handler not as Go code, but as a set of well-defined API endpoints that must be consumed reliably by our client-side services. We must define strong TypeScript interfaces for all request and response payloads to ensure type safety and eliminate runtime errors on the client.

### 1. Core Data Models (TypeScript Interfaces)

We need standardized definitions for the data objects returned by the API.

```typescript
// client/src/types/consultant.ts

/** Represents a single consultant's profile data. */
export interface ConsultantProfile {
    id: string;
    // ... other profile fields (e.g., name, bio, rating)
}

/** Used for listing multiple consultants. */
export interface ConsultantListResponse {
    data: ConsultantProfile[];
    total_count: number;
    page: number;
    limit: number;
}

/** Standardized error structure returned by the API. */
export interface ApiErrorResponse {
    error: string;
    details?: string; // For detailed tracing/client logging
}

/** Payload for updating profile information (POST/PUT body). */
export interface UpdateProfilePayload {
    // Example fields based on expected repository payload
    bio?: string;
    // ... other updatable fields
}

/** Payload for requesting media deletion. */
export interface DeleteMediaRequest {
    image_url: string;
}
```

### 2. State Management Strategy

Since the `ConsultantHandler` exposes multiple distinct resources (Profiles, Listings, Niches, Media), we should adopt a modular state management approach (e.g., using React Query/SWR or Vue Composition API with Pinia/VueUse).

**Principle:** **Never store the entire API state globally.** State should be scoped to the feature component or container component that requires it.

| Resource / Function | Frontend State Scope | State Management Pattern | Fetching Hook/Service | Key State Variables |
| :--- | :--- | :--- | :--- | :--- |
| **Single Profile (`/consultants/:id`)** | `ConsultantDetailPage` | Fetch-on-Mount (Caching) | `useGetConsultantProfile(id)` | `profile`, `isLoading`, `error` |
| **Consultant List (`/consultants`)** | `ConsultantDirectory` | Paginated Fetching | `useFetchConsultantList({ page, filters })` | `list: ConsultantListResponse`, `hasNextPage`, `isFetching` |
| **User/Current Profile Update** | `EditProfileForm` | Local/Transactional State | `updateConsultantProfile(data, userId)` | `isSubmitting`, `updateSuccess`, `errorMessage` |
| **Niches/Languages/Cities** | Various components (Dropdowns, Selects) | Static Fetch (Low Frequency) | `useFetchNiches()`, `useFetchCities()` | `niches: Niche[]`, `languages: Language[]` |
| **Media Upload/Deletion** | `MediaUploaderComponent` | Mutational State | `uploadMedia(files)` / `deleteMedia(url)` | `galleryUrls: string[]`, `isUploading`, `lastError` |

---

## 🧩 Component Architecture Breakdown

The handler logic informs the structure of several crucial client components.

### 1. `ConsultantProfileComponent`
*   **Source Handlers:** `GetProfile`, `GetConsultantByUserID`
*   **Responsibilities:** Displaying the full, comprehensive profile.
*   **Data Flow:** Reads the profile data from the state hook.
*   **Critical Logic Point (Frontend):** The handler returns a 404 with a specific message ("User is not a consultant") if the user ID exists but isn't linked to a consultant record. The frontend must explicitly listen for this *specific* error code/message and render a "Please upgrade your account" message rather than a generic 404.

### 2. `ProfileManagementComponent`
*   **Endpoint:** POST/PUT (Internal logic, maps to handler update functionality)
*   **Functionality:** Handles submitting changes to the user profile.
*   **Design Note:** This component must manage form state and handle both validation errors (client-side) and API validation errors (server-side).

### 3. `MediaUploadComponent`
*   **Endpoints:** POST (Internal Upload logic)
*   **Functionality:** Handles uploading profile pictures or gallery images.
*   **Design Note:** Should use chunked uploads or robust state management to provide real-time feedback (Progress Bar) during the upload process.

### 4. `DirectoryCleanupService` (Utility)
*   **Purpose:** Manages the interaction with image and file endpoints.
*   **Logic:** Abstract away the complexity of file uploading, ensuring that the frontend only handles file selection, and the service handles the multi-step process (Upload -> Get URL -> Save URL to DB).

## 🚀 Key Frontend Implementation Considerations

1.  **Error Handling (Crucial):** Implement a centralized interceptor/error handler for all API calls. This must differentiate between:
    *   *Authentication Errors* (Token expired, redirect to login).
    *   *Resource Errors* (e.g., trying to delete a profile that has associated files).
    *   *Business Logic Errors* (e.g., "File format must be JPEG").
2.  **Optimistic UI Updates:** For actions like "Save Profile" or "Delete Image," implement optimistic updates. Update the UI immediately upon click, and only revert the UI state if the API call fails, providing a much faster perceived performance.
3.  **Performance (Image Handling):** Implement **Lazy Loading** for all images displayed in the profile gallery. Use responsive image tags (`<picture>` or `srcset`) to serve appropriately sized images based on the user's device viewport.
4.  **State Consistency:** When a user modifies profile details (e.g., changes their display name), ensure that *all* components consuming that data (e.g., the navbar, the profile header, the associated listing cards) instantly reflect the change without needing a full page reload.