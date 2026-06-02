import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getConsultantBookings, getPublicConsultantBookings } from "@/lib/bookings";
import { Booking } from "@/types/booking";
import BookingMiniCalendar from "../dashboard/bookings/BookingMiniCalendar"; // Adjust import path if needed

interface ConsultantScheduleSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  consultantId: string;
  consultantName: string;
}

const ConsultantScheduleSidebar = ({
  isOpen,
  onClose,
  consultantId,
  consultantName,
}: ConsultantScheduleSidebarProps) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    new Date(),
  );
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Only fetch if the sidebar is open and we have a valid ID
    if (!isOpen || !consultantId) return;

    const fetchSchedule = async () => {
      setIsLoading(true);
      try {
        console.log(
          `[DEBUG] Fetching public schedule for consultant: ${consultantId}`,
        );
        const data = await getPublicConsultantBookings(consultantId);

        const confirmedPublicBookings = (data || [])
          .filter((b: Booking) => b.status === "confirmed")
          .map((b: Booking) => ({
            ...b,
            traveller_name: "Busy", // Safely overwrite
            notes: "",
          }));

        setBookings(confirmedPublicBookings);
      } catch (error) {
        console.error("Failed to load schedule:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSchedule();
  }, [isOpen, consultantId]);

  if (!isOpen) return null;

  return (
    <div className="w-[400px] sm:w-[450px] h-full flex flex-col bg-card border-l border-border shrink-0 animate-in slide-in-from-right-4 duration-300">
      <div className="flex items-start justify-between p-6 border-b border-border">
        <div className="pr-4">
          <h2 className="text-lg font-semibold">{consultantName}'s Schedule</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Check availability to avoid overlapping times. Times are in your
            local timezone.
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="shrink-0 -mr-2 -mt-2"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-64 space-y-4 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm">Syncing calendar...</p>
          </div>
        ) : (
          <BookingMiniCalendar
            bookings={bookings}
            selectedDate={selectedDate}
            onDateSelect={setSelectedDate}
          />
        )}
      </div>
    </div>
  );
};

export default ConsultantScheduleSidebar;
