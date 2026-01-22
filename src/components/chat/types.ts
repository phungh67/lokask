export type MessageType = "text" | "image" | "map";

export interface ChatMessage {
  id: string;
  type: MessageType;
  content: string;
  imageUrl?: string;
  mapData?: {
    name: string;
    address: string;
    thumbnailUrl: string;
    mapsUrl: string;
  };
  sender: "user" | "consultant";
  timestamp: Date;
}

export interface ConversationSummary {
  preferences: string[];
  placesmentioned: string[];
  decisions: string[];
  nextSteps: string[];
}
