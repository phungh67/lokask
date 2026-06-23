[⬅ Return to Main Compendium](../../../README.md)

## 🚀 Frontend Architecture & Logic Documentation (lokask.se)

As a senior frontend officer, my goal is to translate the underlying infrastructure constraints (Nginx routing and backend services) into a robust, type-safe, and maintainable client-side architecture using TypeScript and Vite best practices.

This documentation outlines the required service layer integration, state management patterns, and component contracts for the application.

---

### 📂 I. Architecture Overview

The application follows a Single Page Application (SPA) model served via Nginx.

| Service Layer | Endpoint Pattern | Protocol | Purpose | Client Interaction Focus |
| :--- | :--- | :--- | :--- | :--- |
| **Static Assets** | `/` (root) | HTTPS | Core UI rendering (HTML, CSS, JS). | Direct React/Vanilla/Framework integration. |
| **API Backend** | `/api/*` | HTTPS (REST/JSON) | Business logic, data fetching (e.g., user profiles, listings). | Dedicated HTTP Client Service (Axios/Fetch). |
| **WebSockets** | `/ws/*` | WSS | Real-time bidirectional communication (e.g., live video, chat status). | Dedicated WebSocket Service/Hook. |

### 💻 II. Technical Implementation Details

#### 1. Type-Safe API Client Service (TypeScript/Axios)

The `/api/` endpoint is the primary data source. We must encapsulate all API calls into a single, type-safe service to handle request/response serialization and error handling.

**File:** `src/services/apiClient.ts`

```typescript
import axios, { AxiosInstance } from 'axios';

// Initialize a reusable, typed Axios instance
const api: AxiosInstance = axios.create({
    baseURL: process.env.VITE_API_BASE_URL || 'https://api.lokask.se/api', // Use environment variable for deployment safety
    headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
    },
});

/**
 * Generic wrapper for making API calls with standardized error handling.
 * @param method HTTP Method (get, post, put, delete)
 * @param url The specific API path (e.g., 'users/profile')
 * @param data Payload to send
 * @returns Promise resolving to the data response.
 */
export async function apiRequest<T>(
    method: 'get' | 'post' | 'put' | 'delete',
    url: string,
    data?: object
): Promise<T> {
    try {
        const response = await api({
            method: method,
            url: url,
            data: data,
        });
        // Assuming the backend returns the data directly in response.data
        return response.data as T; 
    } catch (error) {
        console.error(`[API Error] Failed to call ${method} ${url}:`, error);
        // Global state management should handle the specific error type (e.g., 401 Unauthorized)
        throw new Error(`Service Error: ${error instanceof Error ? error.message : 'Unknown API failure'}`);
    }
}

// Example Type-Specific Functions
export const userService = {
    fetchUser: async (userId: string): Promise<User> => {
        return apiRequest('get', `/users/${userId}`);
    },
    // ... other user actions
}
```

#### 2. Real-Time WebSocket Manager (TypeScript/Hooks)

The `/ws/` endpoint requires a persistent connection for real-time interactions (e.g., live streaming, presence indicators). A dedicated service and a custom hook provide clean state management.

**File:** `src/services/websocketService.ts`

