[⬅ Return to Main Compendium](../../../README.md)

As a senior frontend officer specializing in TypeScript and Vite, I must first address the input provided.

The code snippet is an NGINX server block, which is critical **backend infrastructure** responsible for routing, proxying, and setting up CORS headers for the application services (React, Go API, WebSockets, MinIO). It does not contain any frontend logic, state management, or component definitions.

Therefore, I cannot document the UI logic directly. Instead, I will reverse-engineer the necessary frontend architecture, component contracts, state patterns, and TypeScript interfaces required for a React/Vite application to successfully interact with the services defined in this NGINX configuration.

---

# 🚀 Frontend Architecture Documentation (React/Vite/TypeScript)

**Target Environment:** React 18+ (using Hooks), TypeScript, Vite.
**Goal:** Secure, type-safe interaction with defined backend endpoints (`/api/`, `/ws/`, `/user-avatars`, etc.).

## 1. Architecture Overview: Separation of Concerns

The application will adhere to a modular, layered architecture:

1.  **Presentation Layer (Components):** Responsible for rendering UI and handling user input. They receive state and pass event handlers up. They are "dumb" components.
2.  **Container/Logic Layer (Hooks/Page Components):** Responsible for fetching data, managing local UI state, and handling side effects (e.g., WebSocket connection lifecycle). They call services.
3.  **Service/API Layer (Axios Instances/React Query):** Encapsulates all network requests. This is where the complexity of the NGINX routes is abstracted away.

## 2. TypeScript Interface Definition (Data Contracts)

Defining explicit interfaces is paramount for type safety and maintainability.

```typescript
// src/types/api.ts

/**
 * 📦 Type for generic image/object storage response (MinIO/S3)
 */
export interface StoredObject {
  key: string;          // The path/key in the bucket (e.g., 'galleries/user123/image.jpg')
  metadata: {
    size: number;
    mimeType: string;
    uploadedAt: Date;
  };
  url: string;          // Pre-signed or public URL
}

/**
 * 🧑‍💻 API Response Structure for User/Resource retrieval
 */
export interface UserProfile {
  id: string;
  username: string;
  email: string;
  avatarKey: string; // Key used for MinIO path lookup
  settings: {
    notifications: boolean;
  };
}

/**
 * 💬 WebSocket/WebRTC Signaling Payload
 * This structure assumes signaling messages are JSON payloads.
 */
export type SignalingMessage = {
  type: 'call_request' | 'call_accepted' | 'call_rejected' | 'ice_candidate';
  payload: any; // Highly specific payload based on the 'type'
  timestamp: number;
}

/**
 * 🎙️ API Response Structure for Video/Call setup
 */
export interface CallSession {
  sessionId: string;
  participants: string[]; // List of user IDs
  startTime: Date;
  status: 'pending' | 'active' | 'ended';
}
```

## 3. State Management Strategy

Given the diverse nature of the application (CRUD operations, real-time presence, long-running WebSockets), a combination of state managers is recommended:

### A. Global Client State (React Query / Redux Toolkit)
*   **Use Case:** Fetching data that doesn't change rapidly (e.g., User Profile, list of galleries, application configuration).
*   **Recommendation:** **React Query (TanStack Query)** is the modern standard for data fetching in React. It handles caching, background refetching, stale data management, and loading states automatically, dramatically simplifying the container component logic.
*   **State Examples:** `useQuery(['userProfile', userId], fetchUserProfile)`

### B. Local UI State (useState / useReducer)
*   **Use Case:** Component-specific interactions (e.g., form input values, modal visibility, local pagination).
*   **Example:** Managing the `isModalOpen` state for a user settings panel.

### C. Real-time/Ephemeral State (Custom Context/Zustand)
*   **Use Case:** WebSocket connections, presence detection, real-time call status.
*   **Recommendation:** Use a small, focused state manager like **Zustand** or a dedicated **WebSocket Hook** context to manage the WebSocket connection object, message queue, and current call state globally without over-engineering the application.

## 4. Service Layer Implementation (API Abstraction)

This layer abstracts the NGINX routing rules into clean, type-safe function calls.

