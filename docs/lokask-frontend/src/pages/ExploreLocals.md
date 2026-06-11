```markdown
[⬅ Return to Main Compendium](../../README.md)

# 🧭 `ExploreLocals` Page Component

## Overview
The `ExploreLocals` component is the primary client-facing page responsible for allowing users to browse and search for local consultants. This page implements complex filtering logic, handles paginated data retrieval, and manages the UI state for showing/hiding filter sidebars. It acts as the main consumer of the consultation listing service.

**Purpose:** To provide a discoverable, searchable, and filterable listing of local consultants.
**Primary Function:** State management, data fetching (via TanStack Query), and UI orchestration for search results.

---

## 🛠️ Detail: Component Logic and Flow

### 1. State Management & Initialization
The component initializes three key pieces of state:
*   **`searchParams`:** Reads initial filter state (e.g., `city`, `niche`) directly from the URL parameters using `useSearchParams`.
*   **`showFilters`:** Boolean state to toggle the visibility of the filter sidebar on smaller screens or preference changes.
*   **`sidebarFilters`:** A structured `FilterState` object derived from `searchParams`. This object holds all current filtering criteria (location, niches, price range, etc.).
*   **`page`:** Controls the current page number for pagination, defaulting to `1`.

### 2. Data Fetching (`useQuery` Hook)
The core data retrieval logic is encapsulated in `useQuery`.
*   **Query Key:** `["consultants", "explore", sidebarFilters, page]` ensures that the query re-runs only when the core search filters (`sidebarFilters`) or the current `page` number changes.
*   **API Call:** Calls the external utility function `getConsultants` (located at `../lib/consultants`).
*   **Parameters Passed:** The hook carefully maps the local state values (`sidebarFilters.location`, `sidebarFilters.niches`, `sidebarFilters.priceRange[1]`) to the backend parameters (e.g., `maxPrice`).

### 3. Filter Handling & Side Effects
*   **`handleClearFilters`:** Resets all local state filters to default values and resets the page to 1.
*   **`onApply` (via Sidebar):** When a user interacts with the `ExploreSidebar`, the `onApply` callback updates both `sidebarFilters` and resets `page` to 1, ensuring a fresh search result on the new criteria.
*   **`window.scrollTo`:** Improves UX by scrolling the user back to the top of the page after filters are applied.

### 4. Rendering & UI Components
*   **Layout:** Utilizes a responsive `grid` layout (1 column on mobile, 2 on medium, 3 on large) for displaying results.
*   **Result Display:** Maps over the fetched `consultants` array, rendering each item using the specialized `ConsultantCardCompact` component.
*   **Pagination:** Implements custom pagination logic using the `Pagination` components. It calculates visible page numbers (showing the current page and pages -2 to +2) and manages navigation by updating the `page` state.

***
<details>
<summary>🌐 Conceptual Data Flow Diagram</summary>
<p>
[Client URL Search Params] ➡️ (1. Initialize State & Fetch) ➡️ `useQuery` (Key: Filters + Page) ➡️ `getConsultants(filters, page)` ➡️ [API Backend Service] ➡️ (2. Response Data) ➡️ `isLoading` / `error` Check ➡️ (3. Render) ➡️ `ConsultantCardCompact` List + Paginated Controls.
</p>
</details>
***

## 📝 Notes (Best Practices & Improvements)

1.  **Filter State Persistence:** The current implementation correctly initializes state from `searchParams`. For robustness, consider using a dedicated hook or utility to manage the serialization and deserialization of the complex filter object, rather than relying solely on prop drilling/state updates.
2.  **Performance Optimization:** Since the data fetching relies on changing parameters, ensuring the `getConsultants` function utilizes appropriate caching mechanisms (like React Query or SWR) will prevent unnecessary re-fetches when other unrelated components on the page update.
3.  **Accessibility (A11y):** The entire component structure should ensure proper focus management, especially within the interactive filter/pagination controls.

## ⚠️ Potential Issues & Next Steps

*   **Error Handling:** While component-level state exists, robust API call failure handling (e.g., showing a user-friendly "Could not load results. Please try again." message) should be implemented around the data fetching hook.
*   **Input Validation:** When the user submits filter criteria (if additional inputs are added), server-side validation must confirm that the submitted parameters are valid types (e.g., ensuring a date field is a valid date).

---
**Dependencies Used:**
*   `@react-query/react` (or similar data fetching library)
*   `react-router-dom` (for reading URL parameters)

**Related Components:**
*   `SidebarFilterControls` (Component responsible for updating search parameters)
*   `PaginationControls` (Component handling page number selection)