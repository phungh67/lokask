import { Consultant } from "@/types/consultant";
import { Booking } from "@/types/booking";
import { CreateBookingRequest } from "@/types/booking";

// configure so that the port here should matched with
// API port and API definition in main.go 
const BASE_URL = "/api/v1";

export class ApiError extends Error {
    constructor(public status: number, message: string) {
        super(message);
        this.name = "ApiError";
    }
}

async function fetchJson<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const token = localStorage.getItem("token");

    const headers: HeadersInit = {
        "Content-Type": "application/json",
        ...options?.headers,
    };

    if (token) {
        (headers as any)["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch(`${BASE_URL}${endpoint}`, {
        ...options,
        headers,
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
    niche?: string;
    page?: number;
    limit?: number
}

// Helper to generate a placeholder if the avatar is missing
const getAvatar = (url: string, name: string) => {
    if (url && url.trim() !== "") return url;
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name || "User")}&background=random&color=fff`;
};

// prototype for an unified form of returned object
const mapConsultant = (c: any): Consultant => ({
    ...c,
    id: c.id,
    name: c.full_name || c.name || "User",
    displayName: c.display_name || c.full_name || c.name || "User",
    city: c.city_name || c.city || "",
    country: c.country_code || c.country || "",
    // Ensure both snake_case and camelCase fallbacks
    coverUrl: c.cover_url || c.coverUrl || "",
    avatarUrl: getAvatar(c.avatar_url || c.avatarUrl, c.full_name || c.name),

    rating: Number(c.rating_avg) || Number(c.rating) || 0,
    helpedCount: Number(c.helped_count) || Number(c.helpedCount) || 0,
    hourlyRate: Number(c.hourly_rate) || Number(c.hourlyRate) || 0,

    tags: c.tags || [],
    tag: c.tags && c.tags.length > 0 ? c.tags[0] : "Local",
    bio: c.bio || "",
    quote: c.quote || "",
    languages: c.languages || ["English"],
    responseTime: c.response_time || c.responseTime || "1 hour",
    isOnline: c.is_online ?? false,
    badges: c.badges ? c.badges.map((b: any) => ({
        id: b.id,
        icon_name: b.icon_name || b.iconName,
        title: b.title,
        description: b.description
    })) : [],
    galleryImages: c.gallery_images || []
});

// endpoint for fetching the consultant
// export async function getConsultants(filters?: {
//     page?: number; city?: string, country?: string,
// }): Promise<Consultant[]> {
//     const params = new URLSearchParams();
//     if (filters?.city) params.append("city", filters.city);
//     if (filters?.country) params.append("country", filters.country);

//     // limit page
//     if (filters?.page) params.append("page", filters.page.toString());

//     // returned result
//     const data = await fetchJson<Consultant[]>(`/consultants?${params.toString()}`);

//     // data transform step(s)
//     return data.map((c: any) => ({
//         ...c,

//         name: c.full_name || c.name,
//         displayName: c.display_name || c.full_name,
//         city: c.city_name || c.city,
//         country: c.country_code || c.country || "",
//         coverUrl: c.cover_url || c.coverUrl || "",

//         avatarUrl: getAvatar(c.avatar_url || c.avatarUrl, c.full_name),

//         rating: Number(c.rating_avg) || Number(c.rating) || 0,
//         helpedCount: Number(c.helped_count) || Number(c.helpedCount) || 0,
//         hourlyRate: Number(c.hourly_rate) || Number(c.hourlyRate) || 0,

//         tags: c.tags || [],
//         tag: c.tags && c.tags.length > 0 ? c.tags[0] : "Local",
//     }));
// }

export async function getConsultants(filters?: {
    page?: number;
    city?: string;
    country?: string;
    niche?: string;
    limit?: number;
}): Promise<PaginatedConsultants> {
    const params = new URLSearchParams();
    if (filters?.city) params.append("city", filters.city);
    if (filters?.country) params.append("country", filters.country);
    if (filters?.niche) params.append("niche", filters.niche);
    if (filters?.page) params.append("page", filters.page.toString());
    if (filters?.limit) params.append("limit", filters.limit.toString());

    const response = await fetchJson<any>("/consultants?" + params.toString());

    return {
        data: (response.data || []).map(mapConsultant),
        total_count: response.total_count || 0,
        page: response.page || filters?.page || 1,
        limit: response.limit || 12
    };
}

// function to get a specific consultant by 
// looking in the consultant id
// export async function getConsultantById(id: string): Promise<Consultant> {
//     const c = await fetchJson<any>(`/consultants/${id}`);
//     return {
//         id: c.id,
//         name: c.full_name,
//         displayName: c.display_name || c.full_name,
//         avatarUrl: c.avatar_url,
//         coverUrl: c.cover_url || "", // 🟢 Added
//         city: c.city_name,
//         country: c.country_code || "",
//         bio: c.bio || "",
//         quote: c.quote || "",
//         tags: c.tags || [],
//         tag: c.tags && c.tags.length > 0 ? c.tags[0] : "Local",
//         rating: Number(c.rating_avg) || 0,
//         helpedCount: Number(c.helped_count) || 0,
//     };
// }

export async function getConsultantById(id: string): Promise<Consultant> {
    const data = await fetchJson<any>(`/consultants/${id}`);
    // Apply the exact same transformation logic
    return mapConsultant(data);
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
        consultant_id?: string;
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

// getme 
export async function getMe() {
    return fetchJson<any>("/auth/me");
}

// begin development for chat function
// ----- chat function -----

// data type

export interface ChatMessage {
    id: number,
    conversation_id: string,
    sender_id: string, // mapped with DB uuid
    content: string,
    is_read: boolean,
    created_at: string, // mapped with DB timestamp

    // helper, for future development
    type?: "text" | "image" | "map";
    imageUrl?: string;
}

export interface Conversation {
    id: string,
    traveler_id: string,
    consultant_id: string,
    last_message?: string;
    last_message_at?: String
}

// API call

// begin conversations
// POST /api/v1/conversations
export async function startChat(consultantId: string): Promise<Conversation> {
    return fetchJson<Conversation>("/conversations", {
        method: "POST",
        body: JSON.stringify({ consultant_id: consultantId })
    })
}

// get message from a specific conversation
// GET /api/v1/conversations/:id/messages
export async function getChatHistory(conversationId: string): Promise<ChatMessage[]> {
    return fetchJson<ChatMessage[]>(`/conversations/${conversationId}/messages`);
}

// send a message
// POST /api/v1/conversations/:id/messages
export async function sendMessage(conversationId: string, content: string): Promise<ChatMessage> {
    return fetchJson<ChatMessage>(`/conversations/${conversationId}/messages`, {
        method: "POST",
        body: JSON.stringify({ content }),
    });
}

// get inbox
export async function getInbox(): Promise<Conversation[]> {
    return fetchJson<Conversation[]>("/conversations");
}

// for dynamicall page number
export interface PaginatedConsultants {
    data: Consultant[];
    total_count: number;
    page: number;
    limit: number;
}

// booking
/**
 * Fetch bookings for a consultant's dashboard
 */
export async function createBooking(data: CreateBookingRequest) {
    return fetchJson<Booking>("/bookings", {
        method: "POST",
        body: JSON.stringify(data),
    });
}

/**
 * 2. View my trips (Traveller Dashboard)
 * Matches: protected.Get("/bookings/my-trips", bookHandler.GetUserTrips)
 */
export async function getMyTrips(userId: string) {
    return fetchJson<Booking[]>("/bookings/my-trips");
}

/**
 * 3. View consultant schedule (Consultant Dashboard)
 * Matches: protected.Get("/bookings/consultant/:id", bookHandler.GetMySchedule)
 */
export async function getConsultantBookings(consultantId: string) {
    return fetchJson<Booking[]>(`/bookings/consultant/${consultantId}`);
}

/**
 * 3.5. Public function to view consultant schedule (User dashboard)
 * Does not require authentication, only show official bookings (i.e. confirmed)
 */
export async function getPublicConsultantBookings(consultantId: string){
    return fetchJson<Booking[]>(`/public/${consultantId}`);
}

/**
 * 4. Update booking status (Confirm/Cancel)
 * Matches: protected.Patch("/bookings/:id/status", bookHandler.UpdateStatus)
 */
export async function updateBookingStatus(id: string, status: "confirmed" | "cancelled") {
    return fetchJson<Booking>(`/bookings/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
    });
}

/**
 * 5. Delete a booking entirely
 * Matches: protected.Delete("/bookings/:id", bookHandler.DeleteBooking)
 */
export async function deleteBooking(id: string) {
    return fetchJson(`/bookings/${id}`, {
        method: "DELETE",
    });
}

/**
 * User profile
 * 
 */

export interface CityOption {
    id: number;
    name: string;
    country: string;
}

// API call
export async function getCities(): Promise<CityOption[]> {
    const data = await fetchJson<CityOption[]>("/cities");
    return data || [];
}

// user's profile modification
export async function uploadAvatar(file: File){
    const formData = new FormData();
    formData.append("avatar", file);

    const token = localStorage.getItem("token")

    const res = await fetch("/api/v1/users/avatar", {
        method: "POST",
        headers: token ? {"Authorization": `Bearer ${token}`} : {},
        body: formData,
    });

    if (!res.ok) throw new Error ("Avatar upload failed");
    return res.json();
}

// consultant's cover and gallery upload
export const uploadConsultantMedia = async (file: File, type: "cover" | "gallery") => {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("No authentication token found");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", type);

    const response = await fetch("api/v1/consultant/media", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${token}`
        },
        body: formData,
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to upload media");
    }

    return response.json();
}