[⬅ Return to Main Compendium](../../README.md)

# 📁 `helper/helper.go` - Media URL Generation Logic

This file contains utility functions for constructing and parsing media object keys into full, accessible URLs, abstracting away the underlying storage system (AWS S3 vs. Minio).

---

## 🛡️ Security Vulnerability Analysis Summary

| Function / Payload | Vulnerability Description | Priority | Remediation Focus |
| :--- | :--- | :--- | :--- |
| `BuildMediaURL(key string)` (Input `key`) | **Lack of Sanitization/Validation on `key`**: The function assumes `key` is safe for inclusion in a URL path. Malicious characters (e.g., `../`, `?`, `#`) in the key could lead to path traversal or misdirection if not properly sanitized before constructing the URL. | **High** | Input validation and sanitization of the media `key`. |
| `BuildMediaURL()` (Environment Variables) | **Reliance on Untrusted Environment Variables**: The function heavily relies on multiple environment variables (`AWS_S3_MEDIA_BUCKET`, `AWS_DEFAULT_REGION`, `MINIO_PUBLIC_URL`, `MININO_MEDIA_BUCKET`). If these variables are not set or contain unexpected values, the function constructs incorrect or insecure URLs. | **Medium** | Robust input/environment variable validation and fallback mechanisms. |
| Return Payload (URLs) | **Hardcoded Default Regions/Endpoints**: The function uses a hardcoded default region (`"eu-north-1"`) if `AWS_DEFAULT_REGION` is missing. This limits flexibility and might fail if the deployment requires a different region. | **Low** | Standardizing region fetching or passing it as a required parameter. |

***

## 📄 Detailed Documentation

### Overview

The `helper` package provides the `BuildMediaURL` function. This function is crucial for generating canonical URLs for media assets stored in object storage (AWS S3 or Minio). Instead of storing the full, potentially complex URL in the database, the system stores a simple object key. This function reconstructs the full URL based on the deployment environment (`DEPLOYMENT_MODE`).

### Detail Analysis

The logic branches based on the `DEPLOYMENT_MODE` environment variable:

1.  **If `key` is empty or starts with "http"**: The key is returned directly. (This is used when the input is already a full URL).
2.  **If `DEPLOYMENT_MODE` is `prod` (AWS S3)**:
    *   Retrieves `AWS_S3_MEDIA_BUCKET` and `AWS_DEFAULT_REGION`.
    *   Constructs the URL using the format: `https://{bucket}.s3.{region}.amazonaws.com/{key}`.
    *   **Vulnerability Note**: Checks for missing S3 environment variables but the path construction itself assumes the input `key` is clean.
3.  **If `DEPLOYMENT_MODE` is set (Minio/Local)**:
    *   Retrieves `MINIO_PUBLIC_URL` and `MININO_MEDIA_BUCKET`.
    *   Constructs the URL using the format: `{minioBase}/{minioBucket}/{key}`.
    *   **Vulnerability Note**: Uses `strings.TrimRight(minioBase, "/")` which is acceptable but the dependency on `MINIO_PUBLIC_URL` being correctly formatted is high.

### 🚨 Security Warning (Critical)

**Path Traversal on `key` Parameter:**

The function takes the `key` parameter and directly embeds it into the resulting URL string (`fmt.Sprintf` or basic concatenation). If the calling service does not validate the `key` input, an attacker could provide a malicious key like `../sensitive_config.txt` or `../../etc/passwd`.

While cloud storage providers (S3/Minio) typically handle object keys safely by design, constructing the URL in the application layer should still account for this. A sanitization step (e.g., removing `..`, redundant path separators, and ensuring the key consists only of permitted characters) must be implemented on the input `key`.

### 💡 Implementation Notes & Tech Debt

1. **Configuration Over-reliance (Tech Debt):** The function has complex dependency management via many environment variables (`AWS_S3_MEDIA_BUCKET`, `MINIO_PUBLIC_URL`, etc.). If these variables are not managed centrally or validated robustly (e.g., using a configuration struct initialized once), deployment complexity increases.
2. **Missing Error Handling for Defaults:** When Minio variables are set to default values (`http://localhost:9000` and `lokask-media`), there is no check if those defaults are actually suitable for the running environment.
3. **Refactoring Suggestion:** Consider abstracting the URL construction logic into an interface (`URLBuilder`) rather than using large conditional blocks based on `DEPLOYMENT_MODE`. This would improve testability and scalability when adding new storage providers (e.g., Azure Blob Storage).

---

## 🎨 Conceptual Diagram (Figure Placeholder)

A diagram illustrating the flow:

**Input Key $\rightarrow$ [Check Key Validity] $\rightarrow$ [Check Deployment Mode]**

*   **If `DEV`:** Use Local/Minio Build $\rightarrow$ **Minio URL**
*   **If `PROD`:** Use S3 Build $\rightarrow$ **S3 URL**
*   **If Invalid/Full URL:** Return Key $\rightarrow$ **Raw URL**

**(Figure: Media URL Construction Flowchart)**

---

## 🔗 Related Files & Dependencies

To maintain proper coding flow and test dependencies, ensure the following links are checked:

*   **Calling Code Logic:** Check the service/handler layer that calls `BuildMediaURL(key)` to ensure that **all incoming `key` inputs are sanitized** before calling this helper. (e.g., `../handlers/media_upload.go`)
*   **Environment Variable Management:** The variables (`DEPLOYMENT_MODE`, `AWS_S3_MEDIA_BUCKET`, etc.) must be managed and validated in the main infrastructure initialization process.
*   **(Cross-Reference Link):** See the usage of environment variables in core middleware logic, e.g., `[../middleware/auth]`.