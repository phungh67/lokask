export interface BookingData {
    consultantId: string;
    startTime: string; // ISO string
    endTime: string;   // ISO string
    notes?: string;
}