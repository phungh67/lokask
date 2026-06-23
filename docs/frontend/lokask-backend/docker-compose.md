[⬅ Return to Main Compendium](../../../README.md)

As a Senior Frontend Officer, my review of the infrastructure stack reveals a robust, modern microservices architecture. The frontend (Lokask Web) depends on the `lokask_api` for all business logic, utilizing dedicated services for persistence (PostGIS) and caching (Redis).

Based on this environment and adhering to best practices for modern SPA development, I have documented the recommended component architecture, state management pattern, and core UI logic using **TypeScript** and **Vite**.

---

## 🚀 Lokask Web Frontend Architecture Documentation

**Goal:** Build a highly performant, type-safe, and scalable Single Page Application (SPA).

**Tooling Stack:**
*   **Framework:** React (Recommended)
*   **Language:** TypeScript (Mandatory)
*   **Build Tool:** Vite (Mandatory for rapid development and performance)
*   **Styling:** Tailwind CSS or CSS Modules (For component encapsulation)
*   **State Management:** Zustand or Redux Toolkit (Context-specific choice)
*   **Data Fetching:** React Query (TanStack Query) (Recommended for server state)

### 1. 📐 Component Architecture Strategy

We will adopt a modular, layered component structure to ensure testability and maintainability.

#### Layers:

1.  **Atoms (The smallest pieces):** Purely presentation components. They receive props and render UI, with no internal state or business logic.
    *   *Examples:* `Button`, `Input`, `Avatar`, `Icon`.
    *   *Implementation Focus:* TypeScript prop validation (`interface Props {}`).
2.  **Molecules (Grouping Atoms):** Components that combine several atoms to form a self-contained UI unit.
    *   *Examples:* `UserCard` (combines `Avatar`, `Button`, `Username`), `FilterDropdown` (combines `Input`, `Select`).
    *   *Logic:* Minimal internal state (e.g., open/closed state).
3.  **Organisms (Complex Sections):** The largest, most complex components that manage flow and data display for a specific view section. They often interact directly with the State Management layer.
    *   *Examples:* `SearchResultsList`, `BookingFormWizard`, `ProfileDashboard`.
    *   *Implementation Focus:* Lifecycle management, data fetching hooks (React Query).
4.  **Pages (Container Components):** The root components loaded by the router (`<RouterView>`). They are responsible for coordinating multiple organisms and managing layout. They handle the overall API call orchestration.
    *   *Example:* `HomePage`, `BookingPage`.

### 2. 💾 State Management Pattern

We must differentiate between **Client State** (UI-specific, local state) and **Server State** (Data fetched from the API).

#### A. Server State Management (The Priority)
*   **Tool:** **React Query (TanStack Query)**
*   **Purpose:** Handles asynchronous data fetching, caching, invalidation, retries, and stale-while-revalidate mechanism. This is crucial as the `lokask_api` manages all complex data structures.
*   **Logic:** Every major Organism that requires data (e.g., fetching user details, fetching search results) must use a `useQuery` hook. This offloads complex data fetching logic from component lifecycle methods.

#### B. Client State Management
*   **Tool:** **Zustand** (Recommended for simplicity)
*   **Purpose:** Managing global, non-server-sourced UI state (e.g., theme preference, modal visibility, global user authentication token if not managed by HTTP context).
*   **Pattern:** Use a single "store" per functional domain (e.g., `AuthStore`, `SettingsStore`).

#### 💡 Data Flow Diagram (High Level)

```mermaid
graph TD
    A[User Interaction: Component] --> B{Component State Change};
    B --> C[React Query Hook (useQuery)];
    C --> D(lokask_api);
    D --> E[Redis Cache Check (lokask_api)];
    E --> F(lokask_db: PostGIS);
    F --> D;
    D --> C;
    C --> G[Component Re-render / State Update];
```

### 3. 💻 UI Logic and Component Implementation Details

#### A. Type Safety (`typescript` enforced)
Every component and state slice must be strictly typed.

**Example: `SearchInput` Component**

```typescript
// src/components/SearchInput/SearchInput.tsx

import React from 'react';

// 1. Define component props (Strict Interface)
interface SearchInputProps {
  placeholder: string;
  onSearchChange: (query: string) => void;
  isLoading: boolean; // Passed down from the parent Organism
}

/**
 * Represents a Molecule component for search input.
 */
const SearchInput: React.FC<SearchInputProps> = ({
  placeholder,
  onSearchChange,
  isLoading,
}) => {
  // 2. Internal Logic
  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onSearchChange(event.target.value);
  };

  // 3. Render (Presentation Logic)
  return (
    <div className="relative">
      <input
        type="text"
        placeholder={placeholder}
        onChange={handleInputChange}
        disabled={isLoading}
        className="w-full py-2 border rounded-lg disabled:opacity-70"
      />
      {isLoading && (
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
          {/* Avatar component used here */}
          <Spinner /> 
        </div>
      )}
    </div>
  );
};

export default SearchInput;
```

#### B. Handling Backend Dependencies

| Service | Frontend Impact / Logic | Best Practice Note |
| :--- | :--- | :--- |
| **PostGIS (`db`)** | The frontend never interacts with PostGIS directly. The `lokask_api` must handle all geospatial calculations and filtering. | Use parameterized search requests (e.g., searching by bounding box coordinates) and expect the response data structure to include geo-attributes if necessary. |
| **Redis (`redis`)** | Caching logic is entirely managed by the `lokask_api`. | The frontend should implement fallback/debounce logic for API calls, assuming the API *might* be reading from Redis. Use `useQuery` to handle potential network latency gracefully. |
| **Backend (`lokask_api`)** | Primary interface. All CRUD operations, authentication, and complex logic flow through this service (Port 8080). | Implement **Error Boundary** components globally. Since the API manages multiple functions (Search, Booking, User), the frontend must handle specific API error codes (e.g., 401, 400, 500) and display user-friendly feedback. |

### 4. ✨ Performance & Deployment Focus (Vite)

1.  **Code Splitting:** Utilize React.lazy() and Suspense combined with Vite's build capabilities to implement aggressive code splitting. Pages (Organisms) should only load necessary vendor code and module chunks on demand (e.g., `HomePage` loads on `/`, `BookingPage` loads on `/book`).
2.  **Environment Variables:** All runtime configuration (API base URL) must be managed via Vite's environment variables (`import.meta.env.*`) to ensure separation from the build process.
3.  **Image Optimization:** Use dedicated components and libraries for lazy loading and optimizing displayed images, especially avatars and media assets retrieved from S3.

---

*this content was created by AI, but the coding and underlying logic are not.*