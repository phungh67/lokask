# README: Explore Locals Page Component (`ExploreLocals.tsx`)

## Overview

The `ExploreLocals` component is a core feature component responsible for displaying and allowing users to filter a directory of local consultants. It provides a sophisticated search and filtering experience, allowing users to discover profiles based on criteria such as location, niche, price range, and minimum rating.

The component integrates client-side state management (React Hooks) with server-side data fetching using TanStack Query (`@tanstack/react-query`) to ensure efficiency and optimal user experience (UX), particularly regarding loading states and filtering logic.

**Key Features:**
*   **Dynamic Filtering:** Supports filters managed via a dedicated sidebar.
*   **Pagination:** Implements robust pagination logic to handle large datasets efficiently.
*   **State Synchronization:** Updates the displayed consultant list and page number whenever filters are changed.
*   **Performance Handling:** Manages loading (`isLoading`) and fetching (`isFetching`) states to prevent data display errors and provide immediate feedback to the user.

## Detail

### 📂 Architecture & Implementation

**1. State Management:**
*   **`useState`:** Manages `showFilters` (visibility of the sidebar) and `page` (current page number).
*   **`useSearchParams`:** Reads initial filter parameters (`city`, `niche`, etc.) from the URL, ensuring deep linking capability.
*   **`sidebarFilters` (State Object):** Holds the active filter state, derived from URL parameters initially and updated when the user interacts with the `ExploreSidebar`.

**2. Data Fetching (TanStack Query):**
*   **`useQuery`:** Encapsulates the API call logic (`getConsultants`).
*   **`queryKey`:** The dependency array (`["consultants", "explore", sidebarFilters, page]`) is critical. It ensures that the data is refetched only when the primary dependencies (filters or page) change, adhering to caching best practices.
*   **`queryFn`:** Calls the `getConsultants` utility function, passing structured parameters: `page`, `limit` (12), `city`, `niches`, `languages`, `maxPrice`, and `minRating`.

**3. UI Components:**
*   **Layout:** Uses a responsive two-column layout on large screens (`lg:block`).
*   **Filtering Area:** The `ExploreSidebar` component is sticky on large screens, improving discoverability.
*   **Results Grid:** Displays consultants using `ConsultantCardCompact` in a responsive grid (`grid-cols-1 md:grid-cols-2 xl:grid-cols-3`).
*   **Pagination:** Implements a custom pagination component logic to display adjacent pages (e.g., `[p-2] ... [p] ... [p+2]`) along with ellipsis, preventing excessive page links.

### ⚙️ Data Flow Diagram

```mermaid
graph TD
    A[User Interaction / Component Mount] --> B{Check URL Parameters};
    B --> C[Initialize sidebarFilters State];
    C --> D(useQuery: getConsultants);
    D --> E{API Call: getConsultants(filters, page)};
    E --> F[Backend API];
    F --> G{Response: data, total_count};
    G --> H[Update consultants state];
    H --> I{Render UI};
    I --> J[Display Consultant Grid];
    I --> K[Display Pagination Controls];
    J --> L{User Clicks Filter/Page};
    L --> C;
```

## Note

### ✨ Development Considerations

1.  **Type Safety:** The structure of `sidebarFilters` (an object representing filters) is critical for both client-side state and the API contract. Maintaining strict typing between the state and the `getConsultants` function ensures robustness.
2.  **Scroll Behavior:** The `onApply` callback in `ExploreSidebar` correctly implements `window.scrollTo({ top: 0, behavior: "smooth" })`. This is a critical UX detail that ensures the user always lands at the top of the page after applying new filters, preventing confusion.
3.  **Pagination Logic:** The manual handling of page links (showing current, plus 2 previous, ellipsis, and total last page) is well-implemented. This enhances UX by managing visual clutter while keeping navigation intuitive.

## Warning (Areas Left Unfinished / Technical Debt)

### 🚨 Next Steps & Potential Improvements

1.  **Price Range Handling in State:**
    *   The code notes: `// Currently ignoring index 0 since backend usually just filters 'max_price'`.
    *   **Action:** It is necessary to confirm if the `minPrice` filter state (`sidebarFilters.priceRange[0]`) is truly irrelevant for the backend API. If it is used, the `getConsultants` function signature and call must be updated to pass both `minPrice` and `maxPrice`.
2.  **Loading State UX:**
    *   Currently, when `isFetching` is true, the consultant grid opacity is reduced (`opacity-50`). While this prevents visual anomalies, consider displaying a persistent, minimal loading skeleton/placeholder *within* the grid structure rather than just applying an overlay, providing a better perceived performance boost.
3.  **URL Synchronization (Filter Application):**
    *   While the component reads filters from `useSearchParams`, it does not show the mechanism for *writing* filters back to the URL upon filter application. When `setSidebarFilters` is called inside `onApply`, the URL should ideally be updated using `setSearchParams` to keep the component state and the browser URL perfectly synchronized.

***
*Generated by Documentation Engineering Team.*