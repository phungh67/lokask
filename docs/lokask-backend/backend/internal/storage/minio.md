# 💾 Storage Service Component Documentation (Minio Client)

This document provides a comprehensive overview of the `MinioClient` package, which handles object storage operations using the Minio SDK. This component is critical for managing user-generated content (UGC) and media assets, ensuring reliable and secure infrastructure interactions.

## 📂 Overview

The `storage` package encapsulates connectivity and upload logic for an S3-compatible object store (Minio). It manages resource lifecycle operations such as connecting to the client, ensuring required buckets exist, setting proper public policies, and facilitating various file uploads (e.g., profile pictures, general media files).

**Key Responsibilities:**

*   **Connectivity:** Establishing a connection to the Minio endpoint using environment variables for credentials.
*   **Bucket Management:** Automatically creating necessary buckets (`user-avatars`, `lokask-media`) if they do not already exist.
*   **Security:** Applying a read-only public bucket policy to allow general object retrieval (`s3:GetObject`).
*   **Data Upload:** Handling file uploads from `multipart.FileHeader` objects, generating unique, structured object keys, and returning public URLs.

### 🖼️ Conceptual Diagram

(A conceptual diagram illustrating the flow: Application -> `storage` Package -> Minio Client -> Object Storage Bucket.)

---

## 📝 Detailed Component Analysis

### 1. `MinioClient` Struct
This struct holds the operational dependencies, defining the connection to the Minio service and the target bucket name.

```go
type MinioClient struct {
	Client *minio.Client // The core Minio SDK client instance.
	Bucket string       // The primary bucket name used by the client.
}
```

### 2. `ConnectToMinioClient()`
This function initializes the connection to the Minio endpoint.

*   **Initialization:** Retrieves endpoint, access key, and secret key from environment variables (`MINIO_ENDPOINT`, `MINIO_ACCESS_KEY`, etc.).
*   **Client Setup:** Creates the `minio.Client` using static V4 credentials.
*   **Bucket Verification & Setup:** Checks if the designated bucket (`user-avatars`) exists. If not, it performs:
    1.  `minioClient.MakeBucket()`: Creates the bucket.
    2.  `minioClient.SetBucketPolicy()`: Applies a highly permissive policy allowing `s3:GetObject` for all principals (`*`).

### 3. `UploadProfilePicture(file *multipart.FileHeader, userID string)`
A specialized, dedicated function for uploading user avatar images.

*   **Object Key Generation:** Creates a structured, unique object key: `avatars/{user_id}_{timestamp}{extension}`.
*   **Process:** Opens the file source, uses `m.Client.PutObject` to upload the file to the hardcoded `user-avatars` bucket.
*   **URL Generation:** Constructs the public URL using the configured `MINIO_PUBLIC_URL` environment variable.

### 4. `UploadFile(file *multipart.FileHeader, ownerID string, objectKey string)`
A generalized function for uploading arbitrary media files.

*   **Bucket Determination:** Reads the target bucket name from the `MINIO_MEDIA_BUCKET` environment variable (defaults to `lokask-media`).
*   **Pre-check:** Calls `m.CreateIfNotExist` to ensure the destination bucket is available and configured.
*   **Upload:** Executes the `PutObject` operation using the provided `objectKey`.
*   **URL Generation:** Returns the public URL based on the defined `MINIO_PUBLIC_URL` and the media bucket name.

### 5. `CreateIfNotExist(ctx context.Context, bucketName string)`
An infrastructure helper method to guarantee a bucket's existence and proper policy setup.

*   **Existence Check:** Uses `m.Client.BucketExists()` to prevent race conditions and redundant API calls.
*   **Idempotency:** If the bucket doesn't exist, it creates it and immediately applies the standard public read policy, making the method idempotent.

---

## 💡 Implementation Notes

### Infrastructure & Deployment
1.  **Environment Variables:** The service relies heavily on setting key environment variables:
    *   `MINIO_ENDPOINT`: The hostname and port of the Minio service.
    *   `MINIO_ACCESS_KEY`: API access key.
    *   `MINIO_SECRET_KEY`: API secret key.
    *   `MINIO_PUBLIC_URL`: The base URL for accessing objects (e.g., `http://localhost:9000`).
2.  **Policy Enforcement:** The policy applied (`s3:GetObject` for `*`) ensures that all uploaded content is publicly readable, which is suitable for profile pictures and general media assets.
3.  **Context Usage:** All Minio operations correctly utilize `context.Context`, allowing for robust timeout and cancellation handling in calling services.

### System Design Considerations
*   **Scalability:** Using Minio/S3 inherently provides high scalability for object storage. The structure supports scaling by adjusting environment variables, rather than modifying the core logic.
*   **Abstraction:** The package successfully abstracts the underlying cloud storage API (Minio SDK) from the business logic.

---

## ⚠️ Warnings & Outstanding Items

**The following items require immediate attention before production deployment:**

1.  **Credential Handling Security:**
    *   **Warning:** The current implementation reads credentials directly from OS environment variables. In a production environment, sensitive secrets (Access/Secret Keys) should be managed by a secure secret management system (e.g., AWS Secrets Manager, HashiCorp Vault) and injected at runtime, rather than being static environment variables.
2.  **Hardcoded Bucket Names:**
    *   The `UploadProfilePicture` function hardcodes `"user-avatars"` and uses the bucket name internally without passing it as a parameter, making it less flexible than `UploadFile`.
3.  **Public Policy Scope:**
    *   The applied bucket policy grants **read access to everyone (`"Principal": {"AWS": ["*"]}`)**. If any uploaded content requires private or restricted access (e.g., payment records, private user documents), a different, more restrictive policy must be implemented.
4.  **`getEnv` Dependency:**
    *   The helper function `getEnv` is crucial for dynamic URL generation but relies on `os.LookupEnv` and string fallbacks. If the environment lookup fails completely, the fallback default URL might be incorrect, leading to broken object links.

---

## ❓ Areas for Improvement (To-Do/Future Scope)

*   **Error Handling Granularity:** Implement more specific error wrapping and logging in `ConnectToMinioClient` to distinguish between network failure, authentication failure, and resource not found.
*   **Concurrency Protection:** While the `minio-go` SDK handles much of the connection pooling, explicit logging or metrics around bucket creation attempts could be added if concurrent service startup is anticipated.
*   **TTL/Lifecycle Management:** Add functionality to set object lifecycles (Time-to-Live) or versioning policies on buckets to automatically clean up stale or old assets, managing storage costs efficiently.