import { useState } from "react";
import { format } from "date-fns";
import { CalendarPlus, Video, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { ScheduledCall } from "@/types/chat";

interface ScheduleCallDialogProps {
  travellerName: string;
  onSchedule: (callData: Omit<ScheduledCall, "id" | "conversationId" | "createdAt">) => void;
}

const TIME_SLOTS = [
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "12:00", "12:30", "13:00", "13:30", "14:00", "14:30",
  "15:00", "15:30", "16:00", "16:30", "17:00", "17:30",
  "18:00", "18:30", "19:00", "19:30", "20:00", "20:30",
];

const ScheduleCallDialog = ({ travellerName, onSchedule }: ScheduleCallDialogProps) => {
  const [open, setOpen] = useState(false);
  const [callType, setCallType] = useState<"video" | "voice">("video");
  const [date, setDate] = useState<Date>();
  const [time, setTime] = useState<string>();
  const [duration, setDuration] = useState<string>("30");
  const [notes, setNotes] = useState("");

  const formatTime = (time24: string) => {
    const [hours, minutes] = time24.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const handleSchedule = () => {
    if (!date || !time) return;

    const [hours, minutes] = time.split(":");
    const scheduledAt = new Date(date);
    scheduledAt.setHours(parseInt(hours), parseInt(minutes), 0, 0);

    onSchedule({
      type: callType,
      scheduledAt,
      duration: parseInt(duration),
      status: "confirmed",
      notes: notes || undefined,
    });

    // Reset form
    setCallType("video");
    setDate(undefined);
    setTime(undefined);
    setDuration("30");
    setNotes("");
    setOpen(false);
  };

  const isFormValid = date && time;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-9 gap-2 text-muted-foreground hover:text-foreground hover:bg-transparent hover:border hover:border-border"
        >
          <CalendarPlus className="h-4 w-4" />
          <span className="text-sm">Schedule</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Schedule a call with {travellerName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Call Type */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Call Type</Label>
            <RadioGroup
              value={callType}
              onValueChange={(value) => setCallType(value as "video" | "voice")}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="video" id="video" />
                <Label htmlFor="video" className="flex items-center gap-2 cursor-pointer">
                  <Video className="h-4 w-4" />
                  Video call
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="voice" id="voice" />
                <Label htmlFor="voice" className="flex items-center gap-2 cursor-pointer">
                  <Phone className="h-4 w-4" />
                  Voice call
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Date Picker */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarPlus className="mr-2 h-4 w-4" />
                  {date ? format(date, "EEEE, MMMM d, yyyy") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Time Picker */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Time</Label>
            <Select value={time} onValueChange={setTime}>
              <SelectTrigger>
                <SelectValue placeholder="Select time" />
              </SelectTrigger>
              <SelectContent>
                {TIME_SLOTS.map((slot) => (
                  <SelectItem key={slot} value={slot}>
                    {formatTime(slot)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Duration */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Duration</Label>
            <Select value={duration} onValueChange={setDuration}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30">30 minutes</SelectItem>
                <SelectItem value="45">45 minutes</SelectItem>
                <SelectItem value="60">60 minutes</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Notes (optional)</Label>
            <Textarea
              placeholder="Add any notes for the call..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="resize-none"
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSchedule} disabled={!isFormValid}>
            Schedule Call
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ScheduleCallDialog;
