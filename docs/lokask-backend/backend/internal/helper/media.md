```markdown
[⬅ Return to Main Compendium](../../README.md)

# 🛠️ Media URL Construction Utility (`package/helper/helper.go`)

This document provides a comprehensive guide to the `helper` package, specifically detailing the implementation of `BuildMediaURL`. This component is critical infrastructure for ensuring that application services can consistently generate publicly accessible, full URLs for stored media objects, abstracting away the underlying storage mechanism (S3 or MinIO).

---

## 🏗️ Overview

The `helper` package manages the transformation of a raw media object key (a relative path or filename) into a complete, functional URL. The core function, `BuildMediaURL`, intelligently determines the correct URL construction logic based on the current runtime environment, reading the `DEPLOYMENT_MODE` environment variable.

**Key Function:** `BuildMediaURL(key string) (string, error)`

**Goal:** Decouple the business logic from infrastructure concerns (i.e., the calling service only passes a key, and the helper handles the complexity of AWS vs. local storage).

## ⚙️ Detail and Technical Deep Dive

### 1. Core Logic Flow

The `BuildMediaURL` function follows a strict, environment-aware sequence:

1.  **Pre-Check:** It first checks if the input `key` is empty or already contains a protocol prefix (`http`). If either is true, the key is returned as is, avoiding unnecessary processing.
2.  **Environment Mode Detection:** It reads `DEPLOYMENT_MODE`. If unset, it defaults to `"dev"`.
3.  **Production Path (`mode == "prod"`):**
    *   **Dependency Check:** Requires `AWS_S3_MEDIA_BUCKET` and relies on `AWS_DEFAULT_REGION` (defaulting to `eu-north-1`).
    *   **Construction:** Uses the canonical AWS S3 endpoint format: `https://{bucket}.s3.{region}.amazonaws.com/{key}`.
    *   *Error Handling:* Returns an explicit error if the required S3 bucket environment variable is missing.
4.  **Development/MinIO Path (All other modes):**
    *   **Dependency:** Relies on MinIO/local storage configuration (`MINIO_PUBLIC_URL` and `MININO_MEDIA_BUCKET`).
    *   **Defaults:** Defaults the public URL to `http://localhost:9000` and the bucket to `lokask-media`.
    *   **Construction:** Concatenates the components: `{base_url}/{bucket}/{key}`.

### 2. Infrastructure Diagram (Conceptual Flow)

```mermaid
graph TD
    A[Input Key: "media/photo.jpg"] --> B{Check Key Validity};
    B -- Invalid/Full URL --> C[Return Key Directly];
    B -- Valid Key --> D{Read DEPLOYMENT_MODE};
    D --> E{Mode == "prod"?};

    E -- Yes --> F[S3 Logic];
    F --> G{Check AWS_S3_MEDIA_BUCKET};
    G -- Success --> H[Build AWS URL];
    H --> K(Output URL);

    E -- No (dev/local) --> I[MinIO Logic];
    I --> J{Use MinIO/Local Config};
    J -- Success --> L[Build MinIO URL];
    L --> K(Output URL);
```

### 3. Knowledge Base Analysis

| Area | Component Focus | Implementation Notes |
| :--- | :--- | :--- |
| **System Design** | Media Service Layer | This component enforces the abstraction layer between the application service and the storage endpoint. The pattern dictates that no internal service should construct a URL string; they must call `BuildMediaURL` first. |
| **Infrastructure** | Cloud Integration | Direct coupling to environment variables (`AWS_S3_MEDIA_BUCKET`, `MINIO_PUBLIC_URL`). This is a standard pattern for configuration management but requires careful deployment management. |
| **Cloud Components** | AWS S3 / MinIO | Handles the structural differences between Amazon Web Services (specific URL format) and general-purpose object storage (MinIO). |
| **Security** | Exposure | This component *builds* the public URL. It assumes that the underlying storage bucket/container is correctly configured for public read access, but it does not handle authentication itself. |

---

## 📝 Note to Implementers

*   **Environment Dependency:** All services calling this helper **must** ensure that `DEPLOYMENT_MODE` is correctly set in the running container/VM. Failure to set this variable will lead to the use of the default development/MinIO path, which is not appropriate in production.
*   **Immutability of Keys:** The system design requires that the `key` passed into this function is always the object's path/name as stored in the bucket/container. Modifying the key before calling this function is forbidden.
*   **Usage Linkage:** When refactoring or calling this logic, always ensure the calling method (e.g., in `api/user_handler.go` or `storage/upload.go`) uses this package instead of hardcoding any URL logic.

## ⚠️ Warning & Technical Debt (Tech Debt)

### 1. Hardcoded Defaults (High Priority)

The function hardcodes defaults for MinIO (`http://localhost:9000` and `lokask-media`) and for the AWS region (`eu-north-1`).

*   **Recommendation:** These defaults should be moved out of the function body and into a dedicated configuration object or loaded from a configuration file (e.g., using Viper or a dedicated config service) to improve testability and maintainability.

### 2. Environment Variable Reliance (Medium Priority)

The tight coupling to global environment variables makes unit testing cumbersome, as the entire global context must be mocked to test different deployment modes.

*   **Recommendation:** Consider refactoring `BuildMediaURL` to accept configuration parameters (e.g., `BuildMediaURL(key, deploymentMode, s3Config, minioConfig)`). This separates the *logic* from the *configuration source*, making it pure and highly testable.

### 3. Lack of Key Sanitization (Low Priority)

The function assumes the `key` passed in is perfectly safe. While the structure of the inputs is controlled by the database, in a complex microservice environment, input keys could theoretically contain problematic characters.

*   **Recommendation:** If keys are user-supplied or passed through multiple services, consider adding a sanitization step to ensure the key only contains characters suitable for file paths and URLs.

***

**Related Files/Flow:**

*   **Usage Example:** See `pkg/services/media_service.go` for how this function should be called when an object is retrieved from the database.
*   **Configuration:** Review `pkg/config/config.go` to ensure `DEPLOYMENT_MODE` is loaded correctly during service startup.
```