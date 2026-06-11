
[⬅ Return to Main Compendium](../../README.md)

# 📁 Storage Service Implementation (S3 Client)

This module provides the concrete implementation for file storage, utilizing Amazon Simple Storage Service (S3) as the primary backend. It abstracts the underlying cloud storage mechanism behind a defined interface, promoting loose coupling and testability.

## 🗺️ Structural Navigation

- [Overview](#overview)
- [Detailed Component Analysis](#detailed-component-analysis)
  - [FileStorage Interface](#filestorage-interface)
  - [S3Client Structure](#s3client-structure)
  - [Connection Logic](#connection-logic)
  - [Method Implementations](#method-implementations)
- [📚 Related Files & Links](#related-files--links)
- [⚠️ Operational Notes & Warnings](#operational-notes--warnings)

---

## 🌟 Overview

The `storage` package is responsible for managing the upload, retrieval (via URL generation), and deletion of various types of user and application files. It implements the `FileStorage` interface, ensuring a consistent way to interact with the underlying storage mechanism, which is currently hardcoded to AWS S3.

The system handles specialized uploads (like user avatars) and general media uploads, automatically managing bucket selection and file naming conventions to ensure data integrity and isolation.

## 🔬 Detailed Component Analysis

### FileStorage Interface

The `FileStorage` interface defines the contract for any storage service implementation. This promotes separation of concerns and allows for easy swapping of storage backends (e.g., MinIO, Google Cloud Storage) in the future without changing the business logic that consumes the service.

| Method | Purpose | Input | Output |
| :--- | :--- | :--- | :--- |
| `UploadProfilePicture` | Handles profile picture uploads, ensuring a structured naming scheme based on User ID and timestamp. | `*multipart.FileHeader`, `userID` | `(url string, error)` |
| `UploadFile` | Handles general media or document uploads using a pre-defined `objectKey`. | `*multipart.FileHeader`, `ownerID`, `objectKey` | `(url string, error)` |
| `DeleteFile` | Deletes a specified object key from the configured media bucket. | `context.Context`, `key string` | `error` |

### S3Client Structure

The `S3Client` is the concrete implementation of the `FileStorage` interface.

```go
type S3Client struct {
	Client *s3.Client // AWS SDK S3 client instance
	Region string    // AWS Region (e.g., us-east-1)
}
```

### Connection Logic (`ConnectToS3Client`)

This function manages the initialization of the S3 client. It correctly utilizes environment variables (`AWS_DEFAULT_REGION`) for region determination, ensuring flexibility in deployment environments.

**Flow:**
1. Reads the default AWS region from environment variables or defaults to `us-east-1`.
2. Loads the default AWS configuration (`config.LoadDefaultConfig`).
3. Initializes and returns a pointer to `S3Client`.

### Method Implementations

#### `UploadProfilePicture`
*   **Bucket Management:** Uses a dedicated environment variable (`AWS_S3_AVATAR_BUCKET`) to target the correct bucket for profile images.
*   **Naming Convention:** Applies a strict naming convention: `avatar/{userID}_{timestamp}{extension}`. This ensures uniqueness and easy identification of the owner.
*   **URL Generation:** Constructs the public URL using the bucket name, region, and object key.

#### `UploadFile`
*   **Bucket Management:** Uses the general media bucket specified by `AWS_S3_MEDIA_BUCKET`.
*   **Object Key:** Relies on an externally provided `objectKey`, giving the caller full control over the file path within the bucket.
*   **Error Handling:** Provides specific logging for failed file uploads.

#### `DeleteFile`
*   **Dependency Check:** First validates that `AWS_S3_MEDIA_BUCKET` is set, preventing runtime errors.
*   **Operation:** Performs a standard S3 `DeleteObject` operation using the provided `key`.
*   **Context Usage:** Correctly accepts a `context.Context` parameter, enabling the caller to implement timeouts and cancellations.

## 📚 Related Files & Links

This module is primarily focused on infrastructure interaction. For related business logic or service consumers, refer to:

- [Middleware/Authentication Logic](../../middleware/auth) - *Checks how the `userID` and `ownerID` parameters are sourced.*
- [User Service Component](../../user/service) - *Where the calls to `UploadProfilePicture` are likely initiated.*

## ⚠️ Operational Notes & Warnings

### 🚨 Technical Debt & Warnings

1. **Context Propagation:** While `DeleteFile` correctly accepts `context.Context`, the `UploadProfilePicture` and `UploadFile` methods use `context.TODO()`. **This is a significant anti-pattern.** The context should be passed through from the originating request handler or service layer to ensure timeouts and cancellation signals are respected during the network I/O operations.
2. **Logging vs. Error Return:** In `UploadProfilePicture` and `UploadFile`, an internal `log.Printf` is used for logging failure, but the function still returns the error. This is acceptable but inconsistent. A centralized logging library (like structured logging) should be used instead of `log.Printf` for production applications.
3. **Resource Cleanup:** The use of `defer src.Close()` is correct for file handles opened from `multipart.FileHeader`. This practice should be maintained everywhere resources are opened.

### 💡 Important Considerations

*   **Authorization/Security:** The current implementation assumes that the AWS credentials configured (via environment variables or IAM roles) have the necessary `s3:PutObject`, `s3:DeleteObject`, and `s3:GetObject` permissions for the specified buckets. In a production environment, the Identity and Access Management (IAM) role executing this code must adhere to the Principle of Least Privilege.
*   **URL Generation:** The URL construction relies on the standard AWS format: `https://%s.s3.%s.amazonaws.com/%s`. While common, consider using AWS SDK mechanisms or CloudFront distributions for highly optimized, secure, and reliable URL access, especially if caching is needed.
*   **Error Specificity:** The returned error from `DeleteFile` is wrapped with a generic `fmt.Errorf`. For better debugging and client consumption, custom error types or using `errors.Wrap` (if using a structured logging/error package) would be beneficial.
```