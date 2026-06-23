[⬅ Return to Main Compendium](../../../../../../README.md)

As a senior frontend officer focusing on TypeScript and Vite, my role here is not to rewrite the Go backend logic, but rather to document the *contracts* and *interfaces* exposed by this repository layer. This ensures that the consuming service layer (which the frontend will communicate with) and the frontend components themselves have absolute clarity on the data shape, state transitions, and expected error states.

The goal is to model this entire data flow using TypeScript, defining the structure and the required service calls.

---

### 📂 Data Contract Definition (`types/user.ts`)

We must first strongly type the `User` object based on the Go struct, accounting for nullable fields and the special JSON presentation of the avatar URL.

```typescript
/**
 * IUser - Defines the public data contract for a User,
 * used for state management in the frontend and between service layers.
 * Note: Fields marked as 'private' or 'internal' should never be exposed directly to the UI.
 */
export interface IUser {
    /** Unique identifier for the user. */
    id: string;
    /** User's email address (used for login/lookup). */
    email: string;
    /** Full display name of the user. */
    fullName: string;
    /** Boolean indicating if the user's email has been verified. */
    isVerified: boolean;
    /** URL of the user's profile avatar. Nullable/optional. */
    avatarUrl: string | null;
    /** A flag to determine if the user profile is complete (e.g., has a name). */
    isProfileComplete: boolean;
    // Add other required fields here (e.g., joinDate, etc.)
}

/**
 * IUserCreationInput - Represents the data payload required when creating a new user.
 * This contract excludes sensitive data like the final ID.
 */
export interface IUserCreationInput {
    email: string;
    passwordHash: string; // Should be handled by a dedicated service/auth layer
    fullName: string;
    avatarUrl?: string | null;
}

/**
 * IVerificationRequest - Payload for initiating or confirming user verification.
 */
export interface IVerificationRequest {
    token: string;
}

/**
 * IAvatarUpdatePayload - Payload for updating the user's avatar.
 */
export interface IAvatarUpdatePayload {
    avatarUrl: string;
}

/**
 * Custom Errors Handled by the Service Layer
 * @description TypeScript definitions for common failure modes exposed by the API.
 */
export class UserError extends Error {
    constructor(message: string, public code: string = 'USER_ERROR') {
        super(message);
        Object.setPrototypeOf(this, UserError.prototype);
    }
}

export class UserNotFoundError extends UserError {
    constructor(message: string = "User not found.") {
        super(message, 'NOT_FOUND');
    }
}

export class InvalidTokenError extends UserError {
    constructor(message: string = "Invalid or expired verification token.") {
        super(message, 'INVALID_TOKEN');
    }
}
```

---

### ⚙️ State Management and Service Layer Logic

Since the repository methods are responsible for persistence, the frontend should only interact with a **Service Layer** (e.g., `userService.ts`). This service layer is the crucial abstraction point that manages state, handles asynchronous logic, and maps domain errors.

#### 1. Component State Modeling (Example: Profile Page)

For components, state should be modeled using React's state hooks or a global state manager (like Redux/Zustand) and always derive the displayed state from the stored data.

```typescript
// Pseudocode for React component state
import { useState, useEffect } from 'react';
import { IUser, UserNotFoundError } from '../types/user';
import { useUserService } from '../hooks/useUserService';

export function ProfilePage() {
    // Initial state loading
    const [user, setUser] = useState<IUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    // Use the service hook to manage fetching logic
    const loadProfile = useUserService<IUser>(['id'], {
        onSuccess: (data) => setUser(data),
        onError: (err) => {
            setError(err);
            // Handle specific domain errors
            if (err instanceof UserNotFoundError) {
                // Display a user-friendly "Profile Missing" message
            }
        }
    });

    useEffect(() => {
        loadProfile();
    }, [loadProfile]);

    // ... render logic based on user, isLoading, and error
}
```

#### 2. TypeScript Service Interface (`services/userService.ts`)

This represents the layer calling the backend API endpoints, which in turn talk to the repository.

```typescript
/**
 * UserService - Handles all business logic and state mutations related to the User entity.
 * This encapsulates repository calls and state management details.
 */
export class UserService {

    /**
     * Fetches a user's profile data by ID.
     * @param userId - The ID of the user to fetch.
     * @returns A Promise resolving to the IUser contract.
     * @throws {UserError} If the user cannot be found or the network fails.
     */
    public static async getUserProfile(userId: string): Promise<IUser> {
        // Implementation calls the API layer, expecting the payload structure defined in IUser
        // Example: await api.get(`/users/${userId}`);
        return Promise.resolve({
            id: userId,
            email: "test@example.com",
            fullName: "John Doe",
            isVerified: true,
            avatarUrl: "https://example.com/avatar.jpg",
            isProfileComplete: true,
        });
    }

    /**
     * Updates the user's avatar URL.
     * This function MUST handle optimistic updates in the state manager
     * before the API call succeeds, and revert on failure.
     * @param userId - The ID of the user.
     * @param avatarUrl - The new public URL for the avatar image.
     */
    public static async updateAvatar(userId: string, avatarUrl: string): Promise<void> {
        // 1. Update local state optimistically (e.g., dispatch: updateAvatarState(avatarUrl))
        // 2. Call API layer
        // Example: await api.patch(`/users/${userId}/avatar`, { avatarUrl });

        // Success: The promise resolves.
    }

    /**
     * Verifies a user's email using a token.
     * This is a critical state transition endpoint.
     * @param token - The verification token provided in the email link.
     * @throws {InvalidTokenError} If the token is null, expired, or invalid.
     */
    public static async verifyUser(token: string): Promise<void> {
        // API call that triggers the verification logic (User.VerifyUserEmail in Go)
        // Example: await api.post('/users/verify-email', { token });
    }
}
```

---

### 💡 Architectural Summary and Best Practices

| Area | Contract / Type | Responsibility | Frontend Implication |
| :--- | :--- | :--- | :--- |
| **Data Shape** | `IUser` (TypeScript Interface) | Defines the immutable contract of user data. | Used for all local component state (`useState`) and global state consumption. |
| **State Transition** | `UserService.verifyUser` | Handles irreversible changes (e.g., unverified -> verified). | Must implement loading states, success toasts, and error handling specifically for `InvalidTokenError`. |
| **Data Mutation** | `UserService.updateAvatar` | Manages partial updates (e.g., only changing the avatar). | Requires **Optimistic UI Updates**. The local state should update *before* the API call to provide instant feedback. |
| **Error Handling** | `UserError`, `UserNotFoundError` | Standardized, domain-specific error reporting. | Prevents generic `Error` handling. Components must use `try/catch` blocks and check the error code/type. |

This structured approach ensures that while the core business logic remains in Go (the repository layer), the frontend and adjacent service layers operate under rigorously defined, strongly typed TypeScript contracts, leading to a robust, maintainable, and predictable user experience.

*this content was created by AI, but the coding and underlying logic are not.*