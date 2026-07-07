import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { X, MessageCircle, Calendar } from "lucide-react"; // Assuming you use lucide-react
import { useEffect, useState } from "react";

interface NotificationBannerProps {
  notification: {
    id: string;
    type: "new_message" | "new_booking" | "booking_confirmed";
    senderName: string;
    senderAvatar?: string;
    preview: string;
  };
  onClose: (id: string) => void;
  onClick: (notification: any) => void;
}

const NotificationBanner = ({ notification, onClose, onClick }: NotificationBannerProps) => {
  const [isVisible, setIsVisible] = useState(false);

  // Trigger slide-in animation on mount
  useEffect(() => {
    setIsVisible(true);
    // Auto-dismiss after 5 seconds
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => onClose(notification.id), 300); // Wait for slide-out animation
    }, 5000);
    
    return () => clearTimeout(timer);
  }, [notification.id, onClose]);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const isChat = notification.type === "new_message";

  return (
    <div
      className={cn(
        "fixed bottom-4 right-4 z-50 w-80 sm:w-96 p-3 rounded-xl shadow-lg border border-border bg-card transition-all duration-300 ease-in-out",
        isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
      )}
    >
      <div className="flex items-start gap-3 relative">
        {/* Icon / Avatar Section */}
        <div className="relative shrink-0 mt-1">
          <Avatar className="h-10 w-10 border border-border/50">
            <AvatarImage src={notification.senderAvatar} alt={notification.senderName} className="object-cover" />
            <AvatarFallback className="bg-primary/10 text-primary">
              {getInitials(notification.senderName)}
            </AvatarFallback>
          </Avatar>
          <div className="absolute -bottom-1 -right-1 h-5 w-5 bg-card rounded-full flex items-center justify-center border shadow-sm">
            {isChat ? (
              <MessageCircle className="h-3 w-3 text-blue-500 fill-blue-500" />
            ) : (
              <Calendar className="h-3 w-3 text-green-500 fill-green-500" />
            )}
          </div>
        </div>

        {/* Content Section */}
        <button 
          onClick={() => onClick(notification)} 
          className="flex-1 min-w-0 text-left cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-0.5">
            <span className="font-semibold text-sm truncate group-hover:text-primary transition-colors">
              {notification.senderName}
            </span>
            <span className="text-[10px] text-muted-foreground shrink-0 uppercase tracking-wider">
              {isChat ? "New Message" : "New Booking"}
            </span>
          </div>
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed pr-4">
            {notification.preview}
          </p>
        </button>

        {/* Close Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsVisible(false);
            setTimeout(() => onClose(notification.id), 300);
          }}
          className="absolute top-0 right-0 p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
        >
          <X className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
};

export default NotificationBanner;