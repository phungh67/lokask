[⬅ Return to Main Compendium](../../../../../../README.md)

As a Senior Frontend Officer specializing in TypeScript and Vite, I have analyzed this backend `AuthHandler` logic.

This handler manages the core authentication workflow, including registration, login, profile retrieval, and password recovery. From a frontend architecture perspective, the system exposes several distinct services and state requirements that need careful handling to ensure a robust, maintainable, and type-safe user experience.

Here is the detailed documentation covering UI Logic, State Management, and Component Architecture.

---

## 🚀 Frontend Architectural Documentation: Authentication Module

**Target Stack:** TypeScript, React, Vite, TanStack Query (or similar data fetching state management).

### 1. Core API Endpoints & Data Mapping

We must map the backend handlers to clean, type-safe API definitions for the frontend services.

| Backend Handler | Frontend Route | HTTP Method | Purpose | Key Request Body | Key Response Payload |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `Register` | `/api/auth/register` | `POST` | User creation and profile setup (Consultant/User). | `{ email, password, ... }` | `{ user: { id, name, ... }, token: string }` |
| `Login` (Implicit) | `/api/login` | User authentication. | `{ email, password }` | `{ user: { id, name, ... }, token: string }` |
| `GetMe` (Implicit) | `/api/user/me` | Retrieves current user profile details. | *(Auth Token)* | `{ id, name, role, ... }` |
| `Logout` (Implicit) | `/api/logout` | Invalidates session. | *(No Body)* | `{ success: true }` |

### 2. State Management Strategy (The Source of Truth)

We must use a centralized state management solution (e.g., Redux Toolkit, Zustand, or React Context) to manage global authentication state.

**Global `AuthSlice` State Structure:**

```typescript
interface AuthState {
  token: string | null; // JWT
  user: UserProfile | null; // Detailed user info
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: 'user' | 'consultant'; // Derived from backend logic
  // ... other necessary user fields
}
```

**Key Side Effects (Async Thunks):**

1.  `loginUser(credentials)`: Calls `/api/login`. On success, stores the token and `user` profile in the state.
2.  `registerUser(formData)`: Calls `/api/register`. On success, handles the initial state update.
3.  `logout()`: Clears the token and user object from the state.
4.  `fetchUserProfile()`: Calls `/api/user/me` using the stored token to hydrate the `user` state upon login or startup.

### 3. Component Structure & Logic Flow

#### A. `AuthProvider` (Wrapper Component)

This component wraps the entire application and handles the persistent state and initial loading state.

**Logic:**
1.  **Initial Check:** On mount, check for a stored token (e.g., in `localStorage`).
2.  **Hydrate:** If a token exists, call `fetchUserProfile()` asynchronously.
3.  **Provide:** Makes the `AuthContext` (or hook) available globally.

#### B. `LoginForm` (Component)

**Logic:**
1.  Handles form input and validation.
2.  On submit, calls the `useAuthStore.loginUser(credentials)`.
3.  Displays success/error messages based on the returned state.

#### C. `ProtectedRoute` (Component)

This component enforces authentication for private routes.

**Logic:**
1.  Checks `isAuthenticated` from the global state.
2.  If `false` or `null`, redirects to `/login`.
3.  If `true`, renders the `<Outlet />` (child route).

### 4. Component Implementation Example (Using a hypothetical `useAuth` hook)

```jsx
// src/components/Dashboard.jsx
import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout(); // Calls the global state dispatcher
    navigate('/login', { replace: true });
  };

  if (!user) {
    // This shouldn't happen if ProtectedRoute works correctly, but good for safety.
    return <div>Loading profile...</div>;
  }

  return (
    <div>
      <h1>Welcome back, {user.full_name}!</h1>
      <p>Your Role: {user.role.toUpperCase()}</p>
      <button onClick={handleLogout}>Logout</button>
    </div>
  );
};

export default Dashboard;
```

### Summary Checklist

| Area | Implementation Detail | Notes |
| :--- | :--- | :--- |
| **Authentication State** | Global/Centralized (Zustand/Redux) | Must hold `token`, `user`, and `isAuthenticated`. |
| **Security** | HTTP-Only Cookies / LocalStorage | Store the token securely. Always validate tokens on every request. |
| **Routing** | `ProtectedRoute` Component | Redirect non-authenticated users. |
| **User Experience** | Loading/Error States | Show spinners while logging in or fetching data. Display clear error messages. |
| **Data Flow** | Single Source of Truth | All state changes (login, logout) must go through the state management layer. |