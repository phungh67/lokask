[⬅ Return to Main Compendium](../../../../../README.md)

## 💻 Frontend Architecture & State Management Documentation

As the senior frontend officer, I have reviewed the core data models. Our focus must be on robust TypeScript typing, predictable state flow, and ensuring the components are highly reusable and testable within the Vite environment.

This document outlines the structured approach for managing bookings, from API requests to UI rendering.

---

### 1. Type Definitions & Validation (The Data Contract)

We must ensure all enums and interfaces are rigidly typed and provide utility types for enhanced safety.

```typescript
// --- Core Enumerations ---

/** Defines the allowed types of services offered. */
export type ServiceType = "chat_only" | "video_call" | "voice_call" | "itinerary_review";

/** Defines the current operational status of a booking record. */
export type BookingStatus = "pending" | "confirmed" | "completed" | "cancelled";

// --- Interfaces ---

/**
 * @typedef {Object} Booking
 * Represents the full, view-ready booking object retrieved from the API.
 * Note: All date/time strings MUST be treated as ISO 8601 strings and converted to Date objects upon consumption.
 */
export interface Booking {
  id: string;
  consultant_id: string;
  user_id: string;
  
  // Time slots (Mandatory for display)
  start_time: string; // ISO String
  end_time: string;   // ISO String
  
  // Management fields
  service_type: ServiceType;
  status: BookingStatus;
  total_price: number;
  user_notes: string;
  
  created_at: string; // ISO String
  updated_at: string; // ISO String

  // View fields (Optionals, representing joined relational data)
  traveller_name?: string;
  traveller_avatar?: string;
  traveller_location?: string;
  consultant_name?: string;
  consultant_avatar?: string;
  consultant_city?: string;
}

/**
 * @typedef {Object} CreateBookingRequest
 * The payload structure for creating a new booking.
 */
export interface CreateBookingRequest {
  consultant_id: string;
  start_time: string; // Must be an ISO string representing the start of the slot
  service_type: ServiceType; // Use the type, not string
  user_notes: string;
  total_price: number;
}

// --- Utility Types & Helpers ---

/**
 * A type guard to validate if a given string is a valid ISO date.
 * This is critical before attempting date parsing.
 */
export const isIsoString = (value: string): value is string => {
    try {
        new Date(value).toISOString(); // Test if the date object can be normalized back
        return true;
    } catch (e) {
        return false;
    }
};

/**
 * Utility hook to parse and safely handle date formatting.
 * @param isoString The ISO 8601 formatted time string.
 * @returns A formatted date object or null if invalid.
 */
export const useParsedDateTime = (isoString: string): Date | null => {
    if (!isIsoString(isoString)) {
        console.error("Invalid ISO date provided:", isoString);
        return null;
    }
    return new Date(isoString);
}
```

### 2. State Management Architecture (Zustand Pattern Recommended)

We should implement a centralized store (e.g., using Zustand) to manage the list of bookings, preventing prop drilling and providing atomic updates.

#### `useBookingStore`

```typescript
import { create } from 'zustand';
import { Booking, CreateBookingRequest, BookingStatus } from './types';

interface BookingState {
  // State for the collection of bookings
  bookings: Booking[];
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchBookings: (userId: string) => Promise<void>;
  addBooking: (newBooking: Omit<Booking, 'id' | 'created_at' | 'updated_at'>) => void;
  updateBookingStatus: (bookingId: string, newStatus: BookingStatus) => void;
}

export const useBookingStore = create<BookingState>((set, get) => ({
  bookings: [],
  isLoading: false,
  error: null,

  /**
   * Fetches the paginated list of bookings for a user.
   * API Call Simulation: GET /api/v1/bookings?user_id={userId}
   */
  fetchBookings: async (userId: string): Promise<void> => {
    set({ isLoading: true, error: null });
    try {
      // Simulate API call fetching array of Booking objects
      // const response: Booking[] = await API.get(`/bookings?user_id=${userId}`);
      // set({ bookings: response });
      console.log(`Fetching bookings for user: ${userId}`);
      // Simulate success
      set({ bookings: [{ id: 'b1', consultant_id: 'c1', user_id: userId, start_time: '...', end_time: '...', service_type: 'chat_only', status: 'confirmed', total_price: 50, user_notes: '...', created_at: '...', updated_at: '...'} ] });

    } catch (err) {
      set({ error: 'Failed to fetch bookings.', isLoading: false });
    } finally {
      set({ isLoading: false });
    }
  },

  /**
   * Adds a new booking to the state after successful API creation.
   * @param newBooking - The payload excluding system metadata.
   */
  addBooking: (newBookingPayload: Omit<Booking, 'id' | 'created_at' | 'updated_at'>) => {
    // In a real implementation, the API response should include the finalized object.
    const newBooking: Booking = { 
        ...newBookingPayload, 
        id: crypto.randomUUID(), // Placeholder ID
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    } as Booking;
    
    set((state) => ({
      bookings: [...state.bookings, newBooking],
    }));
  },

  /**
   * Updates the status of a specific booking (e.g., from pending to confirmed).
   * @param bookingId The unique ID of the booking.
   * @param newStatus The new status enum.
   */
  updateBookingStatus: (bookingId: string, newStatus: BookingStatus) => {
    set((state) => ({
      bookings: state.bookings.map(booking =>
        booking.id === bookingId
          ? { ...booking, status: newStatus, updated_at: new Date().toISOString() }
          : booking
      ),
    }));
  },
}));
```

