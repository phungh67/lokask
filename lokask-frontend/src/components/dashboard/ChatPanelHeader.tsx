import { Phone, Video, Info } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import ScheduleCallDialog from "./chat/ScheduleCallDialog";

interface ChatPanelHeaderProps {
  otherUser: {
    id: string;
    name: string;
    avatar: string;
    isOnline?: boolean;
    hourlyRate?: number;
  };
  consultantId: string;
  onScheduleCall?: (callData: any) => void;
  onOpenInfo?: () => void;
  activeBooking: any | null;
}

const ChatPanelHeader = ({
  otherUser,
  consultantId,
  onScheduleCall,
  onOpenInfo,
  activeBooking,
}: ChatPanelHeaderProps) => {
  if (!otherUser) {
    return (
      <div className="h-[73px] px-6 flex items-center border-b border-border/40 bg-white shrink-0">
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

const canVoiceCall = activeBooking?.service_type === "voice_call";
  const canVideoCall = activeBooking?.service_type === "video_call";

  const openCallWindow = (type: string) => {
    if (!activeBooking?.id) return;
    const url = `/call/${activeBooking.id}?type=${type}`;
    const windowFeatures = "width=1200,height=800,left=100,top=100,menubar=no,toolbar=no,location=no,status=no";
    window.open(url, "LokaskCallRoom", windowFeatures);
  };

  return (
    <div className="px-6 py-4 flex items-center justify-between border-b border-border/40 bg-white shrink-0">
      <div className="flex items-center gap-3">
        <div className="relative">
          <Avatar className="h-10 w-10 border border-border/50">
            <AvatarImage src={otherUser.avatar} alt={otherUser.name} className="object-cover" />
            <AvatarFallback>{getInitials(otherUser.name)}</AvatarFallback>
          </Avatar>
          {otherUser.isOnline && (
            <span className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 rounded-full border-2 border-white" />
          )}
        </div>
        <div>
          <h2 className="font-semibold text-sm text-foreground">{otherUser.name}</h2>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {otherUser.isOnline ? <span className="text-green-600 font-medium">Online</span> : "Offline"}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <Button 
          variant="ghost" 
          size="icon" 
          disabled={!canVoiceCall} 
          onClick={() => openCallWindow("voice_call")}
          className={`h-9 w-9 rounded-full transition-all ${
            canVoiceCall 
              ? "text-primary hover:text-primary hover:bg-primary/10" 
              : "text-muted-foreground/30 cursor-not-allowed"
          }`}
        >
          <Phone className="h-5 w-5" strokeWidth={1.5} />
        </Button>
        
        <Button 
          variant="ghost" 
          size="icon" 
          disabled={!canVideoCall} 
          onClick={() => openCallWindow("video_call")}
          className={`h-9 w-9 rounded-full transition-all ${
            canVideoCall 
              ? "text-primary hover:text-primary hover:bg-primary/10" 
              : "text-muted-foreground/30 cursor-not-allowed"
          }`}
        >
          <Video className="h-5 w-5" strokeWidth={1.5} />
        </Button>
        
        <ScheduleCallDialog
          consultantId={consultantId}
          travellerName={otherUser.name}
          hourlyRate={otherUser.hourlyRate || 50}
        />
        
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onOpenInfo}
          className="h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-secondary/50 rounded-full">
          <Info className="h-5 w-5" strokeWidth={1.5} />
        </Button>
      </div>
    </div>
  );
};

export default ChatPanelHeader;