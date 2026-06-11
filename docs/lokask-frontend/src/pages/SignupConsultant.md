```markdown
[⬅ Return to Main Compendium](../../README.md)

# 👤 Consultant Registration Page (`SignupConsultant.tsx`)

**Module:** Authentication / Onboarding
**Purpose:** Provides a dedicated interface for local experts (Consultants) to register and join the platform.
**Status:** Feature Complete (Requires robust API contract adherence).
**Dependencies:** `sonner` (Toast Notifications), `react-router-dom`, Custom API Hooks.

***

## 📘 Overview

The `SignupConsultant` component is the client-side view responsible for handling the creation of a new Consultant account. It manages the form state, validates input, and communicates asynchronously with the backend via the `registerConsultant` API endpoint. The page provides clear navigation links for both existing users (Login) and other roles (Traveller sign-up).

The primary flow focuses on capturing credentials (`fullName`, `email`, `city`, `password`) and managing the user experience during the API call lifecycle (loading, success, error).

## ⚙️ Detailed Component Analysis

### 1. State Management
The component uses `useState` to manage the form data (`formData`) and the submission loading status (`isLoading`).

*   **`formData`:** `{ fullName: string, email: string, city: string, password: string }`
*   **`isLoading`:** Boolean flag used to disable the submit button and display a loading spinner (`Loader2`) during the API transaction, preventing double submissions.

### 2. Core Logic: `handleSubmit`
This asynchronous function orchestrates the entire registration process.

1.  **Event Prevention:** Calls `e.preventDefault()` to halt default form submission behavior.
2.  **Loading State:** Sets `setIsLoading(true)`.
3.  **API Interaction:** Awaits the call to the critical backend function: `await registerConsultant(formData);`.
    *   *Logic Flow:* This call is responsible for performing necessary server-side validation and hashing/storing credentials.
4.  **Success Handling:** If the API call succeeds, it triggers a success toast (`toast.success`) and redirects the user to the main `/login` page.
5.  **Error Handling:** If the API call fails (caught error), it logs the error and displays a failure toast (`toast.error`) using the error message provided by the backend.
6.  **Cleanup:** The `finally` block ensures `setIsLoading(false)` is executed regardless of success or failure, re-enabling the form.

### 3. UI/UX Considerations
*   **Accessibility:** Inputs are labeled correctly and utilize standard form elements.
*   **Feedback:** Visual feedback (loading spinner, disabled button, toast notifications) is critical for a smooth user experience.
*   **Routing:** Provides clear visual paths for the user to navigate to Login or switch roles (Traveller signup).

***

## ⚠️ Warning (High Priority / Critical Items)

*   **API Contract Enforcement:** The robustness of this component is entirely dependent on the `registerConsultant` API endpoint. Developers must ensure that the API handles:
    1.  **Email Uniqueness:** The backend MUST prevent two consultants from registering with the same email.
    2.  **Password Strength:** Server-side validation for minimum password length and complexity is mandatory.
*   **Password Security:** While the client handles input, developers must verify that the API layer performs **secure, salted hashing** (e.g., bcrypt) before storing the password. Never store raw passwords.
*   **Input Sanitization:** Although React handles basic data flow, if the `formData` is ever used outside of direct API submission (e.g., for local state debugging or display), manual sanitization is needed to prevent XSS vulnerabilities.

## 📝 Note (Areas for Improvement / Tech Debt)

*   **Client-Side Validation:** Currently, the component relies solely on the `required` attribute and API error handling. Implementing explicit client-side validation (e.g., email regex checks, password matching) before submission would significantly improve UX and reduce unnecessary API calls.
*   **State Reset:** After a successful registration, while navigation occurs, explicitly calling `setFormData({...initialState})` if the user were to stay on the page could be good practice.
*   **Password Visibility Toggle:** For better UX, consider adding a toggle visibility button for the password field.

## 🔗 Technical Linkage

This component relies on several critical external modules and logic flows:

| Item | File/Module | Purpose | Related Logic Flow |
| :--- | :--- | :--- | :--- |
| **API Call** | `src/lib/api.ts` | Handles the actual HTTP request to the backend. | `[See API Definition](../lib/api.ts)` |
| **Authentication** | `src/pages/login` | The target page upon successful registration. | `[Login Flow](../pages/login)` |
| **Routing** | `react-router-dom` | Manages navigation and linking between roles. | N/A |
| **Error Display** | `sonner` | Provides user feedback for API success/failure. | N/A |
| **Data Context** | *N/A* | For global user/role context, if implemented later. | N/A |
```