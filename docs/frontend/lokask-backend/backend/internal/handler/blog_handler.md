[⬅ Return to Main Compendium](../../../../../../README.md)

As a senior frontend officer specializing in TypeScript and Vite, my focus here is not on the Go implementation itself, but on defining the **robust, strongly-typed client contract** and the optimal **component architecture** required to consume this API layer efficiently.

This backend handler provides the API contract. We will use TypeScript to ensure that every interaction—from fetching data to submitting forms—is type-safe, thus preventing runtime errors in the frontend application.

Here is the documentation for the UI logic, state management, and component architecture.

---

## 🚀 1. API Contract Definition (TypeScript Interfaces)

Before building any component, we must define the expected data structures. These interfaces translate the Go `domain.Blog` object into our client-side TypeScript reality.

```typescript
// src/types/blog.ts

/**
 * Interface representing a single Blog Post object returned by the API.
 * Matches the structure of the `domain.Blog` object.
 */
export interface Blog {
    id: string; // UUID string
    authorId: string; // UUID string
    title: string;
    summary: string;
    content: string; // Full markdown or HTML content
    coverImageUrl: string; // The key/URL returned by the storage service
    city: string | null;
    country: string | null;
    createdAt: string; // ISO Date String
    updatedAt: string; // ISO Date String
}

/**
 * Interface for filtering and listing blogs (used for ?city=X&country=Y).
 * Corresponds to repository.BlogFilter.
 */
export interface BlogFilter {
    city?: string;
    country?: string;
    authorId?: string;
    limit?: number;
}

/**
 * Interface for the data required to create a new blog post (Form Input).
 * This represents the data collected from the submission form.
 */
export interface NewBlogData {
    title: string;
    summary: string;
    content: string;
    city: string | null;
    country: string | null;
    // The image file will be handled separately via FormData/File API
}

/**
 * Standard API response envelope for error handling.
 */
export interface ApiResponse<T> {
    success: boolean;
    data: T;
    error?: {
        message: string;
        details?: string;
    };
}
```

## 💾 2. State Management Strategy

For an application managing a collection of articles, a global state manager (e.g., Zustand or Redux Toolkit) is recommended. This keeps the list of blogs and the current user's authentication state centralized.

**Recommended Store Structure (e.g., `useBlogStore`):**

| State Variable | Type | Initial Value | Description | Update Mechanism |
| :--- | :--- | :--- | :--- | :--- |
| `blogs` | `Blog[]` | `[]` | Cache of all successfully fetched blog posts. | `fetchBlogs` action (via API call). |
| `isLoading` | `boolean` | `false` | Global loading flag for the blog list. | Set to `true` before `fetchBlogs`, `false` after. |
| `error` | `string | null` | `null` | Last known API error message. | Set on API failure. |
| `currentUserId` | `string` | `""` | The UUID of the currently logged-in user. | Set upon user login/initialization. |

**Key Logic Flows & Side Effects:**

1.  **Initial Load:** `useEffect` hook calls `fetchBlogs` using the current state filters.
2.  **Mutation (Creating):** When a user submits the creation form, the component calls an asynchronous action (`createBlog(data, file)`). Upon success, the new `Blog` object must be optimistically added to the `blogs` array in the store, followed by a refetch to ensure the server state is authoritative.
3.  **Filtering/Listing:** Whenever a filter changes (e.g., changing the City dropdown), the store automatically triggers `fetchBlogs` with the new parameters.

## 🏗️ 3. Component Architecture (Vite Components)

We will adopt a modular, compositional approach using React/Vue (assuming a modern component framework, Vite is ideal for this).

### A. `BlogList` Component (Container/Smart Component)

This component is responsible for orchestrating data fetching and rendering the summary list.

*   **Props:** `filters: BlogFilter` (Controls what is fetched).
*   **State:** Manages local form state for filters (e.g., selected City, Country).
*   **Logic:**
    1.  Calls the `useBlogStore` hooks to read `blogs` and `isLoading`.
    2.  If filters change, it calls `apiService.fetchBlogs(filters)`.
    3.  Handles the loading and empty state display.
*   **Dependencies:** Renders `<BlogSummary />` for each item.

### B. `BlogSummary` Component (Presentational/Dumb Component)

Displays minimal details to entice the user to click for the full content.

*   **Props:** `blog: Blog` (Receives a fully typed `Blog` object).
*   **Logic:** Simply receives and displays the title, summary, and cover image URL.
*   **Interactivity:** Wraps the entire output in a link/button that navigates the user to the detailed view (`/blog/${blog.id}`).

### C. `BlogDetailView` Component (Container)

Handles the display of a single, fully rendered article.

*   **Props:** `blogId: string` (Route parameter).
*   **Logic:**
    1.  On mount, fetches the single blog post using the `blogId`.
    2.  Renders the full content (`content` field, potentially using a markdown renderer like `react-markdown`).
    3.  Handles 404 (Blog not found) and loading states.

### D. `BlogCreateForm` Component (Form/Utility Component)

The critical component for data input and file handling.

*   **State:** Uses local component state (or a form library like React Hook Form) to manage `NewBlogData`.
*   **Inputs:**
    *   Standard text/select inputs for Title, Summary, City, Country.
    *   Crucial element: An input type `file` for `cover_image`.
*   **Submission Logic (`handleSubmit`):**
    1.  Must collect both the text data and the binary `File` object.
    2.  **Crucially, it must serialize the data using `FormData`** to match the `multipart/form-data` requirement implied by the backend's use of `c.FormFile("cover_image")`.
    3.  Calls `apiService.createBlog(formData)`.
*   **Error Handling:** Must display specific, user-friendly error messages derived from the API's response error body.

## 📚 4. Summary of Client-Side Flow

| Endpoint Handled (Go) | Client Action | Component Responsible | Type Flow |
| :--- | :--- | :--- | :--- |
| `POST /blogs` (Create) | Submit Form | `BlogCreateForm` | `FormData` (Text + File) $\rightarrow$ `Blog` |
| `GET /blogs?city=X` (List) | Change Filters/Initial Load | `BlogList` | `BlogFilter` $\rightarrow$ `Blog[]` |
| `GET /blogs/:id` (Get) | Click Blog Summary Link | `BlogDetailView` | `string` (ID) $\rightarrow$ `Blog` |

*this content was created by AI, but the coding and underlying logic are not.*