### 3. Component Architecture & UI Logic

We must decompose the UI into atomic, presentation-focused components that consume state and logic hooks, keeping state manipulation confined to container components (Smart Components).

#### 3.1. Container Component: `BookingDashboard` (Smart Component)

This component orchestrates the fetching and displays the list.

*   **Responsibility:** State management (calling `useBookingStore` actions), fetching data, error handling, and rendering the list container.
*   **Logic:**
    1.  On Mount: Calls `useBookingStore.fetchBookings(currentUser.id)`.
    2.  Watcher: Monitors `isLoading` state to display skeletons/spinners.
    3.  Handler: Provides the mechanism to submit new bookings, validating the input against `CreateBookingRequest` before calling `addBooking`.

```tsx
// BookingDashboard.tsx
import React, { useEffect } from 'react';
import { useBookingStore } from '../store/useBookingStore';
import BookingCard from './BookingCard';
import CreateBookingForm from './CreateBookingForm';

const BookingDashboard: React.FC = () => {
    // Consumption of state and actions
    const { bookings, isLoading, error, fetchBookings, addBooking, updateBookingStatus } = useBookingStore();
    
    // Load data on initial mount
    useEffect(() => {
        fetchBookings("user-abc-123"); // Replace with actual user context
    }, [fetchBookings]);

    const handleStatusChange = (bookingId: string, newStatus: BookingStatus) => {
        updateBookingStatus(bookingId, newStatus);
    };

    return (
        <div className="dashboard-container">
            <h1>My Bookings</h1>
            {error && <p className="error">{error}</p>}
            
            <CreateBookingForm onBookingCreated={addBooking} />
            
            <div className="booking-list">
                {isLoading && <LoadingSkeleton /> : (
                    bookings.map((booking) => (
                        <BookingCard 
                            key={booking.id} 
                            booking={booking} 
                            onStatusChange={handleStatusChange}
                        />
                    ))
                )}
            </div>
        </div>
    );
}
```

#### 3.2. Presentational Component: `BookingCard`

This component receives data via props and displays it. It should have minimal business logic.

*   **Props:** Requires `booking: Booking` and `onStatusChange: (id: string, status: BookingStatus) => void`.
*   **Logic:**
    1.  Date Formatting: Uses `useParsedDateTime` to reliably format `start_time` and `end_time` for display.
    2.  Conditional Rendering: Determines if a button should be visible based on the `status` (e.g., only show "Cancel" if status is `pending`).

```tsx
// BookingCard.tsx
import React from 'react';
import { Booking, BookingStatus } from '../types';

interface BookingCardProps {
    booking: Booking;
    onStatusChange: (id: string, status: BookingStatus) => void;
}

const BookingCard: React.FC<BookingCardProps> = ({ booking, onStatusChange }) => {
    // Use the utility hook for safe date display
    const start = new Date(booking.start_time);
    const end = new Date(booking.end_time);
    
    // Logic for controlling UI visibility/actions
    const isActionable = booking.status === 'pending';

    const handleStatusAction = () => {
        // Example: Toggling confirmation status
        if (booking.status === 'pending') {
            onStatusChange(booking.id, 'confirmed');
        }
    };

    return (
        <div className={`card ${booking.status}`}>
            <h3>{booking.service_type.replace('_', ' ').toUpperCase()} Booking</h3>
            <p className="dates">
                {start.toLocaleString()} - {end.toLocaleString()}
            </p>
            <p>Total: ${booking.total_price.toFixed(2)}</p>
            
            {/* Controlled UI element based on status */}
            {isActionable && (
                <button onClick={handleStatusAction}>Confirm Booking</button>
            )}
        </div>
    );
}
```

#### 3.3. Form Component: `CreateBookingForm`

A dedicated component for handling the write operation.

*   **Responsibility:** Input handling, client-side validation, and payload construction.
*   **Logic:**
    1.  Validation: Must validate that all inputs are non-empty and that `start_time` is a valid ISO date string.
    2.  Submission: On submit, validates the `CreateBookingRequest` payload structure and calls the `onBookingCreated` callback (which ties back to `useBookingStore.addBooking`).

### Summary of Best Practices Implemented

1.  **Type Safety:** We used `export type` and interfaces extensively, and implemented `ServiceType` directly in `CreateBookingRequest` to prevent accidental string literals.
2.  **Date Handling:** Introduced `useParsedDateTime` and `isIsoString` utility functions to abstract away the complex, error-prone process of handling ISO date strings, ensuring all components consume clean `Date` objects.
3.  **State Colocation:** By using a centralized store (`useBookingStore`), we ensure that state mutations (`updateBookingStatus`, `addBooking`) are managed in one place, making the system predictable and testable.
4.  **Separation of Concerns:** `BookingDashboard` handles *data flow and logic*; `BookingCard` handles *presentation*; and `CreateBookingForm` handles *input validation*. This adherence to SRP makes testing trivial.

*this content was created by AI, but the coding and underlying logic are not.*