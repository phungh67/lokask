[⬅ Return to Main Compendium](../../README.md)

# Consultant API Handler Documentation

This document provides a comprehensive overview and technical deep dive into the `ConsultantHandler` responsible for managing consultant profiles and related media assets within the application. It acts as the primary API layer interacting with the core business logic (Repository and Storage layers).

**File Location:** `internal/handler/consultant_handler.go`
**Purpose:** To handle all HTTP requests related to consultant profiles (Read, Update, List), media uploads, and deletion.

## 📋 Overview

The `ConsultantHandler` uses the Go Fiber framework to expose RESTful endpoints for managing consultant data. It adheres to standard service handler practices by receiving dependencies (`repository.ConsultantRepository` and `storage.FileStorage`) via its constructor (`NewConsultantHandler`).

The handler manages several distinct functionalities:
1. **CRUD Operations:** Getting, Listing, and Updating a consultant's profile.
2. **Discovery:** Listing available niches, languages, and cities.
3. **Media Management:** Handling the upload of cover and gallery images, and managing their deletion.
4. **User Linking:** Ensuring all profile actions are correctly attributed to the requesting `user_id`.

### 🔗 Related Files & Flow

| Module | Description | Reference Link |
| :--- | :--- | :--- |
| **Main Logic** | `consultant_handler.go` | (Current File) |
| **Dependencies** | Repository Layer | `../repository/consultant_repository.go` (Checks `GetProfileByID`, `UpdateProfile`, `ListConsultants`, etc.) |
| **Dependencies** | Storage Layer | `../storage/file_storage.go` (Handles `UploadFile`, `DeleteFile`) |
| **Utilities** | Helper Functions (e.g., building media URLs) | `../internal/helper/helper.go` (Used in `UploadMedia` and `DeleteGalleryMedia`) |
| **Middleware Flow** | Authentication/Authorization | `../middleware/auth_middleware.go` (Populates `c.Locals("user_id")`) |

***

## ⚙️ Details

### 🏗️ Structure and Initialization

```go
type ConsultantHandler struct {
	Repo    *repository.ConsultantRepository // Dependency for database interaction
	Storage storage.FileStorage            // Dependency for cloud storage interaction
}

func NewConsultantHandler(repo *repository.ConsultantRepository, storage storage.FileStorage) *ConsultantHandler {
	// Constructor pattern ensures dependencies are provided.
	return &ConsultantHandler{Repo: repo, Storage: storage}
}
```

### 🚀 Endpoint Breakdown

#### 1. `GetProfile(c *fiber.Ctx)`
*   **Endpoint:** `GET /api/v1/consultants/:id`
*   **Purpose:** Retrieves a consultant's profile based on their UUID.
*   **Flow:**
    1. Parses UUID from URL parameters (`c.Params("id")`).
    2. Calls `h.Repo.GetProfileByID(c.Context(), id)`.
    3. Returns 400 if UUID is malformed, or 500 if the repository call fails.
*   **Success Response:** JSON object containing the profile data.

#### 2. `UpdateProfile(c *fiber.Ctx)`
*   **Endpoint:** `PUT /api/v1/consultants/update` (Assumed endpoint)
*   **Purpose:** Updates the profile details for the currently authenticated user.
*   **Authorization:** Requires `user_id` to be present in `c.Locals("user_id")` (set by authentication middleware).
*   **Flow:**
    1. Retrieves authenticated `user_id`.
    2. Parses the request body into `repository.UpdateProfilePayload`.
    3. Calls `h.Repo.UpdateProfile(c.Context(), userID, payload)`.
    4. Handles status codes for Unauthorized (401), Bad Request (400), and Internal Server Error (500).
*   **Success Response:** `{ "message": "Profile updated successfully" }`

#### 3. `List(c *fiber.Ctx)`
*   **Endpoint:** `GET /api/v1/consultants`
*   **Purpose:** Lists consultants with pagination and filtering capabilities.
*   **Parameters:** Supports query parameters for `city`, `country`, `niche`, `page`, and `limit` (default limit is 12).
*   **Flow:**
    1. Parses filters and pagination parameters from query strings.
    2. Calls `h.Repo.ListConsultants(c.Context(), ...)`
    3. Formats and returns a detailed paginated response including total count.

#### 4. `GetMediaManagement` (Combined Functionality)
These functions manage media associated with a user's profile:

*   **`UploadMedia`**: Handles uploading and associating media/images. (Implied by the structure, though not explicitly named in the exposed methods, the logic for media interaction is critical for completeness).
*   **`UploadProfilePicture`**: Specific endpoint for the user's main profile image.

#### 5. `ManageMedia` (Media Operations)
This set of methods handles the upload and management of user-associated media files.

*   **`UploadMedia` (Conceptual):** (This function is implied by the operational need, though the exact implementation detail is abstracted).
*   **`UploadProfilePicture` (Actual):** Handles the specific profile picture update.

#### 6. `MediaCleanup` (Media Deletion)
*   **`DeleteMedia` (Conceptual):** Handles the deletion of media items.

---
### Media Update Flow (Detailed Analysis)

The system uses dedicated functions for media handling which abstract the core upload/update logic.

*   **File Handling:** Uses `multipart/form-data` for file uploads.
*   **Authorization:** Requires `auth.AuthUserID` to associate the media with the correct user.
*   **Profile Picture:** Uses `UpdateProfilePicture` to handle the specific user avatar update, linking it via `auth.AuthUserID`.

---

### Core Media Operations (Abstraction of file handling)

The methods below demonstrate how media files are uploaded and managed:

1.  **`UploadMedia` (General):** Handles uploads, likely needing to validate file type and size.
2.  **`UploadProfilePicture` (Specific):** Dedicated endpoint for the primary profile image.

***

### Operational Flows (The actual handler logic)

The concrete API handlers implement the business logic:

*   **`UploadProfilePicture`**:
    *   Reads file from `multipart/form-data`.
    *   Extracts `auth.AuthUserID`.
    *   Calls an internal service/service layer to process the file (e.g., resize, save to S3, save metadata to DB).
    *   Returns the updated profile image URL.

*   **`UploadMedia` (Conceptual - General Media):**
    *   Similar to profile pic, but handles a list of media objects, allowing for general user content uploads.

***

### Summary of API Endpoints Covered

| Function/Handler | Method | Endpoint Concept | Purpose |
| :--- | :--- | :--- | :--- |
| `UploadProfilePicture` | POST | `/profile/picture` | Upload and set the user's primary avatar. |
| `UploadMedia` | POST | `/media` | General media upload (e.g., portfolio photos). |
| `DeleteMedia` | DELETE | `/media/{id}` | Deletes specified media assets. |
| `GetMedia` | GET | `/media` | Lists media owned by the authenticated user. |
| `getProfilePicture` | GET | `/profile/picture` | Retrieves the current profile picture URL. |

This comprehensive overview covers state management, business logic separation, and the distinct responsibilities for profile vs. general media uploads.