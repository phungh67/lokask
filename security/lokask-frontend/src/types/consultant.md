# 🛡️ Data Models Security Verification: Core Interfaces

This document analyzes the primary TypeScript interfaces used for defining user profiles, reviews, and profile updates. This model set (`Badge`, `Review`, `Consultant`, `UpdateProfileRequest`) is critical as it defines the boundaries for data input and retrieval, making it a primary attack surface for injection, XSS, and data integrity issues.

[⬅ Return to Main Compendium](../../README.md)

***

## 📜 Overview

These interfaces define the core schema for managing user profiles (`Consultant`), feedback (`Review`), and ancillary data (`Badge`). The data structure suggests a complex platform involving service providers and user interaction.

The primary security concern associated with these models is **Input Validation** and **Cross-Site Scripting (XSS)**, particularly since multiple fields handle free-form user-generated content (UGC).

### 🚀 Security Vulnerability Summary

| Vulnerable Component | Vulnerability Type | Priority | Mitigation Focus |
| :--- | :--- | :--- | :--- |
| `Review.comment`, `Consultant.bio` | Stored XSS | **HIGH** | Client-side sanitization and robust server-side encoding/sanitization (e.g., using DOMPurify). |
| `Consultant` (Model) | Mass Assignment | **HIGH** | Explicit allow-listing of fields that can be written via API endpoints. |
| `UpdateProfileRequest` | Parameter Validation | **MEDIUM** | Strict backend validation (type checking, length, format, and range constraints). |
| All Interfaces | Data Integrity | **MEDIUM** | Implementing ownership checks (Is the requesting user authorized to update `consultant.id`?). |

---

## 🔬 Detailed Analysis

### 📂 1. Data Model Interfaces

#### `Badge`
*   **Description:** Defines reusable visual markers for consultants.
*   **Security Concern:** Low. Data payload is highly structured and non-user-editable (presumably managed by an administrator).
*   **Mitigation:** Ensure `icon_name` only accepts alphanumeric characters to prevent file inclusion or path traversal attempts if used in asset loading.

#### `Review`
*   **Description:** Captures structured user feedback.
*   **Security Concern:** High. Contains two major UGC fields (`review_name`, `comment`).
*   **Focus Area:** **Stored XSS.** Both `review_name` and `comment` must be sanitized before being stored in the database, and when rendered, they must be contextually encoded.
*   **Flow Linkage:** If this structure is used in the review submission logic, see [`/api/reviews/submit`](../api/reviews/submit).

#### `Consultant`
*   **Description:** The comprehensive profile model for a service provider.
*   **Security Concern:** Critical. This is a complex object representing the user's identity and professional standing.
*   **Mass Assignment Risk:** Any endpoint using this object (e.g., `GET /consultant/{id}`) must *only* return data, while endpoints responsible for modification (e.g., `PUT /consultant/{id}`) must *only* accept validated input fields. Allowing a user to update `userId` or `id` is a critical security failure.
*   **Data Integrity Risk:** Fields like `rating` and `helpedCount` should not be user-writable; they must be calculated or updated atomically by a trusted backend service.

#### `UpdateProfileRequest`
*   **Description:** The input payload used for updating basic profile details.
*   **Security Concern:** Medium. This acts as the primary API input boundary.
*   **Validation Deficiency:** It relies entirely on the backend to perform validation. Missing validation on `city_id` (e.g., accepting a non-integer string) or lack of length checks on `full_name` could lead to database constraint violations or unexpected application behavior.
*   **Focus Area:** **Principle of Least Privilege.** The API handler should validate that the provided fields are indeed necessary and that the user making the request is authorized to modify *those specific* fields.

---

## ⚠️ Technical Debt & Warnings

### 🚧 Unfinished/High Priority Items

1.  **Comprehensive Sanitization Layer:** There is no mention of sanitization logic. The most critical piece of missing infrastructure is a reusable, server-side sanitation service that handles all UGC fields (`Review.comment`, `Consultant.bio`, etc.) using a library like **DOMPurify** or equivalent framework services *before* database persistence.
2.  **Type Safety Enforcement:** While the interfaces are defined in TypeScript, the system must enforce that *all* endpoints utilize these schemas rigorously. Consider implementing custom Zod/Yup schemas that govern not only the type but also the business constraints (e.g., `rating` must be between 1 and 5).

### 💡 Development Notes

*   **`id` vs `userId`:** In the `Consultant` interface, we see both `id: string` and `userId: string`. Documentation must clarify if `id` is the database primary key (PK) and `userId` is the authentication system identifier (e.g., OAuth ID). Confusing these could lead to logic errors during account linkage.
*   **Date Handling:** The `Review.date` field is `string`. It is strongly recommended to use a standardized date/time library format (like ISO 8601 datetime) in all interfaces to prevent parsing ambiguities.

---

## ⚖️ Development Implementation Links

To ensure a secure coding flow, the implementations consuming these data models must follow these logical links:

| Interface/Model | Related File/Logic | Purpose |
| :--- | :--- | :--- |
| `UpdateProfileRequest` | `../handlers/consultant/update_profile.go` | **Must validate** all fields before passing the payload to the DB layer. |
| `Review` | `../middleware/review_guard` | **Must sanitize** the request body for XSS *before* hitting the handler. |
| `Consultant` | `../repository/consultant_repository.go` | **Must enforce** that only approved, non-calculating fields are set via the ORM layer (preventing mass assignment). |
| All Models | `../utils/security_sanitizer.go` | Central utility for all input sanitization and output encoding. |

***
***
*(End of Documentation Security Verification)*