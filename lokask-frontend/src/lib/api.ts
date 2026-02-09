import { Consultant } from "@/types/consultant";

// configure so that the port here should matched with
// API port and API definition in main.go 
const BASE_URL = "http://localhost:8080/api/v1";

export class ApiError extends Error {
    constructor(public status: number, message: string) {
        super(message);
        this.name = "ApiError";
    }
}

async function fetchJson<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...options?.headers,
        },
    });

    if (!res.ok) {
        throw new ApiError(res.status, `API Error: ${res.statusText}`);
    }

    return res.json();
}

// endpoint for fetching the consultant
export async function getConsultants(filters?: { city?: string, country?: string, }): Promise<Consultant[]> {
    const params = new URLSearchParams();
    if (filters?.city) params.append("city", filters.city);
    if (filters?.country) params.append("country", filters.country);

    // returned result
    const data = await fetchJson<Consultant[]>(`/consultants?${params.toString()}`);

    // data transform step(s)
    return data.map((c) => ({
        ...c,
        tags: c.tags || [],
        tag: c.tag && c.tags.length > 0 ? c.tags[0] : "Local",
        // safety check to ensure these number data is
        // actual "numberical"
        rating: Number(c.rating) || 0,
        helpedCount: Number(c.helpedCount) || 0,
    }))
}

// function to get a specific consultant by 
// looking in the consultant id
export async function getConsultantById(id:string): Promise<Consultant>{
    const data = await fetchJson<Consultant>(`/consultants/${id}`);
    return {
        ...data,
        tags: data.tags || [],
        tag: data.tags && data.tags.length > 0 ? data.tags[0]: "Local",
    };
}