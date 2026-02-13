export interface Badge {
  id: string;
  icon_name: string; // Matches Go JSON tag if using snake_case, or IconName
  title: string;
  description: string;
}

export interface Consultant {
  id: string;
  name: string; // full name
  displayName: string; // display name
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
  badges?: Badge [];
}