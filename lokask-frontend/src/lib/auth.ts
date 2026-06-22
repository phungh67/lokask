import { fetchJson } from "./core";

export interface RegisterData {
    fullName: string;
    email: string;
    password: string;
}

export interface RegisterConsultantData extends RegisterData {
    city_id: number; // "Tokyo", "Paris", etc.
}

export interface LoginData {
    email: string;
    password: string;
}

export interface RegisterResponse {
    message: string;
}

export interface AuthResponse {
    token: string;
    user: {
        id: string;
        consultant_id?: string;
        full_name: string;
        email: string;
        avatar_url: string;
        role: "traveler" | "consultant";
    };
}

// POST /api/v1/auth/register (Traveller)
export async function registerTraveller(data: RegisterData) {
    return fetchJson<RegisterResponse>("/auth/register", {
        method: "POST",
        body: JSON.stringify({
            full_name: data.fullName,
            email: data.email,
            password: data.password,
            role: "traveller"          
        }),
    });
}

// POST /api/v1/auth/register (Consultant)
export async function registerConsultant(data: RegisterConsultantData) {
    return fetchJson<RegisterResponse>("/auth/register", {
        method: "POST",
        body: JSON.stringify({
            full_name: data.fullName,
            email: data.email,
            password: data.password,
            city: data.city_id,       
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

// GET /api/v1/auth/me 
export async function getMe() {
    return fetchJson<AuthResponse>("/auth/me");
}