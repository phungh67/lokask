import { Phone, Video, Info, Minus, X } from "lucide-react";
import { Consultant } from "@/types/consultant";
import { Button } from "@/components/ui/button";

interface ChatHeaderProps {
  consultant: Consultant;
  onMinimize: () => void;
  onClose: () => void;
}

const ChatHeader = ({ consultant, onMinimize, onClose }: ChatHeaderProps) => {
  if (!consultant) {
    return (
      <div className="flex items-center justify-between p-4 border-b border-border bg-warm-white/50 backdrop-blur-sm shrink-0">
        <div className="flex items-center gap-3 animate-pulse">
          <div className="w-12 h-12 bg-gray-200 rounded-lg" />
          <div className="space-y-2">
            <div className="h-4 w-24 bg-gray-200 rounded" />
            <div className="h-3 w-16 bg-gray-200 rounded" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between p-4 border-b border-border bg-warm-white/50 backdrop-blur-sm shrink-0">
      <div className="flex items-center gap-3">
        <div className="relative">
          <img
            src={consultant.avatarUrl || `https://ui-avatars.com/api/?name=${consultant.name}&background=random`}
            alt={consultant.name}
            className="w-12 h-12 rounded-lg object-cover"
          />
          {/* Dynamic Status: Only show green if actually online */}
          {consultant.isOnline && (
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-card" />
          )}
        </div>
        <div>
          <h3 className="font-semibold text-foreground">
            {consultant.displayName || consultant.name}
          </h3>
          <p className="text-xs text-muted-foreground">
            {consultant.city} {consultant.isOnline && (
              <>• <span className="text-emerald-600">Online now</span></>
            )}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" onClick={onMinimize} className="h-8 w-8 text-muted-foreground">
          <Minus size={18} />
        </Button>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 text-muted-foreground hover:text-destructive">
          <X size={18} />
        </Button>
      </div>
    </div>
  );
};

export default ChatHeader;