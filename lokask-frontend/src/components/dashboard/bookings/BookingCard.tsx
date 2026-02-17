// BookingCard.tsx
import React from "react";
import { format, formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Video, Phone, MessageSquare, FileText } from "lucide-react";
import { Booking } from "@/types/booking";

// Define labels locally matching your service_type enum
const serviceTypeLabels: Record<Booking["service_type"], string> = {
  chat_only: "Chat",
  video_call: "Video Call",
  voice_call: "Voice Call",
  itinerary_review: "Itinerary Review",
};

const serviceIcons: Record<Booking["service_type"], React.ReactNode> = {
  chat_only: <MessageSquare className="h-3 w-3" />,
  video_call: <Video className="h-3 w-3" />,
  voice_call: <Phone className="h-3 w-3" />,
  itinerary_review: <FileText className="h-3 w-3" />,
};

interface BookingCardProps {
  booking: Booking;
  isSelected?: boolean; // Made optional for generic lists
  onClick?: () => void;
}

const BookingCard = ({ booking, isSelected, onClick }: BookingCardProps) => {
  return (
    <div
      onClick={onClick}
      className={cn(
        "p-3 rounded-xl cursor-pointer transition-all border mb-2", // 🟢 Added margin bottom
        isSelected
          ? "bg-primary/10 border-primary/30 shadow-sm"
          : "bg-card border-transparent hover:bg-secondary/50 hover:border-border"
      )}
    >
      <div className="flex gap-3 items-start"> {/* 🟢 Ensure items-start for top alignment */}
        <img
          src={booking.traveller_avatar || `https://ui-avatars.com/api/?name=${booking.traveller_name}`}
          className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
          alt=""
        />

        <div className="flex-1 min-w-0"> {/* 🟢 min-w-0 is CRITICAL to prevent text overflow */}
          <div className="flex justify-between items-start gap-2">
            <p className="font-semibold truncate text-sm">{booking.traveller_name}</p>
            {/* 🟢 Move the relative time here if needed to save vertical space */}
          </div>
          
          <div className="flex items-center gap-1 mt-0.5">
             <span className="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0" />
             <p className="text-[11px] text-muted-foreground truncate">{booking.consultant_city}</p>
          </div>

          <div className="flex items-center gap-2 mt-2">
            <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 capitalize">
              {booking.status}
            </Badge>
            <span className="text-[10px] text-muted-foreground">
              {formatDistanceToNow(new Date(booking.created_at), { addSuffix: true })}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingCard;