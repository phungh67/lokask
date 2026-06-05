import { format } from "date-fns";
import { Video, Phone, Check, Clock, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScheduledCall } from "@/types/chat";
import { cn } from "@/lib/utils";

interface ScheduledCallMessageProps {
  scheduledCall: ScheduledCall;
  isConsultant: boolean;
  onReschedule?: () => void;
  onCancel?: () => void;
}

const ScheduledCallMessage = ({
  scheduledCall,
  isConsultant,
  onReschedule,
  onCancel,
}: ScheduledCallMessageProps) => {
  const { type, scheduledAt, duration, status, notes } = scheduledCall;

  const getStatusIcon = () => {
    switch (status) {
      case "confirmed":
        return <Check className="h-3 w-3" />;
      case "pending":
        return <Clock className="h-3 w-3" />;
      case "cancelled":
        return <X className="h-3 w-3" />;
      default:
        return null;
    }
  };

  const getStatusVariant = () => {
    switch (status) {
      case "confirmed":
        return "default";
      case "pending":
        return "secondary";
      case "cancelled":
        return "destructive";
      default:
        return "outline";
    }
  };

  return (
    <div
      className={cn(
        "max-w-[70%] rounded-2xl p-4 border",
        status === "cancelled"
          ? "bg-muted/50 border-muted"
          : "bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20",
        isConsultant ? "rounded-br-md" : "rounded-bl-md"
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        {type === "video" ? (
          <Video className={cn("h-5 w-5", status === "cancelled" ? "text-muted-foreground" : "text-primary")} />
        ) : (
          <Phone className={cn("h-5 w-5", status === "cancelled" ? "text-muted-foreground" : "text-primary")} />
        )}
        <span className={cn("font-medium", status === "cancelled" && "text-muted-foreground")}>
          {type === "video" ? "Video Call" : "Voice Call"} Scheduled
        </span>
      </div>

      {/* Details */}
      <div className={cn("space-y-1", status === "cancelled" && "text-muted-foreground")}>
        <p className={cn("text-sm", status === "cancelled" && "line-through")}>
          {format(scheduledAt, "EEEE, MMMM d, yyyy")}
        </p>
        <p className={cn("text-sm", status === "cancelled" && "line-through")}>
          {format(scheduledAt, "h:mm a")} • {duration} minutes
        </p>
        {notes && (
          <p className="text-xs text-muted-foreground mt-2 italic">
            "{notes}"
          </p>
        )}
      </div>

      {/* Status Badge */}
      <div className="flex items-center gap-2 mt-3">
        <Badge variant={getStatusVariant()} className="capitalize">
          {getStatusIcon()}
          <span className="ml-1">{status}</span>
        </Badge>
      </div>

      {/* Actions (only for consultant and not cancelled) */}
      {isConsultant && status !== "cancelled" && status !== "completed" && (
        <div className="flex gap-2 mt-3 pt-3 border-t border-primary/10">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onReschedule}
            className="text-xs"
          >
            Reschedule
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onCancel}
            className="text-xs text-destructive hover:text-destructive"
          >
            Cancel
          </Button>
        </div>
      )}
    </div>
  );
};

export default ScheduledCallMessage;
