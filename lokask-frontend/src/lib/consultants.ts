import { fetchJson } from "./core";
import { Consultant, Badge, Review, UpdateProfileRequest } from "@/types/consultant";
import { Blog } from "@/types/blog";

// interface to apply filter in search nav bar
interface ConsultantFilters {
    page?: number;
    limit?: number;
    city?: string;
    niche?: string[];
    languages?: string[];
    maxPrice?: number;
    minRating?: number;
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
export const mapConsultant = (c: any): Consultant => ({
    id: String(c.id),
    userId: String(c.userId) || String(c.user_id),
    name: c.full_name || c.name || "User",
    displayName: c.display_name || c.full_name || c.name || "User",
    city: c.city_name || c.city || "",
    country: c.country_code || c.country || "",

    tag: c.tags && c.tags.length > 0 ? c.tags[0] : "Local",
    tags: Array.isArray(c.tags) ? c.tags : [],

    quote: c.quote || "",


    rating: Number(c.rating_avg) || Number(c.rating) || 0,
    helpedCount: Number(c.helped_count) || Number(c.helpedCount) || 0,


    avatarUrl: getAvatar(c.avatar_url || c.avatarUrl, c.full_name || c.name),
    coverUrl: c.cover_url || c.coverUrl || "",

    isHighlyTrusted: Boolean(c.is_highly_trusted || c.isHighlyTrusted),
    bio: c.bio || "",
    languages: Array.isArray(c.languages) ? c.languages : ["English"],
    responseTime: c.response_time || c.responseTime || "1 hour",
    isOnline: Boolean(c.is_online || c.isOnline),
    galleryImages: Array.isArray(c.gallery_images) ? c.gallery_images : [],

    badges: Array.isArray(c.badges) ? c.badges.map((b: any): Badge => ({
        id: String(b.id),
        icon_name: b.icon_name || b.iconName || "", // Ensure camelCase output
        title: b.title || "",
        description: b.description || ""
    })) : [],

    reviews: Array.isArray(c.reviews) ? c.reviews.map((r: any): Review => ({
        id: String(r.id),
        review_name: r.review_name || r.author_name || "Anonymous",
        review_avatar: r.review_avatar || r.avatar_url || getAvatar("", "Anonymous"),
        rating: Number(r.rating) || 5,
        comment: r.comment || r.content || "",
        verified_stay: Boolean(r.verified_stay),
        date: r.date || r.created_at || new Date().toISOString()
    })) : []
});

// Helper to generate a placeholder if the avatar is missing
const getAvatar = (url: string, name: string) => {
    if (url && url.trim() !== "") return url;
    // return a pre generated answer 
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name || "User")}&background=random&color=fff`;
};

// return /consultant/uuid (with respective filter options)
export async function getConsultants(filters?: ConsultantFilters): Promise<PaginatedConsultants> {
    const params = new URLSearchParams();
    if (filters?.city) params.append("city", filters.city);
    if (filters?.niche?.length) params.append("niche", filters.niche.join(","));
    if (filters?.languages?.length) params.append("languages", filters.languages.join(","));
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
    return mapConsultant(data);
}

export async function getNiches(): Promise<Niche[]> {
    const data = await fetchJson<Niche[]>("/niches");
    return data || [];
}

export async function getLanguages(): Promise<string[]> {
    return fetchJson<string[]>("/languages"); 
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

export async function deleteConsultantMedia(imageUrl: string) {
    return fetchJson<any>("/consultant/media", {
        method: "DELETE",
        body: JSON.stringify({ image_url: imageUrl }),
    });
}

export async function updateConsultantProfile(data: Partial<UpdateProfileRequest>){
    return fetchJson<any>("/updateprofile", {
        method: "PATCH",
        body:JSON.stringify(data)
    })
}

// blog section

// Create a new blog post
export async function createBlog(data: {
  title: string;
  summary: string;
  content: string;
  city: string;
  country: string;
  coverImage?: File;
}) {
  const formData = new FormData();
  formData.append("title", data.title);
  formData.append("summary", data.summary);
  formData.append("content", data.content);
  formData.append("city", data.city);
  formData.append("country", data.country);
  
  if (data.coverImage) {
    formData.append("cover_image", data.coverImage);
  }

  // Assuming your custom fetch wrapper from core.ts handles FormData correctly
  // (which we verified earlier that it does!)
  return fetchJson<any>("/blogs", {
    method: "POST",
    body: formData,
  });
}

export async function getConsultantBlogs(authorId: string) {
    return fetchJson<Blog[]>(`/blogs?author_id=${authorId}&limit=4`);
}