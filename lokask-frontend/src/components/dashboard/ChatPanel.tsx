import { useRef, useEffect, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import ChatPanelHeader from "./ChatPanelHeader";
import ChatPanelComposer from "./ChatPanelComposer";
import FloatingAISummary from "./FloatingAISummary";
import ConsultantScheduleSidebar from "../chat/ConsultantScheduleSidebar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface ChatPanelProps {
  conversation: any | null; 
  onSendMessage: (message: string) => void;
  onScheduleCall: (callData: any) => void;
  onCancelCall?: (callId: string) => void;
  session?: any;
  userRole?: string | null;
  onTriggerPurchase?: () => void;
}

const ChatPanel = ({
  conversation,
  onSendMessage,
  onScheduleCall,
  onCancelCall,
  session,
  userRole,
  onTriggerPurchase
}: ChatPanelProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);

  useEffect(() => {
    if (scrollRef.current) {
      const viewport = scrollRef.current.querySelector(
        "[data-radix-scroll-area-viewport]",
      );
      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight;
      }
    }
  }, [conversation?.messages]);

  if (!conversation) {
    return (
      <div className="flex-1 flex items-center justify-center bg-secondary/20 h-full">
        <div className="text-center text-muted-foreground">
          <p className="text-lg font-medium">Select a conversation</p>
          <p className="text-sm">Choose from your inbox to start chatting</p>
        </div>
      </div>
    );
  }

  const renderMessage = (message: any) => {
    const isMe = message.sender === "user";

    return (
      <div
        key={message.id}
        className={cn("flex", isMe ? "justify-end" : "justify-start")}
      >
        <div
          className={cn(
            "max-w-[85%] md:max-w-[70%] rounded-2xl px-4 py-2.5",
            isMe
              ? "bg-primary text-primary-foreground rounded-br-md"
              : "bg-card border border-border rounded-bl-md",
          )}
        >
          <p className="text-sm break-words">{message.content}</p>
          <p
            className={cn(
              "text-xs mt-1",
              isMe ? "text-primary-foreground/70" : "text-muted-foreground",
            )}
          >
            {message.timestamp ? format(message.timestamp, "hh:mm a") : ""}
          </p>
        </div>
      </div>
    );
  };

  const resolvedConsultantId =
    conversation.consultant_id ||
    conversation.consultantId ||
    conversation.consultant?.id ||
    conversation.otherUser?.id ||
    "";

  return (
    <div className="flex-1 flex flex-row overflow-hidden w-full h-full">
      <div className="flex-1 flex flex-col bg-secondary/20 relative min-w-0">
        <ChatPanelHeader
          consultantId={resolvedConsultantId}
          otherUser={{
            id: conversation.otherUser?.id || conversation.traveler_id || "",
            name:
              conversation.otherUser?.name ||
              conversation.consultant?.name ||
              conversation.traveller?.name ||
              "User",
            avatar:
              conversation.otherUser?.avatar ||
              conversation.otherUser?.avatarUrl ||
              conversation.consultant?.avatarUrl ||
              "",
            isOnline:
              conversation.otherUser?.isOnline ||
              conversation.isOnline ||
              false,
            hourlyRate:
              conversation.otherUser?.hourlyRate ||
              conversation.otherUser?.pricePerHour ||
              conversation.consultant?.pricePerHour ||
              50,
          }}
          onScheduleCall={onScheduleCall}
          onOpenInfo={() => setIsScheduleOpen(true)}
        />

        <div className="flex-1 relative overflow-hidden">
          <ScrollArea className="h-full" ref={scrollRef}>
            <div className="p-4 md:pr-80 space-y-4 pb-6">
              {conversation.messages?.map(renderMessage)}
            </div>
          </ScrollArea>
          
          <div className="hidden md:block absolute right-4 top-4 z-10">
            <FloatingAISummary summary={conversation.summary} />
          </div>
        </div>

        <ChatPanelComposer onSendMessage={onSendMessage} />
      </div>

      <ConsultantScheduleSidebar
        isOpen={isScheduleOpen}
        onClose={() => setIsScheduleOpen(false)}
        consultantId={resolvedConsultantId}
        consultantName={conversation.otherUser?.name || "Consultant"}
      />
    </div>
  );
};

export default ChatPanel;