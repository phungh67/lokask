```markdown
[⬅ Return to Main Compendium](../../README.md)

# 🗺️ Destination Page Component (`DestinationPage.tsx`)

**Path:** `src/pages/DestinationPage.tsx`
**Description:** A feature-rich landing page component designed to display information and local expert profiles for a specific geographical destination based on URL slugs.

***

## 📈 Overview

The `DestinationPage` component serves as the primary user interface for showcasing local consultants associated with a particular destination. It handles routing by extracting a `slug` parameter from the URL. It fetches consultant data using React Query, presents destination metadata (Hero image, name), and dynamically renders individual consultant profiles using `ConsultantCardCompact`.

This component is critical for the user journey after navigating from a home or list page to a specific location detail page.

## 💡 Detail

### 1. Initialization & Route Handling
*   **Input:** The component relies on `useParams` to capture the destination `slug` from the URL (e.g., `/destination/paris`).
*   **Metadata Lookup:** It first attempts to match the slug against a predefined `DESTINATION_METADATA` object (e.g., `thailand`, `paris`).
*   **Fallback Logic:** If the slug is not found in the static metadata, a fallback mechanism converts the slug into a formatted name and uses a generic image URL, ensuring the component remains operational even for unmanaged routes.

### 2. Data Fetching (React Query)
*   **Hook:** `useQuery` is utilized for asynchronous data fetching.
*   **Current Query:** The hook calls `getConsultants({ city: "Hanoi" })`.
    *   *Note:* The `enabled` flag ensures that the query only runs if a destination slug is successfully determined.
*   **State Management:** The component successfully manages three states:
    1.  **Loading:** Displays a spinner and "Finding local experts..." text (`isLoading` check).
    2.  **Data Available:** Renders the grid of consultants using the fetched `displayConsultants` array.
    3.  **No Data:** Displays a clear message if the array is empty.

### 3. Rendering Flow
*   **Hero Section:** Displays the destination name and image in a visually prominent "Hero" banner. This section includes back navigation (`Link` to `/`).
*   **Consultant Display:** The main content area features a responsive grid (1 to 4 columns) that maps over the fetched consultant data, passing each instance to `<ConsultantCardCompact />`.

### 💻 Code Flow Diagram

*(Figure Placeholder: A flowchart illustrating the data flow: URL Slug -> Metadata Check -> UseQuery (Hanoi) -> Data -> Render Hero -> Render Grid.)*

---

## 🗒️ Knowledge Notes

### Architecture
*   **State Management:** The use of `@tanstack/react-query` is best practice for handling complex, server-side data fetching, providing caching, stale-while-revalidate, and automatic retry logic.
*   **Component Separation:** The logic for rendering individual expert details is correctly delegated to `<ConsultantCardCompact />`, ensuring high cohesion and low coupling.
*   **Type Safety:** Using explicit types (`useParams<{ slug: string }>`, `Consultant`) improves code maintainability and reduces runtime errors.

### Related Components & Logic
*   **Routing Logic:** The `react-router-dom` library manages URL parameters and navigation links.
    *   *Related:* Navigation logic related to routing parameters should be checked in `[../src/App.tsx]` or the main Router setup file.
*   **Data Fetching Function:** The underlying data retrieval logic is handled by the external utility function.
    *   *Link:* See the API implementation in `[../src/lib/consultants]`.
*   **Display Component:** The visual representation of an individual consultant.
    *   *Link:* Uses `[../components/ConsultantCardCompact]`.

## ⚠️ Warnings & Tech Debt

### 🚩 CRITICAL: Hardcoded Query City (High Priority)
The most significant issue is that the data fetching hook *always* queries for consultants in **"Hanoi"**, regardless of which destination slug is passed in the URL (`destination`).

```typescript
// Current implementation snippet (BUG):
queryKey: ["fixed-consultant-data", "city", "Hanoi"],
queryFn: () => getConsultants({ city: "Hanoi" }),
```

**Action Required:** The `getConsultants` function call inside `useQuery` must be refactored to dynamically use the `destination.name` or a city derived from the `slug` to fetch the correct local data.

### 🚩 Metadata Scalability (Medium Priority)
The `DESTINATION_METADATA` is a hardcoded object. As the application scales to include more destinations, maintaining this object will become cumbersome.

**Suggestion:** Consider migrating the destination metadata source to a dedicated API endpoint or a separate configuration file loaded at startup, making the component more data-driven.

### 🚩 Error Handling (Medium Priority)
The `useQuery` hook lacks comprehensive error handling (e.g., `queryClient.onSuccess` or `onError`). If `getConsultants` fails due to network issues or invalid parameters, the user will likely see a blank screen or an unhandled React Query error boundary.

**Action Required:** Implement a dedicated `onError` block within `useQuery` to provide user-friendly feedback (e.g., "Could not load experts. Please try again.").
```