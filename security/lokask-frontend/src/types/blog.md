```markdown
[⬅ Return to Main Compendium](../../README.md)

# 📚 Data Model: Blog Post Schema (`Blog` Interface)

This document analyzes the structure and potential vulnerabilities associated with the `Blog` data transfer object (DTO) or interface. It outlines best practices for validation, serialization, and consumption of this data model.

---

## 🛡️ Security Vulnerability Analysis

The primary risks associated with data interfaces are insecure deserialization, insufficient validation (leading to XSS/Injection), and improper handling of sensitive or derived data.

### 🎯 Summary Table

| Feature | Vulnerability Risk | Priority | Description |
| :--- | :--- | :--- | :--- |
| `content` | XSS/Injection | **High** | User-supplied content must be sanitized before storage and rendered. |
| `title`, `summary` | XSS/Injection | **Medium** | While shorter, these fields can still carry malicious scripts if input validation is weak. |
| `authorName`, `authorAvatar` | Data Integrity/Impersonation | **Low** | Reliance on client/front-end provided data for identity attributes. Should be sourced server-side. |
| `category`, `readTime`, `viewsCount` | Data Trust/Validation | **Medium** | Calculated fields (`readTime`, `viewsCount`) must be trusted and managed by the backend, not derived or set client-side. |

***

### 🔍 Detailed Breakdown

#### **Overview**
This interface defines the core attributes of a blog post. It combines user-generated content (Title, Content) with system-generated metadata (IDs, Creation Dates). The inherent risk lies in treating all incoming data fields as trustworthy. Strong input validation, output encoding, and strict backend ownership of metadata are critical.

#### **Detail Analysis**

| Field | Type | Vulnerability Risk | Validation Required | Mitigation Strategy |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `string` | Low | Ensure format matches UUID/GUID expectations. | Use server-generated, non-guessable IDs. |
| `authorId` | `string` | Low | Must validate existence against the `User` service. | Authorization checks (Does `user` own `blog`?). |
| `title` | `string` | Medium | Length constraints, allow-list characters. | Implement **Context-Aware Output Encoding** on display. |
| `summary` | `string` | Medium | Length constraints, character limits. | Implement **Context-Aware Output Encoding** on display. |
| `coverImageUrl` | `string` | Low | Validate URL format (is it absolute/relative?). | Use Content Security Policy (CSP) to restrict image sources. |
| `content` | `string` | **High** | Rich Text sanitization (Markdown, HTML). | **Mandatory:** Sanitize input upon write (e.g., using OWASP AntiSamy). Sanitize output upon read. |
| `createdAt` | `string` | Low | Date format validation. | Must be generated and controlled by the persistence layer. |
| `authorName?` | `string` | Low | N/A | **Trust Warning:** Do not display this if the data originates from the client. |
| `authorAvatar?` | `string` | Low | URL validation. | Use server-sourced avatar URLs based on `authorId`. |
| `category?` | `string` | Medium | Must reference a controlled taxonomy/enum list. | Implement strict type/enum validation on the backend. |
| `readTime?` | `string` | Medium | Must be calculated server-side based on `content` length/complexity. | Backend calculation logic ownership. |
| `viewsCount?` | `number` | Medium | Must be incremented atomically and only by the service endpoint. | Use transactional database increments; never trust client-set values. |

#### **Security Summary**

1.  **Injection Flaws (XSS/SQLi):** The highest risk is in `content` and `summary`. All user input must be treated as untrusted. Use robust sanitization libraries for HTML/Markdown before persistence, and ensure context-aware encoding (HTML encoding for HTML contexts, etc.) when rendering.
2.  **Broken Function Level Authorization (BFLA):** Although not explicitly visible in the schema, any endpoint consuming this model must verify that the requesting user is authorized to view or edit the post corresponding to the provided `authorId` or `id`.
3.  **Data Tampering:** Fields like `viewsCount` and derived fields (`readTime`) must *never* be accepted or validated against client input; they must be computed and persisted exclusively by the backend service.

---

### ⚠️ Notes and Warnings (Tech Debt / Missing Logic)

*   **[Important] Content Sanitization Pipeline:** There is currently no defined logic for sanitizing the `content` field. This must be implemented immediately. The preferred approach is to use a robust library (like DOMPurify or AntiSamy) that strips all dangerous tags/attributes while preserving desired formatting (e.g., Markdown to HTML conversion).
*   **[Tech Debt] Status Management:** The schema lacks a status field (e.g., `isPublished: boolean`, `draft: boolean`). Implementing this is crucial for controlling visibility and preventing accidental publication of incomplete content.
*   **[High Priority] Field Ownership:** Explicitly mark which fields are **Write-Only (Client Input)**, **Read-Only (Server Derived)**, and **Primary Key**. This clarifies the trust boundary.

---

### 🔗 Related Files / Flow Links

For completeness, please ensure the following services validate and enforce the schema constraints:

*   [Backend Service Validation Logic](../../service/blog-service.go)
*   [API Validation Middleware](../../middleware/validate.go)
*   [Repository/Persistence Layer Schema](../../repository/blog_schema.sql)
*   [Content Sanitization Utility](../../utils/sanitizer.go)
```