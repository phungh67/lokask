[⬅ Return to Main Compendium](../../../../../../README.md)

## 📄 Component Architecture and Logic Documentation

### `AuthPromptDialog` (Authentication Modal)

This component serves as a unified, multi-step dialog for handling all user authentication flows (initial entry, login, signup, verification). By centralizing the state machine logic within this single component, we ensure a consistent UI/UX experience regardless of the user's current stage in the authentication process.

---

### 📐 Component Structure & Props

The component is a wrapper around a Shadcn `Dialog` component, which dictates its open/close behavior and containment.

#### 📂 Props (`AuthPromptDialogProps`)

| Prop | Type | Required | Description | Usage |
| :--- | :--- | :--- | :--- | :--- |
| `open` | `boolean` | Yes | Controls the visibility of the modal. | Internal/Parent Control |
| `onOpenChange` | `(open: boolean) => void` | Yes | Callback function to inform the parent component about changes in the modal's open state. | Parent Control |
| `message` | `string` | No | Custom message displayed on the initial entry screen. | UI Customization |
| `defaultRole` | `"traveller" \| "customer"` | Sets the initial default user role/context. | Initialization |
| `onOpen()` | (Implicit) | (Used conceptually to manage opening/closing flow) | State Management |

### 🧩 Internal State Management

The component manages complex state through several internal pieces of state, coordinating data flow across the different authentication views:

*   **`currentStep`**: Determines which visual screen (`Initial`, `Login`, `Signup`) is visible.
*   **`selectedRole`**: Tracks the user role selected upon initial interaction.
*   **`formData`**: Holds input data (email, password, etc.) for form submissions.

### 🔄 Flow of Control & Component Logic

The component acts as a central state machine, transitioning between views based on user actions:

1.  **Initial Load**: Renders the basic intro screen, prompting the user to select a role (`selectedRole`).
2.  **Role Selection**: Upon role selection, the component determines the next logical step (e.g., if a role requires immediate login, it shifts the `currentStep` to `Login`).
3.  **Form Handling**: All form submissions are intercepted, validated, and passed up via callbacks to the parent component or API layer for handling.

***

## 🖥️ Breakdown of View Components (Internal Rendering)

The component renders four distinct views, each with specific logic:

### 1. Initial View (Role Selection)
*   **Purpose**: Introduction and role selection.
*   **Interaction**: Button clicks trigger setting the `selectedRole` state.

### 2. Login View
*   **Purpose**: Collecting credentials for existing users.
*   **Fields**: Email, Password.
*   **Action**: `handleLoginSubmit` (calls parent's login API).

### 3. Signup View
*   **Purpose**: Creating a new user account.
*   **Fields**: Email, Password, Confirm Password.
*   **Action**: `handleSignupSubmit` (calls parent's registration API).

### 4. Forgot Password View (Implied/Fallback)
*   **Purpose**: Initiating password recovery flow.
*   **Fields**: Email.
*   **Action**: `handleForgotPassword` (calls parent's password reset API).

***

## 🔧 Technical Implementation Details (Hooks & Callbacks)

The component heavily utilizes React Hooks to manage internal state and communicate events:

| Hook/Callback | Purpose | Dependencies |
| :--- | :--- | :--- |
| `useState` | Manages `currentStep`, `selectedRole`, and form inputs. | Internal state variables. |
| `useEffect` | Manages initial loading state and potential side effects (e.g., fetching user data if needed). | None (runs on mount). |
| `useCallback` | Memoizes handler functions (`handleLoginSubmit`, etc.) passed to children to prevent unnecessary re-renders. | API functions, current state values. |
| `useContext` | (If applicable) Consumes global authentication context for successful redirects. | AuthProvider context. |

**Key Handler Functions:**

*   **`handleLoginSubmit`**:
    1.  Prevents default form submission.
    2.  Calls the parent's `onLogin` prop, passing credentials.
    3.  Handles loading/error states passed via props.
*   **`handleSignupSubmit`**:
    1.  Performs local validation (e.g., password matching).
    2.  Calls the parent's `onSignup` prop, passing credentials.

***
***
**Summary for Reviewer:** The `AuthModal` component is a complex, controlled container managing the entire user onboarding flow. Its primary function is state orchestration, allowing the parent component to remain clean while managing the visible steps (Intro $\rightarrow$ Login/Signup) and executing the final authentication calls.