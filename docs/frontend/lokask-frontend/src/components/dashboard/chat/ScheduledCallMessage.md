[⬅ Return to Main Compendium](../../../../../../../README.md)

# 💻 Component Documentation: `ScheduledCallMessage`

As a senior frontend officer specializing in TypeScript and Vite architecture, I've reviewed the `ScheduledCallMessage` component. This component is responsible for displaying a rich, styled message bubble representing a scheduled call within a chat interface. It handles complex state visibility (e.g., action buttons, strikethroughs) based on the call's status and the user's role.

## 📐 Component Structure & Architecture

*   **Component Name:** `ScheduledCallMessage`
*   **Purpose:** Renders a visually distinct, data-rich message bubble for a scheduled video or voice consultation.
*   **State Management:** This component is primarily *dumb* (presentation-focused). It receives all necessary data and event handlers via props. It does not manage its own local state (no `useState`/`useReducer`).
*   **Dependencies:**
    *   `lucide-react`: Iconography.
    *   `date-fns`: Date formatting.
    *   `@/components/ui/button`, `@/components/ui/badge`: UI primitives.
    *   `@/types/chat`: Defines `ScheduledCall` type.

## 🧠 TypeScript Interface Analysis

The component relies on strict typing to ensure data integrity.

### Props Interface (`ScheduledCallMessageProps`)

```typescript
interface ScheduledCallMessageProps {
  /** The primary data object containing all call details (type, date, status, etc.). */
  scheduledCall: ScheduledCall;
  /** Boolean flag determining if the current viewer is the consultant (affects alignment and available actions). */
  isConsultant: boolean;
  /** Optional callback executed when the user clicks 'Reschedule'. */
  onReschedule?: () => void;
  /** Optional callback executed when the user clicks 'Cancel'. */
  onCancel?: () => void;
}
```

### Key Data Dependency (`ScheduledCall` Structure)

The rendering logic critically depends on these fields from `scheduledCall`:

| Field | Type | Description | Usage in Component |
| :--- | :--- | :--- | :--- |
| `type` | `'video' | 'voice'` | Determines the displayed icon and title. | Icon selection (`Video`/`Phone`), Title rendering. |
| `scheduledAt` | `Date` | The date and time of the call. | Formatted twice (Date/Time) for display. |
| `duration` | `number` | Length of the call in minutes. | Displayed next to the time. |
| `status` | `'confirmed' | 'pending' | 'cancelled' | 'completed'` | The current operational status of the call. | Drives nearly all conditional rendering and styling (colors, strikethroughs). |
| `notes` | `string | null` | Any additional details/notes about the appointment. | Displayed in the details section. |

## ⚛️ Component Logic and Flow

The component logic is modularized into helper functions (or conceptual steps) which enhance readability and maintainability.

### 1. Status-Driven Logic (Core Logic)

The status (`scheduledCall.status`) dictates the component's appearance and behavior.

*   **Icon Determination (`getStatusIcon`):** Maps status strings to appropriate `lucide-react` icons (`Check`, `Clock`, `X`).
*   **Variant Determination (`getStatusVariant`):** Maps status strings to Tailwind/Shadcn badge variants (`default`, `secondary`, `destructive`, etc.).
*   **Styling (Root `div`):**
    *   If `status === "cancelled"`, the background shifts to `bg-muted/50` and the border changes to `border-muted`, visually de-emphasizing the message.
    *   Otherwise, it uses a subtle primary gradient (`bg-gradient-to-br`).
    *   **Alignment:** Uses `rounded-br-md` for consultants (assuming they initiate/manage the bubble) and `rounded-bl-md` for others.

### 2. Conditional Rendering (The Gatekeepers)

The component uses several conditional checks (`&&` operators) to manage state visibility:

*   **Icon/Title:** Swaps between `Video` and `Phone` based on `type`. The color logic also changes if `status === "cancelled"`.
*   **Details Strikethrough:** Both date and time lines are wrapped in a check that applies `line-through` and muted text if `status === "cancelled"`.
*   **Action Buttons:** The critical action block (Reschedule/Cancel) is only rendered if **all** of the following conditions are met:
    1.  `isConsultant` must be `true`.
    2.  `status` must **not** be `"cancelled"`.
    3.  `status` must **not** be `"completed"`.

### 3. State Handling (Action Props)

The component does not execute the logic itself; it passes events up to the parent component:

*   When the "Reschedule" button is clicked, `onReschedule` is called.
*   When the "Cancel" button is clicked, `onCancel` is called.

## 🚀 Best Practices & Improvements (Senior Review)

1.  **TypeScript Strictness:** The helper functions (`getStatusIcon`, `getStatusVariant`) could benefit from being encapsulated or using a dedicated type mapping object to make them purely declarative, rather than using multiple `switch` statements.
2.  **Accessibility (A11y):** Ensure that when the call is cancelled, the action buttons are programmatically disabled if the parent component state transition is required. Currently, the buttons are conditionally rendered, which is fine, but confirmation toasts/modals are highly recommended for actions like "Cancel" to prevent accidental state changes.
3.  **Efficiency (Vite/React):** For performance optimization, if this component is frequently rendered in a large list of chat messages, consider wrapping it with `React.memo` (though React usually handles this well with functional components).

---
*this content was created by AI, but the coding and underlying logic are not.*