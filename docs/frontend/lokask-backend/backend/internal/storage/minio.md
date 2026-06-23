[⬅ Return to Main Compendium](../../../../../../README.md)

## ⚙️ Storage Service API Documentation (Minio Client Integration)

As a senior frontend officer specializing in TypeScript and Vite, my primary concern when reviewing backend utility packages like this is defining the clear **API contract** and **data types** that the consuming frontend services will rely upon. While this package is written in Go, I will document its functionality using TypeScript interfaces and service patterns, which is how we architect state management and component interactions in our modern stack.

---

### 💡 Architectural Overview

The `MinioClient` encapsulates all interaction with the object storage service. We should treat this entire package as a **Service Layer** responsible for all data mutation operations (CRUD). This isolation pattern ensures that our React components and state management stores (e.g., Zustand/Pinia/Redux Toolkit) remain pure and only concern themselves with *display logic*, never *storage logic*.

**Technology Stack Assumption:**
*   **Client Framework:** React / Vue (Functional Components)
*   **Language Contract:** TypeScript
*   **State Management:** Global Store (e.g., managing `userMediaState`, `blogContentState`)
*   **Integration Pattern:** Service Hooks/API Calls (calling a wrapper around the Go service endpoint).

### 📁 Service Layer Mapping (Conceptual TypeScript Service)

We will wrap the underlying Go `MinioClient` methods into a TypeScript Service class (e.g., `StorageService`) that handles the API communication layer.

```typescript
// src/services/storageService.ts

import { UploadResult, DeleteResult } from '../types';

/**
 * Defines the core interface for interacting with the Object Storage Service.
 * All consuming components must use this contract.
 */
export interface IStorageService {
    /**
     * Handles the upload of a generic file to a specific, non-avatars location.
     * Used for profile pictures, documents, etc., where the key is known.
     * @param fileData - The file data (e.g., Blob/File object).
     * @param ownerID - The ID of the resource owner (for tenancy/context).
     * @param objectKey - The desired path/name within the bucket.
     * @returns A promise resolving to the public URL string.
     */
    uploadGenericFile(fileData: File, ownerID: string, objectKey: string): Promise<string>;

    /**
     * Specialized upload handler for user profile avatars.
     * Ensures standardized naming conventions (`avatars/{user_id}_{timestamp}.{ext}`).
     * @param fileData - The file data.
     * @param userID - The user's unique identifier.
     * @returns A promise resolving to the public URL string.
     */
    uploadAvatar(fileData: File, userID: string): Promise<string>;

    /**
     * Specialized upload handler for blog cover images.
     * Ensures standardized path structure: `blog/{blogID}/cover.{ext}`.
     * @param fileData - The file data.
     * @param blogID - The ID of the blog post.
     * @returns A promise resolving to the object key (which the component uses to build the URL).
     */
    uploadBlogCover(fileData: File, blogID: string): Promise<string>;

    /**
     * Deletes a file from the designated media bucket using its object key.
     * @param objectKey - The full key path of the object (e.g., `user-avatars/123_167888.jpg`).
     * @returns A promise resolving to a success status.
     */
    deleteFile(objectKey: string): Promise<void>;
}
```

### 🎨 Component Architecture & Usage (State Management Focus)

The goal is to minimize component knowledge of the storage mechanics. Components should only pass **state** (file data, IDs) and receive **results** (URL, success status).

#### 1. Core State Model (`userMediaState`)

The state store must track the current status of file operations to provide immediate UI feedback (Loading, Error, Success).

```typescript
// src/store/userMediaSlice.ts (Conceptual Zustand Store)
interface FileOperationState {
    isLoading: boolean;
    error: string | null;
    resultUrl: string | null;
    objectKey: string | null;
}

interface RootState {
    // State for the primary profile picture
    avatar: FileOperationState;
    // State for user-uploaded documents
    documents: Record<string, FileOperationState>; 
}
```

#### 2. Component Logic Example: `AvatarUploader`

This component is purely responsible for capturing the user input and calling the service hook.

**Inputs (Props):**
*   `userID: string` (Required)
*   `onAvatarUpdated: (url: string) => void` (Callback passed to the parent/store dispatcher)

**Internal Logic:**
1.  Reads file input change event.
2.  On change, calls `StorageService.uploadAvatar(file, userID)`.
3.  Manages local loading state (`isLoading: true`).
4.  On resolution: Updates the global store state with `resultUrl` and triggers `onAvatarUpdated`.

**Flow Diagram:**
`[Input File] -> AvatarUploader Component -> dispatch(isLoading(true)) -> StorageService.uploadAvatar() -> MinioClient -> State Update (success) -> Parent Component Render Update`

### 🧩 Implementation Details & Constraints Mapping

This section maps the Go logic to the required TypeScript/Frontend constraints.

| Go Function / Logic | Service Method Exposed | Input Contracts | Output Contract | Constraints / Notes |
| :--- | :--- | :--- | :--- | :--- |
| `UploadProfilePicture` | `uploadAvatar` | `File`, `userID: string` | `Promise<string>` (Public URL) | Must handle UUID/Timestamp concatenation in the service layer before calling the API. |
| `UploadBlogCover` | `uploadBlogCover` | `File`, `blogID: string` | `Promise<string>` (Object Key) | *Crucial:* We return the **Object Key**, not the full URL, to allow the component to construct the canonical URL structure (e.g., `<base_url>/${key}`). |
| `UploadFile` | `uploadGenericFile` | `File`, `ownerID: string`, `objectKey: string` | `Promise<string>` (Public URL) | The `objectKey` must be validated client-side to prevent path traversal attacks. |
| `DeleteFile` | `deleteFile` | `objectKey: string` | `Promise<void>` | Requires careful validation to ensure the key belongs to the authenticated user (authorization check). |
| `CreateIfNotExist` | *(Internal)* | `bucketName: string` | `Promise<void>` | This logic should be executed *before* the primary upload service method starts, making it part of the service initialization setup, not a component call. |

***

*this content was created by AI, but the coding and underlying logic are not.*