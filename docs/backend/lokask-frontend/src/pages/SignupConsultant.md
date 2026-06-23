[⬅ Return to Main Compendium](../../../../../README.md)

As a senior backend officer specializing in Go and robust backend architectures, I have analyzed the client-side flow. The critical interaction point is the `registerConsultant` function. This client-side call dictates the necessary API Surface, Business Logic flow, and Data Persistence mechanisms for the Go backend.

Below is the structured documentation covering the core backend implementation components.

***

## Backend Architecture Documentation: Consultant Registration

### 1. Data Model Definition

We must define the core data structure that will be persisted in the database. This represents the `Consultant` entity.

**`Consultant` Model (Go Struct Equivalent)**

```go
// Consultant represents the core user profile for a consultant.
type Consultant struct {
    ID        string    `json:"id"`          // Unique identifier (UUID)
    FullName  string    `json:"full_name"`   // Full name provided by the user
    Email     string    `json:"email"`       // Unique email address (used for login)
    Password  string    `json:"-"`           // Stored as hash, never sent or logged in plain text
    City      string    `json:"city"`        // Local area of expertise (Validated list)
    IsActive  bool      `json:"is_active"`   // Account status (e.g., pending verification)
    CreatedAt time.Time `json:"created_at"`
}
```

### 2. API Surface Documentation (Go HTTP Handler/Controller)

The frontend calls an endpoint responsible for handling the registration request.

**Endpoint:** `POST /api/v1/consultants/register`

**Request Body (Input Payload):**
The API expects a structured JSON body matching the data collected on the frontend.

| Field | Type | Required | Description | Validation Notes |
| :--- | :--- | :--- | :--- | :--- |
| `full_name` | `string` | Yes | Full name of the consultant. | Must not be empty. |
| `email` | `string` | Yes | Unique email address. | Must be a valid email format. Must be unique in the database. |
| `city` | `string` | Yes | The consultant's location. | Must be present and match a predefined list (`VIETNAM_CITIES`). |
| `password` | `string` | Yes | The chosen password. | Must meet complexity requirements (e.g., min 8 characters). |

**Successful Response (HTTP 201 Created):**
Returns confirmation of creation.

```json
{
    "status": "success",
    "message": "Consultant account created successfully. Awaiting verification."
}
```

**Error Responses (HTTP 4xx/5xx):**
Standardized error handling is critical.

*   **400 Bad Request:** Validation failure (e.g., email format invalid, password too weak, city not in supported list).
*   **409 Conflict:** Resource conflict (e.g., `email` already exists).
*   **500 Internal Server Error:** Unexpected database or server failure.

### 3. Core Business Logic (Service Layer)

The `Service` layer orchestrates the entire registration process, implementing the business rules and ensuring proper sequence of operations before hitting the database.

**Service Function:** `RegisterConsultant(ctx context.Context, input models.RegistrationInput) (*models.Consultant, error)`

**Logic Flow:**

1.  **Input Validation:**
    *   Check if `fullName`, `email`, `city`, and `password` are all present.
    *   Validate email format using a regex pattern.
    *   Validate `city` against the internal list of allowed cities.
    *   Validate password complexity.
2.  **Database Uniqueness Check (Conflict Prevention):**
    *   Query the repository to confirm the provided `email` does not already exist. If it does, return a `ConflictError`.
3.  **Password Hashing (Security Critical):**
    *   The plaintext `password` must *never* be stored.
    *   Use a strong, industry-standard hashing algorithm (e.g., **Bcrypt** or Argon2) to generate a secure hash from the input password.
4.  **Account Creation and Persistence:**
    *   Construct the `Consultant` model, replacing the plaintext password with the generated hash.
    *   Call the repository to persist the new record.
    *   *Optional:* Trigger post-registration workflows (e.g., sending a confirmation email, creating a corresponding `User` profile entry).
5.  **Error Handling:**
    *   Wrap all potential database errors into appropriate business-logic errors (e.g., `ErrAlreadyExists`).

### 4. Repository Pattern (Data Access Layer)

The Repository handles all interactions with the database connection (e.g., PostgreSQL, MySQL). It isolates the business logic from the specific database dialect (SQL, ORM calls).

**Repository Interface Definition (Go Interface):**

```go
// IConsultantRepository defines the contract for data access operations.
type IConsultantRepository interface {
    // Create saves a new consultant record to the database.
    Create(ctx context.Context, c *models.Consultant) error

    // FindByEmail checks if a consultant with the given email exists.
    FindByEmail(ctx context.Context, email string) (bool, error)
}
```

**Implementation Detail (`PostgresConsultantRepository`):**

1.  **`Create` implementation:**
    *   Execute the SQL `INSERT` statement.
    *   Crucially, ensure the query uses parameterized statements to prevent SQL injection vulnerabilities.
    *   The transaction must commit the new `Consultant` record.

2.  **`FindByEmail` implementation:**
    *   Execute the SQL `SELECT` query filtering by the `email` column.
    *   Return a simple boolean result (`true` if found, `false` otherwise).

### Summary Flow Diagram (Backend Pseudo-Code)

```
[HTTP Request] -> POST /api/v1/consultants/register (email, password, ...)
        |
        v
[Controller] -> Call Service.RegisterConsultant()
        |
        v
[Service]
    1. Validate Input (City, Email format, Password strength)
    2. Call Repo.FindByEmail(email)
        | (If found) -> Return 409 Conflict Error
    3. Hash Password -> hashedPass
    4. Construct Model(..., hashedPass)
    5. Call Repo.Create(model)
        | (On success) -> Return 201 Created
        | (On failure) -> Return 500 Internal Error
```

*this content was created by AI, but the coding and underlying logic are not.*