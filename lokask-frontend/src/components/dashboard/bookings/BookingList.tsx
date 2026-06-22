import React from 'react';
import BookingCard from './BookingCard';
import { Booking } from '@/types/booking';
import { Loader2, CalendarX, Search } from 'lucide-react';
import { Input } from "@/components/ui/input";

export type BookingStatusFilter = "upcoming" | "pending" | "confirmed" | "completed" | "cancelled";

interface BookingListProps {
  bookings: Booking[];
  selectedId: string | null;
  onSelect: (booking: Booking) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  activeStatus: BookingStatusFilter;
  onStatusChange: (status: BookingStatusFilter) => void;
  isLoading?: boolean;
  consultantId: string;
}

export const BookingList: React.FC<BookingListProps> = ({ 
  bookings, 
  selectedId, 
  onSelect, 
  searchQuery, 
  onSearchChange,
  isLoading 
}) => {

  if (isLoading) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 bg-transparent">
        <Loader2 className="h-8 w-8 animate-spin mb-2" />
        <p>Loading schedule...</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col bg-transparent overflow-hidden">
      {/* Search Header */}
      <div className="p-4 border-b border-border/40">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            className="pl-9" 
            placeholder="Search travelers..." 
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      </div>

      {/* Bookings Scroll Area */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {bookings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <CalendarX className="h-10 w-10 text-slate-300 mb-3" />
            <p className="text-sm text-slate-500">No bookings found</p>
          </div>
        ) : (
          bookings.map((booking) => (
            <BookingCard 
              key={booking.id} 
              booking={booking} 
              isSelected={selectedId === booking.id}
              onClick={() => onSelect(booking)}
            />
          ))
        )}
      </div>
    </div>
  );
};