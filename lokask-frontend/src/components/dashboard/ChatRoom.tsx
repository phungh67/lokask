import { useState, useEffect, useMemo, useCallback } from "react";
import ChatPanel from "@/components/dashboard/ChatPanel";
import { useWebSocket } from "@/lib/websocket";
import { getChatHistory, sendMessage } from "@/lib/chat";
import { toast } from "@/hooks/use-toast";

interface DashboardChatRoomProps {
  activeConversationId: string;
  accountUserId: string;
  consultantProfile: any;
  userRole: string | null;
  conversationData: any; 
  onTriggerPurchase: () => void;
  onMessageUpdate?: (conversationId: string, message: any) => void;
}

const DashboardChatRoom = ({
  activeConversationId,
  accountUserId,
  consultantProfile,
  userRole,
  conversationData,
  onTriggerPurchase,
  onMessageUpdate
}: DashboardChatRoomProps) => {
  const [currentMessages, setCurrentMessages] = useState<any[]>([]);

  // 1. Load Initial Chat History
  useEffect(() => {
    const fetchInitialHistory = async () => {
      try {
        const history = await getChatHistory(activeConversationId);
        const uiMessages = (history ?? []).map((m: any) => {
          const actualSenderId = m.sender_id || m.senderId || m.SenderID || m.SenderId;
          const isMe = actualSenderId === accountUserId || actualSenderId === consultantProfile.id;
          return {
            id: (m.id || Date.now()).toString(),
            content: m.content,
            sender: isMe ? "user" : "other",
            timestamp: new Date(m.created_at || m.createdAt || Date.now()),
            type: m.type || "text",
          };
        });
        setCurrentMessages(uiMessages);
      } catch (error) {
        console.error("Failed to load initial history", error);
      }
    };

    fetchInitialHistory();
  }, [activeConversationId, accountUserId, consultantProfile]);

  // 2. Configure the WebSocket for Real-Time Receiving
  const chatWsUrl = useMemo(() => {
    if (!activeConversationId) return null;
    const token = localStorage.getItem("token") || "";
    const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    return `${wsProtocol}//${window.location.host}/ws/chat?conversation_id=${activeConversationId}&token=${token}`;
  }, [activeConversationId]);

  const handleIncomingChatMessage = useCallback((incomingData: any) => {
    const actualSenderId = incomingData.sender_id || incomingData.senderId || incomingData.SenderID;
    const isMe = actualSenderId === accountUserId || actualSenderId === consultantProfile.id;

    const newMsg = {
      id: (incomingData.id || Date.now()).toString(),
      content: incomingData.content,
      sender: isMe ? "user" : "other",
      timestamp: new Date(incomingData.created_at || incomingData.createdAt || Date.now()),
      type: incomingData.type || "text",
    };

    setCurrentMessages((prev) => {
      const isDuplicate = prev.some((m) => 
        m.id === newMsg.id || 
        (m.content === newMsg.content && m.sender === newMsg.sender && Math.abs(m.timestamp.getTime() - newMsg.timestamp.getTime()) < 5000)
      );

      if (isDuplicate) return prev;
      return [...prev, newMsg];
    });

    // Notify the parent dashboard to update the inbox list
    if (onMessageUpdate) onMessageUpdate(activeConversationId, newMsg);

  }, [accountUserId, consultantProfile, activeConversationId, onMessageUpdate]);

  useWebSocket(chatWsUrl, handleIncomingChatMessage);

  // 3. Handle Send Message 
  const handleSendMessage = async (content: string) => {
    const isActingAsConsultant = conversationData?.consultantId === accountUserId;
    const isSelfChat = conversationData?.consultantId === conversationData?.travelerId;

    const tempId = "temp-" + Date.now();
    const optimisticMsg = {
      id: tempId,
      content,
      timestamp: new Date(),
      sender: "user" as const,
      type: "text" as const,
    };

    setCurrentMessages((prev) => [...prev, optimisticMsg]);
    
    // Notify the parent dashboard immediately
    if (onMessageUpdate) onMessageUpdate(activeConversationId, optimisticMsg);

    try {
      await sendMessage(activeConversationId, content);
    } catch (error: any) {
      setCurrentMessages((prev) => prev.filter((m) => m.id !== tempId));

      const errorStr = JSON.stringify(error).toLowerCase();
      const isSessionError = errorStr.includes("expired") || errorStr.includes("package") || error.status === 403 || error.status === 404;

      if (isSessionError) {
        if (isSelfChat) {
          toast({ title: "Test Chat", description: "You cannot purchase a package for yourself." });
        } else if (isActingAsConsultant) {
          toast({ title: "Session Ended", description: "The traveler's paid session has expired. They must top up before you can reply.", variant: "destructive" });
        } else {
          onTriggerPurchase();
        }
      } else {
        toast({ title: "Message Failed", description: error.message || "The server rejected your message.", variant: "destructive" });
      }
    }
  };

  const activeConversationData = { ...conversationData, messages: currentMessages };

  return (
    <div className="flex-1 overflow-hidden relative">
      <ChatPanel
        conversation={activeConversationData}
        session={null}
        userRole={userRole}
        onSendMessage={handleSendMessage}
        onTriggerPurchase={onTriggerPurchase}
        onScheduleCall={() => {}}
        onCancelCall={() => {}}
      />
    </div>
  );
};

export default DashboardChatRoom;