import React, { useState, useEffect } from "react";
import { format, differenceInMinutes } from "date-fns";
import { Phone, Video, Calendar, MessageSquare, FileText, MapPin, Clock, CreditCard, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Booking } from "@/types/booking";
import { cn } from "@/lib/utils";

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
  pending: { label: "Pending Confirmation", className: "bg-amber-50 text-amber-700 border-amber-200" },
  confirmed: { label: "Confirmed", className: "bg-green-50 text-green-700 border-green-200" },
  completed: { label: "Completed", className: "bg-muted text-muted-foreground border-border" },
  cancelled: { label: "Cancelled", className: "bg-red-50 text-red-700 border-red-200" },
};

const BookingDetail = ({ booking, onConfirm, onReschedule, onCancel, onUpdateNotes }: BookingDetailProps) => {
  const [callStatus, setCallStatus] = useState({ isActive: false, participants: 0 });

  useEffect(() => {
    if (booking?.status !== "confirmed") return;

    const checkStatus = async () => {
      try {
        const token = sessionStorage.getItem("token");
        const res = await fetch(`/api/v1/bookings/${booking.id}/call-status`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setCallStatus({ isActive: data.is_active, participants: data.participants });
        }
      } catch (e) {
        console.error("Failed to check call status", e);
      }
    };

    checkStatus(); // Check immediately on mount
    const interval = setInterval(checkStatus, 5000); 

    return () => clearInterval(interval); // Cleanup on unmount or booking change
  }, [booking?.id, booking?.status]);

  if (!booking) return null;

  const duration = differenceInMinutes(new Date(booking.end_time), new Date(booking.start_time));
  const status = statusConfig[booking.status];
  const displayName = booking.traveller_name || booking.consultant_name || "User";
  const displayAvatar = booking.traveller_avatar || booking.consultant_avatar;

  const openCallWindow = (bookingId: string, type: string) => {
    const url = `/call/${bookingId}?type=${type}`;
    const windowFeatures = "width=1200,height=800,left=100,top=100,menubar=no,toolbar=no,location=no,status=no";
    window.open(url, "LokaskCallRoom", windowFeatures);
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl border border-border/60 shadow-sm overflow-hidden">
      <ScrollArea className="flex-1">
        <div className="p-6 md:p-8 space-y-8">
          
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
                  <Badge variant="secondary" className="font-normal text-xs bg-secondary/50 text-muted-foreground">
                    Traveller
                  </Badge>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" /> {booking.consultant_city}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-end gap-3 shrink-0">
              <Badge variant="outline" className={cn("px-3 py-1 font-medium", status.className)}>
                {status.label}
              </Badge>
              
              {booking.status === "confirmed" && (
                <div className="flex gap-2 transition-all">
                  {callStatus.isActive ? (
                    <Button
                      className="h-10 rounded-full px-6 font-semibold bg-green-500 hover:bg-green-600 text-white animate-pulse shadow-lg shadow-green-500/20"
                      onClick={() => openCallWindow(booking.id, booking.service_type)}
                    >
                      <Users className="h-4 w-4 mr-2" /> 
                      Join Call ({callStatus.participants} waiting)
                    </Button>
                  ) : (
                    // 💤 Idle Room State
                    <>
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
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          <hr className="border-border/40" />

          {/* Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-secondary/20 rounded-xl p-4 border border-border/40 flex items-start gap-3">
              <div className="p-2 bg-white rounded-lg shadow-sm shrink-0">
                {serviceIcons[booking.service_type]}
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">Service</p>
                <p className="font-medium capitalize">{booking.service_type.replace("_", " ")}</p>
              </div>
            </div>

            <div className="bg-secondary/20 rounded-xl p-4 border border-border/40 flex items-start gap-3">
              <div className="p-2 bg-white rounded-lg shadow-sm shrink-0">
                <Clock className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">Duration</p>
                <p className="font-medium">{duration} minutes</p>
              </div>
            </div>

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

          {booking.user_notes && (
            <div className="bg-amber-50/50 rounded-xl p-5 border border-amber-100">
              <p className="text-xs font-bold text-amber-800/60 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" /> Traveller's Notes
              </p>
              <p className="text-sm text-amber-900 leading-relaxed italic">"{booking.user_notes}"</p>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="p-4 md:p-6 border-t border-border bg-gray-50 flex flex-col-reverse sm:flex-row justify-end gap-3 shrink-0">
        {(booking.status === "pending" || booking.status === "confirmed") && (
          <Button variant="ghost" className="w-full sm:w-auto text-destructive hover:bg-destructive/10 hover:text-destructive rounded-full px-6" onClick={onCancel}>
            Cancel booking
          </Button>
        )}
        
        {(booking.status === "pending" || booking.status === "confirmed") && (
          <Button variant="outline" className="w-full sm:w-auto bg-white rounded-full px-6 shadow-sm" onClick={onReschedule}>
            Reschedule
          </Button>
        )}

        {booking.status === "pending" && (
          <Button className="w-full sm:w-auto rounded-full px-8 shadow-sm" onClick={onConfirm}>
            Confirm booking
          </Button>
        )}
      </div>
    </div>
  );
};

export default BookingDetail;