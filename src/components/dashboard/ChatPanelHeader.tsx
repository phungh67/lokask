import { Phone, Video, Info } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DashboardTraveller, ScheduledCall } from "@/data/dashboardMockData";
import ScheduleCallDialog from "./chat/ScheduleCallDialog";

interface ChatPanelHeaderProps {
  traveller: DashboardTraveller;
  onScheduleCall: (callData: Omit<ScheduledCall, "id" | "conversationId" | "createdAt">) => void;
}

const ChatPanelHeader = ({ traveller, onScheduleCall }: ChatPanelHeaderProps) => {
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  return (
    <div className="h-16 px-4 flex items-center justify-between border-b border-border bg-card shrink-0">
      {/* Left: Avatar + Name + Status */}
      <div className="flex items-center gap-3">
        <div className="relative">
          <Avatar className="h-10 w-10">
            <AvatarImage src={traveller.avatar} alt={traveller.name} />
            <AvatarFallback>{getInitials(traveller.name)}</AvatarFallback>
          </Avatar>
          {traveller.isOnline && (
            <span className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 rounded-full border-2 border-card" />
          )}
        </div>
        <div>
          <h2 className="font-medium text-sm">{traveller.name}</h2>
          <p className="text-xs text-muted-foreground">
            {traveller.isOnline ? (
              <span className="text-green-600">Online</span>
            ) : (
              "Offline"
            )}
          </p>
        </div>
      </div>

      {/* Right: Action icons */}
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-transparent hover:border hover:border-border">
          <Phone className="h-5 w-5" strokeWidth={1.5} />
        </Button>
        <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-transparent hover:border hover:border-border">
          <Video className="h-5 w-5" strokeWidth={1.5} />
        </Button>
        <ScheduleCallDialog 
          travellerName={traveller.name} 
          onSchedule={onScheduleCall} 
        />
        <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-transparent hover:border hover:border-border">
          <Info className="h-5 w-5" strokeWidth={1.5} />
        </Button>
      </div>
    </div>
  );
};

export default ChatPanelHeader;
