import { useRef, useEffect } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import ChatPanelHeader from "./ChatPanelHeader";
import ChatPanelComposer from "./ChatPanelComposer";
import FloatingAISummary from "./FloatingAISummary";
import LocationCard from "./LocationCard";
import { DashboardConversation, DashboardMessage } from "@/data/dashboardMockData";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface ChatPanelProps {
  conversation: DashboardConversation | null;
  onSendMessage: (message: string) => void;
}

const ChatPanel = ({ conversation, onSendMessage }: ChatPanelProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [conversation?.messages]);

  if (!conversation) {
    return (
      <div className="flex-1 flex items-center justify-center bg-secondary/20">
        <div className="text-center text-muted-foreground">
          <p className="text-lg font-medium">Select a conversation</p>
          <p className="text-sm">Choose from your inbox to start chatting</p>
        </div>
      </div>
    );
  }

  const renderMessage = (message: DashboardMessage) => {
    const isConsultant = message.sender === "consultant";

    if (message.type === "location" && message.locationData) {
      return (
        <div
          key={message.id}
          className={cn("flex", isConsultant ? "justify-end" : "justify-start")}
        >
          <LocationCard
            name={message.locationData.name}
            image={message.locationData.image}
            hashtags={message.locationData.hashtags}
          />
        </div>
      );
    }

    return (
      <div
        key={message.id}
        className={cn("flex", isConsultant ? "justify-end" : "justify-start")}
      >
        <div
          className={cn(
            "max-w-[70%] rounded-2xl px-4 py-2.5",
            isConsultant
              ? "bg-primary text-primary-foreground rounded-br-md"
              : "bg-card border border-border rounded-bl-md"
          )}
        >
          <p className="text-sm">{message.content}</p>
          <p
            className={cn(
              "text-xs mt-1",
              isConsultant ? "text-primary-foreground/70" : "text-muted-foreground"
            )}
          >
            {format(message.timestamp, "h:mm a")}
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col bg-secondary/20 relative">
      {/* Header */}
      <ChatPanelHeader traveller={conversation.traveller} />

      {/* Messages area with floating AI Summary */}
      <div className="flex-1 relative overflow-hidden">
        {/* Messages */}
        <ScrollArea className="h-full" ref={scrollRef}>
          <div className="p-4 pr-80 space-y-4">
            {conversation.messages.map(renderMessage)}
          </div>
        </ScrollArea>

        {/* Floating AI Summary */}
        <div className="absolute right-4 top-4">
          <FloatingAISummary summary={conversation.summary} />
        </div>
      </div>

      {/* Composer */}
      <ChatPanelComposer onSendMessage={onSendMessage} />
    </div>
  );
};

export default ChatPanel;
