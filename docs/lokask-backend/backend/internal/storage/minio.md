
[⬅ Return to Main Compendium](../../README.md)

# ☁️ Storage Management Layer (MinIO Adapter)

**File:** `storage/storage.go`
**Description:** This package provides a robust abstraction layer for interacting with MinIO object storage. It encapsulates connection logic, bucket management, and various file operations (upload, download, delete), ensuring that the application services interact with a stable, cloud-agnostic storage interface.

***

## 💡 Overview

This module initializes and manages the connection to a MinIO instance, treating it as the primary backend storage for all user-generated and application-related media assets (e.g., avatars, profile pictures, general media uploads).

The core functionality revolves around the `MinioClient` struct, which manages connection credentials, default bucket names, and implements standardized methods for common storage workflows.

### Core Responsibilities:
1. **Connection Management:** Initializing the MinIO client and validating credentials from environment variables.
2. **Resource Provisioning:** Ensuring required buckets (like `user-avatars` and `lokask-media`) exist and are configured with a public read policy.
3. **Data Operations:** Providing highly specific methods for common tasks (e.g., `UploadProfilePicture`) and a generic method (`UploadFile`) for flexibility.

***

## ⚙️ Detail & Implementation Flow

### 1. `MinioClient` Structure

The central unit for all storage interactions.

```go
type MinioClient struct {
	Client *minio.Client // The underlying MinIO SDK client
	Bucket string       // Primary default bucket name (e.g., "user-avatars")
}
```

### 2. Connection Initialization: `ConnectToMinioClient()`

This function is the entry point for setting up the storage connection.

| Step | Logic | Key Considerations |
| :--- | :--- | :--- |
| **Env Read** | Retrieves `MINIO_ENDPOINT`, `MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY`. | Dependency on external environment configuration. |
| **Client Init** | Initializes `minio.New()` client using the credentials. | Currently hardcoded to `Secure: false`. |
| **Bucket Check** | Calls `minioClient.BucketExists()` for `user-avatars`. | Prevents connection failures if the bucket is missing. |
| **Bucket Create** | If the bucket doesn't exist, `MakeBucket()` is called. | If successful, a crucial **Public Read Policy** is set via `SetBucketPolicy()`. |

### 3. Uploading Profile Pictures: `UploadProfilePicture()`

This method is specialized for user avatars, guaranteeing a specific naming convention.

**Naming Convention:** `avatars/{user_id}_{timestamp}{extension}`
*   Uses `multipart.FileHeader` to read file contents.
*   Uses `time.Now().Unix()` as a unique component to prevent overwrites.
*   Relying on a dedicated `avatars/` subdirectory within the bucket.
*   The resulting URL construction is sensitive to the `MINIO_PUBLIC_URL` environment variable.

### 4. General File Upload: `UploadFile()`

This is the generalized upload utility for any media file.

**Logic Flow:**
1. Gets the target bucket name from `MINIO_MEDIA_BUCKET` environment variable (defaulting to `lokask-media`).
2. Calls `m.CreateIfNotExist()` to ensure the media bucket is ready.
3. Uses `minioClient.PutObject()` to upload the data.
4. Constructs the public URL using the format: `${MINIO_PUBLIC_URL}/${bucket_name}/${object_key}`.

### 5. Object Deletion: `DeleteFile()`

A straightforward method to remove an object given the bucket and the full object key. It uses `minio.RemoveObjectOptions{}`.

```go
// Pseudocode Flow
bucket := os.Getenv("MINIO_MEDIA_BUCKET") // Get bucket name
m.Client.RemoveObject(ctx, bucket, key, opts) // Execute deletion
```

### 6. Bucket Management: `CreateIfNotExist()`

A utility function used internally by `UploadFile()` that ensures the specified bucket exists and enforces the public read policy.

***

## ⚠️ Critical Warnings & Technical Debt (TODOs)

1. **Inconsistent Environment Variable Usage:**
    *   `UploadProfilePicture` hardcodes `bucketName := "user-avatars"` and `bucketName := "user-avatars"` for the public URL construction.
    *   `UploadFile` uses `getEnv("MINIO_MEDIA_BUCKET", "lokask-media")` and `getEnv("MINIO_PUBLIC_URL", "http://localhost:9000")`.
    *   **Recommendation:** Standardize all bucket/URL access using consistent configuration loading (e.g., pass the bucket name/URL as required parameters, rather than relying on mixed environment variables or hardcoded strings).

2. **Error Handling Consistency:**
    *   Some functions return basic `error`, while others use `fmt.Errorf("failed to delete file from MinIO: %w", err)` (wrapping).
    *   **Recommendation:** Standardize error wrapping using `%w` for all exported methods to provide clear context to calling service layers.

3. **Security Policy Enforcement:**
    *   The bucket policy setting is crucial for public access, but it uses string formatting (`fmt.Sprintf`) directly with the bucket name. While functional, careful input validation is required if bucket names could ever be user-defined (currently mitigated by using environment variables).

4. **Global Helper Function:**
    *   The `getEnv` function is a small helper, but it currently relies on `os.LookupEnv` which is fine for local use but should be documented as a necessary low-level utility for reading environment parameters consistently.

***

## 📚 Note (Improvements & Future Scope)

*   **File Streaming Optimization:** While using `file.Open()` and `defer src.Close()` is correct, for extremely large files, consider integrating multipart upload capabilities offered by the SDK for better resilience and performance.
*   **Context Propagation:** Although `context.Background()` is used widely, it is better practice to require the caller to pass a `context.Context` (e.g., `context.Background()` should be replaced with `ctx context.Context`) to allow cancellation and timeouts to propagate correctly throughout the stack.

***

## 🔗 Related Logic & Dependencies

| Component | File/Function Link | Description | Notes |
| :--- | :--- | :--- | :--- |
| **Profile Upload** | (Link to `handler/user_profile_handler.go`) | Logic that calls `UploadProfilePicture` after receiving a file upload request. | This service layer consumes this module. |
| **Media Upload** | (Link to `service/media_manager.go`) | Orchestrates the use of `UploadFile` when a general media resource is saved. | Requires valid `ownerID` and `objectKey`. |
| **Authentication** | (Link to `pkg/auth/middleware.go`) | **[Conceptual Link]** The caller must ensure the `userID` provided to `UploadProfilePicture` is authenticated and authorized. | The storage layer assumes the caller provides a valid ID. |
| **General Config** | (Link to `pkg/config/config.go`) | All environment variables (`MINIO_ENDPOINT`, etc.) should be sourced from the central configuration provider. | Avoid direct `os.Getenv` calls in favor of a dedicated config struct. |
```