### A. HTTP Service (Axios Instance)

We define a dedicated instance for API calls to manage headers and base URLs.

```typescript
// src/services/apiClient.ts
import axios, { AxiosInstance } from 'axios';

const apiClient: AxiosInstance = axios.create({
    baseURL: '/api/', // Maps to the proxy location /api/
    headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        'Content-Type': 'application/json',
    },
});

export const apiClientWrapper = (config: any) => {
    // Allows overriding specific methods/headers for specialized calls
    return apiClient.request(config);
};
```

### B. Object Storage Service (MinIO)

This handles interaction with the S3-like endpoint, abstracting the bucket paths (`user-avatars`, `galleries`).

```typescript
// src/services/minioService.ts
import axios from 'axios';
import { StoredObject } from '../types/api';

const minioClient = axios.create({
    // Note: MinIO endpoints require specific pathing
    baseURL: process.env.REACT_APP_MINIO_URL || '/user-avatars/', // Use the most common bucket path here
});

/**
 * Uploads a file and returns object metadata.
 */
export async function uploadFile(file: File, bucket: 'user-avatars' | 'galleries'): Promise<StoredObject> {
    const formData = new FormData();
    formData.append('file', file);

    // Pathing logic must replicate the MinIO location structure
    const key = `${bucket}/${Date.now()}-${file.name}`; 

    return minioClient.post<StoredObject>(`/${bucket}/${key}`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        }
    });
}
```

### C. WebSockets Hook

This manages the lifecycle and type-casting for the real-time signaling.

```typescript
// src/hooks/useWebSocket.ts
import { WebSocket, CloseEvent } from 'ws';
import { useCallback, useEffect, useRef } from 'react';

export const useWebSocket = (url: string): { sendMessage: (msg: SignalingMessage) => void; connectionState: 'open' | 'closed' | 'connecting' } => {
    const wsRef = useRef<WebSocket | null>(null);
    
    useEffect(() => {
        // Maps to the NGINX /ws/ location
        wsRef.current = new WebSocket(url); 

        wsRef.current.onopen = () => {
            console.log('WebSocket Connected');
        };

        wsRef.current.onmessage = (event) => {
            const data: SignalingMessage = JSON.parse(event.data);
            // Implement message dispatching to global state/context here
            console.log('Received Signal:', data.type);
        };
        
        wsRef.current.onclose = (event: CloseEvent) => {
            console.warn('WebSocket Closed:', event);
            // Logic to attempt reconnection
        };

        return () => {
            wsRef.current?.close();
        };
    }, [url]);

    const sendMessage = useCallback((msg: SignalingMessage) => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify(msg));
        }
    }, []);
    
    // ... return connection state logic
};
```

## 5. Component Contract Example: Avatar Upload

This illustrates how the frontend pieces fit together, utilizing the structured services and hooks.

```tsx
// src/components/AvatarUploader.tsx
import React, { useState } from 'react';
import { uploadFile } from '../services/minioService';
import { StoredObject } from '../types/api';

type AvatarUploaderProps = {
    userId: string;
    onAvatarUpdated: (newAvatar: StoredObject) => void;
};

const AvatarUploader: React.FC<AvatarUploaderProps> = ({ userId, onAvatarUpdated }) => {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0]);
            setError(null);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedFile) return;

        setIsLoading(true);
        setError(null);
        
        try {
            // 1. Call the MinIO service abstraction layer
            const newObject = await uploadFile(selectedFile, 'user-avatars');
            
            // 2. Update local state and trigger parent component update
            onAvatarUpdated(newObject);

        } catch (err) {
            console.error("Upload failed:", err);
            setError("Failed to upload avatar. Please check permissions.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <input 
                type="file" 
                onChange={handleFileChange} 
                disabled={isLoading} 
            />
            <button type="submit" disabled={isLoading || !selectedFile}>
                {isLoading ? 'Uploading...' : 'Save Avatar'}
            </button>
            {error && <p style={{ color: 'red' }}>{error}</p>}
        </form>
    );
};
```

***

*this content was created by AI, but the coding and underlying logic are not.*