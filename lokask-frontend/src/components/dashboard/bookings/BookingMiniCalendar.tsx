import { useMemo } from "react";
import { format, isSameDay } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Booking } from "@/types/booking";
import { cn } from "@/lib/utils";

interface BookingMiniCalendarProps {
  selectedDate: Date | undefined;
  bookings: Booking[];
}

interface TimeSlot {
  time: string;
  hour: number;
  isBooked: boolean;
  booking?: Booking;
}

const BookingMiniCalendar = ({ selectedDate, bookings }: BookingMiniCalendarProps) => {
  // Get dates that have bookings
  const bookedDates = useMemo(() => {
    return bookings
      .filter((b) => b.status !== "cancelled")
      .map((b) => new Date(b.start_time));
  }, [bookings]);

  // Generate time slots for selected date
  const timeSlots = useMemo<TimeSlot[]>(() => {
    if (!selectedDate) return [];

    const slots: TimeSlot[] = [];
    const workingHours = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];

    for (const hour of workingHours) {
      const slotDate = new Date(selectedDate);
      slotDate.setHours(hour, 0, 0, 0);

      const matchingBooking = bookings.find(
        (b) =>
          b.status !== "cancelled" &&
          isSameDay(new Date(b.start_time), slotDate) &&
          new Date(b.start_time).getHours() === hour
      );

      slots.push({
        time: format(slotDate, "h:mm a"),
        hour,
        isBooked: !!matchingBooking,
        booking: matchingBooking,
      });
    }

    return slots;
  }, [selectedDate, bookings]);

  return (
    <div className="w-[280px] border-l border-border bg-card flex flex-col">
      {/* Monthly Calendar */}
      <div className="p-4 border-b border-border">
        <Calendar
          mode="single"
          selected={selectedDate}
          className="pointer-events-none" // Note: This prevents clicking other days, acting purely as a display!
          modifiers={{
            booked: bookedDates,
          }}
          modifiersClassNames={{
            booked: "bg-primary/20 text-primary font-medium",
          }}
        />
      </div>

      {/* Time Slots for Selected Date */}
      <div className="flex-1 flex flex-col">
        <div className="px-4 pt-4 pb-2">
          <h4 className="font-medium text-sm">
            {selectedDate ? format(selectedDate, "EEEE, MMM d") : "Schedule"}
          </h4>
        </div>

        <ScrollArea className="flex-1 px-4 pb-4">
          {!selectedDate ? (
            <div className="text-sm text-muted-foreground text-center py-8">
              Select a booking to view its schedule.
            </div>
          ) : (
            <div className="space-y-2">
              {timeSlots.map((slot) => (
                // ... keep your existing slot mapping logic here ...
                <div
                  key={slot.hour}
                  className={cn(
                    "p-3 rounded-lg text-sm flex items-center justify-between",
                    slot.isBooked
                      ? "bg-primary/10 border border-primary/20"
                      : "bg-green-50 border border-green-100"
                  )}
                >
                  <span
                    className={cn(
                      "font-medium",
                      slot.isBooked ? "text-primary" : "text-green-700"
                    )}
                  >
                    {slot.time}
                  </span>
                  {slot.isBooked ? (
                    <span className="text-xs text-primary truncate max-w-[80px]">
                      {slot.booking?.traveller_name}
                    </span>
                  ) : (
                    <Badge
                      variant="outline"
                      className="text-xs bg-green-50 text-green-700 border-green-200"
                    >
                      Available
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  );
};

export default BookingMiniCalendar;
