import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getBucketImageUrl(path: string): string {
  if (!path) return "https://placehold.co/800x1000";
  
  if (path.startsWith("http")) return path; 
  
  const bucketUrl = import.meta.env.VITE_BUCKET_URL || "https://deun1-general-purpose-bucket.s3.eu-north-1.amazonaws.com";
  
  const cleanBucketUrl = bucketUrl.endsWith("/") ? bucketUrl : `${bucketUrl}/`;
  const cleanPath = path.startsWith("/") ? path.slice(1) : path;
  
  return `${cleanBucketUrl}${cleanPath}`;
}