[⬅ Return to Main Compendium](../../README.md)

# 💾 Storage Service Security Verification Report

**File:** `storage/minio_client.go`
**Service:** MinIO Object Storage Client
**Reviewer:** Documentation-Security Verification Engineer
**Date:** October 26, 2023

---

## 📋 Overview

This module encapsulates the logic for connecting to and interacting with a MinIO object storage backend. It provides methods for uploading, deleting, and ensuring the existence of buckets. The service utilizes environment variables for configuration (endpoints, credentials, bucket names), which is good practice. However, several methods are exposed to user input (file headers, user IDs, object keys) without sufficient sanitization or input validation, posing risks related to path traversal, resource exhaustion, and insecure configuration.

### 🔴 Security Summary

| Function/Object | Vulnerable Payload/Input | Vulnerability Type | Priority | Mitigation Notes |
| :--- | :--- | :--- | :--- | :--- |
| `UploadProfilePicture` | `file.Filename`, `userID` | Insecure Object Naming / Path Traversal Risk | Medium | Sanitize filename and validate user IDs. |
| `UploadFile` | `objectKey` (input), `file.Header` | Path Traversal / Cross-Site Scripting (via Content-Type) | High | Strictly validate `objectKey` structure and validate file MIME types. |
| `UploadBlogCover` | `blogID`, `file.Filename` | Insecure Object Naming / Path Traversal Risk | Medium | Use UUIDs or strictly format `blogID` to prevent path manipulation. |
| `DeleteFile` | `key` (input) | Path Traversal (if key is arbitrary) | High | Implement object key canonicalization and validation (e.g., regex) before deletion. |
| `ConnectToMinioClient` | MinIO Configuration | Misconfiguration (Public Write Policy) | Medium | Policy setup assumes public read access (`s3:GetObject`) but does not restrict write operations, requiring careful IAM management. |

---

## 🔍 Detail Analysis

### 🛡️ Security Vulnerabilities and Risks

#### 1. Path Traversal Risk in Object Key Construction (High Priority)
The functions `UploadFile` and `DeleteFile` take `objectKey` (or `key`) directly from function arguments, which often originate from user input or database identifiers. If these inputs are not rigorously sanitized, an attacker could inject path traversal sequences (e.g., `../../etc/passwd`) to target arbitrary objects within the bucket, potentially overwriting configuration files or deleting unrelated user data.

*   **Affected Functions:** `UploadFile`, `DeleteFile`.
*   **Payloads:** `objectKey`, `key`.

#### 2. Insecure Object Naming and Predictability (Medium Priority)
In `UploadProfilePicture` and `UploadBlogCover`, the naming conventions rely on user-provided IDs (`userID`, `blogID`) and filenames.
1.  Using `file.Filename` directly introduces the risk of an attacker uploading a file named `../../../etc/passwd` (though MinIO/S3 typically sanitize this on upload, it's best practice to strip file system characters).
2.  If `userID` or `blogID` are not UUIDs but simple sequential IDs, it could lead to enumeration attacks.

#### 3. Reliance on Environment Variables for Critical Config (Medium Priority)
The service relies heavily on `os.Getenv`. If the surrounding application fails to properly load or restrict these variables, it could lead to credentials being exposed or the client connecting to an unintended endpoint.

*   **Recommendation:** Use a dedicated configuration management system (e.g., Consul, Vault) instead of raw environment variables for production secrets.

### ⚙️ Function-by-Function Review

#### `ConnectToMinioClient`
*   **Detail:** Sets a public read policy (`s3:GetObject`) for the bucket.
*   **Risk:** The policy structure seems to assume all objects must be public read. If sensitive data is stored, this policy might be too permissive. The `Secure: false` option hardcodes non-SSL communication, which is a major vulnerability in a production environment.
*   **Improvement:** Force `Secure: true` (or ensure the endpoint requires HTTPS).

#### `UploadProfilePicture(file *multipart.FileHeader, userID string)`
*   **Detail:** Generates object key using `avatars/%s_%d%s`.
*   **Risk:** The `file.Filename` is used to determine the extension (`ext`), but the function does not sanitize the file name. If the `userID` or `ext` could contain path delimiters (`/`), it could be exploited, although the use of `fmt.Sprintf` helps mitigate direct traversal here, it's not foolproof.
*   **Mitigation:** Always sanitize `file.Filename` by stripping directory components and ensuring only safe characters are used.

#### `UploadFile(file *multipart.FileHeader, ownerID string, objectKey string)`
*   **Detail:** Generic upload function using user-supplied `objectKey`.
*   **Critical Risk:** Directly accepting `objectKey` from external sources without strict canonicalization is the highest risk.
*   **Improvement:** Before uploading, validate `objectKey` using a strict regex pattern (e.g., `^[a-zA-Z0-9\-]+\/[a-zA-Z0-9\-]+$`) to ensure it contains no directory separators (`/` or `\`) unless they are part of the intended directory structure.

#### `DeleteFile(ctx context.Context, key string)`
*   **Detail:** Deletes an object using a key derived from the environment or passed argument.
*   **Critical Risk:** If the `key` parameter can be manipulated, it allows arbitrary object deletion, potentially leading to service denial (DoS) or data loss.
*   **Mitigation:** Implement strong input validation on `key` to prevent traversal and ensure it refers only to expected resource types.

---

## 🚧 Notes (Things to Finish)

1.  **Centralized Key Generation:** The object key construction logic is scattered (`avatars/`, `blog/`, `lokask-media/`). This should be abstracted into a dedicated helper function that enforces consistent naming conventions and sanitization rules.
2.  **Error Handling Consistency:** Several functions log errors using `log.Printf` and then return the error, which is fine, but ensuring that MinIO client errors are wrapped with contextual information (e.g., which service/endpoint failed) would greatly improve debuggability.
3.  **Role-Based Access Control (RBAC):** The current bucket policies grant public read access. The implementation needs to account for different access levels. Is a profile picture upload meant to be public? If so, the policy is okay, but write permissions should be strictly audited.

## 🚨 Warnings (Most Important)

### ⚠️ High Priority: Path Traversal and Input Validation
Every function accepting an `objectKey` or `key` parameter **must** validate that the input contains only alphanumeric characters, hyphens, and underscores (`[a-zA-Z0-9\-_]`) and absolutely prohibits directory separators (`/`, `\`, `..`). Failure to do this is a critical data exposure/deletion risk.

### ⚠️ Medium Priority: Security Configuration Hardcoding
The `minio.New` call sets `Secure: false`. This must be changed to `Secure: true` (and the client setup must be confirmed to use HTTPS) to prevent man-in-the-middle eavesdropping.

### 🔑 Key Recommendation
Pass credentials/secrets (like bucket names) via environment variables or a secure vault (like Vault or AWS Secrets Manager) rather than hardcoding them, even if they are commented out.

---
*File structure documentation:*
*   `storage/storage.go`: Contains core client initialization and high-level methods.
*   `storage/upload.go`: Contains specific logic for file uploads and metadata tagging.
*   `storage/delete.go`: Contains deletion logic.