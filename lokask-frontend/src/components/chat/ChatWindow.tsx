import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom"; // 🟢 Added for routing
import { Consultant } from "@/types/consultant";
import ChatHeader from "./ChatHeader";
import ChatMessages from "./ChatMessages";
import ChatComposer from "./ChatComposer";
import { Dialog, DialogContent } from "@/components/ui/dialog"; // 🟢 Added Dialog
import { AlertCircle, Loader2 } from "lucide-react"; // 🟢 Added AlertCircle
import {
  startChat,
  getChatHistory,
  sendMessage,
  getChatSession,
} from "@/lib/chat";
import { ChatMessage } from "@/types/chat";
import { toast } from "sonner";

interface ChatWindowProps {
  consultant: Consultant;
  onMinimize: () => void;
  onClose: () => void;
}

const ChatWindow = ({ consultant, onMinimize, onClose }: ChatWindowProps) => {
  const navigate = useNavigate();
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string>("traveller");

  // 🟢 Session State
  const [activeSession, setActiveSession] = useState<any>(null);
  const [showPurchaseDialog, setShowPurchaseDialog] = useState(false);

  const pollInterval = useRef<NodeJS.Timeout | null>(null);

  // 1. Initialize User & Chat
  useEffect(() => {
    const initChat = async () => {
      try {
        setIsLoading(true);

        setMessages([]);
        setConversationId(null);

        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          const user = JSON.parse(storedUser);
          setCurrentUserId(user.id);
          if (user.role) setUserRole(user.role);
        }

        const conversation = await startChat(consultant.id);
        setConversationId(conversation.id);

        const history = await getChatHistory(conversation.id);
        setMessages(history);

        // 🟢 Fetch initial session
        const session = await getChatSession(conversation.id);
        setActiveSession(session);
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

  // 2. Poll for messages and session
  useEffect(() => {
    if (!conversationId) return;

    pollInterval.current = setInterval(async () => {
      try {
        const history = await getChatHistory(conversationId);
        setMessages(history);

        // 🟢 Keep session fresh
        const session = await getChatSession(conversationId);
        setActiveSession(session);
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
    const optimisticMsg: ChatMessage = {
      id: tempId,
      conversation_id: conversationId,
      content,
      sender_id: currentUserId,
      created_at: new Date().toISOString(),
      type: "text",
      is_read: false,
    };

    setMessages((prev) => [...prev, optimisticMsg]);

    try {
      const realMsg = await sendMessage(conversationId, content);

      setMessages((prev) =>
        prev.map((msg) => (msg.id === tempId ? realMsg : msg)),
      );

      const freshHistory = await getChatHistory(conversationId);
      setMessages(freshHistory);
    } catch (error: any) {
      console.error("Send failed", error);
      setMessages((prev) => prev.filter((m) => m.id !== tempId));

      const errorStr = JSON.stringify(error).toLowerCase();

      // 🟢 Intercept the expired session
      if (
        errorStr.includes("expired") ||
        errorStr.includes("package") || // Catches "no active package found"
        error.status === 403 ||
        error.status === 404
      ) {
        setShowPurchaseDialog(true);
      } else {
        toast.error("Failed to send message");
      }
    }
  };

  const uiMessages: ChatMessage[] = messages.map((m) => ({
    ...m,
    id: m.id.toString(),
    sender: m.sender_id === currentUserId ? "user" : "consultant",
    timestamp: new Date(m.created_at),
  }));

  // 🟢 Logic Lock
  const canChat =
    activeSession &&
    activeSession.status !== "expired" &&
    activeSession.status !== "pending_payment" &&
    (!activeSession.expires_at ||
      new Date() < new Date(activeSession.expires_at));

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
        <ChatMessages messages={uiMessages} />
      )}

      {/* 🟢 Conditionally show Composer or Interceptor */}
      {canChat ? (
        <ChatComposer onSendMessage={handleSendMessage} />
      ) : (
        <div className="p-4 border-t border-border bg-card">
          {userRole === "consultant" ? (
            <div className="text-sm text-muted-foreground bg-muted px-4 py-3 rounded-xl flex items-center justify-center gap-2 text-center">
              <AlertCircle size={16} /> Session expired. Waiting for traveler.
            </div>
          ) : (
            <button
              onClick={() => setShowPurchaseDialog(true)}
              className="w-full border-2 border-dashed border-[#C77752]/40 bg-[#FCE8E0]/30 hover:bg-[#FCE8E0]/60 text-[#C77752] font-medium py-3 rounded-xl transition-all flex items-center justify-center gap-2 text-sm"
            >
              <AlertCircle size={18} /> Session expired. Purchase package to
              reply.
            </button>
          )}
        </div>
      )}

      {/* 🟢 The Purchase Intercept Dialog */}
      <Dialog open={showPurchaseDialog} onOpenChange={setShowPurchaseDialog}>
        <DialogContent className="max-w-[350px] rounded-2xl p-6">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-[#FCE8E0] rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-[#C77752]" />
            </div>
            <h2 className="text-xl font-bold text-[#101828]">
              Time to top up!
            </h2>
            <p className="text-sm text-[#4A5565]">
              Your session has ended. To continue getting advice, please select
              a new package.
            </p>
            <div className="pt-4 flex flex-col gap-3">
              <button
                onClick={() => {
                  setShowPurchaseDialog(false);
                  onClose(); // Close the floating widget
                  navigate(`/consultant/${consultant.id}/packages`); // Navigate to purchase page
                }}
                className="w-full h-10 rounded-full bg-[#C77752] hover:bg-[#b06745] text-white font-medium transition-colors"
              >
                View Packages
              </button>
              <button
                onClick={() => setShowPurchaseDialog(false)}
                className="w-full h-10 rounded-full text-[#6A7282] hover:bg-gray-100 font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ChatWindow;
