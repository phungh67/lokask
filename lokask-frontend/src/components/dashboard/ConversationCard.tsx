import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { DashboardConversation, formatRelativeTime } from "@/data/dashboardMockData";

interface ConversationCardProps {
  conversation: DashboardConversation;
  isActive: boolean;
  onClick: () => void;
}

const ConversationCard = ({ conversation, isActive, onClick }: ConversationCardProps) => {
  const { traveller, context, lastMessage, status, isTyping, timestamp, unreadCount } = conversation;

  const getStatusBadge = () => {
    switch (status) {
      case "active":
        return <Badge className="bg-primary/10 text-primary hover:bg-primary/10 text-xs">Active</Badge>;
      case "new":
        return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 text-xs">New</Badge>;
      case "booked":
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-100 text-xs">Booked</Badge>;
      case "waiting":
        return <Badge variant="secondary" className="text-xs">Waiting</Badge>;
      default:
        return null;
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-start gap-3 p-4 rounded-2xl transition-colors text-left",
        isActive ? "bg-primary/5 border border-primary/20" : "hover:bg-secondary/50"
      )}
    >
      {/* Circular avatar */}
      <div className="relative shrink-0">
        <Avatar className="h-12 w-12">
          <AvatarImage src={traveller.avatar} alt={traveller.name} />
          <AvatarFallback>{getInitials(traveller.name)}</AvatarFallback>
        </Avatar>
        {/* Online indicator */}
        {traveller.isOnline && (
          <span className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 rounded-full border-2 border-card" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Top row: name + timestamp */}
        <div className="flex items-center justify-between mb-0.5">
          <span className="font-medium text-sm truncate">{traveller.name}</span>
          <span className="text-xs text-muted-foreground shrink-0 ml-2">
            {formatRelativeTime(timestamp)}
          </span>
        </div>

        {/* Context */}
        <p className="text-xs text-muted-foreground mb-1">{context}</p>

        {/* Last message or typing indicator */}
        <p className="text-sm text-muted-foreground truncate">
          {isTyping ? (
            <span className="text-primary animate-pulse">typing...</span>
          ) : (
            lastMessage || "No messages yet"
          )}
        </p>

        {/* Bottom row: status badge + unread count */}
        <div className="flex items-center gap-2 mt-2">
          {getStatusBadge()}
          {unreadCount > 0 && (
            <span className="h-5 w-5 flex items-center justify-center bg-primary text-primary-foreground text-xs font-medium rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
      </div>
    </button>
  );
};

export default ConversationCard;
