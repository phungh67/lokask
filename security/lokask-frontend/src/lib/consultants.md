[⬅ Return to Main Compendium](../../README.md)

# 🛡️ API Service Layer Review: `consultant-blog-services.ts`

**File Path:** `src/services/consultant-blog-services.ts` (Assumed)
**Scope:** Data fetching, mapping, and submission logic for consultant profiles and blog content.
**Knowledge Base Used:** System Design, Cloud Security, Security Engineering.

---

## 📝 Overview

This file serves as the primary service layer interface for interacting with the Consultant and Blog domains. It handles data fetching using `fetchJson` (assumed to be a custom API wrapper), performs data mapping (`mapConsultant`, `mapBlog`), and manages complex operations like media uploads and profile updates.

The core functionality relies heavily on client-side input handling and API endpoint construction. While the API calls themselves seem structured, the lack of server-side input validation and the use of `any` types during mapping introduce several risks.

### 🚨 Vulnerability Summary

| Function / Object | Vulnerable Payload / Data | Priority | Description |
| :--- | :--- | :--- | :--- |
| `getConsultants` | `filters` object (City, Niche, Languages) | **Medium** | Potential Injection (If API layer doesn't sanitize `URLSearchParams`). |
| `mapConsultant` | `c` object (Raw API response) | **High** | Over-fetching/Data Exposure (Mapping internal fields/sensitive data). |
| `mapBlog` | `b` object (Raw API response) | **Medium** | Data Integrity/Exposure (Mapping full content without sanitization). |
| `createBlog` | `data` object (FormData) | **High** | Input Validation & XSS (Lack of comprehensive content validation before submission). |
| `getConsultantByUserId` | `userId` parameter | **Medium** | Potential IDOR (Reliance on user-provided ID without ownership checks). |
| `updateConsultantProfile` | `data` object (Partial<UpdateProfileRequest>) | **High** | Broken Access Control (Assuming the backend endpoint does not verify the authenticated user's ownership of the profile being updated). |

---

## 🔎 Detail Analysis (Security Risks & Weaknesses)

### 🔴 High Priority Vulnerabilities

#### 1. Broken Access Control (BAC) in `updateConsultantProfile`
*   **Function:** `updateConsultantProfile(data: Partial<UpdateProfileRequest>)`
*   **Risk:** The function accepts `data` and patches a profile via `/updateprofile`. If the backend API endpoint does not enforce that the user making the request owns the profile being updated (e.g., by comparing an internal session ID to the profile owner ID), an attacker could update *any* consultant's profile by simply guessing the parameters (if the payload includes user identifiers).
*   **Mitigation:** The backend must verify the caller's identity against the profile being updated.

#### 2. Cross-Site Scripting (XSS) & Validation in `createBlog`
*   **Function:** `createBlog`
*   **Risk:** The function takes `title`, `summary`, and `content` as raw strings and submits them via `FormData`. There is no client-side or explicit server-side validation (input sanitization/encoding) on the content. If the API accepts raw HTML/script tags, and those tags are later rendered on a public page, it leads to stored XSS.
*   **Mitigation:** All incoming string content (Title, Summary, Content) must be aggressively sanitized (e.g., using libraries like DOMPurify) before being processed or saved to the database.

#### 3. Data Exposure / Over-fetching in `mapConsultant`
*   **Function:** `mapConsultant(c: any)`
*   **Risk:** This mapping function is responsible for unifying data from multiple API sources (`c.full_name || c.name || "User"`). Because it uses `any` for the input `c` and pulls data from many potentially unsanitized fields (e.g., `c.user_id`, `c.country_code`), it risks exposing internal or unnecessary fields if the raw API response structure changes or if the backend returns sensitive data (e.g., passwords, internal IDs) that are not explicitly needed in the public facing `Consultant` object.
*   **Mitigation:** Use strict TypeScript interfaces for the expected API response body structure. Only map explicitly required fields.

### 🟠 Medium Priority Vulnerabilities

#### 4. Potential Injection via Filtering in `getConsultants`
*   **Function:** `getConsultants(filters?: ConsultantFilters)`
*   **Risk:** The filters are constructed using `URLSearchParams` and appended to the query string. While modern framework wrappers often handle parameter encoding, if the backend API (`/consultants`) relies solely on this URL input without robust parameter binding (e.g., if it uses raw string concatenation in its database query), an attacker might introduce injection vectors (SQL/NoSQL).
*   **Mitigation:** Ensure the backend layer utilizes parameterized queries for all database interactions derived from API parameters.

#### 5. Potential IDOR in `getConsultantByUserId`
*   **Function:** `getConsultantByUserId(userId: string)`
*   **Risk:** This function fetches data using a user-provided `userId`. If the API endpoint `/users/${userId}/consultant` does not verify that the authenticated user performing the request is authorized to view the profile associated with `userId`, an attacker can view private consultant data belonging to other users.
*   **Mitigation:** The API must incorporate authorization middleware that checks if the request initiator matches the requested resource owner.

---

## 💡 Note (Tech Debt & Refactoring Opportunities)

1. **Type Safety Enforcement:** The extensive use of `any` (`mapConsultant`, `mapBlog`, `fetchJson<any>`) is a major source of runtime errors and difficult testing. Defining precise interface types for raw API responses (e.g., `ApiResponseForConsultants`) would dramatically improve reliability.
2. **Helper Function Isolation:** The `getAvatar` function is currently defined internally. If avatar generation logic is complex or reused, it should be extracted into a dedicated utility module (`utils/avatar.ts`).
3. **Error Handling:** The `fetchJson` wrapper assumes success. Functions should implement structured `try...catch` blocks and handle potential HTTP errors (401, 404, 500) gracefully, instead of just returning empty arrays or failing silently.

---

## ⚠️ Warning (Critical & Missing Components)

1. **Authentication Context Missing:** All exposed endpoints (`getConsultantById`, `createBlog`, etc.) rely on user context. The functions need to explicitly receive, validate, and utilize the user's authentication token or session context to enforce *who* is allowed to perform the actions (e.g., only an admin can delete a blog).
2. **Input Validation:** None of the functions perform server-side validation on incoming data. For example, when creating a blog, the service must validate that required fields (title, content, etc.) are present and that data types are correct *before* attempting to save to the database.
3. **Rate Limiting:** Public endpoints (e.g., search, profile view) are vulnerable to abuse. Implementing robust rate limiting (e.g., 100 requests per hour per IP/user) is critical for service stability.

---
***Recommendation Action Plan***

1. **Implement Middleware:** Wrap all functions with middleware that checks authentication and authorization (AuthN/AuthZ).
2. **Schema Validation:** Add Joi/Yup or similar library validation before database writes.
3. **Refactor Data Fetching:** Update API service calls to pass contextual user IDs instead of relying solely on query parameters where identity is paramount.