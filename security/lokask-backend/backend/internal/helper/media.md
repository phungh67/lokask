```markdown
[⬅ Return to Main Compendium](../../README.md)

# 🛡️ Code Review: `helper/media_url_builder.go`

**File:** `helper/media_url_builder.go`
**Description:** Utility file responsible for constructing and parsing media object keys into full, environment-specific URLs (S3, MinIO, etc.).

---

## 📋 Overview

This module provides a critical utility function, `BuildMediaURL`, which abstracts the complexity of generating correct URLs for stored media objects. It intelligently determines the required storage backend (AWS S3 for production, MinIO otherwise) based on the `DEPLOYMENT_MODE` environment variable. This separation of concerns is good practice for deployment flexibility, but the reliance on multiple environment variables introduces potential configuration risks.

**Vulnerability Summary:**
| Function/Object | Vulnerability Point | Priority | Recommendation |
| :--- | :--- | :--- | :--- |
| `BuildMediaURL(key string)` | Input sanitization of `key` (Path Traversal) | Medium | Input validation/sanitization on `key`. |
| Environment Variables (General) | Misconfiguration/Variable Dependency | High | Implement mandatory checks and sensible defaults for all necessary env vars. |
| `BuildMediaURL(key string)` | Incomplete Error Handling (MinIO) | Medium | Improve error reporting and make MinIO dependencies clearer. |

---

## 🔍 Detail Analysis

### `func BuildMediaURL(key string) (string, error)`

**Function Purpose:** Builds a full URL for a media object key.

**Logic Flow:**
1. Checks if the `key` is empty or already an absolute URL (`http` prefix). If so, returns the key directly.
2. Determines `mode` from `DEPLOYMENT_MODE`. Defaults to "dev".
3. **Production Mode (`mode == "prod"`):**
    * Requires `AWS_S3_MEDIA_BUCKET` and `AWS_DEFAULT_REGION`.
    * Constructs URL using `https://%s.s3.%s.amazonaws.com/%s`.
    * Handles missing S3 bucket gracefully with an error.
4. **Development/Testing Mode (MinIO/Other):**
    * Defaults `minioBase` to `http://localhost:9000`.
    * Uses `MININO_MEDIA_BUCKET` (with fallback `lokask-media`).
    * Constructs URL using `"%s/%s/%s"`.

### Vulnerability Breakdown

#### ⚠️ 1. Path Traversal (Input Key)
* **Vulnerability:** The `key` parameter, which is expected to be a storage path, is used directly in `fmt.Sprintf`. If this `key` originates from user input (e.g., user-provided filename or object key), an attacker could inject path traversal sequences (`../`) to potentially point the constructed URL to resources outside the intended bucket scope, although the actual access control depends on the backend service.
* **Mitigation:** Always sanitize or validate the `key` parameter to ensure it only contains allowed characters (alphanumeric, hyphens, underscores, and slashes) and does not start with directory traversal sequences.

#### ⚠️ 2. Environment Variable Dependency and Configuration Failure
* **Vulnerability:** The function is highly dependent on global environment variables (`DEPLOYMENT_MODE`, `AWS_S3_MEDIA_BUCKET`, `MINIO_PUBLIC_URL`, etc.). If these variables are missing or incorrectly scoped in production/testing environments, the function fails or uses insecure defaults (e.g., hardcoded `lokask-media` bucket).
* **Impact:** Leads to incorrect URL generation, service disruption, or potential fallback to insecure/local endpoints.

#### ⚠️ 3. MinIO Path Construction (Regex/Sanitization)
* **Vulnerability:** The MinIO construction uses `strings.TrimRight(minioBase, "/")` followed by joining three components. While functional, if `minioBase` contains unusual characters or unintended slashes, the join logic could be brittle, leading to malformed URLs.

---

## 📝 Documentation & Review Notes

### ✨ Overview (Summary)
This file correctly encapsulates media URL generation logic, improving separation of concerns. The tiered approach (S3 vs. MinIO) is robust but increases dependency complexity. Input sanitization on the `key` is mandatory.

### 🔩 Technical Notes
1. **Consistency:** Ensure that the default bucket name for MinIO (`lokask-media`) is documented as a fallback constant and not hardcoded magic value.
2. **Error Scope:** The error handling for the AWS path is good (`return "", fmt.Errorf("Error, no S3 was set")`). This pattern should be applied consistently to other critical configuration checks.
3. **Link Integrity:** This utility file is likely consumed by handlers or services that manage asset uploads/retrievals. The consuming components must be reviewed to ensure they sanitize the `key` *before* passing it to `BuildMediaURL`.

### 🔴 Warnings (Critical Action Items / Tech Debt)
1. **Input Validation (URGENT):** Implement strong validation/sanitization for the `key` parameter immediately. It must be validated against a strict regex that prevents directory traversal (`../`, absolute paths).
2. **Configuration Object:** Consider refactoring the entire URL building mechanism to accept a configuration struct instead of relying purely on global `os.Getenv()`. This makes unit testing far simpler and allows explicit handling of required variables.

---

## ⚙️ Implementation Details

### 💡 Suggested Improvement (Code Snippet Recommendation)

To improve Path Traversal resistance, the key processing should incorporate normalization:

```go
import "path/filepath"
// ... inside BuildMediaURL

// Sanitize key to prevent directory traversal
// This ensures that "foo/../bar" is treated as "bar" or similarly cleaned.
cleanKey := filepath.Clean(key) 
// Use cleanKey instead of key in subsequent logic.
```

### 🔗 Related Files and Flow
* **Consumption Points:** `handler/media_upload_handler.go` (Likely calls this function after receiving file data).
* **Dependency:** `config/environment.go` (The source of truth for environment variables used here).
* **Logic Flow:** This utility is a foundational piece of the application's persistence layer. Any change here affects all parts of the application that handle asset URLs.
```