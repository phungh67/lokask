[⬅ Return to Main Compendium](../../../../../../README.md)

As a senior frontend officer specializing in TypeScript and Vite, I have analyzed the provided Go domain package. This package defines the core data model for our "Consultant Profile" system.

My primary task is to translate these backend domain models into robust, type-safe TypeScript interfaces, define the optimal component structure, and outline the necessary state management logic to ensure a clean, scalable, and performant frontend application.

---

## 🧬 1. TypeScript Contracts (Data Modeling)

Before implementing any logic, we must establish the canonical TypeScript types based on the Go structs. This ensures strong typing across the entire frontend stack.

```typescript
// src/types/domain.ts

import { UUID } from 'crypto';

/**
 * 🏆 Badge represents a trust indicator.
 */
export interface Badge {
  id: string;        // e.g. "tenure_gold", "verified_id"
  iconName: string;  // Hint for frontend icon (optional)
  title: string;
  description: string;
}

/**
 * 📝 Review represents a single review left for a consultant.
 */
export interface Review {
  id: UUID;
  reviewerName: string;
  reviewerAvatar: string;
  rating: number;       // Assuming int in Go translates to number in TS
  comment: string;
  verifiedStay: boolean;
  createdAt: string;    // Date string (ISO 8601)
}

/**
 * 👤 ConsultantProfile holds all detailed information about a consultant.
 */
export interface ConsultantProfile {
  // Basic Identity
  id: UUID;
  userId: UUID;
  name: string;
  displayName: string;

  // Media & Presentation
  avatarUrl: string;
  coverUrl: string;
  galleryImages: string[]; // pq.StringArray -> string[]
  
  // Core Content & Stats
  bio: string;
  quote: string;
  rating: number;
  helpedCount: number;

  // Professional Status
  isHighlyTrusted: boolean;
  hourlyRate: number;

  // Location & Niches
  city: string;
  country: string; // Omitable
  tags: string[];  // Niche tags

  // Operational Data
  languages: string[]; // pq.StringArray -> string[]
  responseTime: string;
  joinedAt: string; // time.Time -> ISO date string
  badges: Badge[];
  reviews: Review[]; // Note: Reviews might be loaded separately for efficiency

  // Optional: Temporary/Backend-derived fields
  tag?: string; 
}

/**
 * 📦 Pagination Helper Types
 */
export interface PaginatedConsultants<T> {
  data: T[];
  totalCount: number;
  page: number;
  limit: number;
}

/**
 * 💼 Session and Billing System
 */
export interface ConsultantSession {
  id: UUID;
  conversationId: UUID;
  packageType: string;
  durationHours: number;
  status: 'pending' | 'active' | 'completed' | 'failed'; // Refinement for Status
  paidAt: string;
  startedAt: string;
  expiresAt: string;
  createdAt: string;
}
```

---

## 🌐 2. State Management Strategy

Given the complexity and interdependence of the data (e.g., the main profile vs. the list of profiles), a centralized state management pattern (like React Query/TanStack Query or a Redux/Zustand store) is recommended.

### A. Primary State Hook: `useConsultantProfiles`

We should decouple the fetching and caching of the profile list from the profile details themselves.

**Technology:** React Query (`useQuery`)

**Purpose:** Manages the paginated list of profiles (`PaginatedConsultants`).

**Logic Flow:**
1. **Fetch Hook:** `useConsultantProfiles({ page: currentPage, limit: LIMIT })`
2. **State Keys:** Use a cache key based on the page/limit (e.g., `['consultants', currentPage, LIMIT]`).
3. **Data Structure:** The hook returns `data: PaginatedConsultants<ConsultantProfile>`.
4. **Side Effects:** Should handle pagination changes and potential server-side filtering/sorting.

### B. Secondary State Hook: `useConsultantDetails`

**Technology:** React Query (`useQuery`)

**Purpose:** Manages the specific, detailed view of one consultant (the single `ConsultantProfile`).

**Logic Flow:**
1. **Fetch Hook:** `useConsultantDetails(consultantId: UUID)`
2. **Caching:** Cache the full profile data by `consultantId`.
3. **Optimistic Updates:** This is crucial for actions like updating a user's bio or marking a review, allowing the UI to react instantly while the API call finishes.

---

## 🧱 3. Component Architecture

We will break down the UI into logical, reusable components, ensuring that each component receives only the props it absolutely needs.

### 🎯 A. The Profile List View (Container Component)

