import { fetchJson } from "./core";

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
export async function uploadAvatar(file: File) {
    const formData = new FormData();
    formData.append("avatar", file);

    return fetchJson<any>("/users/avatar", {
        method: "POST",
        body: formData,
    });
}