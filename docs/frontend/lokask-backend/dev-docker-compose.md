[⬅ Return to Main Compendium](../../../README.md)

## 💻 Lokask Frontend Architecture Documentation

As the Senior Frontend Officer, my focus is on leveraging TypeScript and Vite to build a highly performant, maintainable, and type-safe user experience. The provided infrastructure stack confirms a robust microservice architecture, which dictates our API communication patterns and state handling within the frontend.

This document outlines the intended UI logic, state management pattern, and component architecture for the `lokask-frontend` application.

---

### 🏗️ 1. System Architecture Overview

The frontend will operate as a Single Page Application (SPA) built with modern React/Vue principles (assuming React for best synergy with TypeScript typing). Vite ensures lightning-fast development builds and optimized production bundles.

**Key Flow & Interaction:**

1.  **Client $\rightarrow$ Backend:** The frontend (served on `http://localhost:80`) makes all data requests to the `backend` service, which is exposed on port `8080` (`localhost:8080`).
2.  **Backend $\rightarrow$ Services:** The backend service handles all the complex integrations (PostGIS, MinIO, Redis) using the internal service names (`db`, `minio`, `redis`).
3.  **Data Contracts:** All communication must strictly adhere to the JSON schemas defined by the backend API endpoints.

**Goal:** Maximize Separation of Concerns. The UI components must be completely decoupled from the underlying data fetching logic, which must be strictly typed.

### ⚙️ 2. Component Architecture (Composition & Structure)

We will adopt a modular component design following the pattern: **Atomic $\rightarrow$ Molecule $\rightarrow$ Organism**.

#### A. Layering Strategy:

*   **Atoms:** The smallest, reusable UI elements (e.g., `Button.tsx`, `InputField.tsx`, `LoadingSpinner.tsx`). These components accept standard props and manage minimal state.
*   **Molecules:** Combinations of Atoms to form simple UI units (e.g., `SearchForm` (Atom + Atom + Button), `CardHeader`).
*   **Organisms:** Complex, self-contained sections of the UI that manage their own state and logic (e.g., `TripList`, `UserDashboard`). These components interact with the global state management layer.

#### B. Directory Structure (TypeScript Focus):

```
src/
├── assets/          # Images, icons, global styles
├── api/             # 🌟 API Client Layer (Axios/Fetch wrapper)
│   ├── lokaskApi.ts # Centralized API instance
│   ├── types.ts     # Centralized TypeScript interfaces for API responses
│   └── services/    # Grouped API calls (e.g., userService.ts, mapService.ts)
├── components/      # UI Components (Atoms/Molecules/Organisms)
│   ├── atoms/       # Button, InputField, Select
│   ├── molecules/   # SearchBar, FormGroup
│   └── organisms/   # TripList, DetailView
├── state/           # Global State Management (Zustand/Redux Toolkit)
│   ├── useAuthStore.ts
│   └── useCacheStore.ts
└── views/           # Page containers (Router level)
    ├── Dashboard.tsx
    ├── TripDetail.tsx
    └── Login.tsx
```

### 🧠 3. State Management (React Hooks & Reactivity)

To manage the complexity arising from multiple asynchronous data sources (DB data, MinIO assets, Redis cache hits), we will use a centralized, predictable state management system.

**Recommendation:** Use **Zustand** (or Redux Toolkit) for its minimal boilerplate and focus on simple, hook-based state logic.

#### A. State Segmentation:

1.  **Global State (`UseXyzStore`):** Holds session data, user profile, global loading flags, and application-level settings (e.g., `isSidebarOpen`).
2.  **Local State (React `useState`):** Managed within Organisms for temporary UI concerns (e.g., which tab is active, form input draft data).
3.  **Data Fetching State (React Query/SWR):** **CRITICAL.** We must use a dedicated data fetching library (e.g., React Query) to handle the complexity of:
    *   Caching API results (interacting with Redis indirectly).
    *   Automatic data invalidation (when a user updates a record).
    *   Managing loading, error, and stale data states automatically.

#### B. Type Safety Enforcement (TypeScript):

Every data structure pulled from the backend must be explicitly typed in the `src/api/types.ts` file. This guarantees that components consuming the state or props will fail compilation if the backend API changes, dramatically improving developer experience.

```typescript
// Example type definition derived from the backend service schema
export interface UserProfile {
  id: string;
  username: string;
  email: string;
  createdAt: Date;
}

// Example type definition for a fetched list of trips
export interface Trip {
  id: string;
  title: string;
  destination: string;
  startDate: Date;
  // Asset link structure, combining MinIO URL logic
  mainImage: string; 
}
```

### 🚀 4. API Integration & Data Flow (The `api` Layer)

The dedicated `api/` layer acts as the sole interface between the component logic and the network. This pattern is known as the **Service Layer** or **Data Repository**.

#### A. API Client Setup:

We will utilize a wrapper around `axios` (or the native `fetch` API) configured specifically for the backend endpoint: `http://localhost:8080`.

```typescript
// src/api/lokaskApi.ts
import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:8080/api/v1', // Target backend service
  headers: {
    'Content-Type': 'application/json'
  }
});

export const getTripDetails = async (tripId: string): Promise<Trip> => {
    const response = await API.get<Trip>(`/trips/${tripId}`);
    return response.data;
};

// ... more typed functions
```

#### B. Handling Assets (MinIO Integration):

Since the backend handles the interaction with MinIO, the frontend only needs to consume the final, public URL. The backend logic must ensure that any returned image object includes the correct publicly accessible `Minio_Public_Url` prefix.

**Action Item:** When rendering images, the component must use the image URL provided by the API, trusting that the backend has correctly signed or prepared the URL for direct display.

---
*this content was created by AI, but the coding and underlying logic are not.*