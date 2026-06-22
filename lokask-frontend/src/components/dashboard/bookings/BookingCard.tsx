import React from "react";
import { format, formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Video, Phone, MessageSquare, FileText } from "lucide-react";
import { Booking } from "@/types/booking";

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
  isSelected?: boolean;
  onClick?: () => void;
}

const BookingCard = ({ booking, isSelected, onClick }: BookingCardProps) => {
  const displayName =
    booking.traveller_name || booking.consultant_name || "User";
  const displayAvatar = booking.traveller_avatar || booking.consultant_avatar;

  return (
    <div
      onClick={onClick}
      className={cn(
        "p-3 rounded-xl cursor-pointer transition-all border mb-2",
        isSelected
          // 🟢 Changed from bg-primary/10 (peach) to a clean, neutral selection state
          ? "bg-muted border-border shadow-sm ring-1 ring-border"
          : "bg-card border-transparent hover:bg-secondary/30 hover:border-border",
      )}
    >
      <div className="flex gap-3 items-start">
        <img
          src={
            displayAvatar || `https://ui-avatars.com/api/?name=${displayName}`
          }
          className="w-10 h-10 rounded-lg object-cover flex-shrink-0 border border-border/50"
          alt=""
        />
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start gap-2">
            <p className="font-semibold truncate text-sm">{displayName}</p>
          </div>
          <div className="flex items-center gap-1 mt-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0" />
            <p className="text-[11px] text-muted-foreground truncate">
              {booking.consultant_city}
            </p>
          </div>
          <div className="flex items-center gap-2 mt-2">
            {/* 🟢 Updated badge colors based on status for better visual scanning */}
            <Badge
              variant="outline"
              className={cn(
                "text-[10px] px-1.5 py-0 h-4 capitalize font-medium",
                booking.status === "confirmed" && "bg-green-50 text-green-700 border-green-200",
                booking.status === "pending" && "bg-amber-50 text-amber-700 border-amber-200",
                booking.status === "cancelled" && "bg-red-50 text-red-700 border-red-200",
              )}
            >
              {booking.status}
            </Badge>
            <span className="text-[10px] text-muted-foreground">
              {formatDistanceToNow(new Date(booking.created_at), {
                addSuffix: true,
              })}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingCard;