import { Phone, Video, Info } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import ScheduleCallDialog from "./chat/ScheduleCallDialog"; // Adjust path if needed

interface ChatPanelHeaderProps {
  otherUser: {
    id: string;          
    name: string;
    avatar: string;
    isOnline?: boolean;
    hourlyRate?: number; 
  };
  consultantId: string; // 🟢 Add this explicitly to catch the raw DB ID
  onScheduleCall?: (callData: any) => void;
  // allow "info" button to be clickable
  onOpenInfo?: () => void;
}

const ChatPanelHeader = ({ otherUser, consultantId, onScheduleCall, onOpenInfo }: ChatPanelHeaderProps) => {
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
    return name.split(" ").map((n) => n[0]).join("").toUpperCase();
  };

  return (
    <div className="h-16 px-4 flex items-center justify-between border-b border-border bg-card shrink-0">
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
            {otherUser.isOnline ? <span className="text-green-600">Online</span> : "Offline"}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-transparent hover:border hover:border-border">
          <Phone className="h-5 w-5" strokeWidth={1.5} />
        </Button>
        <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-transparent hover:border hover:border-border">
          <Video className="h-5 w-5" strokeWidth={1.5} />
        </Button>
        
        {/* 🟢 FIX: Pass the explicit consultantId from the DB to the Dialog */}
        <ScheduleCallDialog
          consultantId={consultantId}
          travellerName={otherUser.name}
          hourlyRate={otherUser.hourlyRate || 50}
        />
        
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onOpenInfo}
          className="h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-transparent hover:border hover:border-border">
          <Info className="h-5 w-5" strokeWidth={1.5} />
        </Button>
      </div>
    </div>
  );
};

export default ChatPanelHeader;