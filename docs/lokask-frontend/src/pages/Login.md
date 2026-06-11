```markdown
[⬅ Return to Main Compendium](../../README.md)

# 🔒 Authentication Module: Login Component (`Login.tsx`)

## 📋 Overview

The `Login.tsx` component is the primary client-side interface for user authentication. It provides a dedicated UI form for users to submit their email and password credentials. Upon successful submission, the component handles API communication, client-side session management (storing tokens), and subsequent redirection to the appropriate dashboard or homepage based on the user's role.

This component serves as a crucial entry point, managing the initial state and flow after a user successfully validates their identity.

---

## 🔍 Technical Details

### 🧩 Component Structure
This is a functional React component utilizing `useState` for managing form state (`email`, `password`, `isLoading`) and `useNavigate` (though it ultimately uses `window.location.href` for redirection) for navigation.

### 💡 Core Functionality: `handleSubmit` Flow

The heart of the component lies in the `handleSubmit` function, which orchestrates the entire authentication flow:

1.  **Event Handling:** Prevents the default form submission behavior.
2.  **API Call:** Executes the login request using the external utility function `login({ email, password })` located in `@/lib/api`.
3.  **Success Handling (Critical Path):**
    *   The returned `res.token` and `res.user` object are stored persistently in `localStorage`. This mimics a session state.
    *   A success toast notification is displayed.
    *   **Redirection:** The component *forcefully* redirects the user using `window.location.href`. The destination is determined by checking `res.user.role` (e.g., `consultant` goes to `/dashboard`, others go to `/`).
4.  **Failure Handling:** If the API call fails (catches an error), an error toast is displayed using the error message provided by the backend.

### 📚 Dependencies & Libraries

| Dependency | Purpose | Notes |
| :--- | :--- | :--- |
| `react-router-dom` | Handles internal links (`<Link>`) for the Sign Up page. | Standard client-side routing. |
| `sonner` | Provides user feedback via non-blocking toast notifications. | Used for success and failure messaging. |
| `@/lib/api` | Abstraction layer for API communication. | Contains the `login` function definition. |
| `localStorage` | Client-side session storage. | Used to persist the authentication token and user profile. |

### 🖼️ Flow Diagram (Conceptual)

```mermaid
graph TD
    A[User submits Form] --> B{handleSubmit Triggered};
    B --> C{API Call: login(email, password)};
    C -- Success (HTTP 200) --> D[Store Token/User in localStorage];
    D --> E{Check User Role};
    E -- Role == 'consultant' --> F[Redirect to /dashboard];
    E -- Other Roles --> G[Redirect to /];
    C -- Failure (HTTP Error) --> H[Display Error Toast];
    H --> I(Form remains visible);
```

---

## 📝 Notes & Knowledge Transfer

### 🚀 State Management Best Practices
While `localStorage` is used here for simplicity and immediate access, in a highly scalable, enterprise-grade application, session management should ideally utilize secure HTTP-only cookies (signed by the backend) instead of client-accessible `localStorage` to mitigate XSS risks.

### 🔗 Related Components/Files
*   **API Logic:** The successful execution relies entirely on the `login` function defined in the authentication utility layer. (See: `../lib/api.ts` - *API utility definitions*).
*   **User Profile Access:** After logging in, the user's role and data are available. When accessing protected routes, components like the dashboard (`/dashboard`) or profile management must implement middleware checks to validate the token retrieved from `localStorage`. (See: `../middleware/auth.ts` - *Authentication Guards*).
*   **Error Handling:** The component relies on global error handling via `try...catch`. Consistency is maintained by using `sonner` toasts for all user-facing feedback.

---

## ⚠️ Warnings & Technical Debt

### 🚩 Security Warning: Session Storage
**HIGH PRIORITY:** Using `localStorage` for storing authentication tokens is susceptible to Cross-Site Scripting (XSS) attacks. If any other part of the application is compromised with malicious JavaScript, the token could be stolen.
**Mitigation:** For production deployments, strongly consider upgrading to HTTP-only, secure cookies managed by the backend, which are inaccessible to client-side JavaScript.

### ⏳ Technical Debt: Redirection Method
The use of `window.location.href = ...` bypasses React Router's history management and state updates. This "hard reload" approach is functional but non-idiomatic within a React application using React Router.
**Recommendation:** If the surrounding application structure permits, refactor the success handler to use `navigate('/dashboard')` *after* ensuring the token is set, though the current necessity might stem from needing an immediate global state synchronization.

### 🐛 Future Improvement: Loading State UX
The current loading state shows the `Loader2` icon. It would enhance user experience if the entire form or input fields were disabled, alongside the button, to prevent accidental form resubmission during the network request.
```