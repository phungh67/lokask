import { useState } from "react";
import { Consultant } from "@/data/mockData";
import ChatHeader from "./ChatHeader";
import ChatAISummary from "./ChatAISummary";
import ChatMessages from "./ChatMessages";
import ChatComposer from "./ChatComposer";
import { ChatMessage } from "./types";
import { mockMessages, mockSummary } from "./mockChatData";

interface ChatWindowProps {
  consultant: Consultant;
  onMinimize: () => void;
  onClose: () => void;
}

const ChatWindow = ({ consultant, onMinimize, onClose }: ChatWindowProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>(mockMessages);

  const handleSendMessage = (content: string) => {
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      type: "text",
      content,
      sender: "user",
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, newMessage]);
  };

  return (
    <div className="fixed bottom-20 right-4 z-50 w-[390px] h-[600px] bg-card rounded-[18px] shadow-strong flex flex-col overflow-hidden animate-fade-in">
      <ChatHeader
        consultant={consultant}
        onMinimize={onMinimize}
        onClose={onClose}
      />
      <ChatAISummary summary={mockSummary} />
      <ChatMessages messages={messages} />
      <ChatComposer onSendMessage={handleSendMessage} />
    </div>
  );
};

export default ChatWindow;
