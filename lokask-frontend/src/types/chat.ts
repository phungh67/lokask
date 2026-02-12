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