export interface Consultant {
  id: string;
  name: string;
  city: string;
  country: string;
  tag: string;           // Used in the compact card
  tags: string[];        // Used in the main card
  quote: string;
  rating: number;
  helpedCount: number;
  avatarUrl: string;
  coverUrl: string;
  
  // Optional fields (matching the ? in your interface)
  isHighlyTrusted?: boolean;
  bio?: string;
  languages?: string[];
  responseTime?: string;
  isOnline?: boolean;
  galleryImages?: string[]; // Matches the gallery images field
}