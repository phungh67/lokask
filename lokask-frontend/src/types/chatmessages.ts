export interface ChatMessage {
  id: string;
  content: string;
  sender: "user" | "consultant" | "traveler"; // Updated to match your Dashboard logic
  timestamp: Date;
  type?: "text" | "image" | "map";
  imageUrl?: string;
  mapData?: {
    name: string;
    address: string;
    thumbnailUrl: string;
    mapsUrl: string;
  };
}