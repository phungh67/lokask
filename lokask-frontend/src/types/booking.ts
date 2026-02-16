export interface Booking {
  id: string;
  consultant_id: string;
  user_id: string;
  start_time: string; // ISO 8601 string from Go time.Time
  end_time: string;   // ISO 8601 string from Go time.Time
  status: "pending" | "confirmed" | "completed" | "cancelled";
  service_type: "chat_only" | "video_call" | "voice_call" | "itinerary_review";
  total_price: number;
  user_notes: string;
  created_at: string;
  updated_at: string;

  // Joined fields from backend
  traveller_name: string;
  traveller_avatar: string;
  consultant_city: string;
}

export interface CreateBookingRequest {
  consultant_id: string;
  start_time: string;
  service_type: string;
  user_notes?: string;
}