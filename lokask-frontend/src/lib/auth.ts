// for authentication features
import { fetchJson } from "./core";

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

// response
export interface AuthResponse {
    token: string;
    user: {
        id: string;
        consultant_id?: string;
        full_name: string;
        email: string;
        avatar_url: string;
        role: "traveller" | "consultant";
    };
}

// POST /api/v1/auth/register
export async function registerTraveller(data: RegisterData) {
    return fetchJson<AuthResponse>("/auth/register", {
        method: "POST",
        body: JSON.stringify({
            full_name: data.fullName,
            email: data.email,
            password: data.password,
            role: "traveler"          
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
            city: data.city,       
            role: "consultant"       
        }),
    });
}

// POST /api/v1/auth/login
export async function login(data: LoginData) {
    return fetchJson<AuthResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify(data),
    });
}

// getme - keep session betweenb f5 or switch tabs
export async function getMe() {
    return fetchJson<any>("/auth/me");
}