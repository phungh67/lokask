import { format, isToday, isTomorrow, differenceInHours } from "date-fns";
import { Video, Phone, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScheduledCall } from "@/types/chat";

interface UpcomingCallBannerProps {
  scheduledCall: ScheduledCall;
  onJoin?: () => void;
  onReschedule?: () => void;
}

const UpcomingCallBanner = ({ scheduledCall, onJoin, onReschedule }: UpcomingCallBannerProps) => {
  const { type, scheduledAt, duration } = scheduledCall;

  const formatScheduleTime = () => {
    const hoursUntil = differenceInHours(scheduledAt, new Date());
    
    if (hoursUntil < 1) {
      return "Starting soon";
    }
    
    if (isToday(scheduledAt)) {
      return `Today at ${format(scheduledAt, "h:mm a")}`;
    }
    
    if (isTomorrow(scheduledAt)) {
      return `Tomorrow at ${format(scheduledAt, "h:mm a")}`;
    }
    
    return format(scheduledAt, "EEE, MMM d 'at' h:mm a");
  };

  const hoursUntil = differenceInHours(scheduledAt, new Date());
  const isStartingSoon = hoursUntil < 1 && hoursUntil >= 0;

  return (
    <div className="px-4 py-2.5 flex items-center justify-between bg-primary/10 border-b border-primary/20">
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary/20">
          {type === "video" ? (
            <Video className="h-4 w-4 text-primary" />
          ) : (
            <Phone className="h-4 w-4 text-primary" />
          )}
        </div>
        <div>
          <p className="text-sm font-medium">
            {type === "video" ? "Video" : "Voice"} call: {formatScheduleTime()}
          </p>
          <p className="text-xs text-muted-foreground">
            {duration} minutes
          </p>
        </div>
      </div>
      
      <div className="flex gap-2">
        {isStartingSoon ? (
          <Button size="sm" onClick={onJoin} className="gap-1.5">
            <ExternalLink className="h-3.5 w-3.5" />
            Join Now
          </Button>
        ) : (
          <>
            <Button size="sm" variant="outline" onClick={onReschedule}>
              Reschedule
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default UpcomingCallBanner;
