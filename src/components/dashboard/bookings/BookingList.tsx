import { Search, Settings } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Booking } from "@/data/dashboardMockData";
import BookingCard from "./BookingCard";

export type BookingStatusFilter = "upcoming" | "pending" | "completed" | "cancelled";

interface BookingListProps {
  bookings: Booking[];
  selectedId: string | null;
  onSelect: (booking: Booking) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  activeStatus: BookingStatusFilter;
  onStatusChange: (status: BookingStatusFilter) => void;
}

const BookingList = ({
  bookings,
  selectedId,
  onSelect,
  searchQuery,
  onSearchChange,
  activeStatus,
  onStatusChange,
}: BookingListProps) => {
  const statusTabs: { key: BookingStatusFilter; label: string }[] = [
    { key: "upcoming", label: "Upcoming" },
    { key: "pending", label: "Pending" },
    { key: "completed", label: "Completed" },
    { key: "cancelled", label: "Cancelled" },
  ];

  return (
    <div className="w-[320px] border-r border-border bg-card flex flex-col">
      {/* Status Tabs */}
      <div className="p-3 border-b border-border">
        <div className="flex gap-1 flex-wrap">
          {statusTabs.map((tab) => (
            <Button
              key={tab.key}
              variant={activeStatus === tab.key ? "default" : "ghost"}
              size="sm"
              className="h-8 text-xs"
              onClick={() => onStatusChange(tab.key)}
            >
              {tab.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Search Bar */}
      <div className="p-3 border-b border-border">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search bookings..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
          <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Booking Cards List */}
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-2">
          {bookings.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">No bookings found</p>
            </div>
          ) : (
            bookings.map((booking) => (
              <BookingCard
                key={booking.id}
                booking={booking}
                isSelected={booking.id === selectedId}
                onClick={() => onSelect(booking)}
              />
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default BookingList;
