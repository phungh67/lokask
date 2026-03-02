export type ServiceType = "chat_only" | "video_call" | "voice_call" | "itinerary_review";
export type BookingStatus = "pending" | "confirmed" | "completed" | "cancelled";

export interface Booking {
  id: string;
  consultant_id: string;
  user_id: string;
  
  // Time slots (coming from PostgreSQL as ISO strings)
  start_time: string;
  end_time: string;
  
  // Management
  service_type: ServiceType;
  status: BookingStatus;
  total_price: number;
  user_notes: string;
  
  created_at: string;
  updated_at: string;

  // View fields joined from the database
  traveller_name?: string;
  traveller_avatar?: string;
  traveller_location?: string;
  consultant_name?: string;
  consultant_avatar?: string;
  consultant_city?: string;
}

export interface CreateBookingRequest {
  consultant_id: string;
  start_time: string; // Must be sent as an ISO string
  service_type: string;
  user_notes: string;
  total_price: number;
}