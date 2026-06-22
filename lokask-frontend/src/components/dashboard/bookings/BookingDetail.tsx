import React, { useState } from "react";
import { format, differenceInMinutes } from "date-fns";
import { Phone, Video, Calendar, MessageSquare, FileText, MapPin, Clock, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Booking } from "@/types/booking";
import { cn } from "@/lib/utils";
import CallRoom from "@/components/CallRoom";

interface BookingDetailProps {
  booking: Booking | null;
  onConfirm: () => void;
  onReschedule: () => void;
  onCancel: () => void;
  onUpdateNotes: (notes: string[]) => void;
}

const serviceIcons: Record<Booking["service_type"], React.ReactNode> = {
  chat_only: <MessageSquare className="h-4 w-4" />,
  video_call: <Video className="h-4 w-4" />,
  voice_call: <Phone className="h-4 w-4" />,
  itinerary_review: <FileText className="h-4 w-4" />,
};

const statusConfig = {
  pending: {
    label: "Pending Confirmation",
    className: "bg-amber-50 text-amber-700 border-amber-200",
  },
  confirmed: {
    label: "Confirmed",
    className: "bg-green-50 text-green-700 border-green-200",
  },
  completed: {
    label: "Completed",
    className: "bg-muted text-muted-foreground border-border",
  },
  cancelled: {
    label: "Cancelled",
    className: "bg-red-50 text-red-700 border-red-200",
  },
};

const BookingDetail = ({
  booking,
  onConfirm,
  onReschedule,
  onCancel,
  onUpdateNotes,
}: BookingDetailProps) => {
  const [activeCallType, setActiveCallType] = useState<
    "voice_call" | "video_call" | null
  >(null);
  
  if (!booking) return null; // Handled by parent wrapper now

  const duration = differenceInMinutes(
    new Date(booking.end_time),
    new Date(booking.start_time),
  );
  const status = statusConfig[booking.status];

  const displayName = booking.traveller_name || booking.consultant_name || "User";
  const displayAvatar = booking.traveller_avatar || booking.consultant_avatar;

  const openCallWindow = (
    bookingId: string,
    type: "video_call" | "voice_call",
  ) => {
    const url = `/call/${bookingId}?type=${type}`;
    const windowFeatures =
      "width=1200,height=800,left=100,top=100,menubar=no,toolbar=no,location=no,status=no";
    window.open(url, "LokaskCallRoom", windowFeatures);
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl border border-border/60 shadow-sm overflow-hidden">
      
      <ScrollArea className="flex-1">
        <div className="p-6 md:p-8 space-y-8">
          
          {/* Header Profile Section */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <img
                src={displayAvatar || `https://ui-avatars.com/api/?name=${displayName}`}
                alt={displayName}
                className="w-16 h-16 md:w-20 md:h-20 rounded-full object-cover border border-border shadow-sm"
              />
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-foreground tracking-tight">{displayName}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary" className="font-normal text-xs bg-secondary/50 text-muted-foreground hover:bg-secondary/50">
                    Traveller
                  </Badge>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    {booking.consultant_city}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-end gap-3 shrink-0">
              <Badge variant="outline" className={cn("px-3 py-1 font-medium", status.className)}>
                {status.label}
              </Badge>
              
              {/* Call Buttons restricted only to valid sessions */}
              {booking.status === "confirmed" && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={booking.service_type !== "voice_call"}
                    className={cn("h-9 rounded-full px-4 font-medium", booking.service_type === "voice_call" ? "text-primary border-primary/30 bg-primary/5 hover:bg-primary/10" : "opacity-50")}
                    onClick={() => openCallWindow(booking.id, "voice_call")}
                  >
                    <Phone className="h-4 w-4 mr-2" /> Call
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={booking.service_type !== "video_call"}
                    className={cn("h-9 rounded-full px-4 font-medium", booking.service_type === "video_call" ? "text-primary border-primary/30 bg-primary/5 hover:bg-primary/10" : "opacity-50")}
                    onClick={() => openCallWindow(booking.id, "video_call")}
                  >
                    <Video className="h-4 w-4 mr-2" /> Video
                  </Button>
                </div>
              )}
            </div>
          </div>

          <hr className="border-border/40" />

          {/* Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Service Type Box */}
            <div className="bg-secondary/20 rounded-xl p-4 border border-border/40 flex items-start gap-3">
              <div className="p-2 bg-white rounded-lg shadow-sm shrink-0">
                {serviceIcons[booking.service_type]}
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">Service</p>
                <p className="font-medium capitalize">{booking.service_type.replace("_", " ")}</p>
              </div>
            </div>

            {/* Time Box */}
            <div className="bg-secondary/20 rounded-xl p-4 border border-border/40 flex items-start gap-3">
              <div className="p-2 bg-white rounded-lg shadow-sm shrink-0">
                <Clock className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">Duration</p>
                <p className="font-medium">{duration} minutes</p>
              </div>
            </div>

            {/* Date Box */}
            <div className="bg-secondary/20 rounded-xl p-4 border border-border/40 flex items-start gap-3 sm:col-span-2">
              <div className="p-2 bg-white rounded-lg shadow-sm shrink-0">
                <Calendar className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">Scheduled For</p>
                  <p className="font-medium">{format(new Date(booking.start_time), "EEEE, MMMM d, yyyy")}</p>
                </div>
                <div className="sm:text-right bg-white px-3 py-1.5 rounded-lg border border-border/40 text-sm font-semibold text-foreground">
                  {format(new Date(booking.start_time), "h:mm a")} - {format(new Date(booking.end_time), "h:mm a")}
                </div>
              </div>
            </div>
          </div>

          {/* Notes Section */}
          {booking.user_notes && (
            <div className="bg-amber-50/50 rounded-xl p-5 border border-amber-100">
              <p className="text-xs font-bold text-amber-800/60 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" />
                Traveller's Notes
              </p>
              <p className="text-sm text-amber-900 leading-relaxed italic">"{booking.user_notes}"</p>
            </div>
          )}

          {/* Price Summary */}
          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border border-border/50">
            <div className="flex items-center gap-2 text-muted-foreground">
              <CreditCard className="w-4 h-4" />
              <span className="text-sm font-medium">Total Booking Value</span>
            </div>
            <span className="text-lg font-bold text-foreground">
              €{booking.total_price}
            </span>
          </div>

        </div>
      </ScrollArea>

      <div className="p-4 md:p-6 border-t border-border bg-gray-50 flex flex-col-reverse sm:flex-row justify-end gap-3 shrink-0">
        {(booking.status === "pending" || booking.status === "confirmed") && (
          <Button
            variant="ghost"
            className="w-full sm:w-auto text-destructive hover:bg-destructive/10 hover:text-destructive rounded-full px-6"
            onClick={onCancel}
          >
            Cancel booking
          </Button>
        )}
        
        {(booking.status === "pending" || booking.status === "confirmed") && (
          <Button 
            variant="outline" 
            className="w-full sm:w-auto bg-white rounded-full px-6 shadow-sm" 
            onClick={onReschedule}
          >
            Reschedule
          </Button>
        )}

        {booking.status === "pending" && (
          <Button 
            className="w-full sm:w-auto rounded-full px-8 shadow-sm" 
            onClick={onConfirm}
          >
            Confirm booking
          </Button>
        )}
      </div>

      {activeCallType && (
        <CallRoom
          bookingId={booking.id}
          serviceType={activeCallType}
          onClose={() => setActiveCallType(null)} 
        />
      )}
    </div>
  );
};

export default BookingDetail;