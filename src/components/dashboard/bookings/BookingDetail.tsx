import { format, addMinutes } from "date-fns";
import { Phone, Video, Calendar, MessageSquare, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Booking, serviceTypeLabels } from "@/data/dashboardMockData";
import ConsultantNotes from "./ConsultantNotes";
import BookingAISummary from "./BookingAISummary";
import { cn } from "@/lib/utils";

interface BookingDetailProps {
  booking: Booking | null;
  onConfirm: () => void;
  onReschedule: () => void;
  onCancel: () => void;
  onUpdateNotes: (notes: string[]) => void;
}

const serviceIcons: Record<Booking["serviceType"], React.ReactNode> = {
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
  if (!booking) {
    return (
      <div className="flex-1 bg-secondary/20 flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <p className="text-lg font-medium">Select a booking</p>
          <p className="text-sm">Choose a booking from the list to view details</p>
        </div>
      </div>
    );
  }

  const endTime = addMinutes(booking.scheduledAt, booking.duration);
  const status = statusConfig[booking.status];

  return (
    <div className="flex-1 bg-secondary/20 flex flex-col">
      {/* Scrollable Content */}
      <ScrollArea className="flex-1">
        <div className="p-6 space-y-6">
          {/* Header: Avatar + Traveller Info */}
          <div className="flex items-start gap-4">
            <img
              src={booking.traveller.avatar}
              alt={booking.traveller.name}
              className="w-16 h-16 rounded-xl object-cover"
            />
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-semibold">{booking.traveller.name}</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                >
                  <Phone className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                >
                  <Video className="h-4 w-4" />
                </Button>
              </div>

              {/* Location + Trip Dates */}
              <p className="text-muted-foreground flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                {booking.traveller.location}
                <span className="mx-1">·</span>
                {format(booking.traveller.tripDates.start, "MMM d")}-
                {format(booking.traveller.tripDates.end, "d, yyyy")}
              </p>
            </div>

            {/* Status Badge */}
            <Badge variant="outline" className={cn("px-3 py-1", status.className)}>
              {status.label}
            </Badge>
          </div>

          {/* Service Info Card */}
          <div className="bg-card rounded-xl p-4 border border-border space-y-4">
            {/* Service Type */}
            <div className="flex items-center gap-2">
              {serviceIcons[booking.serviceType]}
              <span className="font-medium">
                {booking.serviceType === "video_call"
                  ? "Video consultation"
                  : booking.serviceType === "voice_call"
                  ? "Voice consultation"
                  : booking.serviceType === "itinerary_review"
                  ? "Itinerary review"
                  : "Chat consultation"}
              </span>
              <span className="text-muted-foreground">({booking.duration} min)</span>
            </div>

            {/* Date */}
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>{format(booking.scheduledAt, "EEEE, MMMM d, yyyy")}</span>
            </div>

            {/* Dual Timezone Display */}
            <div className="bg-secondary/50 rounded-lg p-3 space-y-1">
              <p className="text-sm">
                <span className="text-muted-foreground">Your time:</span>{" "}
                <span className="font-medium">
                  {format(booking.scheduledAt, "h:mm a")} -{" "}
                  {format(endTime, "h:mm a")} {booking.consultantTimezone}
                </span>
              </p>
              <p className="text-sm">
                <span className="text-muted-foreground">Traveller's time:</span>{" "}
                <span className="font-medium">
                  {format(booking.scheduledAt, "h:mm a")} -{" "}
                  {format(endTime, "h:mm a")} {booking.traveller.timezone}
                </span>
              </p>
            </div>

            {/* Pricing */}
            <div className="flex items-center gap-4 text-sm pt-3 border-t border-border">
              <span>
                <span className="text-muted-foreground">Price:</span> €{booking.price}
              </span>
              <span>
                <span className="text-muted-foreground">Fees:</span> €{booking.fees}
              </span>
              <span className="font-medium text-primary">Payout: €{booking.payout}</span>
            </div>
          </div>

          {/* Consultant Notes */}
          <ConsultantNotes
            notes={booking.consultantNotes || []}
            onUpdate={onUpdateNotes}
          />

          {/* AI Booking Summary */}
          <BookingAISummary summary={booking.aiSummary || []} />
        </div>
      </ScrollArea>

      {/* Fixed Bottom Action Bar */}
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
              className="flex-1 text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={onCancel}
            >
              Cancel booking
            </Button>
          </>
        )}
        {booking.status === "completed" && (
          <div className="flex-1 text-center text-sm text-muted-foreground py-2">
            This booking has been completed
          </div>
        )}
        {booking.status === "cancelled" && (
          <div className="flex-1 text-center text-sm text-muted-foreground py-2">
            This booking was cancelled
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingDetail;
