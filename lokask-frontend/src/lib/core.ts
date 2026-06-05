// the core API for front-end logic

export const BASE_URL = "/api/v1";

export class ApiError extends Error {
    constructor(public status: number, message: string) {
        super(message);
        this.name = "ApiError";
    }
}

// fetch JSON
export async function fetchJson<T>(endpoint: string, options?: RequestInit): Promise<T> {
    // get the token in the localstorage first
    const token = localStorage.getItem("token");

    // in upload media case
    const isFormData = options?.body instanceof FormData;

    const headers: HeadersInit = {
        ...(isFormData ? {} : { "Content-Type": "application/json" }),
        ...options?.headers,
    };

    if (token) {
        (headers as any)["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch(`${BASE_URL}${endpoint}`, { ...options, headers });

    if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw errorData || new ApiError(res.status, `API Error: ${res.statusText}`);
    }

    return res.json();
}