[⬅ Return to Main Compendium](../../README.md)

# 🛡️ Documentation Security Verification Report: `domain/domain.go`

## 📄 Overview

This file defines core data structures (models/DTOs) used throughout the application domain, covering profiles, sessions, reviews, and catalog information. The primary security concern within a `domain` package is the **potential for excessive data exposure (over-fetching)** and the lack of inherent validation rules on complex data types. Several structs contain highly sensitive information (PII, billing details) that must be handled with extreme care in the service and handler layers.

**File:** `domain/domain.go`
**Purpose:** Defines application-wide domain models for persistence and data transfer.

---

## 🔎 Vulnerability Analysis

### ⚠️ Potential Attack Vectors and Payload Risk

| Priority | Vulnerable Object/Field | Description of Vulnerability | Mitigation Requirement |
| :--- | :--- | :--- | :--- |
| **High** | `ConsultantSession` | Contains financial and temporal data (`DurationHours`, `PaidAt`, `ExpiresAt`). If exposed or mutated improperly, it leads to billing fraud or unauthorized access to paid resources. | Strict API endpoint control. Authorization checks must confirm the calling user owns or is authorized to manage the session. |
| **High** | `ConsultantProfile` | Contains multiple PII fields (`Name`, `City`, `Country`, `Bio`). Excessive data exposure can lead to user tracking or identity theft. | Implement DTO separation. Only necessary fields should be exposed to specific endpoints (e.g., 'public view' vs. 'admin view'). |
| **Medium** | `Review.Comment` | The `Comment` field is a free-text input. If not sanitized or validated for XSS, a malicious user could inject scripts, leading to stored XSS attacks when displayed on the frontend. | Input validation and sanitization must occur at the Service layer before saving to the database. |
| **Medium** | `PaginatedConsultants.Limit` / `PaginatedReviews.Limit` | Lack of server-side validation on pagination limits could allow attackers to request excessively large datasets, potentially causing Denial of Service (DoS) or resource exhaustion. | Enforce maximum limits (e.g., `Limit` max = 50) in the handler layer, irrespective of client input. |

---

## ✍️ Detailed Documentation

### 🗺️ Structural Navigation

*   [Service/Handler Layer Usage](../handlers/user_handler.go) - *Reference for accessing profiles/sessions.*
*   [Validation Logic](./utils/validators.go) - *Reference for necessary input sanitization and validation.*

### ⚙️ Detailed Breakdown by Object

#### 💼 `ConsultantProfile`
*   **Risk:** High data exposure. Combining PII, financial, and status flags into one struct means any misuse of this object in a handler creates a potential leak.
*   **Recommendation:** Create at least three distinct view models (DTOs) based on this core struct:
    1.  `ProfilePublicView`: Minimal fields (Name, DisplayName, Avatar, Rating).
    2.  `ProfileClientView`: Includes basic PII (City, Country, Bio) and status (IsHighlyTrusted).
    3.  `ProfileAdminView`: Includes sensitive fields (HourlyRate, UserID, internal metadata).
*   **Cross-Reference:** When handling profile updates, the update function must check if the user is authorized to modify the specific fields (e.g., only the owner can change `Bio`, only the Admin can change `HourlyRate`).

#### 💰 `ConsultantSession`
*   **Risk:** Critical billing and temporal data exposure.
*   **Recommendation:** This object should **never** be exposed directly via a general API endpoint. Access must be gated by a specific business function (e.g., `/session/{id}/status`). The service layer must verify:
    1.  The session ID belongs to the authenticated user.
    2.  The user has not already been charged or the session status is active.

#### 📝 `Review`
*   **Risk:** Stored XSS.
*   **Recommendation:** In the service method responsible for creating or updating a review, implement HTML sanitization (e.g., using a library like `bluemonday`) on the `Comment` field before persistence.

#### ✨ `PaginatedConsultants` / `PaginatedReviews`
*   **Risk:** Denial of Service (DoS) via excessive pagination requests.
*   **Recommendation:** Ensure the `Limit` parameter is capped on the backend to prevent resource exhaustion.

### 📌 Security Notes

*   **Input Trust:** These structures assume that data flowing into the service layer (from HTTP requests) has passed initial validation. This is unsafe. **All inputs must be treated as untrusted.**
*   **Database Tags (`db:"..."`):** While these tags help mapping, they do not enforce security. Never use these fields directly in raw SQL queries. Always use parameterized queries through the ORM layer.

### 🚨 Warnings (Tech Debt / Incomplete Security Measures)

1.  **PII Masking:** There is no established mechanism for masking PII (like `AvatarURL` or `GalleryImages` contents) when they are displayed in a low-privilege view. This needs to be addressed at the API/Handler level.
2.  **Time Zone Handling:** All `time.Time` fields rely on the database's time zone settings. It is critical to explicitly handle and validate time zones (e.g., always storing UTC) throughout the service layer to prevent temporal inconsistencies.
3.  **Magic Strings:** Status fields (`ConsultantSession.Status`, `ConsultantProfile.IsHighlyTrusted`) rely on strings (e.g., "active", "pending"). These should be converted into enumerated types (Go `iota` constants) to ensure type safety and prevent runtime bugs from misspelled status strings.

---

## 📊 Summary Figure (Conceptual Flow)

```mermaid
graph TD
    A[Client Request (HTTP)] --> B(Handler Layer: Input Validation & Sanitization);
    B --> C{Service Layer: Business Logic & Authorization};
    C -- Reads/Writes Domain Objects --> D[domain/domain.go Structures];
    D --> E(Database/Repository Layer: Parameterized Query);
    E --> F(Validated Data Flow);

    subgraph Security Focus Points
        B --> B_Check{Input Sanitization (XSS, Rate Limit)};
        C --> C_Check{Authorization Check (Scope, Ownership)};
        C --> C_Check2{Data Minimization (DTO Selection)};
    end

    style B_Check fill:#f99,stroke:#333,stroke-width:2px
    style C_Check fill:#f99,stroke:#333,stroke-width:2px
    style C_Check2 fill:#f99,stroke:#333,stroke-width:2px

```