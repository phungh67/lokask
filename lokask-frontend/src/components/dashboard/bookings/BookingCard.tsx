import { format, formatDistanceToNow } from "date-fns"; // 🟢 Replace mock helper with standard library
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Video, Phone, MessageSquare, FileText } from "lucide-react";

// 🟢 Define the Booking interface locally to remove mock dependency
export interface Booking {
  id: string;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  createdAt: string | Date;
  scheduledAt: string | Date;
  duration: number;
  serviceType: "chat_only" | "video_call" | "voice_call" | "itinerary_review";
  traveller: {
    name: string;
    avatar: string;
    location: string;
    tripDates: {
      start: string | Date;
      end: string | Date;
    };
  };
}

// 🟢 Define labels locally instead of importing from mock data
const serviceTypeLabels: Record<Booking["serviceType"], string> = {
  chat_only: "Chat",
  video_call: "Video Call",
  voice_call: "Voice Call",
  itinerary_review: "Itinerary Review",
};

interface BookingCardProps {
  booking: Booking;
  isSelected: boolean;
  onClick: () => void;
}

const serviceIcons: Record<Booking["serviceType"], React.ReactNode> = {
  chat_only: <MessageSquare className="h-3 w-3" />,
  video_call: <Video className="h-3 w-3" />,
  voice_call: <Phone className="h-3 w-3" />,
  itinerary_review: <FileText className="h-3 w-3" />,
};

const BookingCard = ({ booking, isSelected, onClick }: BookingCardProps) => {
  const statusVariant = {
    pending: "bg-amber-100 text-amber-700 border-amber-200",
    confirmed: "bg-green-100 text-green-700 border-green-200",
    completed: "bg-muted text-muted-foreground border-border",
    cancelled: "bg-red-100 text-red-700 border-red-200",
  };

  const statusLabel = {
    pending: "Pending",
    confirmed: "Confirmed",
    completed: "Completed",
    cancelled: "Cancelled",
  };

  return (
    <div
      className={cn(
        "p-3 rounded-xl cursor-pointer transition-all border",
        isSelected
          ? "bg-primary/10 border-primary/30 shadow-sm"
          : "bg-card border-transparent hover:bg-secondary/50 hover:border-border"
      )}
      onClick={onClick}
    >
      <div className="flex gap-3">
        {/* Avatar */}
        <img
          src={booking.traveller.avatar}
          alt={booking.traveller.name}
          className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
        />

        <div className="flex-1 min-w-0">
          {/* Name */}
          <p className="font-medium truncate">{booking.traveller.name}</p>

          {/* Location + Trip Dates */}
          <p className="text-sm text-muted-foreground flex items-center gap-1 flex-wrap">
            <span className="inline-flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
              {booking.traveller.location}
            </span>
            <span className="mx-0.5">·</span>
            <span>
              {format(new Date(booking.traveller.tripDates.start), "MMM d")}-
              {format(new Date(booking.traveller.tripDates.end), "d, yyyy")}
            </span>
          </p>

          {/* Status + Time ago */}
          <div className="flex items-center gap-2 mt-1.5">
            <Badge
              variant="outline"
              className={cn("text-xs px-1.5 py-0", statusVariant[booking.status])}
            >
              {statusLabel[booking.status]}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {/* 🟢 Using standard date-fns formatter */}
              {formatDistanceToNow(new Date(booking.createdAt), { addSuffix: true })}
            </span>
          </div>

          {/* Schedule info */}
          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
            {format(new Date(booking.scheduledAt), "MMM d")} · {format(new Date(booking.scheduledAt), "h:mm a")}
            <span className="mx-0.5">·</span>
            {booking.duration} min
            <span className="mx-0.5">·</span>
            <span className="inline-flex items-center gap-0.5">
              {serviceIcons[booking.serviceType]}
              {serviceTypeLabels[booking.serviceType]}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default BookingCard;