**Component:** `<ConsultantListContainer />`
**Purpose:** Orchestrates the fetching and displaying of multiple profiles.
**State Consumption:** `useConsultantProfiles` hook.

| Props/State | Type | Description |
| :--- | :--- | :--- |
| `currentPage` | `number` | Current page number (managed internally). |
| `totalCount` | `number` | Total number of available consultants (from API). |
| `profiles` | `ConsultantProfile[]` | Array of data to render. |
| `isLoading` | `boolean` | State for loading indicators. |

**Key Logic:**
1. **Pagination:** Must handle page changes (`onPageChange`) and trigger the `useConsultantProfiles` hook refresh.
2. **Mapping:** Iterates over `profiles` and renders `<ConsultantCard />` for each entry.
3. **Error Handling:** Displays a graceful error message if the fetch fails.

### 💳 B. The Consultant Card (Presentational Component)

**Component:** `<ConsultantCard />`
**Purpose:** A summarized, actionable view of a single consultant (e.g., on a search results page).
**Props:** Requires a single `ConsultantProfile` object.

| Prop | Type | Description |
| :--- | :--- | :--- |
| `profile` | `ConsultantProfile` | The full profile data snapshot. |
| `onClick` | `(id: UUID) => void` | Callback function to navigate to the detailed view. |

**Key Logic:**
1. **Display Logic:** Must prioritize showing the `displayName`, `rating`, `hourlyRate`, and `tags`.
2. **Optimization:** Should use image placeholders and lazy loading for `avatarUrl` and `coverUrl`.
3. **Badges:** Iterates over `profile.badges` and renders `<Badge />` component.

### 👤 C. The Profile Detail View (Container/Presentational Mix)

**Component:** `<ConsultantProfileDetailView />`
**Purpose:** The full, immersive view of a single consultant.
**State Consumption:** `useConsultantDetails` hook.

| Props | Type | Description |
| :--- | :--- | :--- |
| `consultantId` | `UUID` | ID of the consultant to view. |
| `onUpdate` | `(profile: ConsultantProfile) => void` | Callback used when the profile is edited (e.g., by the consultant themselves). |

**Child Components:**
1. `<BioSection profile={profile} />`: Displays `bio`, `quote`, and `galleryImages`.
2. `<StatsBadgeList profile={profile} />`: Displays calculated metrics (Rating, HelpedCount, etc.) and the `Badge[]` array.
3. `<LanguageTagList languages={profile.languages} />`: Renders individual language chips.
4. `<ReviewsSection reviews={profile.reviews} />`: Handles the display of all submitted reviews.

### 🚀 D. Auxiliary Components

| Component | Purpose | Props | Logic Notes |
| :--- | :--- | :--- | :--- |
| `<Badge />` | Atomic display unit for trust indicators. | `badge: Badge` | Handles icon mapping based on `iconName`. |
| `<PaginationControls />` | Handles page navigation. | `currentPage: number`, `totalPages: number`, `onPageChange: (page: number) => void` | Should be accessible in both the List and search contexts. |
| `<PricingCard />` | Displays billing information. | `hourlyRate: number`, `durationHours: number` | Uses formatters (e.g., `$10.00/hour`). |

---

## ⚙️ 4. Frontend Logic Summary & Best Practices

### 💡 Data Fetching and Transformation
1. **Time Handling:** All `time.Time` fields (`joinedAt`, `createdAt`, etc.) must be treated as ISO 8601 strings on the client side and formatted into user-friendly relative time strings (e.g., "3 days ago").
2. **Type Coercion:** The backend uses `float64` for rates and `int` for ratings. TypeScript requires consistent handling (e.g., `rating` should be treated as `number`).
3. **Memoization:** Use `React.useMemo` and `React.useCallback` heavily in the parent container components to prevent unnecessary re-renders, especially when calculating derived state (like a combined "Trust Score" based on badges).

### ✨ UX & Interaction Logic
*   **Search/Filtering:** If searching, the `ConsultantListContainer` should first initiate a search/filter API call, which updates the `totalCount` and sets `page: 1`.
*   **Editable Content:** When a consultant views their own profile, the "Bio Section" must transform into an editable form component, utilizing client-side state to hold draft data until a successful update API call is made.
*   **Performance:** For the Profile Detail View, the `ReviewsSection` should implement **virtualization** (e.g., using `react-window`) if the consultant accumulates hundreds of reviews, preventing massive DOM overhead.

---

*this content was created by AI, but the coding and underlying logic are not.*