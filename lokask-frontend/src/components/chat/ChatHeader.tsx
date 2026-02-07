import { Phone, Video, Info, Minus, X } from "lucide-react";
import { Consultant } from "@/data/mockData";

interface ChatHeaderProps {
  consultant: Consultant;
  onMinimize: () => void;
  onClose: () => void;
}

const ChatHeader = ({ consultant, onMinimize, onClose }: ChatHeaderProps) => {
  return (
    <div className="flex items-center justify-between p-4 border-b border-border bg-warm-white/50 backdrop-blur-sm shrink-0">
      {/* Left: Avatar + Info */}
      <div className="flex items-center gap-3">
        <div className="relative">
          <img
            src={consultant.avatarUrl}
            alt={consultant.name}
            className="w-12 h-12 rounded-lg object-cover"
          />
          {/* Online status dot */}
          <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-card" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">{consultant.name}</h3>
          <p className="text-xs text-muted-foreground">
            {consultant.city} •{" "}
            <span className="text-emerald-600">Online now</span>
          </p>
        </div>
      </div>

      {/* Right: Action buttons */}
      <div className="flex items-center gap-1">
        <button
          className="p-2 rounded-full hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
          aria-label="Phone call"
        >
          <Phone size={18} />
        </button>
        <button
          className="p-2 rounded-full hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
          aria-label="Video call"
        >
          <Video size={18} />
        </button>
        <button
          className="p-2 rounded-full hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
          aria-label="Info"
        >
          <Info size={18} />
        </button>
        <div className="w-px h-5 bg-border mx-1" />
        <button
          onClick={onMinimize}
          className="p-2 rounded-full hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
          aria-label="Minimize chat"
        >
          <Minus size={18} />
        </button>
        <button
          onClick={onClose}
          className="p-2 rounded-full hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
          aria-label="Close chat"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
};

export default ChatHeader;
