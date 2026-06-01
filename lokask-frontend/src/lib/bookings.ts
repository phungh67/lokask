import { fetchJson } from "./core";
import { Booking } from "@/types/booking";
import { CreateBookingRequest } from "@/types/booking";

// booking
/**
 * Fetch bookings for a consultant's dashboard
 */
export async function createBooking(data: CreateBookingRequest) {
    return fetchJson<Booking>("/bookings", {
        method: "POST",
        body: JSON.stringify(data),
    });
}

/**
 * View my trips (Traveller Dashboard)
 * Matches: protected.Get("/bookings/my-trips", bookHandler.GetUserTrips)
 */
export async function getMyTrips(userId: string) {
    return fetchJson<Booking[]>("/bookings/my-trips");
}

/**
 * View consultant schedule (Consultant Dashboard)
 * Matches: protected.Get("/bookings/consultant/:id", bookHandler.GetMySchedule)
 */
export async function getConsultantBookings(consultantId: string) {
    return fetchJson<Booking[]>(`/bookings/consultant/${consultantId}`);
}

/**
 * Public function to view consultant schedule (User dashboard)
 * Does not require authentication, only show official bookings (i.e. confirmed)
 */
export async function getPublicConsultantBookings(consultantId: string){
    return fetchJson<Booking[]>(`/public/${consultantId}`);
}

/**
 * Update booking status (Confirm/Cancel)
 * Matches: protected.Patch("/bookings/:id/status", bookHandler.UpdateStatus)
 */
export async function updateBookingStatus(id: string, status: "confirmed" | "cancelled") {
    return fetchJson<Booking>(`/bookings/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
    });
}

/**
 * Delete a booking entirely
 * Matches: protected.Delete("/bookings/:id", bookHandler.DeleteBooking)
 */
export async function deleteBooking(id: string) {
    return fetchJson(`/bookings/${id}`, {
        method: "DELETE",
    });
}