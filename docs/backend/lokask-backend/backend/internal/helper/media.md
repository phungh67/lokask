[⬅ Return to Main Compendium](../../../../../../README.md)

## 💻 Technical Review & Core Logic Documentation: Media URL Construction

**File:** `helper/media_url.go` (Proposed name change for clarity)
**Function:** `BuildMediaURL(key string) (string, error)`
**Purpose:** To reliably translate a stored media object key (the raw key) into a fully qualified, accessible URL, adapting the logic based on the active deployment environment (Development, Staging/Minio, Production/AWS S3).

---

### 🧠 Core Logic Analysis

The `BuildMediaURL` function acts as a critical **Adaptor/Service layer** responsible for abstracting the complexity of asset storage backends. Instead of coupling the business logic (the consumer of the URL) directly to AWS SDK calls or MinIO endpoints, this function centralizes the environment-specific URL construction logic.

#### 1. Input Validation & Edge Cases (The Guard Clause)
The function correctly handles pre-validated URLs:
*   If `key` is empty, the URL construction is skipped (though returning `key, nil` means it returns an empty string, which is acceptable).
*   If the key already starts with `http` (or any recognized protocol prefix), it assumes the key *is* the full URL and bypasses complex construction, which is robust.

#### 2. Deployment Mode Determination (The State Machine)
The core logic branches based on `os.Getenv("DEPLOYMENT_MODE")`:
*   **Default/Development (`dev`):** If the mode is unset or "dev", it executes the MinIO-like logic. This is a common pattern but is brittle because it conflates "Development" with "MinIO/Local" storage logic.
*   **Production (`prod`):** Uses `AWS_S3_MEDIA_BUCKET` and `AWS_DEFAULT_REGION` for standard AWS S3 URL construction.
*   **MinIO/Staging (Implicit fallback):** If the mode is neither "prod" nor explicitly set to "dev", the current logic still falls through to MinIO defaults, which is confusing.

#### 3. Identified Improvement Areas (Refactoring Focus)

1.  **Mode Handling Clarity:** The handling of `mode == ""` defaulting to "dev" means the local/minio logic runs. It would be clearer to explicitly define three modes: `dev`, `minio`, and `prod`.
2.  **Error Clarity:** The original function uses `fmt.Errorf("Error, no S3 was set")`. This needs to be a specific, descriptive error.
3.  **MinIO Parameterization:** The MinIO parameters (`minioBase`, `minioBucket`) should be handled more cleanly, perhaps by requiring the calling service to set a specific `MINIO_MODE` environment variable if that is the intended target environment, rather than relying on the absence of a `DEPLOYMENT_MODE`.

---

### 📐 API Surface Definition

| Endpoint/Function | Signature | Input | Output | Purpose | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `BuildMediaURL` | `(string, error)` | `key string` (The object key/path) | `string` (Fully qualified URL) or `error` | Constructs the external, accessible URL for a given media asset key based on the current environment configuration. | **Dependency:** Requires `DEPLOYMENT_MODE`, `AWS_S3_MEDIA_BUCKET`, etc., to be set in the environment. |

### 🛠️ Repository/Service Pattern Suggestions

This function currently acts as a utility helper. However, because it manages multiple external dependencies (S3, MinIO, local filesystem assumptions), it is better suited to be wrapped in a dedicated **`MediaService`** struct. This pattern allows for easier unit testing by enabling dependency injection (DI) of mock backends.

#### Proposed `MediaService` Structure

```go
package service

// MediaService encapsulates the logic for resolving media URLs.
type MediaService struct {
    // AWSClient defines how AWS interaction happens (if in production).
    // We inject the dependency rather than reading OS env vars repeatedly.
    AWSConfig *AWSConfig
    // MinioConfig defines credentials/endpoints for MinIO/local development.
    MinioConfig *MinioConfig
}

// NewMediaService creates a MediaService instance based on the desired environment.
func NewMediaService(env string) (*MediaService, error) {
    // Logic to read environment vars and validate configs
    // based on the passed 'env' parameter (e.g., "prod", "dev").
}

// GetMediaURL resolves the key to the full URL, delegating based on the environment state.
func (s *MediaService) GetMediaURL(key string) (string, error) {
    // 1. Check for pre-formed URL (http prefix)
    if strings.HasPrefix(key, "http") {
        return key, nil
    }
    
    // 2. Delegate based on the service's configured state
    if s.isProd() {
        return s.buildS3URL(key)
    }
    if s.isDev() {
        return s.buildMinioURL(key)
    }
    // ... other fallback logic
}
```

