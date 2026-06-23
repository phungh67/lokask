[⬅ Return to Main Compendium](../../../../../../README.md)

As a senior frontend officer specializing in TypeScript and Vite, my job is to treat this comprehensive backend API structure not as a backend implementation, but as the **API Contract** that dictates the required client-side architecture.

The provided `main.go` file defines robust, modular API endpoints (`/api/v1/...`). We must leverage this structure to design a clean, scalable, and maintainable client-side application using modern frontend patterns (React/Vue + TypeScript + Vite).

Here is the detailed documentation for the UI Logic, State Management, and Component Architecture.

---

## 🚀 Frontend Architecture Design Blueprint

**Goal:** To build a single-page application (SPA) that is highly modular, type-safe, and efficiently manages complex, user-driven state (e.g., chat sessions, booking calendars).

**Tech Stack:** TypeScript, Vite, React (or equivalent component library), Zustand/Jotai (for State Management).

### 1. State Management Strategy (Global State / Type Definitions)

We must centralize the application state to prevent prop drilling and ensure predictable data flow, especially when dealing with authenticated, dynamic resources like chats and bookings.

#### 📂 Core Data Models (TypeScript Interfaces)

We will define strict interfaces based on the backend models:

```typescript
// src/types/index.ts

// Auth State
export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// User/Consultant Profile
export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatarUrl: string;
  isConsultant: boolean;
  // Add other relevant profile fields
}

// Booking/Trip Management
export interface Booking {
  id: string;
  consultantId: string;
  startDate: Date;
  endDate: Date;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED';
  details: string;
}

// Chat/Message Management
export interface ChatMessage {
  messageId: string;
  senderId: string;
  content: string;
  timestamp: Date;
}

export interface ChatSession {
  conversationId: string; // Corresponds to /conversations/:id
  title: string;
  lastMessage: string;
  history: ChatMessage[]; // Local cache for history
}

// Consultant Details
export interface Consultant {
  id: string;
  name: string;
  specialties: string[]; // From /niches
  bio: string;
  services: any[]; // Complex structured data
}
```

#### ⚛️ State Management Implementation (Zustand Pattern)

We will use Zustand to create dedicated, centralized stores for major domains:

| Store Name | State Managed | Source API Calls | Purpose |
| :--- | :--- | :--- | :--- |
| `useAuthStore` | `AuthState`, User Profile | `/auth/login`, `/auth/register`, `/auth/me` | Manages user session and JWT token lifecycle. |
| `useBookingsStore` | `Booking[]`, `BookingState` | `/bookings/my-trips`, `/bookings/consultant/:id` | Handles fetching, creating, and updating trip schedules. |
| `useChatStore` | `ChatSession[]`, `ChatMessage[]` | `/conversations`, `/conversations/:id/messages` | Aggregates all conversation threads and real-time message history. |
| `useConsultantStore` | `Consultant[]`, `ConsultantDetail` | `/consultants`, `/consultants/:id` | Caches fetched consultant lists and profiles. |

### 2. Component Architecture (Structure)

The application will be broken down into reusable, dumb components (presentational) and smart components (container/logic).

#### A. Layout Components (Structural)
1.  `Header`: Contains logo and user profile dropdown. (Depends on `useAuthStore`).
2.  `SidebarNavigation`: Primary navigation links.
3.  `PageLayout`: Handles overall page structure, status loading, and global error boundaries.

#### B. Smart/Container Components (Logic Holders)
These components fetch data and manage their local state, passing props down.

1.  **`BookingDashboard`**: (Manages the view for `/bookings/my-trips`).
    *   *Logic:* Calls `useBookingsStore` to fetch all user trips.
    *   *Child Components:* `<BookingCard />`, `<CalendarView />`.
2.  **`ChatPage`**: (The main view for chat/messaging).
    *   *Logic:* Uses `useChatStore` for the active session ID. Implements WebSocket handling.
    *   *Child Components:* `<MessageHistory />`, `<MessageInput />`.
3.  **`ConsultantProfilePage`**: (The view for `/consultants/:id`).
    *   *Logic:* Fetches consultant data and schedules.
    *   *Child Components:* `<ScheduleViewer />`, `<ServiceList />`, `<BookingWidget />`.
4.  **`AuthFormContainer`**: (Used for login/register).
    *   *Logic:* Handles form submission and token persistence using `useAuthStore`.

#### C. Dumb/Presentational Components (UI Primitives)
These components receive all necessary data and handlers via props and have no internal state or API calls.

*   `Button`: Standard reusable button (handles disabled state).
*   `Input`: Typed and accessible text input.
*   `Card`: Generic container for structured information (e.g., BookingCard).
*   `MessageBubble`: Renders a single `ChatMessage` object.
*   `DatePicker`: Handles date selection for scheduling.

### 3. UI Logic Flow (State & Side Effects)

#### 🌐 Authentication Logic
1.  **Initial Load:** On app startup, check local storage for the token. If present, call `/auth/me` (protected) to validate the session and populate `useAuthStore`.
2.  **Login/Register:** Submit credentials $\rightarrow$ Call `/auth/login` $\rightarrow$ Receive JWT $\rightarrow$ Store token and user data in `useAuthStore`.
3.  **Logout:** Clear token from local storage and reset `useAuthStore`.

#### 🔄 Chat/Realtime Logic (WebSocket Integration)
The most complex logic is handling the chat state:
1.  **Initiation:** User selects a recipient $\rightarrow$ API call to `/conversations` (POST) to start/fetch the session.
2.  **State Update:** `useChatStore` is populated with `ChatSession` details.
3.  **Realtime:** The `ChatPage` container establishes a WebSocket connection (`/ws/video/conversation/:id`).
4.  **Handling Messages:** The WebSocket listener intercepts incoming messages $\rightarrow$ **Does NOT** update component state directly $\rightarrow$ Instead, it triggers a state mutation function in `useChatStore.addMessage(message)` which automatically updates the message history and last message summary.

#### 🗓️ Booking Logic
1.  **Read:** Component mounts $\rightarrow$ Fetch available slots for a given service (via API).
2.  **Create/Update:** User selects date/time $\rightarrow$ Submit booking request (POST `/api/bookings`).
3.  **View:** Successfully submitted booking data updates the local component state to show confirmation, removing the booking form.

### Summary of Data Flow (Diagrammatic View)

$$\text{User Interaction} \xrightarrow{\text{Triggers}} \text{Component} \xrightarrow{\text{Calls}} \text{API Service} \xrightarrow{\text{Returns Data}} \text{Global State (Context/Zustand)} \xrightarrow{\text{Renders}} \text{UI Component}$$