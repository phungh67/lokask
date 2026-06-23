[⬅ Return to Main Compendium](../../../../../README.md)

As a senior backend officer specializing in Go and robust backend architecture, I analyze the provided component (`CTASection`) not as code, but as a representation of a critical **business workflow**. This section's primary goal is to convert interested users into registered "Local Experts."

The backend design must support the user journey triggered by the call-to-action link: `/become-local`.

Here is the documentation for the required API surfaces, core logic, and repository patterns, assuming a standard microservice architecture built with Go (Golang).

---

## 🧑‍💻 Backend Feature Documentation: Local Expert Onboarding

**Feature Focus:** Allowing users to apply, register, and manage their profile as a local expert ("Local").
**Target Workflow:** User initiates onboarding flow $\rightarrow$ Backend validates details $\rightarrow$ Local Profile is created and managed.

### 🌐 API Surface Definition (Go/Gin Framework Example)

The endpoints handle the lifecycle of a prospective Local Expert.

| Component | Method | Endpoint | Description | Request Body (Schema) | Response Body (Schema) | HTTP Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Authentication** | `POST` | `/api/v1/onboard/start` | Initiates the onboarding process. Verifies basic user credentials and creates a pending local profile record. | `{"user_id": UUID, "email": string, "local_city": string}` | `{"success": bool, "step": string, "form_data": map[string]any}` | `201 Created` |
| **Profile Submission** | `POST` | `/api/v1/onboard/details` | Submits detailed profile information (skills, areas of expertise, documentation). | `LocalDetailsSchema` | `{"success": bool, "message": string, "next_step": string}` | `200 OK` |
| **Verification** | `POST` | `/api/v1/local/verify` | Handles document/proof submission (e.g., photo ID, local business registration). | `{"document_url": string, "document_type": string}` | `{"verification_id": UUID, "status": "PENDING"}` | `202 Accepted` |
| **Local Profile Retrieval**| `GET` | `/api/v1/local/me` | Retrieves the current user's local profile status and dashboard data. | *None* | `LocalProfileSchema` | `200 OK` |

### 📐 Data Models (Go Structs)

We define the core entities required for the system.

```go
// User represents the core system user (authentication).
type User struct {
    ID        string `json:"id"`
    Email     string `json:"email"`
    IsLocal   bool   `json:"is_local"`
    CreatedAt time.Time `json:"created_at"`
}

// LocalExpertProfile is the dedicated profile for locals.
type LocalExpertProfile struct {
    ProfileID     string    `json:"profile_id"`
    UserID        string    `json:"user_id"`
    City          string    `json:"city"`
    Bio           string    `json:"bio"`
    ExpertiseTags []string  `json:"expertise_tags"`
    Status        string    `json:"status"` // e.g., "PENDING_REVIEW", "ACTIVE", "SUSPENDED"
    CommissionRate float64   `json:"commission_rate"`
    CreatedAt     time.Time `json:"created_at"`
}

// VerificationSubmission holds proof of identity/location.
type VerificationSubmission struct {
    SubmissionID string    `json:"submission_id"`
    ProfileID    string    `json:"profile_id"`
    DocumentURL  string    `json:"document_url"`
    DocumentType string    `json:"document_type"` // e.g., "ID_CARD", "RESIDENCE_PROOF"
    SubmittedAt  time.Time `json:"submitted_at"`
    Status       string    `json:"status"` // "PENDING", "APPROVED", "REJECTED"
}
```

### 💾 Repository Layer Pattern (Interface Definition)

The repository layer abstracts data access, allowing the service logic to remain clean and decoupled from the specific database implementation (e.g., Postgres, MongoDB).

```go
// LocalRepository defines the necessary interface for all database interactions
// related to the Local Expert workflow.
type LocalRepository interface {
    // CreatePendingProfile creates the initial record when a user starts the onboarding.
    CreatePendingProfile(ctx context.Context, userID string, city string) (*LocalExpertProfile, error)

    // UpdateProfileDetails updates non-critical profile information.
    UpdateProfileDetails(ctx context.Context, profileID string, details LocalDetails) error

    // SubmitVerification stores the document submission and returns a tracking ID.
    SubmitVerification(ctx context.Context, profileID string, documentURL string, docType string) (*VerificationSubmission, error)

    // GetLocalProfile retrieves the full, current state of the local expert profile.
    GetLocalProfile(ctx context.Context, profileID string) (*LocalExpertProfile, error)

    // UpdateProfileStatus updates the status after manual review (Admin/Service use).
    UpdateProfileStatus(ctx context.Context, profileID string, status string) error
}

// Example implementation using SQL/database driver.
// type PostgresLocalRepo struct { /* db connection pool */ }
// func (r *PostgresLocalRepo) CreatePendingProfile(...) { ... }
```

### 🧠 Business Logic / Service Layer (Go Implementation)

The service layer contains the business rules and orchestrates data flow between the API handler and the repositories. This is where the core value lies.

#### `LocalService`

```go
type LocalService struct {
    Repo LocalRepository
    Logger *log.Logger // For logging business events
}

// NewLocalService initializes the service with the required repository dependency.
func NewLocalService(repo LocalRepository) *LocalService {
    return &LocalService{
        Repo: repo,
        Logger: log.Default(),
    }
}

// StartOnboarding handles the initial step, ensuring the profile exists before proceeding.
func (s *LocalService) StartOnboarding(ctx context.Context, userID string, city string) (*LocalExpertProfile, error) {
    // Business Rule 1: Check if a profile for this user already exists.
    // If it exists and is ACTIVE, return an error/redirect message.
    
    // Use the repository to create the initial, pending record.
    profile, err := s.Repo.CreatePendingProfile(ctx, userID, city)
    if err != nil {
        s.Logger.Printf("Error creating pending profile: %v", err)
        return nil, fmt.Errorf("failed to initiate local onboarding")
    }
    return profile, nil
}

// SubmitExpertise submits the collected details and updates the profile.
func (s *LocalService) SubmitExpertise(ctx context.Context, profileID string, details LocalDetails) error {
    // Business Rule 2: Ensure the profile status is still PENDING_REVIEW before accepting details.
    // (Prevents users from spamming the profile endpoint if they haven't completed verification).
    
    err := s.Repo.UpdateProfileDetails(ctx, profileID, details)
    if err != nil {
        return fmt.Errorf("failed to update profile details")
    }
    return nil
}

// SubmitAndTrackVerification handles the document upload workflow.
func (s *LocalService) SubmitAndTrackVerification(ctx context.Context, profileID string, docURL string, docType string) (*VerificationSubmission, error) {
    // Business Rule 3: Critical validation checks (File size, acceptable file types, etc.)
    
    submission, err := s.Repo.SubmitVerification(ctx, profileID, docURL, docType)
    if err != nil {
        return nil, fmt.Errorf("failed to submit verification document")
    }
    s.Logger.Printf("Local Expert %s submitted verification for type %s.", profileID, docType)
    return submission, nil
}
```

*this content was created by AI, but the coding and underlying logic are not.*