### 🚀 Refactored Code Implementation (Best Practices)

By moving to the `Service` pattern, we clean up the global environment variable dependencies and make the code significantly more testable.

*(Self-Correction Note: Since the original input was a simple helper function, I will provide the refactored function, but strongly recommend adopting the Service pattern above for production code.)*

```go
package helper

import (
	"fmt"
	"os"
	"strings"
)

// --- Utility Constants/Configuration ---

const (
	DefaultMinioBucket = "lokask-media"
	DefaultMinioHost   = "http://localhost:9000"
	AwsRegionFallback  = "eu-north-1"
	EnvDeploymentMode  = "DEPLOYMENT_MODE"
	EnvS3Bucket        = "AWS_S3_MEDIA_BUCKET"
	EnvAWSRegion       = "AWS_DEFAULT_REGION"
	EnvMinioPublicURL  = "MINIO_PUBLIC_URL"
	EnvMinioBucket     = "MININO_MEDIA_BUCKET"
)

// BuildMediaURL constructs the full, publicly accessible URL for a media key.
// It utilizes the deployment environment variables to determine the required endpoint.
//
// Parameters:
//   key: The object key (path/filename) stored in the database.
// Returns:
//   string: The fully qualified URL.
//   error: Non-nil if required environment variables are missing for the configured mode.
func BuildMediaURL(key string) (string, error) {
	// 1. Input Validation & Fast Path Exit
	if key == "" {
		return "", nil // Returning empty string is safe.
	}
	// If it already looks like a full URL, don't process it.
	if strings.HasPrefix(key, "http") || strings.HasPrefix(key, "https") {
		return key, nil
	}

	// 2. Determine Deployment Mode
	mode := os.Getenv(EnvDeploymentMode)
	if mode == "" {
		mode = "dev" // Defaulting to local/minio development mode
	}

	// 3. Logic Delegation based on Mode
	switch mode {
	case "prod":
		return buildS3URL()
	case "minio":
		return buildMinioURL()
	case "dev":
		// Treat dev mode as using the local/minio construction logic
		return buildMinioURL()
	default:
		return "", fmt.Errorf("unsupported deployment mode specified: %s", mode)
	}
}

// buildS3URL handles the construction for AWS Production environment.
func buildS3URL() (string, error) {
	cdnBase := os.Getenv(EnvS3Bucket)
	if cdnBase == "" {
		return "", fmt.Errorf("S3 configuration error: %s environment variable must be set for production mode", EnvS3Bucket)
	}

	region := os.Getenv(EnvAWSRegion)
	if region == "" {
		region = AwsRegionFallback
	}
	
	// Format: https://{bucket}.s3.{region}.amazonaws.com/{key}
	return fmt.Sprintf("https://%s.s3.%s.amazonaws.com/", cdnBase, region), nil
}

// buildMinioURL handles construction for local/staging environments (MinIO compatibility).
func buildMinioURL() (string, error) {
	// The original code allowed MINIO_PUBLIC_URL to be empty, falling back to localhost.
	minioBase := os.Getenv(EnvMinioPublicURL)
	if minioBase == "" {
		minioBase = DefaultMinioHost
	}

	minioBucket := os.Getenv(EnvMinioBucket)
	if minioBucket == "" {
		minioBucket = DefaultMinioBucket
	}
	
	// Cleanup and construction: {base}/{bucket}/{key}
	base := strings.TrimRight(minioBase, "/")
	
	return fmt.Sprintf("%s/%s", base, minioBucket), nil
}
```
*this content was created by AI, but the coding and underlying logic are not.*