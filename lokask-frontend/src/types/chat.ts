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
  // backend properties, must have
  id: string | number;
  conversation_id: string;
  sender_id: string;
  content: string;
  is_read: boolean;
  created_at: string;

  // heleper for front end display (chat, booking, etc,...)
  sender?: "user" | "consultant" | "traveler";
  timestamp?: Date;

  // other contents (avatar, address,...)
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