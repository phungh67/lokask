[⬅ Return to Main Compendium](../../../../../README.md)

As a senior backend officer specializing in Go and scalable backend logic, I have analyzed the client-side component. The core business logic revolves around the user registration process.

The provided React code serves as the presentation layer, encapsulating the necessary state management and handling the API contract via the `registerTraveller` function. My documentation will focus on translating this API call into a robust, performant, and secure backend architecture using Go principles.

---

## 🧑‍💻 Backend Design Specification: Traveller Registration

### 1. Core Objective
To implement a dedicated API endpoint that securely registers a new user account for the "Traveller" persona.

### 2. Data Models (Go Struct Definitions)

We define the required data structures for input, internal business models, and API responses.

#### `TravellerInput` (API Request Body Model)
This model dictates the payload received from the client.

```go
package model

// TravellerInput represents the data submitted by the frontend signup form.
type TravellerInput struct {
	FullName string `json:"full_name" binding:"required,min=3"`
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=8"` // Enforce minimum password length
}
```

#### `User` (Database Persistence Model)
This model represents the user as it should be stored in the database. Note the crucial change: storing the hashed password, not the raw password.

```go
package model

import "time"

// User is the primary entity stored in the 'users' table.
type User struct {
	ID        string    `gorm:"primaryKey;type:uuid"`
	Email     string    `gorm:"unique;index:idx_email"`
	PasswordHash string `gorm:"size:255"` // Stores the hash (e.g., bcrypt output)
	FullName  string    `gorm:"size:100"`
	Role      string    // e.g., "Traveller", "Consultant"
	CreatedAt time.Time
	UpdatedAt time.Time
}

// Service-level struct for passing business data (optional, but good practice)
type NewUserCredentials struct {
	Email    string
	Password string
	FullName string
	Role      string
}
```

### 3. API Surface Definition (The Contract)

The API surface is defined by the HTTP method, endpoint path, and expected request/response formats.

| Detail | Specification |
| :--- | :--- |
| **Endpoint** | `/api/v1/travellers/register` |
| **Method** | `POST` |
| **Request Body** | `TravellerInput` (JSON) |
| **Response (Success)** | HTTP Status `201 Created`. Body: `{"message": "Account created successfully."}` |
| **Response (Error)** | HTTP Status `400 Bad Request` (Validation/Input Error) or `409 Conflict` (Email already exists). Body: `{"error": "Specific error message."}` |

#### Go Handler Function Signature Example
(Using a common framework approach like Fiber or Gin)

```go
// Controller/Handler Layer
func RegisterTravellerHandler(c *gin.Context) {
	var input model.TravellerInput
	if err := c.ShouldBindJSON(&input); err != nil {
		// Handle validation errors (400)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input data"})
		return
	}

	// Delegate to the Service layer
	err := service.RegisterTraveller(c.Request.Context(), model.NewUserCredentials{
		Email: input.Email,
		Password: input.Password,
		FullName: input.FullName,
		Role: "Traveller", // Business logic sets the role
	})

	if err != nil {
		if errors.Is(err, repository.ErrConflict) {
			c.JSON(http.StatusConflict, gin.H{"error": "This email is already registered."})
		} else {
			// General internal server error
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Registration failed due to system error."})
		}
		return
	}

	// Success
	c.JSON(http.StatusCreated, gin.H{"message": "Account created successfully."})
}
```

### 4. Core Backend Logic Flow (Service Layer)

The Service Layer is the heart of the application. It encapsulates business logic, transaction management, and handles security concerns, isolating the handlers from the database details.

#### `Service.RegisterTraveller()`
1. **Input Processing & Validation:** The service layer must re-validate inputs, enforcing rules that might be too complex for basic struct tags (e.g., checking for suspicious usernames, formatting).
2. **Conflict Check:** Attempt to query the repository to verify if a user with the provided `Email` already exists.
    *   If conflict is found, return a specific, expected error (e.g., `repository.ErrConflict`).
3. **Security: Password Hashing:** **CRITICAL STEP.** The raw password received must *never* be stored. Use a strong, industry-standard hashing algorithm like **bcrypt** or Argon2 to hash the password immediately.
4. **Business Rule Application:** Determine the default `Role` ("Traveller").
5. **Transaction Management:** Start a database transaction.
6. **Persistence:** Call the repository layer to save the new `User` record using the hashed password.
7. **Cleanup:** Commit the transaction and return success.

### 5. Repository Pattern Implementation (Persistence Layer)

The Repository abstracts the database operations (SQL/NoSQL) away from the service logic, allowing us to swap databases (e.g., from Postgres to Mongo) without touching the service layer.

#### `UserRepository` Interface
Defining an interface is best practice in Go, allowing for easy mocking and testing.

```go
package repository

import "context"

type UserRepository interface {
	// ByEmail checks if a user exists with the given email.
	// Returns an error if the user is found, or nil otherwise.
	FindByEmail(ctx context.Context, email string) error

	// Create inserts a new user record into the database.
	// Requires the already-hashed password.
	Create(ctx context.Context, user *model.User) error
}
```

#### Implementation Example (`*PostgresUserRepository`)

```go
// Example function implementation (Pseudocode)
func (r *PostgresUserRepository) FindByEmail(ctx context.Context, email string) error {
    // SELECT count(1) FROM users WHERE email = $1;
    // If count > 0, return repository.ErrConflict
}

func (r *PostgresUserRepository) Create(ctx context.Context, user *model.User) error {
    // INSERT INTO users (email, password_hash, full_name, role) 
    // VALUES ($1, $2, $3, $4)
    // Execute transaction here (Start -> Execute -> Commit)
}
```

***

This structure adheres to the Clean Architecture principles (Handler -> Service -> Repository), ensuring high testability, maintainability, and strong separation of concerns—essential qualities for any senior-level backend service.

*this content was created by AI, but the coding and underlying logic are not.*