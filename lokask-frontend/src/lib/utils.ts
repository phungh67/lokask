import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getBucketImageUrl(key: string): string {
  if (!key) return "https://placehold.co/800x1000";

  if (key.startsWith("http")) return key;

  const cleanKey = key.startsWith("/") ? key.slice(1) : key;
  return `/api/v1/media/${cleanKey}`;
}