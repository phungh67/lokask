[⬅ Return to Main Compendium](../../../../../../README.md)

As a senior frontend officer, I recognize that the provided code is a robust backend data access layer (Go/SQLX). My role is to document how we *consume* this structured data in the client-side application. The core task is translating the data contracts (`ConsultantBookingView`, `UserBookingView`) and the repository logic into strongly-typed, reusable, and performance-optimized frontend components using TypeScript and Vite principles.

Here is the documentation covering the data contracts, state management, and component architecture.

---

## 📐 Frontend Component & Data Architecture Documentation (TypeScript/Vite)

### 1. Data Modeling (TypeScript Interfaces)

We must first create precise TypeScript interfaces that mirror the expected data structure received from the backend API endpoints corresponding to the repository methods. We'll assume UUIDs and Date strings for consistency.

#### `src/types/booking.ts`

```typescript
/**
 * Core booking entry structure (Matches domain.BookingEntry)
 * @schema: booking_entry
 */
export interface BookingEntry {
    id: string; // UUID
    status: 'CONFIRMED' | 'CANCELLED' | 'PENDING' | 'COMPLETED'; // Restricted Union Type
    // Date format must be standardized (e.g., ISO 8601 string)
    createdAt: string; 
    updatedAt: string;
    // We assume this is available on the booking entry itself
    // e.g., serviceType: string;
}

/**
 * View Model for displaying bookings when viewing a CONSULTANT's schedule.
 * Corresponds to the backend's ConsultantBookingView.
 */
export interface ConsultantBookingView extends BookingEntry {
    // Data about the client (the traveler)
    travellerName: string;
    travellerAvatar: string; // Use empty string '' instead of *string for type safety
    travellerLocation: string;

    // Data about the consultant (the person viewing their schedule)
    consultantName: string | null; // Nullable if the JOIN fails gracefully
    consultantAvatar: string;
    consultantCity: string;
}

/**
 * View Model for displaying bookings when viewing a USER's profile.
 * Corresponds to the backend's UserBookingView.
 */
export interface UserBookingView extends BookingEntry {
    // Data about the consultant booked
    consultantName: string;
    consultantAvatar: string;
    consultantCity: string;
}

/**
 * Payload for creating a new booking.
 */
export interface BookingCreationPayload {
    consultantId: string;
    userId: string;
    startTime: string; // ISO 8601
    endTime: string;   // ISO 8601
    totalPrice: number;
    userNotes: string;
    serviceType: string;
}

/**
 * Response structure for CRUD operations.
 */
export interface OperationResponse<T> {
    success: boolean;
    message: string;
    data?: T;
}
```

### 2. State Management (Zustand/Redux Toolkit Approach)

For managing global or complex component-specific state (like the user's active bookings or the consultant's full schedule), we prefer a centralized, minimal, and observable store pattern (e.g., Zustand).

**Goal:** Centralize the fetching and storage of the booking list to prevent redundant API calls and manage loading/error states gracefully.

#### `src/store/useBookingStore.ts`

```typescript
import create from 'zustand';
import { ConsultantBookingView, UserBookingView } from '../types/booking';

interface BookingState {
    // State properties
    isLoading: boolean;
    error: string | null;
    consultantBookings: ConsultantBookingView[];
    userBookings: UserBookingView[];

    // Actions (Async thunks)
    fetchConsultantBookings: (consultantId: string) => Promise<void>;
    fetchUserBookings: (userId: string) => Promise<void>;
    updateBookingStatus: (id: string, status: 'CONFIRMED' | 'CANCELLED' | 'PENDING') => Promise<void>;
}

export const useBookingStore = create<BookingState>()((set, get) => ({
    isLoading: false,
    error: null,
    consultantBookings: [],
    userBookings: [],

    // --- State Actions ---

    fetchConsultantBookings: async (consultantId: string) => {
        set({ isLoading: true, error: null });
        try {
            // Assume existence of an API service layer (e.g., api/bookingService.ts)
            const response: { data: ConsultantBookingView[] } = await api.get(`/bookings/consultant/${consultantId}`);
            set({ 
                consultantBookings: response.data, 
                isLoading: false 
            });
        } catch (e) {
            set({ error: 'Failed to fetch consultant bookings.', isLoading: false });
        }
    },

    fetchUserBookings: async (userId: string) => {
        set({ isLoading: true, error: null });
        try {
            const response: { data: UserBookingView[] } = await api.get(`/bookings/user/${userId}`);
            set({ 
                userBookings: response.data, 
                isLoading: false 
            });
        } catch (e) {
            set({ error: 'Failed to fetch user bookings.', isLoading: false });
        }
    },

    updateBookingStatus: async (id: string, status: 'CONFIRMED' | 'CANCELLED' | 'PENDING') => {
        // Optimistic UI Update: Update local state immediately
        set(state => ({ 
            // Assuming we update the bookings array in place
            consultantBookings: state.consultantBookings.map(b => 
                b.id === id ? { ...b, status: status } : b
            )
        }));

        try {
            await api.patch(`/bookings/${id}/status`, { status });
            // On success, the state remains updated.
        } catch (e) {
            // Rollback on error
            set({ error: 'Failed to update booking status.', isLoading: false });
        }
    }
}));
```

