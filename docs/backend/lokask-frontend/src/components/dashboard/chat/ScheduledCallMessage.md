[⬅ Return to Main Compendium](../../../../../../../README.md)

## System Analysis and Documentation: Scheduled Call Messaging Feature

As a senior backend officer, I have analyzed the provided client-side presentation component, `ScheduledCallMessage`. While this component operates entirely on the client (rendering based on local state), its existence dictates clear requirements for the **Data Model, API Surfaces, and Core Business Services** on the backend.

The core purpose of this feature is managing the state and display of future meeting appointments (Scheduled Calls).

---

### 💾 Data Model Definition (Go Struct/Database Schema)

The component relies heavily on the `ScheduledCall` type. This should be modeled as a robust entity in the database.

**Model:** `ScheduledCall`

| Field Name | Type | Description | Constraints | Source Implication |
| :--- | :--- | :--- | :--- | :--- |
| `CallID` | UUID | Unique identifier for the scheduled call. | Primary Key, Not Null | Used for fetching/updating state. |
| `CallerID` | UUID | ID of the primary user/client (the viewer). | Foreign Key (User) | Who initiated or owns the viewing context. |
| `CallType` | Enum | Type of interaction. | `VIDEO` or `VOICE` | Used in header icon/title. |
| `ScheduledAt` | Timestamp | Date and time the call is scheduled for. | Not Null | Used for formatting display date/time. |
| `DurationMinutes` | Integer | Expected length of the call in minutes. | Not Null | Display metric. |
| `Status` | Enum | Current state of the call. | `CONFIRMED`, `PENDING`, `CANCELLED`, `COMPLETED` | Drives all display logic and action availability. |
| `Notes` | String | Optional contextual notes regarding the call. | Nullable | Display in message body. |
| `OwnerID` | UUID | The ID of the other party involved (e.g., Consultant's ID). | Foreign Key (User) | Determines the `isConsultant` context. |

**Database Relationships:**
*   `ScheduledCall` $\rightarrow$ `User` (via `CallerID`, `OwnerID`)

### 🌐 API Surface Design (RESTful Endpoints)

The frontend component requires endpoints to retrieve the data and endpoints to execute the state transitions (actions).

#### 1. Read Operations (GET)

| Endpoint | Method | Description | Request Body | Response Body | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `/api/v1/calls/scheduled` | `GET` | Fetches a list of scheduled calls for the authenticated user. | Query Params: `startDate`, `endDate`, `pageSize` | `[]ScheduledCall` | Pagination and filtering should be supported. |
| `/api/v1/calls/scheduled/{callId}` | `GET` | Fetches the detailed status and data for a single call. | None | `ScheduledCall` | Optimized for displaying the full message payload. |

#### 2. Write Operations (POST/PATCH)

These endpoints handle the actions available to the consultant role.

| Endpoint | Method | Description | Request Body | Status Handled | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `/api/v1/calls/scheduled/{callId}/cancel` | `POST` | Initiates cancellation of the scheduled call. | `{ reason: string }` | `Status: CANCELLED` | Requires robust authorization checks (who is allowed to cancel). |
| `/api/v1/calls/scheduled/{callId}/reschedule` | `PATCH` | Updates the scheduled time and potentially the date. | `{ newScheduledAt: timestamp, newDuration: int }` | `Status: CONFIRMED` (or updated state) | Should validate availability against the backend calendar/user schedule. |
| `/api/v1/calls/scheduled/{callId}/complete` | `POST` | Marks a scheduled call as completed after the meeting. | `{ notes: string }` | `Status: COMPLETED` | Used by both parties upon finishing the call. |

### 💻 Backend Service Layer Logic (Go/Service Pattern)

The business logic should be encapsulated in dedicated services to ensure atomic transactions and enforce state machine rules.

#### 1. `CallManagementService`

This service handles all state transitions.

**Key Functions:**

1.  **`GetScheduledCallDetails(callID uuid) (*model.ScheduledCall, error)`:**
    *   Retrieves the call details from the repository.
    *   Performs initial validation (e.g., checking if the `CallerID` matches the authenticated user).
2.  **`CancelCall(callID uuid, cancellerID uuid, reason string) (*model.ScheduledCall, error)`:**
    *   **Logic:** Must enforce cancellation rules (e.g., cannot cancel 5 minutes before the call starts).
    *   **Transaction:** Updates `ScheduledCall.Status` to `CANCELLED`.
    *   **Output:** Returns the updated call object.
3.  **`RescheduleCall(callID uuid, newTime time.Time, newDuration int) (*model.ScheduledCall, error)`:**
    *   **Logic:** Must check the availability of the involved parties at `newTime`.
    *   **Transaction:** Updates `ScheduledCall.ScheduledAt` and `ScheduledCall.DurationMinutes`.
    *   **Output:** Returns the updated call object.
4.  **`MarkCallComplete(callID uuid, completerID uuid, notes string) (*model.ScheduledCall, error)`:**
    *   **Logic:** Simple status update, but critical for audit trail.
    *   **Transaction:** Updates `ScheduledCall.Status` to `COMPLETED`.

#### 2. `AuthorizationMiddleware`

Every write operation endpoint (`POST /cancel`, `PATCH /reschedule`, etc.) must pass through authorization middleware that checks:
1.  Does the requesting user (`context.UserID`) have the necessary role (e.g., `CONSULTANT`)?
2.  Is the user authorized to modify this specific `callID`?

### 🧪 Backend Logic Flow Mapping (The Status Machine)

The component's state-dependent rendering requires a clear state machine model on the backend, ensuring that client-side actions are validated against the current state.

| Current Status | Action Attempted | Is Action Valid? | New Status | Service Method |
| :--- | :--- | :--- | :--- | :--- |
| `PENDING` | Reschedule | Yes (if time is available) | `CONFIRMED` | `RescheduleCall` |
| `CONFIRMED` | Reschedule | Yes (if time is available) | `CONFIRMED` | `RescheduleCall` |
| `CONFIRMED` | Cancel | Yes (if time buffer is respected) | `CANCELLED` | `CancelCall` |
| `PENDING` | Cancel | Yes | `CANCELLED` | `CancelCall` |
| `CANCELLED` | Reschedule | No | Error (Cannot modify cancelled call) | Blocked |
| `COMPLETED` | Reschedule | No | Error (Call already happened) | Blocked |

***

*this content was created by AI, but the coding and underlying logic are not.*