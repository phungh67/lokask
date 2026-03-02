import { useState, useEffect, useRef } from "react";
import { Consultant } from "@/types/consultant"; 
import ChatHeader from "./ChatHeader";
import ChatAISummary from "./ChatAISummary";
import ChatMessages from "./ChatMessages";
import ChatComposer from "./ChatComposer";
import { 
  ChatMessage as APIChatMessage, 
  startChat, 
  getChatHistory, 
  sendMessage 
} from "@/lib/api";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ChatWindowProps {
  consultant: Consultant;
  onMinimize: () => void;
  onClose: () => void;
}

const ChatWindow = ({ consultant, onMinimize, onClose }: ChatWindowProps) => {
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<APIChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  
  const pollInterval = useRef<NodeJS.Timeout | null>(null);

  // 1. Initialize User & Chat
  useEffect(() => {
    const initChat = async () => {
      try {
        setIsLoading(true);

        // clear old data?
        setMessages([]); 
        setConversationId(null);
        
        // Get the current logged-in user ID to differentiate "me" from others
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          const user = JSON.parse(storedUser);
          setCurrentUserId(user.id);
        }

        const conversation = await startChat(consultant.id);
        setConversationId(conversation.id);
        
        const history = await getChatHistory(conversation.id);
        setMessages(history);
      } catch (error) {
        console.error("Failed to start chat:", error);
        toast.error("Could not connect to chat");
      } finally {
        setIsLoading(false);
      }
    };

    if (consultant.id) {
      initChat();
    }

    return () => {
      if (pollInterval.current) clearInterval(pollInterval.current);
    };
  }, [consultant.id]);

  // 2. Poll for messages
  useEffect(() => {
    if (!conversationId) return;

    pollInterval.current = setInterval(async () => {
      try {
        const history = await getChatHistory(conversationId);
        setMessages(history);
      } catch (err) {
        console.error("Polling error", err);
      }
    }, 3000); 

    return () => {
      if (pollInterval.current) clearInterval(pollInterval.current);
    };
  }, [conversationId]);

  // 3. Handle Send
  const handleSendMessage = async (content: string) => {
    if (!conversationId || !currentUserId) return;

    const tempId = Date.now(); 
    // Optimistic UI Update using real current user ID
    const optimisticMsg: APIChatMessage = {
      id: tempId, 
      conversation_id: conversationId,
      content,
      sender_id: currentUserId, 
      created_at: new Date().toISOString(),
      type: "text",
      is_read: false
    };
    
    setMessages((prev) => [...prev, optimisticMsg]);

    try {
      // fixing the async gap
      const realMsg = await sendMessage(conversationId, content);

      // swap opstimistic id with actual data
      setMessages ((prev) => 
        prev.map((msg) => msg.id === tempId ? realMsg : msg)
      )

      const freshHistory = await getChatHistory(conversationId);
      setMessages(freshHistory);
    } catch (error) {
      console.error("Send failed", error);
      toast.error("Failed to send message");
      setMessages((prev) => prev.filter(m => m.id !== tempId));
    }
  };

  const uiMessages = messages.map(m => ({
    id: m.id.toString(),
    // LOGIC: If sender matches consultant ID, it's 'consultant'. 
    // Otherwise, it's 'user' (me).
    sender: m.sender_id === currentUserId ? 'user' : 'consultant',
    content: m.content,
    type: m.type || 'text',
    timestamp: new Date(m.created_at),
    imageUrl: m.imageUrl 
  }));

  return (
    <div className="fixed bottom-20 right-4 z-50 w-[390px] h-[600px] bg-card rounded-[18px] shadow-strong flex flex-col overflow-hidden animate-fade-in border border-border">
      <ChatHeader
        consultant={consultant}
        onMinimize={onMinimize}
        onClose={onClose}
      />

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <ChatMessages messages={uiMessages as any} />
      )}

      <ChatComposer onSendMessage={handleSendMessage} />
    </div>
  );
};

export default ChatWindow;