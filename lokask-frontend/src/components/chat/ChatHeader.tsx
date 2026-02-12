import { Phone, Video, Info, Minus, X } from "lucide-react";
import { Consultant } from "@/types/consultant"; // 🟢 FIX: Use unified type

interface ChatHeaderProps {
  consultant: Consultant;
  onMinimize: () => void;
  onClose: () => void;
}

const ChatHeader = ({ consultant, onMinimize, onClose }: ChatHeaderProps) => {
  return (
    <div className="flex items-center justify-between p-4 border-b border-border bg-warm-white/50 backdrop-blur-sm shrink-0">
      <div className="flex items-center gap-3">
        <div className="relative">
          <img
            src={consultant.avatarUrl} // 🟢 Using unified property
            alt={consultant.name}
            className="w-12 h-12 rounded-lg object-cover"
          />
          <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-card" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">{consultant.displayName || consultant.name}</h3>
          <p className="text-xs text-muted-foreground">
            {consultant.city} • <span className="text-emerald-600">Online now</span>
          </p>
        </div>
      </div>
      {/* ... action buttons ... */}
    </div>
  );
};

export default ChatHeader