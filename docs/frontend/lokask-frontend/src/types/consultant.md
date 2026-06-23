[⬅ Return to Main Compendium](../../../../../README.md)

# ⚙️ System Architecture & Component Documentation

## Project Context Overview

These interfaces define the core data models for a User Profile and Consultant Directory feature. Given the structure (ratings, badges, detailed personal information), this system likely involves significant state management, API interaction, and complex presentation logic.

Our goal is to build a highly performant, type-safe, and maintainable UI layer using TypeScript and a modern frontend architecture supported by Vite.

---

## 📁 Data Models Analysis (TypeScript Interfaces)

The provided interfaces are excellent starting points for defining API contracts. We will treat them as immutable data structures passed down to our components.

### 1. `Badge`
Defines structured achievement data.

*   **Usage:** Used for visual flair and credibility indicators on the profile.
*   **Key Consideration:** The `icon_name` suggests this data must map to a known asset collection (e.g., an internal Icon component library).

### 2. `Review`
Defines structured feedback.

*   **Usage:** Critical for social proof and determining overall consultant reliability.
*   **Key Consideration:** Sorting and pagination logic will be required when displaying lists of reviews.

### 3. `Consultant`
The core entity representing the user profile data.

*   **Usage:** This model drives the primary display component (`<ConsultantProfileCard />`) and the data structure for the global state store.
*   **Architecture Note:** The optional fields (`?`) are vital. The consuming components must handle `null` or `undefined` states gracefully (e.g., showing "N/A" instead of crashing).

### 4. `UpdateProfileRequest`
Defines the payload for mutations (API writes).

*   **Usage:** This strongly suggests a dedicated state slice or form handler. Since it contains `main_niche_id` and `city_id` (IDs), the form component must handle select/dropdown inputs that map to these numerical identifiers.

---

## 💡 State Management Strategy

We recommend utilizing a dedicated global state management library (e.g., **Zustand** or **Pinia**) for handling asynchronous data fetching and user profile data, ensuring atomic updates and separation of concerns.

### 1. State Structure (`useConsultantStore`)

| State Field | Type | Source Model | Description |
| :--- | :--- | :--- | :--- |
| `consultant` | `Consultant \| null` | `Consultant` | The currently loaded, main profile data. |
| `isLoading` | `boolean` | N/A | Tracks the status of data fetching. |
| `error` | `Error \| null` | N/A | Captures any API failure. |
| `reviews` | `Review[]` | `Review` | Paginated/filtered list of reviews. |
| `badges` | `Badge[]` | `Badge` | Collection of displayed badges. |
| `isEditing` | `boolean` | N/A | Controls whether the profile form is visible. |

### 2. State Logic Flow (Thunks/Actions)

1.  **`fetchConsultantProfile(userId: string)`:**
    *   *Action:* Calls the API endpoint for the `Consultant`.
    *   *Logic:* Updates `isLoading` to `true`. On success, sets the `consultant` state and potentially triggers parallel fetches for `reviews` and `badges`.
2.  **`updateConsultantProfile(data: UpdateProfileRequest)`:**
    *   *Action:* Takes the client-side form data and validates/transforms it into `UpdateProfileRequest`.
    *   *Logic:* Sends data to the mutation endpoint. On success, updates the local `consultant` state *optimistically* before confirming the API write.

---

## 🧱 Component Architecture & Logic Flow

We adopt a compositional, container/presentational component structure.

### 1. Container Component: `<ConsultantProfilePage />`

*   **Purpose:** Manages state, fetches data, and orchestrates child components.
*   **Logic:**
    1.  Hooks into `useConsultantStore`.
    2.  Calls `fetchConsultantProfile` on mount.
    3.  Conditional rendering based on `isLoading` or `error`.
    4.  Passes derived and structured props to the sub-components.

### 2. Presentational Components (UI View)

#### A. `<ConsultantHeader />`
*   **Inputs:** `Consultant` (read-only).
*   **Logic:** Displays `name`, `displayName`, `avatarUrl`, `quote`, and `rating`.
*   **Optimization:** Uses the `Consultant.isHighlyTrusted` flag to conditionally render a premium ribbon component.

#### B. `<BadgeDisplay />`
*   **Inputs:** `Badge[]` (read-only).
*   **Logic:** Iterates over the `badges` array. Maps each `Badge` object to an `<IconBadge />` component.
*   **Flow:** *Critical:* Handles potential empty array input gracefully.

#### C. `<ReviewSection />`
*   **Inputs:** `Review[]` (read-only).
*   **Logic:** Manages pagination (if implemented). Maps each `Review` to `<ReviewCard />`.
*   **Flow:** Implements filtering/sorting logic (e.g., sort by `date` descending).

### 3. Form & Interaction Component: `<EditProfileForm />`

*   **Inputs:** `Consultant` (initial state), `UpdateProfileRequest` (payload model).
*   **Dependencies:** Requires a robust form management library (e.g., React Hook Form) for validation and state handling.
*   **Logic:**
    1.  On mount, pre-populates form fields using `Consultant` data.
    2.  Handles complex data types:
        *   `city_id`: Must use a controlled Select component fetching IDs from a separate locale service.
        *   `tags`: Requires a multi-select input that allows selecting multiple values, converting them into the `string[]` array format.
    3.  On submit, executes the validation pipeline and calls the `updateConsultantProfile` store action.

---

## 🚀 Vite Configuration & Build Strategy

Since we are using Vite, we leverage its speed for rapid development cycles.

1.  **TypeScript Strictness:** Enforce `strict: true` in `tsconfig.json`. Leverage TypeScript interfaces at every API boundary and component prop definition.
2.  **Atomic Components:** Each presentational component must be fully typed and isolated (zero side effects).
3.  **API Layer:** Implement a dedicated `apiClient.ts` file to encapsulate all external HTTP calls, ensuring consistency, error handling, and base URL management, keeping the components clean and pure.

---

*this content was created by AI, but the coding and underlying logic are not.*