# 📚 `repository` Package README

This document provides a comprehensive guide and technical specification for the `repository` package, which serves as the Data Access Layer (DAL) for managing user entities within the system.

## 🎯 Overview

The `repository` package encapsulates all database interactions related to user management. It utilizes `sqlx` to abstract SQL operations, providing structured methods for creating, retrieving, and updating `User` records. This pattern isolates the business logic from the database details, adhering to the Repository Pattern for improved maintainability and testability.

**Knowledge Base Focus:** System Design, Infrastructure (SQL interaction), Cloud Components, Security Engineering (Handling password hashes).

### 📂 Directory Structure

```
repository/
├── user.go         # Defines the User struct and repository logic
└── repository.go   # (Assumed main file containing the package structure)
```

## 🔬 Detail

### 1. Data Model (`User` Struct)

The `User` struct represents the user data structure, mapping database fields using `db:` tags.

| Field | Type | Description | Notes |
| :--- | :--- | :--- | :--- |
| `ID` | `string` | Unique identifier for the user. | Primary Key. |
| `Email` | `string` | User's unique email address. | Used for authentication/lookup. |
| `PasswordHash` | `string` | Hashed password. | *Never* exposed via JSON (`json:"-"`). |
| `FullName` | `string` | User's full name. | Display name. |
| `AvatarURL` | `sql.NullString` | Stores the avatar URL from the DB. | Uses `sql.NullString` to handle potential `NULL` values. |
| `AvatarURLJSON` | `string` | JSON-formatted version of the avatar URL. | Used for clean JSON serialization/API response. |

### 2. Repository Implementation (`UserRepository`)

The `UserRepository` struct holds the database connection pool (`*sqlx.DB`) and provides CRUD operations.

#### **Key Methods:**

*   **`NewUserRepository(db *sqlx.DB)`:** Initializes the repository instance with an active database connection.
*   **`CreateUserTx(tx *sqlx.Tx, user *User)`:**
    *   **Purpose:** Safely creates a new user record within an existing database transaction (`*sqlx.Tx`).
    *   **Security:** Requires the caller to manage the transaction scope.
    *   **Mechanism:** Uses `RETURNING id` to fetch the newly generated primary key immediately.
*   **`GetByEmail(email string)`:**
    *   **Purpose:** Retrieves a user record based on a unique email address.
    *   **Mechanism:** Executes a `SELECT` query filtered by email. Handles the conversion of the nullable `avatar_url` into the `AvatarURLJSON` field for API use.
*   **`GetByID(userID string)`:**
    *   **Purpose:** Retrieves a user record based on the user's unique ID.
    *   **Mechanism:** Executes a `SELECT` query filtered by ID. Also handles the conversion of the nullable avatar URL.
*   **`UpdateAvatar(userID uuid.UUID, avatarURL string)`:**
    *   **Purpose:** Updates only the user's avatar URL and the `updated_at` timestamp.
    *   **Robustness:** Implements `context.WithTimeout` for guaranteed resource cleanup and prevents indefinite blocking on network operations.

### 💡 Architecture Flowchart

```mermaid
graph TD
    A[Service Layer] -->|1. Call CreateUserTx| B(UserRepository);
    B -->|2. Uses Transaction (tx)| C[Database: users table];
    A -->|3. Call GetByEmail/GetByID| B;
    B -->|4. Reads Data| C;
    A -->|5. Call UpdateAvatar| B;
    B -->|6. Executes UPDATE (with context)| C;
```

## 📝 Notes

1.  **Transaction Management:** The `CreateUserTx` method expects the caller (e.g., a service layer function) to manage the transaction lifecycle (`BEGIN`, `COMMIT`/`ROLLBACK`). Passing `*sqlx.Tx` ensures atomicity for multi-step operations.
2.  **Null Handling:** The use of `sql.NullString` for `AvatarURL` is critical. It allows the repository to correctly distinguish between a field that is `NULL` in the database and a field that is simply an empty string (`""`).
3.  **Context Usage:** `UpdateAvatar` properly utilizes `context.Context` with a timeout. This is best practice for infrastructure components and prevents resource leaks in distributed systems.
4.  **Hashing:** The `PasswordHash` field uses `json:"-"` tag, ensuring that raw password hashes are never leaked into JSON responses, enhancing security.

## ⚠️ Warnings & Action Items (To Be Completed)

1.  **Error Handling Consistency:** While individual methods return `error`, it is recommended that a standardized error wrapper or custom error type be used across the package to allow calling services to differentiate between "Not Found" errors and "Database Connection" errors (e.g., `repository.ErrNotFound`).
2.  **Database Schema Dependencies:** The repository assumes the existence of the `updated_at` column on the `users` table for the `UpdateAvatar` method to function correctly. This dependency must be documented in the DB migration scripts.
3.  **Input Validation:** The repository methods currently assume that the input data (`email`, `userID`, `avatarURL`) is valid and non-nil. Service layer validation (e.g., email format checking, UUID validation) must occur *before* calling repository methods to prevent unnecessary database lookups or invalid queries.
4.  **Concurrency Handling:** If concurrent modification of user records is a concern (e.g., two processes trying to update the avatar simultaneously), the database might require additional locking mechanisms (e.g., `SELECT FOR UPDATE`) which should be considered for high-concurrency updates.