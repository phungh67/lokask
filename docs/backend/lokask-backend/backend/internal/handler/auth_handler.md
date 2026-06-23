[⬅ Return to Main Compendium](../../../../../../README.md)

# 🛠️ Code Review and Architecture Documentation: `AuthHandler`

**Reviewer:** Senior Backend Officer
**Expertise:** Go Programming, Backend Logic, Security Patterns
**Module:** Authentication (`handler/auth_handler.go`)

This handler contains critical authentication and user lifecycle logic. While functional, there are several areas in terms of transactional integrity, error handling consistency, dependency management, and security hardening that require immediate attention.

## 🌟 Expert Assessment & Security Concerns

### 1. Security Hardening (CRITICAL)
*   **Hardcoded Secret:** The `jwtSecret` is a global variable and hardcoded. This is an extreme vulnerability. It must be loaded from an environment variable (`os.Getenv`) or a dedicated secret management system (e.g., HashiCorp Vault).
*   **Password Storage:** Using `bcrypt.DefaultCost` is generally acceptable, but the cost should be tunable and ideally read from configuration to allow for future hardware increases (e.g., `bcrypt.MinCost`).
*   **Session/Token Management:** The logic correctly uses Redis for session storage, which is good. However, the session key generation (`uuid.New().String()`) should be paired with a more robust mechanism for invalidating tokens (e.g., tracking device/IP combinations if required for session management).
*   **Input Validation:** The current handlers assume inputs are clean. Although middleware should handle this, explicit input validation (especially when retrieving user IDs or emails) is crucial.

### 2. Code Structure and Idempotency Issues
*   **State Management:** The `Login` flow (implied, but not shown) and related services must ensure idempotency. If a user tries to re-authenticate multiple times with the same credentials, the state changes (like `last_login_at`) must be handled gracefully.
*   **Database Transactions:** Any sequence of operations that modifies user records (e.g., profile update after login) *must* be wrapped in explicit database transactions to ensure atomicity.
*   **Error Handling:** The handlers rely heavily on implicit error return paths. Explicit, structured error types should be used throughout the service layer.

### 3. Optimization & Refactoring
*   **Service Layer Abstraction:** The database interaction logic (e.g., `h.UserRepo.GetUserByEmail(email)`) should be fully abstracted into a dedicated `UserService` layer. The handlers should only coordinate calls to this service, keeping them thin and focused purely on HTTP concerns.
*   **Redundancy:** The user fetching logic (e.g., fetching the user profile in multiple places) should be consolidated.

---

## 📚 Component Reference & API Contracts

### 1. `UserService` Interface (To be created)
This service abstracts all business logic regarding users.

```go
type UserService interface {
    GetUserByID(ctx context.Context, id string) (*models.User, error)
    GetUserByEmail(ctx context.Context, email string) (*models.User, error)
    // ... other user related actions
}
```

### 2. `UserRepository` Interface (To be updated)
This interface handles raw database interactions.

```go
type UserRepository interface {
    FindUserByID(ctx context.Context, id string) (*models.User, error)
    FindUserByEmail(ctx context.Context, email string) (*models.User, error)
    UpdateLastLogin(ctx context.Context, userID string, timestamp time.Time) error
}
```

### 3. Data Models (`models` package)
Define consistent models used across the application.

```go
type User struct {
    ID        string
    Email     string
    Password  string // Should be hashed!
    FullName  string
    IsActive  bool
    CreatedAt time.Time
    // Add relevant fields like Role, etc.
}

type UserProfile struct {
    UserID    string
    Email     string
    FullName  string
    Role      string
    // ... minimal set of fields needed for the client
}
```

---

## 🗂️ Updated Handler Logic Examples

The goal is to make handlers cleaner and rely entirely on the service layer.

### Example: `GetUserProfileHandler` (GET /api/profile)

```go
func (h *Handler) GetUserProfile(w http.ResponseWriter, r *http.Request) {
    // 1. Authentication/Authorization middleware should have set the user ID in the context.
    ctx := r.Context()
    userID, ok := ctx.Value("user_id").(string)
    if !ok {
        http.Error(w, "Unauthorized", http.StatusUnauthorized)
        return
    }

    // 2. DELEGATE BUSINESS LOGIC TO SERVICE
    profile, err := h.userService.GetProfileForUser(ctx, userID)
    if err != nil {
        // Handle specific service errors (e.g., NotFound, PermissionDenied)
        if errors.Is(err, service.ErrUserNotFound) {
             http.Error(w, "User profile not found", http.StatusNotFound)
             return
        }
        http.Error(w, "Internal server error", http.StatusInternalServerError)
        return
    }

    // 3. Serialization (mapping the domain model to an HTTP response)
    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(profile)
}
```

---

## ✅ Summary Checklist for Implementation

1. [ ] **Establish Layers:** Define and implement `UserRepository` $\rightarrow$ `UserService` $\rightarrow$ `Handler`.
2. [ ] **Security:** Implement hashing for passwords and robust authorization checks on every endpoint.
3. [ ] **State:** Implement `UpdateLastLogin` using database transactions within the service layer.
4. [ ] **Error Handling:** Use custom, exported error types (`service.ErrUserNotFound`, etc.) instead of raw `error` values.
5. [ ] **Testing:** Write unit tests for the `UserService` layer using mocks for the `UserRepository`.