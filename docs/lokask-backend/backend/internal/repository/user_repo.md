
[⬅ Return to Main Compendium](../../README.md)

# 💾 User Repository Layer (`repository/user.go`)

This module encapsulates all database interactions related to the `User` entity. It abstracts the underlying database logic (using `sqlx`) away from the business logic layer, adhering to the Repository pattern.

## 🔍 Overview

The `UserRepository` provides methods to perform standard CRUD operations (Create, Read, Update) for user data. It handles complex transactions (like user creation) and retrieval based on common identifiers (email or UUID).

### Components and Concepts

*   **`User` Struct:** Defines the schema model for a user, mapping database columns to Go types.
*   **`UserRepository`:** The main structure that holds a connection pool (`*sqlx.DB`) and provides database interface methods.
*   **Database Transactions:** Critical methods utilize database transactions (`*sqlx.Tx`) to ensure atomic operations, especially during user creation.

## ✨ Detail

### 📁 `User` Model Structure

The `User` struct represents the data entity retrieved from the `users` table.

| Field | Type | DB Tag | Description | Notes |
| :--- | :--- | :--- | :--- | :--- |
| `ID` | `string` | `id` | Unique identifier (UUID) of the user. | Primary Key. |
| `Email` | `string` | `email` | User's unique email address. | Indexed for fast lookup. |
| `PasswordHash` | `string` | `password_hash` | Hashed version of the user's password. | Should be handled securely. |
| `FullName` | `string` | `full_name` | User's full displayed name. | |
| `AvatarURL` | `sql.NullString` | `avatar_url` | Optional URL for the user's profile avatar. | Uses `sql.NullString` to handle potential NULL values from the database. |
| `AvatarURLJSON` | `string` | - | Internal representation of `AvatarURL` for JSON serialization. | Helper field for serialization/deserialization. |

### 🚀 `UserRepository` Methods

#### 1. `NewUserRepository(db *sqlx.DB)`
*   **Purpose:** Constructor to initialize the repository with a database connection.
*   **Usage:** Must be called once during application startup.

#### 2. `CreateUserTx(tx *sqlx.Tx, user *User)`
*   **Purpose:** Executes the user creation logic within an existing database transaction (`tx`).
*   **Mechanism:** Uses `RETURNING id` in the SQL query to retrieve the newly generated user ID immediately after insertion.
*   **Signature:** Requires the transaction object and a pointer to the user struct (`*User`) to set the generated ID.

#### 3. `GetByEmail(email string)`
*   **Purpose:** Retrieves a user record using their unique email address.
*   **Mechanism:** Queries the database using the `email` column.
*   **Return:** Returns a pointer to the `User` object or an error.

#### 4. `GetByID(userID string)`
*   **Purpose:** Retrieves a user record using their primary key ID.
*   **Mechanism:** Queries the database using the `id` column.
*   **Return:** Returns a pointer to the `User` object or an error.

#### 5. `UpdateAvatar(userID uuid.UUID, avatarURL string)`
*   **Purpose:** Updates only the avatar URL and the `updated_at` timestamp for a specific user.
*   **Mechanism:** Uses `ExecContext` to execute an UPDATE query, ensuring a timeout context is applied for resilience.
*   **Dependency:** Requires the `uuid` package for type safety when handling IDs.

## 💡 Note (Design & Implementation Details)

1.  **Context Handling:** The `UpdateAvatar` method correctly uses `context.WithTimeout` and `defer cancel()` to manage context lifecycles, which is best practice for networked database operations.
2.  **Null Handling:** The use of `sql.NullString` for `AvatarURL` and subsequent assignment to `AvatarURLJSON` demonstrates robust handling of nullable database fields during ORM/repository usage.
3.  **Atomic Operations:** The reliance on `*sqlx.Tx` for `CreateUserTx` is crucial. This ensures that if any part of the user creation fails, the entire operation rolls back, maintaining data integrity.

## ⚠️ Warning (Security, Tech Debt, and Improvements)

1.  **Security - Password Handling (CRITICAL):**
    *   The `User` struct includes `PasswordHash`, but the implementation relies entirely on the calling layer (the service/handler) to correctly hash the password *before* passing the object to `CreateUserTx`.
    *   **Action Required:** Ensure that the password hashing mechanism (e.g., bcrypt) is mandatory and robustly implemented *outside* of this repository layer.
2.  **Tech Debt - UUID Usage:**
    *   The `GetByID` method uses `string` for `userID`, while `UpdateAvatar` uses `uuid.UUID`. Consistency should be enforced. It is better practice to use `uuid.UUID` as the canonical type for IDs across the entire repository package.
3.  **Completeness - Full User Update:**
    *   Currently, there is no explicit method to update *all* user details (e.g., changing `FullName` or `Email` after creation). This functionality needs to be added, likely requiring separate validation and update logic.
4.  **Dependency Linkage (Mental Flow):**
    *   The business logic/service layer that calls `CreateUserTx` will first handle password hashing, which must execute successfully **before** calling this repository method.

## 🔗 Related Files and Flows

*   **[See User Definition](user.go#User)**: Definition of the data model structure.
*   **[Database Connection Setup](config/db.go)**: This repository expects a properly initialized `*sqlx.DB` connection.
*   **[Middleware/Auth Flow](middleware/auth.go)**: Authentication middleware will interact with `GetByEmail` to validate user credentials before allowing access.
*   **[Service Layer Call](service/user_service.go)**: The service layer should be responsible for coordinating the `transaction` start, calling `CreateUserTx`, and committing the transaction.
```