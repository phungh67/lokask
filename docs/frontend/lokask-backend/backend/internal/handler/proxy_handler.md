[⬅ Return to Main Compendium](../../../../../../README.md)

## 💻 Frontend Architecture & API Consumption Documentation

**Component:** `ImageProxyComponent`
**Module:** `src/components/ImageProxyComponent/ImageProxyComponent.tsx`
**Language:** TypeScript (React/Vite)

As a senior frontend engineer, I treat this Go service (`handler/ProxyHandler`) as a stable, critical **Backend-for-Frontend (BFF)** endpoint. Our client-side logic must be highly robust to handle various network failures, CORS issues, and unexpected MIME types that the backend is designed to manage.

### 🧩 Component Architecture (`ImageProxyComponent`)

This component is responsible for fetching the source image URL from user input and displaying the resulting image asynchronously.

*   **Structure:** Self-contained functional component with local state management for URL input, loading status, and potential errors.
*   **Inputs:** Requires a controlled input element for the `imageUrl` query parameter.
*   **Outputs:** Displays a visual `<img>` element whose source is dynamically updated upon successful fetch.

### 💾 State Management (Local/Context)

We will use React's `useState` hooks for local state management, ensuring immutability and predictable rendering cycles.

| State Variable | Type | Initial Value | Purpose |
| :--- | :--- | :--- | :--- |
| `url` | `string` | `""` | Stores the URL provided by the user for proxying. |
| `imageUrl` | `string` | `""` | Stores the final proxied source URL (or a derived Base64 URI/Blob URL). |
| `isLoading` | `boolean` | `false` | Controls the visibility of the loading indicator. |
| `error` | `string \| null` | `null` | Captures and displays any network or API error messages. |

### 🚀 UI/Interaction Logic (TypeScript Implementation Details)

The core logic resides within an asynchronous handler function, `handleProxyImageFetch`.

**1. Endpoint Definition & Typing:**

We must rigorously type the API call to match the Go backend's expected behavior.

```typescript
// src/types/api.ts
export interface ProxyResult {
  ok: boolean;
  data: Blob | null; // We expect a Blob to handle the raw image data
  contentType: string;
  status: number;
}

// The API Base URL should be environment-dependent
const API_BASE_URL = import.meta.env.VITE_PROXY_API_ENDPOINT;
```

**2. The `handleProxyImageFetch` Logic Flow:**

```typescript
const handleProxyImageFetch = useCallback(async (inputUrl: string) => {
    // 1. Reset state and set loading
    setError(null);
    setImageUrl("");
    setIsLoading(true);

    if (!inputUrl) {
        setError("Please enter a URL.");
        setIsLoading(false);
        return;
    }

    try {
        // 2. Construct the full request URL with the query parameter
        const apiUrl = `${API_BASE_URL}?url=${encodeURIComponent(inputUrl)}`;

        // 3. Fetch the image data (The backend handles streaming, we handle the fetch result)
        const response = await fetch(apiUrl);

        if (!response.ok) {
            // Handle explicit HTTP status codes returned by the backend (400, 502, etc.)
            const errorText = await response.text();
            throw new Error(`Proxy Error ${response.status}: ${errorText || 'Unknown server error.'}`);
        }

        // 4. Determine the Blob and Content Type (Critical Step)
        // Although the Go handler sets headers, we must read the stream robustly.
        // We assume the Content-Type header is correctly set by the backend.
        const contentType = response.headers.get('Content-Type') || 'image/jpeg';
        const blob = await response.blob();

        // 5. Set the final state
        // We use a temporary URL to make the image source ready for the <img> tag.
        const blobUrl = URL.createObjectURL(blob);
        setImageUrl(blobUrl);
        
        console.log(`Successfully fetched image: ${contentType}`);

    } catch (e: any) {
        // 6. Error Handling
        console.error("Failed to fetch image:", e);
        setError(e.message || "An unexpected network error occurred.");
    } finally {
        // 7. Cleanup
        setIsLoading(false);
    }
}, []);
```

### 💡 Optimization & Best Practices

1.  **Client-Side Validation:** Implement basic Regex validation on the input field *before* calling the proxy endpoint to improve UX.
2.  **Cleanup:** Since `URL.createObjectURL()` is used, a `useEffect` hook should ensure `URL.revokeObjectURL(imageUrl)` runs on component unmount or successful refetch to prevent memory leaks.
3.  **Concurrency:** Since the backend is a synchronous GET request, `fetch` is sufficient. However, if we were to implement history prefetching, we would manage multiple concurrent state updates carefully using asynchronous queues.
4.  **Error Display:** Instead of just showing text, we should display the specific error code received from the backend (e.g., "Error 400: Missing URL query parameter") for better debugging and user feedback.

***
*this content was created by AI, but the coding and underlying logic are not.*