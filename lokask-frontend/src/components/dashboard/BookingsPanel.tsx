import { useState, useMemo, useEffect } from "react";
import { isSameDay } from "date-fns";
import { toast } from "@/hooks/use-toast";
import { BookingList, BookingStatusFilter } from "./bookings/BookingList";
import BookingDetail from "./bookings/BookingDetail";
import BookingMiniCalendar from "./bookings/BookingMiniCalendar";
import { Booking } from "@/types/booking";
import { ArrowLeft, Calendar } from "lucide-react";
import {
  getConsultantBookings,
  updateBookingStatus,
  getMyTrips,
} from "@/lib/bookings";
import { useNotifications } from "@/context/NotificationContext";

interface BookingsPanelProps {
  consultantId: string;
  userId: string | null;
  userRole: string | null;
}

const BookingsPanel = ({
  consultantId,
  userId,
  userRole,
}: BookingsPanelProps) => {
  const { notifications } = useNotifications();
  const latestNotifId = notifications[0]?.id;

  const [searchQuery, setSearchQuery] = useState("");
  const [activeStatus, setActiveStatus] =
    useState<BookingStatusFilter>("upcoming");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadBookings = async () => {
    if (!userId || consultantId === "loading") return;

    try {
      setIsLoading(true);
      let data: any;

      if (userRole === "consultant" && consultantId) {
        data = await getConsultantBookings(consultantId);
      } else {
        data = await getMyTrips(userId);
      }

      const bookingsArray = Array.isArray(data) ? data : data?.data || [];
      setBookings(bookingsArray);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load bookings from server.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, [consultantId, userId, userRole, latestNotifId]);

  const tabCounts = useMemo(() => {
    const now = new Date();
    return {
      all: bookings.length,
      upcoming: bookings.filter((b) => {
        const isPendingOrConfirmed =
          b.status === "confirmed" || b.status === "pending";
        const bookingDate = new Date(b.start_time);
        return (
          isPendingOrConfirmed &&
          (bookingDate > now || isSameDay(bookingDate, now))
        );
      }).length,
      past: bookings.filter((b) => {
        const endDate = new Date(b.end_time);
        return endDate < now && b.status !== "cancelled";
      }).length,
      cancelled: bookings.filter((b) => b.status === "cancelled").length,
    };
  }, [bookings]);

  const filteredBookings = useMemo(() => {
    let result = [...bookings];

    if (activeStatus === "upcoming") {
      result = result.filter((b) => {
        const isPendingOrConfirmed =
          b.status === "confirmed" || b.status === "pending";
        const bookingDate = new Date(b.start_time);
        const now = new Date();
        const isFutureOrToday =
          bookingDate > now || isSameDay(bookingDate, now);
        return isPendingOrConfirmed && isFutureOrToday;
      });
    } else if (activeStatus === "past") {
      result = result.filter((b) => {
        const endDate = new Date(b.end_time);
        return endDate < new Date() && b.status !== "cancelled";
      });
    } else if (activeStatus === "cancelled") {
      result = result.filter((b) => b.status === "cancelled");
    } else if (activeStatus === "all") {
      // Keep everything
    } else {
      result = result.filter((b) => b.status === activeStatus);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (b) =>
          b.traveller_name?.toLowerCase().includes(query) ||
          b.consultant_city?.toLowerCase().includes(query),
      );
    }

    result.sort((a, b) => {
      if (activeStatus === "upcoming") {
        return (
          new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
        );
      }
      return (
        new Date(b.start_time).getTime() - new Date(a.start_time).getTime()
      );
    });

    return result;
  }, [bookings, activeStatus, searchQuery]);

  const handleStatusUpdate = async (newStatus: "confirmed" | "cancelled") => {
    if (!selectedBooking || !selectedBooking.id) {
      toast({
        title: "Missing ID",
        description:
          "This booking is missing its ID from the database. Please refresh.",
        variant: "destructive",
      });
      return;
    }

    try {
      await updateBookingStatus(selectedBooking.id, newStatus);
      setBookings((prev) =>
        prev.map((b) =>
          b.id === selectedBooking.id ? { ...b, status: newStatus } : b,
        ),
      );
      setSelectedBooking((prev) =>
        prev ? { ...prev, status: newStatus } : null,
      );

      toast({
        title: `Booking ${newStatus}`,
        description: `Session with ${selectedBooking.traveller_name} has been ${newStatus}.`,
      });
    } catch (error) {
      toast({
        title: "Update failed",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex-1 flex overflow-hidden w-full h-full relative bg-gray-50/30">
      <div
        className={`w-full md:w-[380px] lg:w-[420px] shrink-0 md:border-r border-border/40 bg-white h-full flex flex-col ${selectedBooking ? "hidden md:flex" : "flex"}`}
      >
        <BookingList
          consultantId={consultantId}
          bookings={filteredBookings}
          selectedId={selectedBooking?.id || null}
          onSelect={setSelectedBooking}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          activeStatus={activeStatus}
          onStatusChange={setActiveStatus}
          isLoading={isLoading}
          counts={tabCounts}
        />
      </div>

      <div
        className={`flex-1 h-full flex flex-col relative ${!selectedBooking ? "hidden md:flex" : "flex"}`}
      >
        {selectedBooking && (
          <div className="md:hidden p-4 bg-white border-b border-border/40 flex items-center shrink-0 shadow-sm z-10">
            <button
              onClick={() => setSelectedBooking(null)}
              className="flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Bookings
            </button>
          </div>
        )}

        {selectedBooking ? (
          <div className="flex-1 overflow-y-auto flex justify-center w-full px-4 py-6 md:p-8">
            <div className="w-full max-w-4xl h-fit animate-in fade-in duration-300">
              <BookingDetail
                booking={selectedBooking}
                onConfirm={() => handleStatusUpdate("confirmed")}
                onCancel={() => handleStatusUpdate("cancelled")}
                onReschedule={() =>
                  toast({ title: "Info", description: "Feature coming soon." })
                }
                onUpdateNotes={(notes) => console.log("Updating notes:", notes)}
              />
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4 border border-border/40">
              <Calendar className="w-6 h-6 text-muted-foreground/50" />
            </div>
            <p className="font-medium">Select a booking to view details</p>
          </div>
        )}
      </div>

      <div className="hidden xl:block w-[320px] shrink-0 border-l border-border/40 bg-white">
        <BookingMiniCalendar
          selectedDate={
            selectedBooking ? new Date(selectedBooking.start_time) : undefined
          }
          bookings={bookings}
        />
      </div>
    </div>
  );
};

export default BookingsPanel;
