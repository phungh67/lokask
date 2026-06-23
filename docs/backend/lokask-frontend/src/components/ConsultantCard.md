[⬅ Return to Main Compendium](../../../../../README.md)

## Backend Architecture Documentation: ConsultantCard Feature

As a senior backend officer, I have reviewed the `ConsultantCard` component logic. This component is responsible for displaying an external consultant's profile summary and providing several key interaction points (navigation, favoriting, requesting advice).

The core backend focus areas are defining the robust data contracts (Models) and the precise API endpoints required to support the displayed functionality, ensuring clean separation of concerns from the client-side presentation layer.

---

### 1. Data Model (Input Contract)

The component relies heavily on the `Consultant` structure. This must be rigorously defined as the primary data transfer object (DTO) retrieved from the backend.

**Interface:** `Consultant`

| Field | Type | Description | Constraints | Notes |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `string` (UUID) | Unique identifier for the consultant. | Required, Non-Empty | Primary Key. |
| `name` | `string` | The full display name of the consultant. | Required | Fallback for `displayName`. |
| `displayName` | `string` | User-preferred display name. | Optional | Nullable. |
| `city` | `string` | The geographical location of the consultant. | Required | Used for localized context. |
| `avatarUrl` | `string` | URL pointing to the consultant's profile picture. | Required | Image hosting required. |
| `quote` | `string` | A short quote or personal motto. | Optional | Max length constraint recommended. |
| `tags` | `[]string` | List of relevant keywords (e.g., "History," "Local Guide"). | Optional | Used for filtering and display. |
| `rating` | `float` | Aggregate user rating (e.g., 4.8). | Required | Must be >= 0.0 and <= 5.0. |
| `helpedCount` | `int` | Total number of successful consultations/help requests. | Required | Non-negative integer. |
| `isHighlyTrusted` | `bool` | System flag indicating high reliability/verification. | Default: `false` | Used for badge logic. |
| `isMostAskedLocal` | `bool` | System flag indicating high local demand/interest. | Default: `false` | Used for badge logic (redundant with `showMostAskedBadge` prop, but good for server-side trust). |

### 2. API Surfaces & Endpoints

The following API operations are triggered by user interactions within the `ConsultantCard` component. These must be secured, requiring appropriate authorization checks.

#### A. Read Operation (Data Retrieval)

| Endpoint | Method | Description | Request Body | Response Body | Authorization |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `/api/v1/consultant/{id}` | `GET` | Retrieves the full profile summary for a specific consultant. | None | `Consultant` DTO | None (Public) |
| `/api/v1/consultants/search` | `GET` | Searches and lists consultants based on criteria (e.g., `city`, `tags`). | Query Params: `city`, `tags` | `[]Consultant` | None (Public) |

#### B. Write Operations (State Modification)

These operations modify the database state and must handle transactionality.

| Endpoint | Method | Action Triggered | Request Body | Success Response | Authorization |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `/api/v1/consultant/{id}/wishlist` | `POST` | Adds the consultant to the user's personal wishlist (Heart icon click). | `{ user_id: UUID }` | Status 204 No Content | **Required:** Authenticated User |
| `/api/v1/consultant/{id}/ask` | `POST` | Initiates a formal request to "Ask this local" (Button click). | `{ user_id: UUID }` | Status 202 Accepted | **Required:** Authenticated User |
| `/api/v1/user/prompt/status` | `GET` | Retrieves the current necessary authentication status details. | None | `{ requireAuth: bool, message: string }` | None (Public) |

### 3. Core Logic Flow & Backend Implementation Details

#### 3.1. Navigation (`handleCardClick` / Button Click)
*   **Client Logic:** Navigates the user to the dedicated profile page (`/consultant/${consultant.id}`).
*   **Backend Dependency:** `GET /api/v1/consultant/{id}` (Must retrieve full profile details).
*   **Implementation Note:** The backend only needs to ensure the path parameter `{id}` maps correctly to the primary key.

#### 3.2. Favoriting (Heart Icon Button)
*   **Client Logic:** Calls `requireAuth` and, if successful, triggers the wishlist action.
*   **Backend Logic:**
    1.  Validate the `user_id` and `consultant_id`.
    2.  Implement Upsert logic: Check if the relationship (User $\leftrightarrow$ Consultant) already exists in the Wishlist junction table.
    3.  If yes, update timestamp. If no, insert record.
    4.  *Security:* Must validate that the user is authenticated before proceeding.

#### 3.3. Requesting Help (Ask this local Button)
*   **Client Logic:** Calls `requireAuth` and, upon successful authentication, triggers the request to consult.
*   **Backend Logic:**
    1.  Validate User and Consultant existence.
    2.  Create a new `ConsultationRequest` record associated with the user, consultant, and timestamp.
    3.  This service call must trigger event listeners (e.g., notifying the consultant or admin panel) to manage the subsequent interaction lifecycle.
    4.  *Rate Limiting:* Implement a rate limit (e.g., max 3 requests per user per day) at the endpoint level to prevent abuse.

#### 3.4. Authentication Prompt Management
*   **Client Logic:** Uses `useAuthPrompt` to determine if the user needs to sign up/log in before proceeding with a write action.
*   **Backend Dependency:** The `/api/v1/user/prompt/status` endpoint must determine the *required role* and *action type* (e.g., `wishlist`) to guide the client flow seamlessly.

***

*this content was created by AI, but the coding and underlying logic are not.*