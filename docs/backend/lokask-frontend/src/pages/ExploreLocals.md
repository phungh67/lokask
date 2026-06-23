[⬅ Return to Main Compendium](../../../../../README.md)

## Component Analysis: `ExploreLocals`

As a senior backend officer specializing in Go and robust backend logic, I view this React component primarily as a sophisticated **Client-Side State Orchestrator and Consumer of a well-defined API endpoint**. The underlying structure heavily relies on controlled state transitions and predictable data fetching cycles.

### 🚀 Core Logic Documentation

The component's primary job is to fetch, filter, and paginate a list of "local consultants" data using a React Query hook (`useQuery`).

#### 1. State Management & Data Flow
The component maintains complex local state derived from URL parameters and user interactions:

*   **`searchParams`:** Holds the initial state from the URL (source of truth for default filters).
*   **`sidebarFilters` (FilterState):** This is the central filtering object. It dictates which criteria (location, niches, price range, etc.) are applied to the API request.
    *   **Triggering Change:** Changes occur via the `ExploreSidebar` component's `onApply` handler, which updates the state and critically resets the page to `1`.
*   **`page`:** Manages the current pagination index.
*   **`useQuery` Dependency Array:** The core logic is tied to the query key: `["consultants", "explore", sidebarFilters, page]`. *Any change to `sidebarFilters` or `page` automatically triggers a new API call.*

#### 2. Data Fetching Logic
*   **Source:** The API interaction is mediated by `getConsultants(...)`.
*   **Function:** The function takes granular parameters derived from the component state (`page`, `limit`, `city`, `niches`, etc.).
*   **Efficiency:** By using `react-query` with a key derived from *all* filters and the page number, the component ensures cache invalidation and automatic refetching only when the underlying filter criteria or page changes, preventing unnecessary network calls.
*   **Pagination Logic:** The UI implements standard robust pagination, calculating `totalPages` from the `total_count` returned by the API, ensuring the user interface is always synchronized with the API response metadata.

#### 3. Interaction Flow (The "Backend View")
1.  **Initial Load:** Reads filters from URL -> Calls API (`getConsultants`) using current URL parameters and Page 1.
2.  **Filter Change:** User interacts with `ExploreSidebar` $\rightarrow$ `onApply` handler executes $\rightarrow$ `setSidebarFilters(newFilters)` and `setPage(1)` $\rightarrow$ React Query detects the change in the query key $\rightarrow$ *API Re-call triggered with new parameters.*
3.  **Pagination Change:** User clicks page number or next/prev $\rightarrow$ `setPage(newPage)` $\rightarrow$ React Query detects the change in the query key $\rightarrow$ *API Re-call triggered with same filters but new page number.*

---

### 🌐 API Surfaces

The component assumes and consumes a well-designed RESTful endpoint, which I will model below.

**Endpoint:** `/api/v1/consultants/explore` (or similar)
**Method:** `GET`

**Parameters (Query String):**

| Parameter | Type | Description | Source Component State | Required/Optional |
| :--- | :--- | :--- | :--- | :--- |
| `page` | Integer | The requested page number for pagination. | `page` state | Optional (Default 1) |
| `limit` | Integer | The number of results per page (e.g., 12). | `ITEMS_PER_PAGE` constant | Optional |
| `city` | String | Filter by geographical location. | `sidebarFilters.location` | Optional |
| `niches` | Array\<String\> | Filter by specialized subject areas. | `sidebarFilters.niches` | Optional |
| `languages` | Array\<String\> | Filter by consulting language(s). | `sidebarFilters.languages` | Optional |
| `min_price` | Number | The minimum allowed consultation cost. | Derived from `priceRange[0]` | Optional |
| `max_price` | Number | The maximum allowed consultation cost. | `sidebarFilters.priceRange[1]` | Optional |
| `min_rating` | Float | Minimum required user rating. | `sidebarFilters.minRating` | Optional |

**Response Body Structure (Object/JSON):**

```json
{
  "total_count": 150,        // Total number of consultants matching ALL filters
  "page": 2,                  // The page requested
  "limit": 12,                // Results per page
  "data": [
    // Array of consultant objects (ConsultantCardCompact prop)
    {
      "id": "c123",
      "name": "John Doe",
      "description": "Local expert in...",
      "price": 75,
      "rating": 4.8,
      "city": "Paris"
      // ... other fields
    }
    // ... 11 more consultants
  ]
}
```

---

### 💾 Repository Pattern Implementation (Go/GoLang Focus)

In a modern backend architecture (especially using Go), the data fetching logic should be isolated within a dedicated repository layer to ensure testability, separation of concerns, and adaptability to changing data sources (e.g., moving from Postgres to MongoDB).

#### 1. Go Data Structures (DTOs/Models)

We define structures mirroring the API contract.

```go
// models/consultant.go

// Consultant represents a single local consultant entity.
type Consultant struct {
	ID          string    `json:"id"`
	Name        string    `json:"name"`
	City        string    `json:"city"`
	Description string    `json:"description"`
	Price       float64   `json:"price"`
	Rating      float64   `json:"rating"`
	// Add other fields...
}

// FilterCriteria holds all possible input parameters for the search.
type FilterCriteria struct {
	Page        int
	Limit       int
	City        string
	Niches      []string
	Languages   []string
	MinPrice    float64
	MaxPrice    float64
	MinRating   *float64 // Using pointers for nullable fields
}

// PaginatedResult holds the full API response structure.
type PaginatedResult struct {
	TotalCount int           `json:"total_count"`
	Data       []Consultant  `json:"data"`
	Page       int           `json:"page"`
	Limit      int           `json:"limit"`
}
```

#### 2. Go Repository Interface

This interface defines the contract for data fetching, allowing us to swap implementations (e.g., from PostgreSQL to a mocked service) without changing business logic.

```go
// Repository defines the methods required to interact with the persistence layer.
type Repository interface {
	SearchConsultants(ctx context.Context, params SearchParams) (*SearchResult, error)
}

// SearchParams encapsulates all necessary query parameters.
type SearchParams struct {
	Limit int
	LimitOffset int
	City string
	MinRating float64
	// ... other parameters mapped from the frontend state
}

// SearchResult holds the structured result from the database.
type SearchResult struct {
	Results []Consultant
	TotalCount int
}
```

#### 3. Implementation (Conceptual)

The actual concrete implementation (`SQLRepository`) would then use the `SearchParams` to construct and execute a complex SQL query, handling pagination (`LIMIT`/`OFFSET`) and dynamic filtering dynamically at the database level.

This structure ensures **Testability**, **Maintainability**, and **Separation of Concerns**. The frontend (or service layer) only interacts with the `Repository` interface, remaining agnostic to whether the data comes from Postgres, Mongo, or a dummy JSON file.