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

// using filter logic
interface ConsultantFilters {
    city?: string;
    country?: string;
    page?: number;
}

// endpoint for fetching the consultant
export async function getConsultants(filters?: {
    page?: number; city?: string, country?: string,
}): Promise<Consultant[]> {
    const params = new URLSearchParams();
    if (filters?.city) params.append("city", filters.city);
    if (filters?.country) params.append("country", filters.country);

    // limit page
    if (filters?.page) params.append("page", filters.page.toString());

    // returned result
    const data = await fetchJson<Consultant[]>(`/consultants?${params.toString()}`);

    // data transform step(s)
    return data.map((c: any) => ({
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
export async function getConsultantById(id: string): Promise<Consultant> {
    const data = await fetchJson<Consultant>(`/consultants/${id}`);
    return {
        ...data,
        tags: data.tags || [],
        tag: data.tags && data.tags.length > 0 ? data.tags[0] : "Local",
    };
}

// get niches (tags)
export interface Niche {
    id: number;
    slug: string;
    display_name: string; // matches Go JSON tag "display_name"
}

export async function getNiches(): Promise<Niche[]> {
    const data = await fetchJson<Niche[]>("/niches"); // Assumes endpoint is /api/v1/niches
    return data || [];
}

// Request Types
export interface RegisterData {
    fullName: string;
    email: string;
    password: string;
}

export interface RegisterConsultantData extends RegisterData {
    city: string; // "Tokyo", "Paris", etc.
}

export interface LoginData {
    email: string;
    password: string;
}

export interface AuthResponse {
    token: string;
    user: {
        id: string;
        full_name: string;
        email: string;
        avatar_url: string;
        role: "traveller" | "consultant";
    };
}

// --- Auth Functions ---


// POST /api/v1/auth/register
export async function registerTraveller(data: RegisterData) {
    return fetchJson<AuthResponse>("/auth/register", {
        method: "POST",
        body: JSON.stringify({
            full_name: data.fullName, // Match Go struct json:"full_name"
            email: data.email,
            password: data.password,
            role: "traveler"          // 🟢 Backend uses this to decide
        }),
    });
}

// POST /api/v1/auth/register
export async function registerConsultant(data: RegisterConsultantData) {
    return fetchJson<AuthResponse>("/auth/register", {
        method: "POST",
        body: JSON.stringify({
            full_name: data.fullName,
            email: data.email,
            password: data.password,
            city: data.city,         // 🟢 Backend looks up City ID from this Name
            role: "consultant"       // 🟢 Triggers consultant creation logic
        }),
    });
}

// 3. Login
// POST /api/v1/auth/login
export async function login(data: LoginData) {
    return fetchJson<AuthResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify(data),
    });
}