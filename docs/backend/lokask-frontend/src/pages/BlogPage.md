[⬅ Return to Main Compendium](../../../../../README.md)

As a senior backend officer specializing in Go and robust system design, I have reviewed the provided component structure. This component acts as a complex read-model view, aggregating data from at least three separate services/repositories (`Blog`, `ConsultantProfile`, `Search/Discovery`).

Below is a detailed breakdown of the core logic, API surface contracts, and necessary repository patterns required to support this view efficiently.

***

## System Architecture Document: Blog Read View

**Module:** `BlogPage`
**Purpose:** Display a detailed, enriched blog article view, requiring cross-service data hydration (Blog $\rightarrow$ Author Profile $\rightarrow$ Related Entities).
**Design Focus:** High read throughput, efficient data loading, and adherence to strict data contract enforcement.

### 1. Data Models & Payload Schema

We must enforce strict data contracts for the inputs and outputs of the required APIs.

#### A. `BlogPost` (Core Entity)
| Field | Type | Description | Notes |
| :--- | :--- | :--- | :--- |
| `ID` | `string` | Unique identifier of the article. | Primary Key for `getBlogById`. |
| `Title` | `string` | Display title of the article. | |
| `Summary` | `string` | Short summary displayed near the title. | |
| `Content` | `string` | Full HTML/Markdown content. | Source of truth for article body. |
| `AuthorID` | `string` | Foreign key linking to the author's profile. | **Crucial link.** |
| `AuthorName` | `string` | Display name of the author. | Denormalized for easy frontend consumption. |
| `AuthorAvatar` | `string` | URL to the author's avatar. | |
| `Category` | `string` | Article's primary category. | |
| `CoverImageUrl` | `string` | URL to the main article image. | |
| `ReadTime` | `string` | Estimated reading time (e.g., "5 mins"). | |
| `ViewsCount` | `int` | Total views of the article. | |
| `CreatedAt` | `string` | Timestamp of creation. | |

#### B. `ConsultantProfile` (Author Entity)
| Field | Type | Description | Notes |
| :--- | :--- | :--- | :--- |
| `ID` | `string` | Unique identifier for the consultant. | Primary Key. |
| `Name` | `string` | Full name of the consultant. | |
| `DisplayName` | `string` | Short, preferred display name. | Used for CTAs. |
| `AvatarURL` | `string` | URL to the consultant's avatar. | |
| `City` | `string` | Primary service location (e.g., "New York"). | **Crucial link for related discovery.** |
| `Bio` | `string` | Detailed biography/expertise summary. | Used for the full banner display. |

#### C. `LocalConsultant` (Related Discovery Entity)
This model is used generically for related results, matching the `ConsultantProfile` schema but emphasizing its role in a list/carousel.

### 2. API Surfaces (Contract Layer Definition)

The frontend logic translates into three primary service calls (which should ideally be wrapped in a single orchestration service/resolver on the backend).

#### A. Service: `BlogService`
*   **Endpoint/Function:** `/api/blogs/{blogId}` (GET)
*   **Input:** `blogId: string`
*   **Output:** `BlogPost` payload (Model A).
*   **Logic:** Retrieves the full article content and core metadata.

#### B. Service: `ConsultantService`
*   **Endpoint/Function:** `/api/consultants/by-user/{userId}` (GET)
*   **Input:** `userId: string` (Must match `BlogPost.AuthorID`).
*   **Output:** Full `ConsultantProfile` (Author's details).
*   **Secondary Endpoint:** `/api/consultants/nearby?city={city}`
    *   **Input:** City/Location name.
    *   **Output:** Array of `ConsultantProfile` objects.

#### C. Data Flow Orchestration (Conceptual Endpoint)
Instead of three separate calls, the client/backend should ideally use a single, cached endpoint to minimize waterfall dependencies.

`GET /api/v1/articles/{articleId}/details`

**Responsible Service:** Orchestrator/Gateway API.

### 3. Backend Implementation Details & Flow (Pseudocode Logic)

The execution flow must be resilient (handling `nil` or empty results) and performant (using caching/batching).

```pseudocode
FUNCTION getArticleDetails(articleId):
    // 1. Fetch Primary Content
    articleData = callService("GET /api/v1/articles/" + articleId)
    IF articleData IS NULL OR articleData.status != "published":
        RETURN { error: "Article not found or private" }

    // 2. Identify Dependencies
    authorId = articleData.authorId
    city = articleData.authorCity // Assumed to be available on article metadata

    // 3. Concurrent Fetching (Concurrency/Parallel execution)
    // Execute both calls simultaneously to minimize latency.
    {
        authorProfileResponse, nearbyProfilesResponse
    } = CONCURRENT_CALLS(
        "GET /api/v1/consultants/" + authorId,
        "GET /api/v1/consultants/nearby?city=" + city
    )

    // 4. Assemble and Return
    RETURN {
        article: articleData,
        authorProfile: authorProfileResponse, // Profile for the writer
        relatedProfiles: nearbyProfilesResponse // List for related/nearby experts
    }
```

### 4. Key Backend Considerations

1. **Caching:** Implement aggressive caching for `ConsultantProfile` endpoints. Author profiles rarely change, and "nearby" results are geographically limited.
2. **Data Integrity:** Ensure the `authorId` in the article metadata reliably maps to an active profile record.
3. **Error Handling:** If the author profile lookup fails (e.g., ID is retired), the system must gracefully return the article content without failing the entire request.
4. **Pagination:** The "related/nearby profiles" endpoint *must* implement robust pagination to handle large datasets and prevent performance bottlenecks.