### 3. Component Architecture

We adhere to the principles of **Separation of Concerns (SoC)** and **Controlled Components**. Complex logic resides in the container/page component, while simple display logic is handled by presentation components.

#### 3.1. Core Components (`/components/booking/`)

**A. `BookingCard` (Presentation Component)**
*   **Role:** Displaying the details of a single booking entry. Highly reusable.
*   **Props (TypeScript):** Accepts `data: ConsultantBookingView` (or `UserBookingView`) and `isEditable: boolean`.
*   **Logic:** Pure rendering. Handles displaying avatar images, formatting dates (e.g., using a specialized `formatDate` hook), and showing conditional styling based on `status`.
*   **Example Usage:**
    ```tsx
    // Example rendering logic within BookingCard.tsx
    const getStatusStyles = (status: string) => {
        if (status === 'CANCELLED') return 'text-red-600';
        if (status === 'CONFIRMED') return 'text-green-600';
        return 'text-yellow-600';
    };

    return (
        <div className={`p-4 border-b ${status === 'CANCELLED' ? 'bg-red-50' : 'bg-white'}`}>
            <h3 className={`text-sm font-semibold ${getStatusStyles(data.status)}`}>
                {data.status}
            </h3>
            {/* ... Display details using data.travellerName, data.consultantName, etc. */}
        </div>
    );
    ```

**B. `BookingSchedule` (Container Component)**
*   **Role:** The main "view" of the schedule. It manages the collection of `BookingCard`s.
*   **Dependencies:** Needs the `useBookingStore` hook.
*   **Logic:**
    1.  **Subscription:** Subscribes to the relevant slice of the Zustand store (`useBookingStore(state => state.consultantBookings)`).
    2.  **Error Handling:** Displays a dedicated component if `state.error` is present.
    3.  **Empty State:** Displays a friendly "No bookings found" message if the array is empty.
    4.  **Interactivity:** Contains the handlers that call the state store methods (`updateBookingStatus`).

#### 3.2. Page Components (Container/Page Logic)

**A. `ConsultantDashboardPage`**
*   **Role:** The entry point when a consultant logs in to view their schedule.
*   **Logic Flow:**
    1.  Uses `useBookingStore` to determine the consultant's ID from the auth context.
    2.  **Effect Hook:** On mount, calls `useBookingStore.getState().fetchConsultantBookings(consultantId)`.
    3.  Renders the `<BookingSchedule />` component, passing the ID for context.
*   **Vite Optimization:** Since this page involves data fetching, we ensure that the Vite build uses **React Suspense** or equivalent loading patterns to provide a perfect skeleton loader experience while data is being retrieved.

**B. `UserBookingHistoryPage`**
*   **Role:** View a user's past and upcoming appointments.
*   **Logic Flow:**
    1.  Identifies the `userId` from the authentication context.
    2.  Uses `useBookingStore` to fetch `userBookings`.
    3.  Renders the `<BookingSchedule />` component, but passing `UserBookingView` types.

### 4. Key Technical Decisions & Optimization

| Area | Technology/Principle | Reason/Optimization |
| :--- | :--- | :--- |
| **Typing** | TypeScript Interfaces & Unions | Enforces data contracts exactly, catching type errors at compile time, significantly improving developer experience. |
| **State** | Zustand (or similar minimal store) | Avoids the boilerplate and overhead of massive Redux setups while still providing global state management and dependency isolation. |
| **Data Fetching** | Thunks/Selectors (within Zustand) | Keeps the fetching logic coupled with the state management. Ensures that all components consuming the data always use the latest state and trigger fetching correctly. |
| **Rendering** | Presentational/Container Pattern | **Separation of Concerns.** Components only receive props and render. Container components handle API interaction, state, and business logic. This makes components highly testable and reusable. |
| **Performance** | Memoization (`React.memo`) | Applied to the `BookingCard` component to prevent unnecessary re-renders when only the status or surrounding state changes, maximizing client performance. |

***
*this content was created by AI, but the coding and underlying logic are not.*