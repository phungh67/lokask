export interface ScheduledCall {
  id: string;
  conversationId: string;
  type: "video" | "voice";
  scheduledAt: Date;
  duration: number;
  status: "confirmed" | "pending" | "cancelled" | "completed";
  notes?: string;
  createdAt: Date;
}

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

// src/types/chat.ts

/**
 * Defines the AI-generated distillation of a conversation used across 
 * the dashboard and chat widgets.
 */
export interface ConversationSummary {
  /** Traveler preferences identified by AI (e.g., "likes local food"). */
  preferences: string[];

  /** Key locations mentioned during the chat. */
  placesmentioned: string[];

  /** Agreed-upon decisions or choices. */
  decisions: string[];

  /** Immediate follow-up items for either party. */
  nextSteps: string[];
}