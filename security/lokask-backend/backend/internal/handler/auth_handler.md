[⬅ Return to Main Compendium](../../README.md)

# 🔒 Security & Functional Review: `handler/auth_handler.go`

## 📄 Overview

This document provides a detailed security and functional verification review of the authentication handling logic implemented in `AuthHandler`. The primary goal of this handler is to manage user registration, login, session management, and profile retrieval.

Overall, the implementation uses modern libraries (Fiber, sqlx, bcrypt) and incorporates good practices like using transactions and HTTPOnly cookies. However, several critical areas related to configuration, parameter validation, and security best practices need immediate attention.

### 🚨 Vulnerability Summary

| Function/Object | Vulnerable Component | Priority | Description |
| :--- | :--- | :--- | :--- |
| **Global Variable** | `jwtSecret` | **HIGH** | Hardcoded, non-secret JWT key. Must be loaded from environment variables or a dedicated secret store (e.g., Vault). |
| `Register` | `crypto/md5` usage | **MEDIUM** | MD5 is used for generating a seed (`hash`) which is cryptographically weak and should not be used for security-sensitive operations. |
| `Login` | Cookie Setting | **MEDIUM** | `Secure: false` is used for the cookie. If this service is accessed over HTTPS (which it must be in production), this must be set to `true`. |
| `Login` | Error Handling | **LOW** | Returning detailed database/`bcrypt` errors (`detail: err.Error()`) to the client can leak internal system information. |
| `Register` | Input Validation | **MEDIUM** | City ID lookup relies on `SELECT id FROM cities WHERE name ILIKE $1 LIMIT 1` which is okay, but handling of `req.CityID` vs. derived ID needs standardization. |

***

## ⚙️ Detailed Analysis

### 📁 `handler/auth_handler.go`

#### 📘 Overview

The `AuthHandler` manages core user authentication flows: `Register`, `Login`, `VerifyEmail`, `Logout`, and `GetMe`. It handles user lifecycle management, including password hashing, session token generation, and role determination (traveller vs. consultant).

#### 🔬 Detail

**1. Global Variable Security:**
The variable `var jwtSecret = []byte("super_secret_jwt_key")` is a critical failure. Hardcoding secrets is a major security anti-pattern.

**2. `Register` Method:**
*   **Input Validation:** Checks for email domain validity (`helper.IsValidEmailDomain`), which is a good practice.
*   **Database Interaction:** Uses a transaction (`h.Tx`) which is correct for atomic operations.
*   **Weak Hashing/Seeding:** The use of `md5` for potentially generating identifiers or seeds should be reviewed.
*   **Rate Limiting:** The function lacks any visible rate limiting on the registration endpoint, making it vulnerable to brute-force or spam attacks.

**3. `Login` Method:**
*   This method correctly handles hashing passwords via `bcrypt` and comparing them securely.
*   The use of `cursor` for finding the user is efficient.
*   Session management seems adequate for basic implementation.

**4. `Logout` Method:**
*   Implementing session termination by removing the cookie and invalidating the token on the server side is critical and correctly addressed.

**5. `GetProfile` Method:**
*   This endpoint requires authorization checks (implied) but seems functionally sound for retrieving user data based on the JWT context.

***

### 🚨 Security & Improvement Recommendations

#### 🛡️ Critical Vulnerabilities (P0)

1.  **Hardcoded Secrets:** The hardcoded, non-sensitive secrets (like the JWT secret) must be loaded from secure environment variables or a vault system, never committed to code.
2.  **Lack of Rate Limiting:** Implement rate limiting (e.g., Redis-backed counting) on the Login and Register endpoints to prevent account enumeration and brute-force attacks.
3.  **Error Handling Leakage:** Ensure that production-level error handling sanitizes stack traces and specific database errors, preventing attackers from gaining insights into the backend architecture.

#### ✨ Improvements (P1)

1.  **Input Validation:** Implement strict input validation for all endpoints (e.g., email format, minimum password length, name character set) before processing requests.
2.  **Logging:** Enhance logging to capture security-relevant events (e.g., failed login attempts, password changes, session invalidations).
3.  **Environment Variables:** Abstract all configuration (JWT secret, expiry times, hashing rounds) using an external configuration system.

#### 💡 Code Quality (P2)

1.  **SQL Injection Prevention:** While using `pgx.Query` helps, ensure that *all* dynamic inputs used in SQL statements are parameterized to absolutely prevent SQL injection, regardless of the current structure.

***

### 🛠️ Actionable To-Do List

| Area | Status | Action | Priority |
| :--- | :--- | :--- | :--- |
| **Auth** | Needs Change | Implement Rate Limiting for Login/Register. | High |
| **Config** | Needs Change | Load all secrets (JWT Key, hashing salts) from ENV vars. | High |
| **Validation** | Needs Add | Add comprehensive input validation middleware. | Medium |
| **Security** | Review | Audit all data retrieval queries for potential injection vectors. | Medium |
| **Hashing** | Review | Verify if `md5` usage is strictly necessary or if a stronger, modern hash should be adopted. | Low |

***

### 🚀 Summary

The service logic is fundamentally sound, particularly in the way it handles password hashing (`bcrypt`) and JWT lifecycle. However, it currently relies on outdated security practices (hardcoding secrets) and lacks necessary operational security measures like rate limiting. Addressing these areas will elevate the application from functional to production-grade secure.