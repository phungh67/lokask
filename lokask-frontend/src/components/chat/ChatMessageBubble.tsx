import { MapPin, ExternalLink } from "lucide-react";
import { ChatMessage } from "./types";
import { format } from "date-fns";

interface ChatMessageBubbleProps {
  message: ChatMessage;
}

const ChatMessageBubble = ({ message }: ChatMessageBubbleProps) => {
  const isUser = message.sender === "user";

  const baseClasses = isUser
    ? "ml-auto bg-primary text-primary-foreground rounded-2xl rounded-br-md"
    : "mr-auto bg-secondary text-foreground rounded-2xl rounded-bl-md";

  const renderContent = () => {
    switch (message.type) {
      case "image":
        return (
          <div className="space-y-2">
            {message.content && <p className="text-sm">{message.content}</p>}
            {message.imageUrl && (
              <img
                src={message.imageUrl}
                alt="Shared image"
                className="rounded-lg max-w-full h-auto"
              />
            )}
          </div>
        );

      case "map":
        if (!message.mapData) return null;
        return (
          <div className="space-y-2">
            {message.content && <p className="text-sm">{message.content}</p>}
            <div className="bg-card rounded-lg overflow-hidden border border-border">
              <div className="h-24 bg-secondary/50 flex items-center justify-center">
                <img
                  src={message.mapData.thumbnailUrl}
                  alt={message.mapData.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-3">
                <div className="flex items-start gap-2">
                  <MapPin size={16} className="text-primary shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-foreground truncate">
                      {message.mapData.name}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {message.mapData.address}
                    </p>
                  </div>
                </div>
                <a
                  href={message.mapData.mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  Open in Maps <ExternalLink size={12} />
                </a>
              </div>
            </div>
          </div>
        );

      default:
        return <p className="text-sm">{message.content}</p>;
    }
  };

  return (
    <div
      className={`max-w-[75%] px-4 py-2.5 ${baseClasses} ${
        message.type !== "text" ? "p-2" : ""
      }`}
    >
      {renderContent()}
      <p
        className={`text-[10px] mt-1 ${
          isUser ? "text-primary-foreground/70" : "text-muted-foreground"
        }`}
      >
        {format(message.timestamp, "HH:mm")}
      </p>
    </div>
  );
};

export default ChatMessageBubble;