```typescript
/**
 * Manages the WebSocket connection lifecycle.
 * Designed to be singleton/globally accessible.
 */
export class WebSocketManager {
    private socket: WebSocket | null = null;
    private handlers: Map<string, ((data: any) => void)[]> = new Map();

    /**
     * Establishes and manages the WebSocket connection.
     * Uses wss:// because the Nginx setup enforces HTTPS.
     * @param endpoint The API endpoint path (e.g., 'ws/video-call')
     */
    public connect(endpoint: string, onMessage: (data: any) => void): void {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.disconnect();
        }

        // Assuming the base protocol is HTTPS, we use wss:
        const wsUrl = `wss://${window.location.host}/${endpoint}`; 
        this.socket = new WebSocket(wsUrl);

        this.socket.onopen = () => {
            console.log('WebSocket connected successfully.');
        };

        this.socket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                // Dispatch or execute registered handlers
                onMessage(data); 
            } catch (e) {
                console.error('Error parsing WebSocket message:', e);
            }
        };

        this.socket.onclose = () => {
            console.warn('WebSocket disconnected. Attempting reconnect in 5s...');
            // Implement auto-reconnect logic here (e.g., setTimeout(() => this.connect(...)))
        };

        this.socket.onerror = (event) => {
            console.error('WebSocket error:', event);
        };
    }

    public sendMessage(message: object): void {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify(message));
        } else {
            console.warn('Cannot send message: WebSocket is not open.');
        }
    }

    public disconnect(): void {
        if (this.socket) {
            this.socket.close();
            this.socket = null;
        }
    }
}

// Expose the singleton instance
export const wsManager = new WebSocketManager();
```

**Custom Hook Integration:**

```typescript
// src/hooks/useWebSocket.ts
import { useState, useEffect } from 'react';
import { wsManager } from '../services/websocketService';

export function useWebSocket(endpoint: string, initialMessage: object): { sendMessage: (msg: object) => void } {
    const [latestData, setLatestData] = useState<any>(null);

    useEffect(() => {
        // Callback handler that updates the component state
        const handleMessage = (data: any) => {
            setLatestData(data);
        };
        
        wsManager.connect(endpoint, handleMessage);
        wsManager.sendMessage(initialMessage);

        return () => {
            wsManager.disconnect();
        };
    }, [endpoint, initialMessage]);

    const sendMessage = (msg: object) => {
        wsManager.sendMessage(msg);
    };

    return { latestData, sendMessage };
}
```

#### 3. Component Architecture & State Management

We utilize a combination of React Hooks and a centralized state manager (e.g., Zustand, Redux Toolkit) to manage derived and global state.

**A. Global State Management (e.g., Zustand Store)**

Used for persistent, cross-component data (Authentication, User Profile, Global Notifications).

*   **Schema:** `AuthState` (user, token, loading, isAuthenticated)
*   **Action:** `login(credentials)` $\rightarrow$ Calls `userService.login()`
*   **Action:** `logout()` $\rightarrow$ Clears state, redirects to `/`

**B. Component Contracts (UI Logic)**

Components must be highly focused (Container/Presentational pattern) and rely entirely on the services layer for data fetching.

| Component/Page | Dependency Services | State Required | Logic Flow |
| :--- | :--- | :--- | :--- |
| **`ProfilePage`** | `userService` | `User` (from API), `isLoading` | 1. Fetch user data on mount. 2. Show loading skeleton. 3. Display data or show error message. |
| **`LiveCallComponent`** | `useWebSocket` | `CallStatus`, `RemoteStreams` | 1. Initialize `useWebSocket` hook. 2. Handle incoming `CallStatus` updates (e.g., `CALL_JOINED`, `DISCONNECTED`). 3. Render video streams based on active user list. |
| **`SearchPage`** | `apiClient` | `SearchResults[]`, `SearchTerm` | 1. Debounce input change. 2. Call `apiClient.search(...)` with term. 3. Filter and display results. |

### 🚦 III. Summary of Frontend Constraints

1.  **Environment Variables:** All backend URLs (`/api/`, `/ws/`) *must* be consumed via Vite's environment variable mechanism (`process.env.VITE_...`) to ensure secure and scalable deployment.
2.  **Error Handling:** Implement a centralized global error handler (e.g., an interceptor in Axios) to catch API-level errors (401, 500) and translate them into user-friendly UI notifications.
3.  **Type Safety:** Define strict TypeScript interfaces for *all* API request payloads and response models (`interface User { id: string; name: string; }`). Never treat backend JSON data as `any`.

*this content was created by AI, but the coding and underlying logic are not.*