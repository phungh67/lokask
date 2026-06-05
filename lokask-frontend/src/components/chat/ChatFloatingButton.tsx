import { Consultant } from "@/types/consultant";
// @TODO: inspect later

interface ChatFloatingButtonProps {
  consultant: Consultant;
  onClick: () => void;
  unreadCount?: number;
}

const ChatFloatingButton = ({
  consultant,
  onClick,
  unreadCount = 0,
}: ChatFloatingButtonProps) => {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-4 right-4 z-50 group"
      aria-label={`Open chat with ${consultant.name}`}
    >
      <div className="flex items-center gap-3 bg-card rounded-xl px-4 py-3 shadow-medium hover:shadow-strong transition-all duration-200 group-hover:scale-105">
        {/* Avatar - Square with rounded corners */}
        <div className="relative">
          <img
            src={consultant.avatarUrl}
            alt={consultant.name}
            className="w-10 h-10 rounded-lg object-cover"
          />
          {/* Online status dot */}
          <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-card" />
        </div>

        {/* Name & Label */}
        <div className="text-left">
          <p className="font-semibold text-sm text-foreground">
            {consultant.name}
          </p>
          <p className="text-xs text-muted-foreground">Chat</p>
        </div>

        {/* Unread Badge */}
        {unreadCount > 0 && (
          <span className="bg-primary text-primary-foreground text-xs font-medium rounded-full px-2 py-0.5 min-w-[20px] text-center">
            {unreadCount}
          </span>
        )}
      </div>
    </button>
  );
};

export default ChatFloatingButton;
