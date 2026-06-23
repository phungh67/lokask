[⬅ Return to Main Compendium](../../../../../README.md)

## 💻 Frontend Architecture Documentation: API Utilities Layer

As a Senior Frontend Officer specializing in TypeScript and Vite, I have analyzed the provided API service file (`api/consultant/index.ts` - assuming location). This file acts as our data access layer (DAL) for consultant, blog, and profile management.

The current implementation is excellent—it centralizes API calls, handles complex data mapping (`mapConsultant`, `mapBlog`), and standardizes query building (e.g., `getConsultants` filter logic).

The documentation below focuses on how frontend components should consume and manage the state derived from these utilities, ensuring optimal performance and type safety throughout the application lifecycle.

---

### 🧩 1. Component Architecture Overview

This utility file doesn't house components; rather, it provides the **service logic** that components *call*. Components should utilize React Hooks (e.g., `useQuery` from React Query/TanStack Query) to manage the asynchronous state derived from these functions.

#### Core Architectural Components:

1.  **`data-fetcher`:** The functions themselves (e.g., `getConsultants`, `getBlogById`). They are pure async utilities.
2.  **`state-management`:** The consuming React Hooks (e.g., `useConsultants` hook) which handle caching, loading states, error handling, and state synchronization across components.
3.  **`data-transformer`:** The mapping functions (`mapConsultant`, `mapBlog`). These are crucial for decoupling the raw JSON structure returned by the backend from the consistent TypeScript interfaces used in the frontend.

---

### 🚀 2. State Management Strategy (React/TanStack Query Focus)

To manage the complex, paginated, and frequently changing data derived from these APIs, we must rely heavily on robust state management tools like TanStack Query (React Query).

#### A. Paginated Consultancies State (`getConsultants`)

The result of `getConsultants` is perfect for React Query's pagination capabilities.

**Implementation Hook (`useConsultants`):**
We should wrap `getConsultants` in a custom hook that manages the `page` and `limit` parameters.

*   **Input State:** `filters: ConsultantFilters` (Manages `city`, `niche`, `country`, etc.)
*   **Local State:** `page: number`, `limit: number`
*   **Caching Strategy:** Use `queryKey` that includes **all filter parameters** and the current page/limit. This ensures that changing a niche filter clears and refetches the data correctly.
    *   *Example Key:* `['consultants', filters.country, filters.niche, page, limit]`

**Handling `total_count`:**
The returned `PaginatedConsultants` object must populate the query's meta data. This allows other components to display "Page 3 of 10" without requiring a separate API call.

#### B. User Profile State (`getConsultantById`, `getConsultantByUserId`)

This data is typically fetched once and remains stable (until the user explicitly updates it).

**Implementation Hook:**
Use `useQuery` with the `id` as the key. Since profile data is sensitive and changes, implement **Stale-While-Revalidate (SWR)** behavior.

**State Lifecycle:**
1.  Initial load: Fetch data using `getConsultantById(id)`.
2.  Mutation: After a successful `updateConsultantProfile` mutation, manually invalidate the query cache for the current user's profile ID (`queryClient.invalidateQueries(['consultant', userId])`). This forces the component to refetch fresh data.

#### C. Blog Content State (`getFeaturedBlogs`, `getBlogById`)

This is highly cacheable.

*   **`getFeaturedBlogs`:** Cache this list globally. It changes infrequently. Use `staleTime` to keep it available in the cache for a longer duration (e.g., 15 minutes) to minimize unnecessary fetches on component mount.
*   **`getBlogById`:** Fetch this with the `id` as the primary key.

---

### 💡 3. Detailed UI Logic & Typing Review

#### A. Data Mapping Consistency (`mapConsultant`, `mapBlog`)

**Critical Observation:** The mapping functions are excellent because they normalize inconsistent backend naming conventions (snake\_case vs. camelCase).

**Action Items:**
1.  **Typing Safety:** Ensure the `: any` types used in `mapConsultant` and `mapBlog` are updated to accept the full shape of the incoming raw JSON objects for maximum TypeScript safety, or at minimum, document the expected raw structure.
2.  **Error Handling:** Consider wrapping the mapping logic in a robust `try...catch` block during development to catch unexpected `null` or `undefined` values from the backend, preventing runtime rendering errors.

#### B. Filter and Search Logic (`getConsultants`)

The construction of `URLSearchParams` is clean and reliable.

**Logic Review:**
*   **Defaulting:** The fallback logic for `country` (`else { params.append("country", "VN"); }`) is critical and must be documented clearly for all consuming teams.
*   **Niche/Language:** Joining multiple values with a comma (`filters.niche.join(",")`) is efficient but makes the endpoint reliant on the backend correctly parsing this comma-separated string into an array. *This dependency should be verified on the backend side.*

#### C. Mutation Handling (Media & Profiles)

*   **`uploadConsultantMedia`:** This is a complex file upload utility. The frontend component must handle `FormData` creation and manage the upload state (e.g., "Uploading image...", progress bar) before showing the resulting `imageUrl`.
*   **`updateConsultantProfile`:** This requires a **Mutation Hook** (e.g., `useMutation`). The component must show a loading state during the PATCH request and handle success (invalidate cache) or failure (show error message) gracefully.

---

### 🧪 4. TypeScript Enhancement Recommendations

1.  **API Response Types:** While `Promise<PaginatedConsultants>` provides great type safety for the *output*, the `fetchJson<any>` calls use `any` for the input (`const response = await fetchJson<any>`). For maximum type safety, define interface types for the *raw* expected response structures (e.g., `RawConsultantResponse` for the body of `getConsultants`).

2.  **Global Utility Typing:** Since `getAvatar` is a helper, consider moving it into a dedicated utility file or defining it as a purely functional helper outside the service file to keep the service layer focused on networking.

3.  **Enum Usage:** For constrained string inputs like `type: "cover" | "gallery"` in `uploadConsultantMedia`, continue using TypeScript literal types/enums. This prevents typographical errors when calling the utility.

***

*this content was created by AI, but the coding and underlying logic are not.*