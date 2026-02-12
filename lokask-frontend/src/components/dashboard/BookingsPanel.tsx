import { useState, useMemo } from "react";
// 🟢 Remove mock imports
import { toast } from "@/hooks/use-toast";
import BookingList, { BookingStatusFilter } from "./bookings/BookingList";
import BookingDetail from "./bookings/BookingDetail";
import BookingMiniCalendar from "./bookings/BookingMiniCalendar";

// 🟢 Define the Booking interface locally to replace mockData imports
export interface Booking {
  id: string;
  status: "confirmed" | "pending" | "cancelled" | "completed";
  scheduledAt: Date;
  traveller: {
    id: string;
    name: string;
    location: string;
    avatar?: string;
  };
  consultantNotes?: string[];
}

const BookingsPanel = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeStatus, setActiveStatus] = useState<BookingStatusFilter>("upcoming");
  
  // 🟢 Initialize as an empty array instead of using mockBookings
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  // Filter by status + search
  const filteredBookings = useMemo(() => {
    let result = bookings;

    // Filter by status
    if (activeStatus === "upcoming") {
      result = result.filter(
        (b) => b.status === "confirmed" && new Date(b.scheduledAt) > new Date()
      );
    } else {
      result = result.filter((b) => b.status === activeStatus);
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (b) =>
          b.traveller.name.toLowerCase().includes(query) ||
          b.traveller.location.toLowerCase().includes(query)
      );
    }

    return result;
  }, [bookings, activeStatus, searchQuery]);

  const handleConfirm = () => {
    if (!selectedBooking) return;

    setBookings((prev) =>
      prev.map((b) =>
        b.id === selectedBooking.id ? { ...b, status: "confirmed" as const } : b
      )
    );
    setSelectedBooking((prev) =>
      prev ? { ...prev, status: "confirmed" as const } : null
    );

    toast({
      title: "Booking confirmed!",
      description: `Your session with ${selectedBooking.traveller.name} has been confirmed.`,
    });
  };

  const handleReschedule = () => {
    if (!selectedBooking) return;

    toast({
      title: "Reschedule",
      description: "Rescheduling functionality coming soon.",
    });
  };

  const handleCancel = () => {
    if (!selectedBooking) return;

    setBookings((prev) =>
      prev.map((b) =>
        b.id === selectedBooking.id ? { ...b, status: "cancelled" as const } : b
      )
    );
    setSelectedBooking((prev) =>
      prev ? { ...prev, status: "cancelled" as const } : null
    );

    toast({
      title: "Booking cancelled",
      description: `Your session with ${selectedBooking.traveller.name} has been cancelled.`,
    });
  };

  const handleUpdateNotes = (notes: string[]) => {
    if (!selectedBooking) return;

    setBookings((prev) =>
      prev.map((b) =>
        b.id === selectedBooking.id ? { ...b, consultantNotes: notes } : b
      )
    );
    setSelectedBooking((prev) =>
      prev ? { ...prev, consultantNotes: notes } : null
    );
  };

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Left: Booking List */}
      <BookingList
        bookings={filteredBookings}
        selectedId={selectedBooking?.id || null}
        onSelect={setSelectedBooking}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        activeStatus={activeStatus}
        onStatusChange={setActiveStatus}
      />

      {/* Center: Booking Detail */}
      {selectedBooking ? (
        <BookingDetail
          booking={selectedBooking}
          onConfirm={handleConfirm}
          onReschedule={handleReschedule}
          onCancel={handleCancel}
          onUpdateNotes={handleUpdateNotes}
        />
      ) : (
        <div className="flex-1 flex items-center justify-center text-muted-foreground bg-white">
          <p>Select a booking to view details</p>
        </div>
      )}

      {/* Right: Mini Calendar */}
      <BookingMiniCalendar
        selectedDate={selectedBooking?.scheduledAt}
        bookings={bookings}
      />
    </div>
  );
};

export default BookingsPanel;