import { useRef, useEffect, useMemo } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import ChatPanelHeader from "./ChatPanelHeader";
import ChatPanelComposer from "./ChatPanelComposer";
import FloatingAISummary from "./FloatingAISummary";
import { cn } from "@/lib/utils";
import { format, isAfter, addHours } from "date-fns";

interface ChatPanelProps {
  conversation: any | null; // Uses the mapped backend data
  onSendMessage: (message: string) => void;
  // 🟢 Updated to accept real call data structure
  onScheduleCall: (callData: any) => void; 
  onCancelCall?: (callId: string) => void;
}

const ChatPanel = ({ conversation, onSendMessage, onScheduleCall, onCancelCall }: ChatPanelProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      const viewport = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight;
      }
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

  const renderMessage = (message: any) => {
    // Check if sender is current user (could be 'me' or matches consultantProfile.id)
    const isMe = message.sender === "consultant" || message.sender === "me";

    return (
      <div key={message.id} className={cn("flex", isMe ? "justify-end" : "justify-start")}>
        <div className={cn(
          "max-w-[70%] rounded-2xl px-4 py-2.5",
          isMe ? "bg-primary text-primary-foreground rounded-br-md" : "bg-card border border-border rounded-bl-md"
        )}>
          <p className="text-sm">{message.content}</p>
          <p className={cn("text-xs mt-1", isMe ? "text-primary-foreground/70" : "text-muted-foreground")}>
            {format(new Date(message.timestamp), "h:mm a")}
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col bg-secondary/20 relative">
      <ChatPanelHeader 
        // 🟢 Uses the otherUser object mapped in the dashboard
        otherUser={conversation.otherUser} 
        onScheduleCall={onScheduleCall}
      />

      <div className="flex-1 relative overflow-hidden">
        <ScrollArea className="h-full" ref={scrollRef}>
          <div className="p-4 pr-80 space-y-4">
            {conversation.messages?.map(renderMessage)}
          </div>
        </ScrollArea>

        <div className="absolute right-4 top-4">
          <FloatingAISummary summary={conversation.summary} />
        </div>
      </div>

      <ChatPanelComposer onSendMessage={onSendMessage} />
    </div>
  );
};

export default ChatPanel;