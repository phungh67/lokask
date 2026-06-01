import { fetchJson } from "./core";
import { Consultant } from "@/types/consultant";

// interface to apply filter in search nav bar
interface ConsultantFilters {
    city?: string;
    country?: string;
    niche?: string;
    page?: number;
    limit?: number
}

// for dynamicall page number
export interface PaginatedConsultants {
    data: Consultant[];
    total_count: number;
    page: number;
    limit: number;
}

// niches for any consultant
// get niches (tags)
export interface Niche {
    id: number;
    slug: string;
    display_name: string; // matches Go JSON tag "display_name"
}

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

// Helper to generate a placeholder if the avatar is missing
const getAvatar = (url: string, name: string) => {
    if (url && url.trim() !== "") return url;
    // return a pre generated answer 
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name || "User")}&background=random&color=fff`;
};

// return /consultant/uuid (with respective filter options)
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

export async function getConsultantById(id: string): Promise<Consultant> {
    const data = await fetchJson<any>(`/consultants/${id}`);
    // Apply the exact same transformation logic
    return mapConsultant(data);
}

// Assumes endpoint is /api/v1/niches
export async function getNiches(): Promise<Niche[]> {
    const data = await fetchJson<Niche[]>("/niches");
    return data || [];
}

// upload media function
export async function uploadConsultantMedia(file: File, type: "cover" | "gallery") {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", type);

    return fetchJson<any>("/consultant/media", {
        method: "POST",
        body: formData,
    });
}
