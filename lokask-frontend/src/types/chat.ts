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