# 🛡️ Security Verification Report: File Storage Service (`storage` package)

[⬅ Return to Main Compendium](../../README.md)

---

## 📝 Overview

This document provides a security and architectural review of the `storage` package, which implements file storage functionality using AWS S3. The module defines an interface (`FileStorage`) and a concrete implementation (`S3Client`) to manage object uploads (avatars, general files, blog covers) and deletions.

The core logic for file handling appears functional, leveraging `multipart.FileHeader` for input. However, several critical vulnerabilities related to **Input Validation**, **Authorization Scope**, and **Context Management** were identified that require immediate remediation to prevent unauthorized data modification or leakage.

### 🧭 Navigation

*   [1. 🔴 Summary & Vulnerability Ranking](#summary--vulnerability-ranking)
*   [2. 🧠 Detailed Security Analysis](#detailed-security-analysis)
    *   [2.1 General Architectural Issues](#general-architectural-issues)
    *   [2.2 Function Breakdown](#function-breakdown)
*   [3. ⚙️ Engineering Notes & Recommendations](#engineering-notes--recommendations)
*   [4. ⚠️ Critical Warnings & Tech Debt](#critical-warnings--tech-debt)

---

## 🔴 Summary & Vulnerability Ranking

| Function / Object | Vulnerable Component | Attack Vector | Priority | Description |
| :--- | :--- | :--- | :--- | :--- |
| `UploadFile` | `objectKey` parameter | Arbitrary Resource Overwrite / IDOR | **HIGH** | Caller controls the entire S3 key, allowing potential overwriting of sensitive files if not strictly controlled by the service logic. |
| `DeleteFile` | `key` parameter | Insecure Direct Object Reference (IDOR) | **HIGH** | Deletes any object provided by the caller without validating if the caller owns the resource. |
| `Upload*` methods | File Handling | Missing Content Validation | **MEDIUM** | No validation (MIME type, file extension check, size limit) is performed on incoming files, allowing potential malicious uploads (e.g., uploading executable files renamed to images). |
| `*` methods | Context Usage | Context Leakage | **MEDIUM** | Frequent use of `context.TODO()` ignores proper context tracing, making the code susceptible to issues in larger, distributed systems. |
| `*` methods | Initialization | Environment Dependency | **LOW** | Relies heavily on global `getEnv()` calls, making local testing and dependency management brittle. |

---

## 🧠 Detailed Security Analysis

### 2.1 General Architectural Issues

#### **Vulnerability: Improper Authorization Scope (IDOR)**
The current design assumes that any calling service layer (e.g., a handler or controller) is responsible for sanitizing and authorizing the inputs (`objectKey`, `key`). In `UploadFile` and `DeleteFile`, the resource identifiers are taken directly from arguments, creating a classic **Insecure Direct Object Reference (IDOR)** risk.

*   **Impact:** A low-privilege user could potentially delete or overwrite files belonging to other users simply by knowing or guessing the resource keys.
*   **Mitigation:** The service layer must enforce ownership checks at the boundary. The `DeleteFile` function should ideally accept a `resourceOwnerID` alongside the `key` and perform an ownership lookup before interacting with S3.

#### **Vulnerability: Lack of Input Validation**
All upload functions rely on the client providing valid files. However, the code only reads the `Content-Type` header and the raw stream.

*   **Impact:** An attacker can bypass file type restrictions by uploading executables (`.exe`) or malicious scripts and simply renaming them to image extensions (e.g., `image.jpg`).
*   **Mitigation:** Implement mandatory server-side validation:
    1.  **MIME Type Sniffing:** Use libraries (or services) to determine the actual content type, not just the header provided by the client.
    2.  **Size Limits:** Enforce strict file size limits to prevent denial-of-service (DoS) via massive uploads.

### 2.2 Function Breakdown

#### 📂 `S3Client.UploadProfilePicture`
| Flaw | Details | Remediation |
| :--- | :--- | :--- |
| **Security** | The `userID` is used to create the key, which is good, but the file content itself is unchecked. | **Action:** Implement MIME type and size validation. |
| **Code Quality** | Uses `context.TODO()` for the S3 `PutObject` call. | **Action:** Ensure a valid context (e.g., passing the request context) is always provided. |
| **Flow** | Key generation uses `time.Now().Unix()` which adds uniqueness, minimizing collision risks. | **Assessment:** Structurally sound, pending validation improvements. |

#### 📂 `S3Client.UploadFile`
| Flaw | Details | Remediation |
| :--- | :--- | :--- |
| **Security (HIGH)** | Accepts `objectKey` as a direct parameter. If this key is not generated/validated by the calling service using the `ownerID`, it exposes the system to IDOR/Arbitrary Write attacks. | **Action:** If the goal is to secure uploads, the service must generate the full key based on the `ownerID` and context, instead of accepting it. |
| **Security** | No validation of `objectKey` for reserved characters or path traversal sequences (`../`). | **Action:** Validate and sanitize the `objectKey` to ensure it only contains allowed characters (alphanumeric, hyphens, etc.). |

#### 📂 `S3Client.UploadBlogCover`
| Flaw | Details | Remediation |
| :--- | :--- | :--- |
| **Security** | Relies on `blogID` from the caller. If `blogID` is a user-provided string, it could potentially be manipulated (though less likely than the object key scenario). | **Action:** Validate `blogID` input (e.g., ensuring it's a UUID or integer format) before constructing the key. |
| **Medium** | No file validation. | **Action:** Apply file type/size validation consistently across all upload paths. |

#### 📂 `S3Client.DeleteFile`
| Flaw | Details | Remediation |
| :--- | :--- | :--- |
| **Critical Security Flaw** | The function accepts an arbitrary resource key (`key`) without any context or authorization check. Any authenticated user who knows a valid key can delete any resource. | **MUST BE REVISED:** Before executing the deletion, the service must check if the calling user/principal has explicit ownership or administrative rights to the resource identified by `key`. |

### 💡 Code Recommendation Summary
1.  **Implement Authorization Checks:** Add ownership checks to all delete/modify operations.
2.  **Input Sanitization:** Sanitize and validate all inputs used in key construction (`key`, `blogID`).
3.  **File Validation:** Implement client-side and server-side file type/size validation.

***

### 📚 Related Code Snippets
*   **Input Validation Helper:** A generalized function to sanitize user-provided strings used in path construction.
*   **Authorization Check Middleware:** A function that enforces resource ownership checks before allowing file operations.
