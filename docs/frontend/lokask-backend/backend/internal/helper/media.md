[⬅ Return to Main Compendium](../../../../../../README.md)

As a Senior Frontend Officer specializing in TypeScript and Vite architecture, I recognize that the provided Go package defines critical **backend service logic** for constructing canonical media URLs based on deployment environments (Development, Production/S3, MinIO).

Since the frontend client (built with Vite/TS) should ideally consume a standardized API endpoint for this function, the UI logic should not replicate the internal Go environment variable fetching. Instead, we must create a highly typed, composable **Service Utility** that wraps this logic, making it accessible and resilient on the client side.

Here is the documentation detailing the intended architecture, component usage, and state handling for consuming this media URL service.

***

## 📐 Media URL Service Documentation

### 📁 Architecture Overview: The `MediaService` Utility

This functionality should be encapsulated into a dedicated utility file, preventing scattering of complex environment-dependent logic across various components. We will define a `MediaService` module that handles the core logic and exports a strongly typed function.

**Location:** `src/utils/api/mediaService.ts`

**Goal:** To provide a single, predictable, and type-safe entry point for generating full media URLs from a relative key, abstracting away the environmental complexity (S3, MinIO, etc.).

### 💡 Type Definition (TypeScript)

We define clear types for inputs and potential error states.

```typescript
/**
 * Defines the expected structure of the media key.
 */
export type MediaKey = string;

/**
 * Defines the structure for the result, ensuring type safety.
 */
export interface MediaResult {
  url: string;
  success: true;
}

/**
 * Defines the error structure for failure states.
 */
export interface MediaError {
  message: string;
  code: string;
}
```

### 🛠 Service Implementation (TypeScript Logic)

The `getMediaUrl` function will mimic the *behavior* of the Go function, but assuming that environment variables (`DEPLOYMENT_MODE`, `AWS_S3_MEDIA_BUCKET`, etc.) are available via a client-side environment configuration mechanism (e.g., Vite's `import.meta.env`).

```typescript
// src/utils/api/mediaService.ts

import { MediaKey, MediaResult, MediaError } from '../types/media';

// NOTE: In a real Vite app, these variables are accessed via import.meta.env
// We simulate the environment logic here.
const getEnv = (key: string): string | undefined => {
  return (typeof import.meta.env).get(key) as string | undefined;
};


/**
 * Constructs the full media URL from a relative key based on the current deployment environment.
 * @param key The relative key path of the media file.
 * @returns A MediaResult object containing the final URL or an error.
 */
export const getMediaUrl = (key: MediaKey): { type: 'success' | 'error', data: MediaResult | MediaError } => {
    if (!key || key.startsWith("http")) {
        return { type: 'success', data: { url: key, success: true } };
    }

    const mode: 'dev' | 'prod' = getEnv('VITE_DEPLOYMENT_MODE') || 'dev';

    try {
        if (mode === 'prod') {
            // --- Production (AWS S3) Logic ---
            const cdnBase = getEnv('VITE_AWS_S3_MEDIA_BUCKET');
            if (!cdnBase) {
                return { type: 'error', data: { message: "S3 Bucket not configured for production.", code: "ENV_MISSING_S3" } };
            }
            const region = getEnv('VITE_AWS_DEFAULT_REGION') || "eu-north-1";
            const url = `https://${cdnBase}.s3.${region}.amazonaws.com/${key}`;
            return { type: 'success', data: { url: url, success: true } };

        } else {
            // --- Development / MinIO Logic ---
            const minioBase = getEnv('VITE_MINIO_PUBLIC_URL') || "http://localhost:9000";
            const minioBucket = getEnv('VITE_MINIO_MEDIA_BUCKET') || "lokask-media";

            // Clean up trailing slashes for reliable URL construction
            const cleanMinioBase = minioBase.replace(/\/$/, "");
            const url = `${cleanMinioBase}/${minioBucket}/${key}`;
            return { type: 'success', data: { url: url, success: true } };
        }
    } catch (error) {
        console.error("Failed to build media URL:", error);
        return { type: 'error', data: { message: "An unexpected error occurred while building the URL.", code: "UNKNOWN_ERROR" } };
    }
};
```

### 🧩 Component Architecture & Consumption

The consuming component (e.g., `MediaImageComponent.tsx`) should interact with this service within a custom hook or a dedicated function call, ensuring that the UI reacts appropriately to the success or failure of the URL generation.

#### 1. Custom Hook Recommendation (`useMediaUrl`):

Using a custom hook abstracts the calling logic and manages the state derived from the service call, which is cleaner than passing the utility function directly into the JSX.

```typescript
// src/hooks/useMediaUrl.ts
import { MediaKey } from '../utils/api/mediaService';

