import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getBucketImageUrl(path: string): string {
  if (!path) return "https://placehold.co/800x1000";

  if (path.startsWith("http")) return path;

  const cleanPath = path.startsWith("/") ? path.slice(1) : path;
  return `/api/v1/media/${cleanPath}`;
}