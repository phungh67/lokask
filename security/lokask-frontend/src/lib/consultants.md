[⬅ Return to Main Compendium](../../README.md)

# 🛡️ Security Verification Report: `apiClient.ts` (Data Retrieval & Mapping Layer)

## 📝 Overview

This module (`apiClient.ts`) serves as the primary data access layer for the application, handling interactions with various backend endpoints (`/consultants`, `/blogs`, `/niches`, etc.). It contains several helper functions (`mapConsultant`, `mapBlog`) responsible for normalizing and transforming raw API payloads into standardized, predictable client objects.

**Overall Assessment:** The code structure is generally clean and robust. It utilizes `fetchJson` (presumably a secure wrapper for `fetch`) and handles various data types and null checks effectively. The primary security concerns are not within the client-side mapping logic itself, but rather related to how user-supplied input is constructed into API calls (e.g., `URLSearchParams` and `FormData`), which could potentially lead to poor input validation or excessive data exposure if not handled by the backend.

### 🚨 Vulnerability Summary

| Area | Vulnerable/Concerned Element | Description | Priority |
| :--- | :--- | :--- | :--- |
| **Consultant Search** | `getConsultants(filters?)` | Filters are built using `URLSearchParams`. While standard URL encoding is used, the backend must strictly validate the data types (e.g., ensuring `minRating` is numeric, `page` is an integer) to prevent unexpected query parameters or type coercion vulnerabilities. | Medium |
| **Media Management** | `deleteConsultantMedia(imageUrl: string)` | Deletion relies solely on an `imageUrl` provided by the client. The backend endpoint (`/consultant/media`) must rigorously validate that the provided URL is authorized for deletion, ensuring the calling user is an owner or administrator. | High |
| **Profile Update** | `updateConsultantProfile(data: Partial<UpdateProfileRequest>)` | The entire profile update payload is sent via `JSON.stringify(data)`. The backend must perform comprehensive input validation and sanitization on *all* fields to prevent Mass Assignment vulnerabilities (allowing users to update fields they shouldn't, like `is_highly_trusted`). | High |
| **Data Mapping/Type Coercion** | `mapConsultant` / `mapBlog` | Multiple instances of `||` and `Number()` are used for defensive programming. While good, this complexity can mask underlying type mismatches or lead to unexpected default values (e.g., if `rating` is expected to be a float but defaults to 0, it might be misleading). | Low |

---

## 📑 Detailed Analysis

### 📂 `ConsultantFilters` Interface & `getConsultants` Function

**Function:** `getConsultants(filters?: ConsultantFilters): Promise<PaginatedConsultants>`
**Input:** User-controlled filters (city, niche, languages, page, limit, etc.).
**Vulnerability/Concern:**
1. **Input Validation Depth:** The function correctly uses `URLSearchParams` to encode parameters, mitigating basic XSS in URLs. However, the construction logic is purely client-side. If the backend doesn't enforce strict type validation (e.g., if a user inputs a non-numeric string for `minRating`), it could lead to unexpected database queries or application errors.
2. **Data Leakage:** If the `total_count` or `page`/`limit` calculation in the backend is flawed, it could expose the total number of users or pagination details unintentionally.

**Priority:** Medium

### 📂 `updateConsultantProfile` Function

**Function:** `updateConsultantProfile(data: Partial<UpdateProfileRequest>): Promise<any>`
**Input:** `data: Partial<UpdateProfileRequest>` (User-provided profile update payload).
**Vulnerability/Concern:**
1. **Mass Assignment Vulnerability (CRITICAL):** This is the highest risk function on the client side. Since the input is a partial object sent to a generic `/updateprofile` endpoint, the backend **must** use an allow-list approach. It cannot simply assume that every field provided by the client is safe to update. Attackers could attempt to inject sensitive fields (e.g., `is_admin: true`, `salary: 0`) if the backend model is too permissive.

**Priority:** High

### 📂 `deleteConsultantMedia` Function

**Function:** `deleteConsultantMedia(imageUrl: string): Promise<any>`
**Input:** `imageUrl: string` (Identifier for the media to be deleted).
**Vulnerability/Concern:**
1. **Insecure Direct Object Reference (IDOR) / Authorization Flaw:** The function relies only on the URL string. The backend API endpoint must not only verify that the `imageUrl` exists but, crucially, it must verify that the *currently authenticated user* has the explicit right to delete that specific resource. Simply passing the URL is insufficient authorization checking.

**Priority:** High

### 📂 `mapConsultant` Function

**Function:** `mapConsultant(c: any): Consultant`
**Input:** Raw, untrusted object (`c: any`) from the API response.
**Vulnerability/Concern:**
1. **Data Sanitization/Serialization:** The use of fallback logic (`c.full_name || c.name || "User"`) is robust for data integrity but requires attention. If the raw data coming from the API (`c`) contains non-string primitives or objects that shouldn't be displayed (e.g., HTML injection in `bio`), they are mapped directly. Assuming `fetchJson` handles basic serialization/sanitization, the primary risk remains ensuring that all string fields (`bio`, `description`, `comment`) are scrubbed of HTML before use on the client side, though this is often handled by the presentation layer.

**Priority:** Low (Assuming backend filters malicious payload)

### 📂 `createBlog` Function

**Function:** `createBlog(...)`
**Input:** User-supplied text fields (title, summary, content, etc.) and a `File` object.
**Vulnerability/Concern:**
1. **File Upload Handling (XSS/Malware):** The use of `FormData` is correct for file uploads. The backend must implement strict validation on the uploaded file (MIME type checking, size limits) and run anti-virus/content scanning before saving it to persistent storage.
2. **Input Sanitization:** All text fields (`title`, `summary`, `content`) must be rigorously sanitized on the backend to prevent XSS, especially if rich text is allowed.

**Priority:** Medium

---

## 📝 Notes & Warnings (Tech Debt / Recommendations)

### ⚠️ Technical Debt & Improvement Suggestions

1. **Standardize Input Validation:** While `getConsultants` handles URL construction, consider moving the complex logic of data structure creation into a dedicated "schema validation" layer (e.g., using Zod or Yup) before invoking the API calls. This would ensure that all inputs conform to expected types and ranges client-side, improving resilience.
2. **Error Handling in `mapConsultant`:** The mapping function uses aggressive fallbacks (`||`). If an API endpoint returns `null` for a critical field, and the mapping falls back to a default value (like an empty string or `0`), the calling component might fail later because it expected a non-null type. Consider explicit checks for `null` or `undefined` when performing mapping operations.
3. **Authentication Context:** Several endpoints implicitly rely on the user's identity (e.g., updating a user's own profile). Ensure that every function that modifies data verifies that the user token/context matches the owner of the data being changed to prevent **Insecure Direct Object Reference (IDOR)** attacks.

### ✅ Best Practices Implemented

*   **Separation of Concerns:** The module successfully abstracts API interaction logic from UI rendering, which is good practice.
*   **Use of Typed Inputs:** The explicit use of types for complex objects (like `Article` or `User`) helps maintain code clarity and predictability.
*   **Payload Handling:** The use of `FormData` for file uploads is correct for modern web APIs.