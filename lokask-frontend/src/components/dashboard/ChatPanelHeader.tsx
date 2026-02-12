import { Phone, Video, Info } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import ScheduleCallDialog from "./chat/ScheduleCallDialog";

interface ChatPanelHeaderProps {
  otherUser: {
    name: string;
    avatar: string;
    isOnline?: boolean;
  };
  onScheduleCall: (callData: any) => void;
}

const ChatPanelHeader = ({ otherUser, onScheduleCall }: ChatPanelHeaderProps) => {
  // 🟢 GUARD: Prevent "undefined" property access crash
  if (!otherUser) {
    return (
      <div className="h-16 px-4 flex items-center border-b border-border bg-card shrink-0">
        <div className="animate-pulse flex space-x-3 items-center">
          <div className="rounded-full bg-slate-200 h-10 w-10"></div>
          <div className="h-2 w-24 bg-slate-200 rounded"></div>
        </div>
      </div>
    );
  }

  const getInitials = (name: string) => {
    if (!name) return "?";
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
            <AvatarImage src={otherUser.avatar} alt={otherUser.name} />
            <AvatarFallback>{getInitials(otherUser.name)}</AvatarFallback>
          </Avatar>
          {otherUser.isOnline && (
            <span className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 rounded-full border-2 border-card" />
          )}
        </div>
        <div>
          <h2 className="font-medium text-sm">{otherUser.name}</h2>
          <p className="text-xs text-muted-foreground">
            {otherUser.isOnline ? (
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
          travellerName={otherUser.name}
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