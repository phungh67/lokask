[⬅ Return to Main Compendium](../../README.md)

# 📄 DestinationPage.tsx Security & Functionality Review

**Module:** Destination Page Component
**Purpose:** Renders a dedicated page for a specific destination (`/destination/:slug`), displaying a hero image and listing local consultants associated with that location.

---

## 🛡️ Security Verification Summary

This component handles routing parameters (`slug`) and fetches data based on an assumed location context. The primary finding is a **critical logic flaw** where the API call is hardcoded and ignores the dynamically determined destination, leading to incorrect data presentation (data fixation).

| Vulnerable Element | Type | Priority | Description |
| :--- | :--- | :--- | :--- |
| `getConsultants` call | Logic Flaw / Data Exposure | **High** | The API call is hardcoded to fetch consultants for `"Hanoi"`, regardless of the actual `slug` parameter processed by the component. |
| `slug` parameter | Input Validation | **Medium** | The `slug` retrieved via `useParams` is used for object key lookups and rendering. Proper sanitization/validation is needed to prevent unexpected behavior or XSS if the slug originated from an untrusted source. |
| Displayed URLs/Images | Operational/Dependency | **Low** | Hardcoding external image URLs (Unsplash) increases dependency risk. |

---

## 📝 Overview

The `DestinationPage` component successfully retrieves location data (name, image) based on a URL `slug`. It then attempts to fetch and display local consultants for that destination.

The overall structure is clean, using React Query (`useQuery`) for data fetching and ensuring good loading state handling. However, the integration between the routing logic and the data fetching hook (`useQuery`) is flawed, causing the component to incorrectly fetch data for "Hanoi" every time, regardless of the destination slug.

## 🔬 Detail Analysis

### 1. Functionality and Data Flow
1.  **Input:** The component reads the `slug` parameter from the URL (`useParams`).
2.  **Processing:** The component determines the `destination` metadata by mapping the `slug` against `DESTINATION_METADATA`. A fallback heuristic is used if the slug is unknown.
3.  **Data Fetching:** The component utilizes `useQuery` to fetch consultant data.
    *   **Issue:** The `queryKey` and `queryFn` are fixed: `queryKey: ["fixed-consultant-data", "city", "Hanoi"]`, and `queryFn: () => getConsultants({ city: "Hanoi" })`.
    *   The API call completely ignores the dynamically calculated `destination` and always queries for "Hanoi".
4.  **Rendering:** Renders the destination details and the list of consultants using `ConsultantCardCompact`.

### 2. Vulnerable Functions/Objects
*   **Function:** `DestinationPage` (The component itself).
    *   **Vulnerability:** Flawed API integration logic.
    *   **Impact:** High (Data integrity failure).
*   **Object:** `slug` (from `useParams`).
    *   **Vulnerability:** Lack of enforced sanitization/validation on input parameter.
    *   **Impact:** Medium (Potential for misuse if input were unsanitized for HTML context).
*   **Function:** `getConsultants` (External dependency).
    *   **Vulnerability:** This function is misused within the component (fixed parameters). The component calling it must be updated to pass the correct `city` variable.

## 💡 Note (Suggested Fixes & Best Practices)

1.  **Fix Data Query Parameter:** Modify the `useQuery` hook to dynamically use the `destination.name` (or a derived city name) as the parameter for `getConsultants`.

    *   **Before:**
        ```typescript
        queryKey: ["fixed-consultant-data", "city", "Hanoi"],
        queryFn: () => getConsultants({ city: "Hanoi" }),
        ```
    *   **After (Conceptual Fix):**
        ```typescript
        queryKey: ["consultants", destination?.name],
        queryFn: () => getConsultants({ city: destination?.name }),
        enabled: !!destination,
        ```
2.  **Input Sanitization:** Although the lookups primarily use controlled strings, it is best practice to explicitly sanitize or validate the `slug` parameter coming from `useParams` (e.g., ensuring it only contains alphanumeric characters and hyphens) to protect against XSS if the component ever renders raw, unescaped slug content.
3.  **Code Linking:** To correctly implement the fix, the `DestinationPage` must reference the current business logic flow handled in `getConsultants` to ensure the dynamic parameter is passed.

## ⚠️ Warning (Critical Action Items)

**CRITICAL BUSINESS LOGIC BUG:** The API call to retrieve consultants is **hardcoded** to `"Hanoi"` within `useQuery`. If this component is deployed, users navigating to pages for Paris, Thailand, or any other destination will still receive the consultant data for Hanoi, leading to a complete breakdown of the user experience and data accuracy.

**IMMEDIATE ACTION REQUIRED:** Correct the `useQuery` hook parameters to derive the city name dynamically from the successful `destination` object, utilizing the city context provided by the URL `slug`.

---

### 🛠️ Related Files/Modules

*   **[Components Link]** `@/components/ConsultantCardCompact`: Review its input props (`consultant: Consultant`) to ensure robust data handling, particularly if the `Consultant` type changes.
*   **[API Call Logic Link]** `@/lib/consultants`: Verify that `getConsultants` is designed to accept and correctly use a variable city parameter, rather than assuming a fixed value.
*   **[Data Types Link]** `@/types/consultant`: Confirm that the `Consultant` type handles all necessary fields expected by `ConsultantCardCompact` and is correctly modeled for various regions.