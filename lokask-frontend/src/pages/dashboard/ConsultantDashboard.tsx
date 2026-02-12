import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import InboxPanel from "@/components/dashboard/InboxPanel";
import ChatPanel from "@/components/dashboard/ChatPanel";
import ProfilePanel from "@/components/dashboard/ProfilePanel";
import BookingsPanel from "@/components/dashboard/BookingsPanel";
import { toast } from "@/hooks/use-toast";
import { 
  getInbox, 
  getChatHistory, 
  sendMessage, 
  ChatMessage 
} from "@/lib/api";

// 🟢 Use only the unified Consultant type
import { Consultant } from "@/types/consultant";

const fallbackProfile: Consultant = {
  id: "loading",
  name: "Loading...",
  displayName: "Loading...",
  city: "",
  country: "",
  tag: "Local",
  tags: [],
  quote: "",
  rating: 0,
  helpedCount: 0,
  avatarUrl: "",
  coverUrl: "",
  isHighlyTrusted: false,
  bio: "",
  languages: [],
  responseTime: "1 hour",
  isOnline: false,
  galleryImages: []
};

const mapConversationToDashboard = (apiConv: any) => ({
  id: apiConv.id,
  traveller: {
    name: apiConv.traveler_name || "Traveler", 
    avatar: apiConv.traveler_avatar || "https://ui-avatars.com/api/?name=Traveler&background=random",
  },
  lastMessage: apiConv.last_message || "Started a conversation",
  time: apiConv.last_message_at || new Date().toISOString(),
  unread: 0,
  messages: [],
  scheduledCalls: [],
});

const ConsultantDashboard = () => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<"inbox" | "bookings" | "profile">("inbox");
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<any[]>([]);
  const [currentMessages, setCurrentMessages] = useState<any[]>([]);

  // 🟢 State now strictly uses Consultant type
  const [consultantProfile, setConsultantProfile] = useState<Consultant | null>(null);
  const pollInterval = useRef<NodeJS.Timeout | null>(null);

  // 3. Load Real User from LocalStorage
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      navigate("/login");
      return;
    }

    try {
      const user = JSON.parse(storedUser);
      setConsultantProfile({
        ...fallbackProfile,
        id: user.id,
        name: user.full_name || user.name || "User",
        displayName: user.full_name || user.name || "User",
        avatarUrl: user.avatar_url || "", // 🟢 Property from consultant.ts
        coverUrl: (user as any).cover_url || "", // 🟢 Property from consultant.ts
      });
    } catch (error) {
      console.error("Error parsing user data", error);
      navigate("/login");
    }
  }, [navigate]);

  // 4. Fetch Real Inbox
  useEffect(() => {
    const loadInbox = async () => {
      try {
        const data = await getInbox();
        const mapped = data.map(mapConversationToDashboard);
        setConversations(mapped);
        if (!activeConversationId && mapped.length > 0) {
          setActiveConversationId(mapped[0].id);
        }
      } catch (error) {
        console.error("Failed to load inbox", error);
      }
    };
    loadInbox();
  }, []);

  // 5. Fetch Messages with Dynamic Polling
  useEffect(() => {
    if (!activeConversationId || !consultantProfile) return;

    const fetchMessages = async () => {
      try {
        const history = await getChatHistory(activeConversationId);
        const uiMessages = history.map((m: ChatMessage) => ({
          id: m.id.toString(),
          content: m.content,
          sender: m.sender_id === consultantProfile.id ? "consultant" : "traveler",
          timestamp: new Date(m.created_at),
          type: "text",
        }));
        setCurrentMessages(uiMessages);
      } catch (error) {
        console.error("Failed to load history", error);
      }
    };

    fetchMessages();
    pollInterval.current = setInterval(fetchMessages, 3000);
    return () => { if (pollInterval.current) clearInterval(pollInterval.current); };
  }, [activeConversationId, consultantProfile]);

  // 6. Handle Send
  const handleSendMessage = async (content: string) => {
    if (!activeConversationId) return;
    const tempId = Date.now().toString();
    const optimisticMsg = { id: tempId, content, sender: "consultant", timestamp: new Date(), type: "text" };
    setCurrentMessages((prev) => [...prev, optimisticMsg]);

    try {
      await sendMessage(activeConversationId, content);
    } catch (error) {
      toast({ title: "Error", description: "Failed to send message", variant: "destructive" });
      setCurrentMessages((prev) => prev.filter((m) => m.id !== tempId));
    }
  };

  const foundConversation = conversations.find((c) => c.id === activeConversationId);
  const activeConversationData = foundConversation ? { ...foundConversation, messages: currentMessages } : null;

  if (!consultantProfile) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#F5F2EE]">
        <div className="animate-pulse text-xl font-semibold text-gray-500">Loading Dashboard...</div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-[#F5F2EE]">
      {/* 🟢 Passing real profile to components */}
      <DashboardHeader consultant={consultantProfile as any} />

      <div className="flex-1 flex overflow-hidden">
        <DashboardSidebar
          consultant={consultantProfile as any}
          activeSection={activeSection}
          onSectionChange={setActiveSection}
        />
        <main className="flex-1 flex overflow-hidden">
          {activeSection === "inbox" && (
            <>
              <InboxPanel
                conversations={conversations}
                activeConversationId={activeConversationId}
                onSelectConversation={setActiveConversationId}
              />
              {activeConversationData ? (
                <ChatPanel
                  conversation={activeConversationData}
                  onSendMessage={handleSendMessage}
                  onScheduleCall={() => { }}
                  onCancelCall={() => { }}
                />
              ) : (
                <div className="flex-1 flex items-center justify-center text-muted-foreground bg-white">
                  Select a conversation to start chatting
                </div>
              )}
            </>
          )}
          {activeSection === "bookings" && <BookingsPanel />}
          {activeSection === "profile" && (
            <ProfilePanel
              consultant={consultantProfile as any}
              onSave={(updates) => setConsultantProfile((prev) => prev ? ({ ...prev, ...updates }) : null)}
            />
          )}
        </main>
      </div>
    </div>
  );
};

export default ConsultantDashboard;