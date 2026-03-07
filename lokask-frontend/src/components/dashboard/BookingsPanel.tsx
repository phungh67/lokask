import { useState, useMemo, useEffect } from "react";
import { toast } from "@/hooks/use-toast";
import { BookingList, BookingStatusFilter } from "./bookings/BookingList";
import BookingDetail from "./bookings/BookingDetail";
import BookingMiniCalendar from "./bookings/BookingMiniCalendar";
import { Booking } from "@/types/booking"; 
import { getConsultantBookings, updateBookingStatus, getMyTrips } from "@/lib/api";

interface BookingsPanelProps {
  consultantId: string;
  userId: string | null;
  userRole: string | null
}

const BookingsPanel = ({ consultantId, userId, userRole }: BookingsPanelProps) => {
  // debug
  console.log("DEBUG BookingPanel: Props receieved:", {consultantId, userId, userRole});
  const [searchQuery, setSearchQuery] = useState("");
  const [activeStatus, setActiveStatus] = useState<BookingStatusFilter>("upcoming");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 1. Fetch initial data
  const loadBookings = async () => {
    try {
      setIsLoading(true);
      // const data = await getConsultantBookings(consultantId);
      let data;

      if (consultantId && consultantId !== "" && consultantId !== "loading") {
        console.log(`[DEBUG] Fetching Consultant Jobs for ID: ${consultantId}`);
        data = await getConsultantBookings(consultantId);
      } else if (userId) {
        console.log(`[DEBUG] Fetching Traveler Trips for ID: ${userId}`);
        data = await getMyTrips(userId);
      }

      setBookings(data || []);  

    } catch (error) {
      toast({ title: "Error", description: "Failed to load bookings", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, [consultantId]);

  // 2. Filter logic updated for flat keys
  const filteredBookings = useMemo(() => {
    console.log(`[DEBUG BookingsPanel] Running filter. Active status: ${activeStatus}. Total raw bookings:`, bookings.length);
    let result = [...bookings];

    if (activeStatus === "upcoming") {
      result = result.filter(
        (b) => (b.status === "confirmed" || b.status === "pending") && new Date(b.start_time) > new Date()
      );
    } else {
      result = result.filter((b) => b.status === activeStatus);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (b) =>
          b.traveller_name.toLowerCase().includes(query) ||
          b.consultant_city.toLowerCase().includes(query)
      );
    }

    console.log("[DEBUG BookingsPanel] Filtered bookings count:", result.length);
    return result;
  }, [bookings, activeStatus, searchQuery]);

  // 3. API-driven Action Handlers
  const handleStatusUpdate = async (newStatus: "confirmed" | "cancelled") => {
    if (!selectedBooking) return;

    try {
      // 🟢 Call backend PATCH endpoint
      await updateBookingStatus(selectedBooking.id, newStatus);

      // Refresh local state
      setBookings((prev) =>
        prev.map((b) => (b.id === selectedBooking.id ? { ...b, status: newStatus } : b))
      );
      setSelectedBooking((prev) => (prev ? { ...prev, status: newStatus } : null));

      toast({
        title: `Booking ${newStatus}`,
        description: `Session with ${selectedBooking.traveller_name} has been ${newStatus}.`,
      });
    } catch (error) {
      toast({ title: "Update failed", description: "Please try again.", variant: "destructive" });
    }
  };

  return (
    <div className="flex-1 flex overflow-hidden">
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
      />

      {selectedBooking ? (
        <BookingDetail
          booking={selectedBooking}
          onConfirm={() => handleStatusUpdate("confirmed")}
          onCancel={() => handleStatusUpdate("cancelled")}
          onReschedule={() => toast({ title: "Info", description: "Feature coming soon." })}
          onUpdateNotes={(notes) => console.log("Updating notes:", notes)}
        />
      ) : (
        <div className="flex-1 flex items-center justify-center text-muted-foreground bg-white">
          <p>Select a booking to view details</p>
        </div>
      )}

      <BookingMiniCalendar
        selectedDate={selectedBooking ? new Date(selectedBooking.start_time) : undefined}
        bookings={bookings}
      />
    </div>
  );
};

export default BookingsPanel;