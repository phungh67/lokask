[⬅ Return to Main Compendium](../../../../../../README.md)

As a senior backend officer specializing in Go and robust backend logic, I have analyzed the provided `domain` package structures. These models define the core data interactions for a consultation platform.

Based on these structures, I will document the core business logic, the presumed API surfaces, and the recommended repository patterns to maintain clean separation of concerns (following the Repository Pattern).

---

## 🏛️ Backend Architecture Documentation: Consultation Platform

### 1. Core Domain Models Analysis

The provided structures are well-typed and cover key areas: professional profiles (`ConsultantProfile`), transactional data (`ConsultantSession`), and feedback (`Review`).

| Struct | Purpose | Key Relationships | Notes |
| :--- | :--- | :--- | :--- |
| `ConsultantProfile` | Detailed public view of a consultant. | `Review`, `Badge`, `Niche` (via `Tags`), `pq.StringArray` (Languages/Images) | Heavily denormalized for read performance (e.g., `Rating`, `Badges` are calculated/cached). |
| `Review` | Client feedback mechanism. | N/A | Basic review structure, optimized for storage/display. |
| `ConsultantSession` | Billing and booking records. | N/A | Critical for billing logic; tracks status and timing. |
| `Paginated...` | Standardized API response wrappers. | N/A | Essential for cursor-based or offset-based list fetching. |
| `Badge` | Trust indicators. | N/A | Derived/calculated data point. |

### 2. API Surface Design (The Handlers/Services Layer)

The API surface defines the external contract. Given the complexity, we must define service endpoints that orchestrate multiple repository calls.

#### 2.1 Consultant Endpoints (`/consultants`)

| Endpoint | HTTP Method | Function | Logic Flow | Return Type |
| :--- | :--- | :--- | :--- | :--- |
| `/` | `GET` | Search & List Consultants | **Service:** Search (filters by `Tags`, `City`, `Rating`), Pagination. **Repo:** `GetConsultantList(filters, page, limit)`. | `PaginatedConsultants` |
| `/:id` | `GET` | Get Single Profile | **Service:** Fetch profile data. Requires joining the consultant record with **Reviews** and **Badges** (read-optimized join query). | `ConsultantProfile` |
| `/search` | `GET` | Filter & Discover | Similar to `GET /`, but optimized for tag/niche filtering. | `PaginatedConsultants` |

#### 2.2 Reviews Endpoints (`/reviews`)

| Endpoint | HTTP Method | Function | Logic Flow | Request/Response |
| :--- | :--- | :--- | :--- | :--- |
| `/` | `POST` | Submit New Review | **Service:** Validate rating/comment. Create `Review` record and then trigger a dedicated **Profile Update Service** to recalculate and update the consultant's aggregate `Rating` and `HelpedCount`. | `Review` (POST body) -> 201 |

#### 2.3 Session & Booking Endpoints (`/sessions`)

| Endpoint | HTTP Method | Function | Logic Flow | Request/Response |
| :--- | :--- | :--- | :--- | :--- |
| `/book` | `POST` | Initiate Booking | **Service:** Check consultant availability (business logic). Create `ConsultantSession` record in `PENDING` status. | Booking Request -> Session ID |
| `/:id/status` | `PUT` | Update Session Status | **Service:** Update status (`STARTED`, `COMPLETED`, `CANCELLED`). This is the trigger point for billing/payment reconciliation. | Status Update Payload |

### 3. Repository Patterns Implementation (The Data Access Layer)

The repository layer must abstract the persistence logic. Given the use of `pq.StringArray` and complex joins, the repository implementations will leverage PostgreSQL's advanced capabilities (CTEs, JSONB, array operators).

#### 3.1 `ConsultantRepository`

**Goal:** Efficient read access, especially for public profiles.

*   **`GetProfileByID(ctx context.Context, id uuid.UUID) (*domain.ConsultantProfile, error)`:**
    *   **Logic:** Must perform a single, optimized JOIN query that fetches the primary profile data, aggregates the average rating, and fetches the N items of associated `Badges` and `Reviews` (N+1 problem mitigation via JOINs or two separate calls/struct composition).
    *   **Query Consideration:** Use PostgreSQL JSON aggregation or CTEs to handle the many-to-many and one-to-many relationships efficiently.
*   **`SearchConsultants(ctx context.Context, filters *SearchCriteria) ([]domain.ConsultantProfile, int, error)`:**
    *   **Logic:** Builds dynamic query filters (e.g., `WHERE city = $1 AND tags @> ARRAY[$2]`). Needs to handle pagination parameters (OFFSET/LIMIT or Keyset/Cursor).
    *   **Output:** Returns the list of profiles and the total count of matching profiles.

#### 3.2 `ReviewRepository`

**Goal:** High-volume write and aggregation.

*   **`CreateReview(ctx context.Context, review *domain.Review) error`:**
    *   **Logic:** Simple INSERT into the `reviews` table.
    *   **Critical Step:** After successful insertion, this repository method must *signal* or *trigger* the business service to recalculate the aggregate rating for the associated consultant.
*   **`GetReviewsByConsultant(ctx context.Context, consultantID uuid.UUID, page, limit int) ([]domain.Review, int, error)`:**
    *   **Logic:** Pagination query on the `reviews` table.

#### 3.3 `SessionRepository`

**Goal:** Transactional integrity and temporal state management.

*   **`CreateSession(ctx context.Context, session *domain.ConsultantSession) error`:**
    *   **Logic:** INSERT. Must handle initial state validation (e.g., `PackageType` existence).
*   **`UpdateSessionStatus(ctx context.Context, sessionID uuid.UUID, newStatus string) (*domain.ConsultantSession, error)`:**
    *   **Logic:** `UPDATE` query with state machine validation (e.g., a session cannot go from `CANCELLED` to `STARTED`).
    *   **Transaction Scope:** This action is often the boundary for financial transactions and must be wrapped in a database transaction.

### 4. Key Backend Logic Flow (Business Service Level)

The service layer coordinates these repositories to enforce business rules.

**Flow: Rating Recalculation (After Review Submission)**

1.  **Client $\rightarrow$ Service:** `POST /reviews` (Submit Review).
2.  **Service $\rightarrow$ Repo:** `ReviewRepository.CreateReview(...)`
3.  **Repo:** Inserts review record.
4.  **Repo $\rightarrow$ Signal/Service:** Triggers an event or calls a dedicated service method: `RateService.RecalculateConsultantRating(consultantID)`.
5.  **RateService:**
    *   A. Queries `ReviewRepository` to fetch ALL relevant reviews for the consultant.
    *   B. Calculates `TotalRating` ($\Sigma$ of all ratings) and `ReviewCount` (Count of all reviews).
    *   C. Updates the `consultants` table (or a dedicated `consultant_stats` table) with the new `rating_avg` and `helped_count`.

---
*this content was created by AI, but the coding and underlying logic are not.*