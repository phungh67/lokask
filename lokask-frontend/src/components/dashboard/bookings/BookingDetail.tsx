import React, { useState } from "react";
import { format, differenceInMinutes } from "date-fns"; // standard date-fns
import { Phone, Video, Calendar, MessageSquare, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Booking } from "@/types/booking";
import VideoCallRoom from "@/pages/VideoCallRoom";
import { cn } from "@/lib/utils";

interface BookingDetailProps {
  booking: Booking | null;
  onConfirm: () => void;
  onReschedule: () => void;
  onCancel: () => void;
  onUpdateNotes: (notes: string[]) => void;
}

const serviceIcons: Record<Booking["service_type"], React.ReactNode> = {
  chat_only: <MessageSquare className="h-5 w-5 text-primary" />,
  video_call: <Video className="h-5 w-5 text-primary" />,
  voice_call: <Phone className="h-5 w-5 text-primary" />,
  itinerary_review: <FileText className="h-5 w-5 text-primary" />,
};

const statusConfig = {
  pending: {
    label: "Pending Confirmation",
    className: "bg-amber-100 text-amber-700 border-amber-200",
  },
  confirmed: {
    label: "Confirmed",
    className: "bg-green-100 text-green-700 border-green-200",
  },
  completed: {
    label: "Completed",
    className: "bg-muted text-muted-foreground border-border",
  },
  cancelled: {
    label: "Cancelled",
    className: "bg-red-100 text-red-700 border-red-200",
  },
};

const BookingDetail = ({
  booking,
  onConfirm,
  onReschedule,
  onCancel,
  onUpdateNotes,
}: BookingDetailProps) => {
  const [showVideoCall, setShowVideoCall] = useState(false);

  if (!booking) {
    return (
      <div className="flex-1 bg-secondary/20 flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <p className="text-lg font-medium">Select a booking</p>
          <p className="text-sm">
            Choose a booking from the list to view details
          </p>
        </div>
      </div>
    );
  }

  // Logic: Calculate duration from start/end times
  const duration = differenceInMinutes(
    new Date(booking.end_time),
    new Date(booking.start_time),
  );
  const status = statusConfig[booking.status];

  const displayName =
    booking.traveller_name || booking.consultant_name || "User";
  const displayAvatar = booking.traveller_avatar || booking.consultant_avatar;

  return (
    <div className="flex-1 bg-secondary/20 flex flex-col">
      <ScrollArea className="flex-1">
        <div className="p-6 space-y-6">
          {/* Header: Avatar + Traveller Info */}
          <div className="flex items-start gap-4">
            <img
              src={
                displayAvatar ||
                `https://ui-avatars.com/api/?name=${displayName}`
              }
              alt={displayName}
              className="w-16 h-16 rounded-xl object-cover"
            />
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-semibold">{displayName}</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground"
                >
                  <Phone className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-primary hover:bg-primary/20"
                  onClick={() => {
                    console.log(
                      `Starting video call for booking: ${booking.id}`,
                    );
                    setShowVideoCall(true);
                  }}
                >
                  <Video className="h-4 w-4" />
                </Button>
              </div>

              <p className="text-muted-foreground flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                {booking.consultant_city}
              </p>
            </div>

            <Badge
              variant="outline"
              className={cn("px-3 py-1", status.className)}
            >
              {status.label}
            </Badge>
          </div>

          <div className="bg-card rounded-xl p-4 border border-border space-y-4">
            <div className="flex items-center gap-2">
              {serviceIcons[booking.service_type]}
              <span className="font-medium capitalize">
                {booking.service_type.replace("_", " ")}
              </span>
              <span className="text-muted-foreground">({duration} min)</span>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>
                {format(new Date(booking.start_time), "EEEE, MMMM d, yyyy")}
              </span>
            </div>

            <div className="bg-secondary/50 rounded-lg p-3">
              <p className="text-sm">
                <span className="text-muted-foreground">Scheduled Time:</span>{" "}
                <span className="font-medium">
                  {format(new Date(booking.start_time), "h:mm a")} -{" "}
                  {format(new Date(booking.end_time), "h:mm a")}
                </span>
              </p>
            </div>

            <div className="flex items-center gap-4 text-sm pt-3 border-t border-border">
              <span className="font-medium text-primary">
                Total Price: €{booking.total_price}
              </span>
            </div>

            {/* Traveller Notes from Booking */}
            {booking.user_notes && (
              <div className="pt-3 border-t border-border">
                <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">
                  Traveller Notes
                </p>
                <p className="text-sm italic">"{booking.user_notes}"</p>
              </div>
            )}
          </div>
        </div>
      </ScrollArea>

      {/* Action Bar */}
      <div className="p-4 border-t border-border bg-card flex gap-3">
        {booking.status === "pending" && (
          <Button className="flex-1" onClick={onConfirm}>
            Confirm booking
          </Button>
        )}
        {(booking.status === "pending" || booking.status === "confirmed") && (
          <>
            <Button variant="outline" className="flex-1" onClick={onReschedule}>
              Reschedule
            </Button>
            <Button
              variant="ghost"
              className="flex-1 text-destructive hover:bg-destructive/10"
              onClick={onCancel}
            >
              Cancel booking
            </Button>
          </>
        )}
      </div>
      {showVideoCall && (
        <VideoCallRoom
          bookingId={booking.id}
          onClose={() => setShowVideoCall(false)}
        />
      )}
    </div>
  );
};

export default BookingDetail;