/**
 * Custom hook to safely retrieve and manage media URL states.
 * @param key The media key.
 * @returns { url, isLoading, error }
 */
export const useMediaUrl = (key: MediaKey) => {
    const [resultState, setResultState] = React.useState<{ url: string | null, error: string | null, isLoading: boolean }>({
        url: null,
        error: null,
        isLoading: true
    });

    React.useEffect(() => {
        setResultState(s => ({ ...s, isLoading: true, error: null }));

        // Simulate API call delay if this were a remote service
        setTimeout(() => {
            const serviceResult = getMediaUrl(key);

            if (serviceResult.type === 'success') {
                setResultState({
                    url: serviceResult.data.url,
                    error: null,
                    isLoading: false
                });
            } else {
                setResultState({
                    url: null,
                    error: serviceResult.data.message,
                    isLoading: false
                });
            }
        }, 50); // Minor delay for demonstration

    }, [key]);

    return resultState;
};
```

#### 2. Component Usage (`MediaImageComponent.tsx`):

The component is now purely focused on presentation and consuming the hook's derived state.

```tsx
// src/components/MediaImageComponent.tsx
import React from 'react';
import { useMediaUrl } from '../hooks/useMediaUrl';

interface MediaImageProps {
    mediaKey: string; // Prop passed down, e.g., "images/profile/user123.jpg"
}

const MediaImageComponent: React.FC<MediaImageProps> = ({ mediaKey }) => {
    // 1. Use the custom hook to manage the complexity
    const { url, error, isLoading } = useMediaUrl(mediaKey);

    // 2. Handle Loading State
    if (isLoading) {
        return <div>Loading media asset...</div>;
    }

    // 3. Handle Error State (UI Feedback)
    if (error) {
        return <div className="media-error">Error loading media: {error}</div>;
    }

    // 4. Render Final Asset (Success)
    return (
        <img 
            src={url} 
            alt="Media Asset" 
            className="media-asset" 
            onError={(e) => {
                // Robustness check: If the URL is generated correctly but the asset fails to load,
                // we can log the failure or display a placeholder.
                console.error("Image failed to load from the generated URL:", url);
                e.currentTarget.onerror = null; // Prevent loop
                e.currentTarget.style.display = 'none';
                alert("Placeholder image used.");
            }}
        />
    );
};

export default MediaImageComponent;
```

### 🚀 Summary of Architectural Improvements

| Aspect | Old Approach (Conceptual) | New Approach (TS/Vite) | Benefit |
| :--- | :--- | :--- | :--- |
| **Logic Flow** | Scattered utility calls across components. | Centralized `MediaService` and `useMediaUrl` hook. | High Cohesion, Low Coupling. |
| **State Management** | None (Requires manual loading/error checks). | Built-in `isLoading`, `error`, and `url` state via the hook. | Predictive UI behavior, prevents race conditions. |
| **Typing** | Implicit string handling. | Explicit `MediaKey`, `MediaResult`, `MediaError` types. | Zero runtime type errors, improved developer experience (DX). |
| **Scalability** | Difficult to add new deployment modes. | Easily extend the `getMediaUrl` switch/conditional block. | Maintainability and testability. |

***
*this content was created by AI, but the coding and underlying logic are not.*