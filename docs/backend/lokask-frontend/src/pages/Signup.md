[⬅ Return to Main Compendium](../../../../../README.md)

As a senior backend officer specializing in Go and robust backend architecture, I have analyzed the provided frontend structure. This page dictates the initial role selection (Traveller or Consultant), which is the most critical piece of logic that must be enforced and managed on the backend.

The frontend links (`/signup/traveller` and `/signup/consultant`) represent distinct application entry points that mandate different user schemas, validation rules, and subsequent permissions.

Below is the detailed documentation of the core backend logic, API surfaces, and repository patterns required to support this user onboarding flow.

---

## 🚀 Backend Logic & API Design Documentation

### 1. Core Logic: User Onboarding Flow

The core logic revolves around ensuring that the registered user's role is accurately captured, validated, and persists across the system. We must differentiate between standard user registration (Credentials) and role-specific profile data (Schema Expansion).

**Workflow:**

1.  **Request Intake:** User submits registration details (e.g., Email, Password, Role).
2.  **Validation:** Validate credentials and mandatory role-specific fields (e.g., Consulting license ID for a Consultant).
3.  **Service Orchestration:** The `UserService` handles the business logic, calling the `AuthRepository` (for credentials) and the appropriate Role-Specific Repository (e.g., `ConsultantRepository`) to save profile data.
4.  **Persistence:** Generate a `UserID` and issue authentication tokens.

### 2. Data Models (Go Structs)

We will define the core models that govern persistence.

```go
// models/user.go

// User represents the core account credentials (common to all roles).
type User struct {
    UserID       string `json:"user_id"`
    Email        string `json:"email"`
    PasswordHash string `json:"password_hash"`
    Role         UserRole `json:"role"` // ENUM: TRAVELLER, CONSULTANT
    CreatedAt    time.Time `json:"created_at"`
}

// UserRole defines the possible roles in the system.
type UserRole string
const (
    RoleTraveller   UserRole = "TRAVELLER"
    RoleConsultant  UserRole = "CONSULTANT"
    RoleAdmin       UserRole = "ADMIN"
)

// TravellerProfile holds data specific to the Traveller role.
type TravellerProfile struct {
    UserID       string
    PreferredInterests []string `json:"preferred_interests"`
    // Add other relevant data (e.g., primary location, dietary restrictions)
}

// ConsultantProfile holds data specific to the Consultant role.
type ConsultantProfile struct {
    UserID          string
    LicenseID       string `json:"license_id"` // Critical for business logic
    ExpertiseAreas  []string `json:"expertise_areas"`
    HourlyRate      float64 `json:"hourly_rate"`
    Bio             string `json:"bio"`
}

// RegistrationRequest encapsulates all input for a new user sign-up.
type RegistrationRequest struct {
    Email string `json:"email" binding:"required,email"`
    Password string `json:"password" binding:"required,min=8"`
    Role string `json:"role" binding:"required"` // Must be validated against TRAVELLER/CONSULTANT
    // Depending on the endpoint, we might include nested fields:
    TravellerData *TravellerProfile
    ConsultantData *ConsultantProfile
}
```

### 3. API Surfaces (REST/gRPC Endpoints)

Since the frontend handles the routing based on the role, we should consolidate the registration logic into a single, parameterized endpoint, while providing separate handlers for role-specific data validation.

**Service:** `AuthService`

| Endpoint | Method | Description | Request Body | Response Body | Error Handling |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `/api/v1/auth/register` | `POST` | Primary user registration endpoint. Routes the request to the correct role logic. | `RegistrationRequest` | `{ "user_id": "...", "token": "..." }` | `400 Bad Request` (Validation), `409 Conflict` (Email exists) |
| `/api/v1/user/profile/validate` | `POST` | Used by the frontend *after* initial sign-up to validate and store role-specific details (e.g., fetching a license ID). | `map[string]interface{}` (Role data) | `{ "status": "success", "message": "Profile updated." }` | `403 Forbidden` (Requires Auth), `422 Unprocessable` (Missing field) |

### 4. Repository Patterns

The Repository Pattern abstracts data access logic, allowing us to swap underlying database technologies (e.g., Postgres $\to$ MongoDB) without changing the business service layer.

#### A. `UserRepository` (Handles common authentication data)

**Interface Definition (Go):**
```go
type UserRepository interface {
    FindByEmail(email string) (*models.User, error)
    CreateUser(user *models.User) error
    // Add method for password hashing/verification (usually handled by a dedicated password manager utility)
}
```

**Implementation Details:**
*   **Read/Write:** Deals only with the core `User` table.
*   **Key Function:** Ensures email uniqueness before creation.

#### B. Role-Specific Repositories (Handles role expansion)

We must implement separate repositories for profile data to keep schemas clean and queries fast.

**1. `TravellerRepository`**
```go
type TravellerRepository interface {
    CreateProfile(profile *models.TravellerProfile) error
    GetProfileByUserID(userID string) (*models.TravellerProfile, error)
}
```

**2. `ConsultantRepository`**
```go
type ConsultantRepository interface {
    CreateProfile(profile *models.ConsultantProfile) error
    GetProfileByUserID(userID string) (*models.ConsultantProfile, error)
    // Unique query methods can be added here (e.g., FindConsultantByLicense(licenseID))
}
```

### 5. Service Layer Implementation (The Orchestrator)

The `AuthService` ties everything together.

```go
// auth_service.go (Core Business Logic)
type AuthService struct {
    UserRepo repository.UserRepository
    TravellerRepo repository.TravellerRepository
    ConsultantRepo repository.ConsultantRepository
    PasswordHasher *password.Hasher // Utility for hashing
}

// RegisterUser handles the primary signup logic.
func (s *AuthService) RegisterUser(req models.RegistrationRequest) (string, error) {
    // 1. Validate inputs and check for existing user
    existingUser, err := s.UserRepo.FindByEmail(req.Email)
    if err == nil && existingUser != nil {
        return "", fmt.Errorf("email already registered")
    }
    
    // 2. Create core user record
    user := &models.User{
        // ... populate fields
    }
    if err := s.UserRepo.CreateUser(user); err != nil {
        return "", err
    }

    // 3. Handle role-specific profile creation
    switch models.UserRole(req.Role) {
    case models.RoleTraveller:
        // Profile data must be passed in the request body or handled by a subsequent dedicated call
        if req.TravellerData == nil {
            return "", errors.New("traveller profile data required")
        }
        err := s.TravellerRepo.CreateProfile(req.TravellerData)
        if err != nil {
            // Critical: Needs transaction rollback logic here!
            return "", fmt.Errorf("failed to save traveller profile: %w", err)
        }
    case models.RoleConsultant:
        if req.ConsultantData == nil {
            return "", errors.New("consultant profile data required")
        }
        err := s.ConsultantRepo.CreateProfile(req.ConsultantData)
        if err != nil {
            // Critical: Needs transaction rollback logic here!
            return "", fmt.Errorf("failed to save consultant profile: %w", err)
        }
    default:
        return "", fmt.Errorf("unsupported user role: %s", req.Role)
    }

    // 4. Success: Generate token and return UserID
    return user.UserID, nil
}
```

***
*this content was created by AI, but the coding and underlying logic are not.*