import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import InboxPanel from "@/components/dashboard/InboxPanel";
import ChatPanel from "@/components/dashboard/ChatPanel";
import ProfilePanel from "@/components/dashboard/ProfilePanel";
import BookingsPanel from "@/components/dashboard/BookingsPanel";
import { toast } from "@/hooks/use-toast";
import { AlertCircle } from "lucide-react";
import {
  getInbox,
  getChatHistory,
  sendMessage,
  ChatMessage
} from "@/lib/api";

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

const mapConversationToDashboard = (apiConv: any, currentUserId: string | null) => {
  const isCurrentUserConsultant = apiConv.consultant_id === currentUserId;

  return {
    id: apiConv.id,
    otherUser: {
      name: isCurrentUserConsultant
        ? (apiConv.traveler_name || "Traveler")
        : (apiConv.consultant_name || "Local Expert"),
      avatar: isCurrentUserConsultant
        ? (apiConv.traveler_avatar || `https://ui-avatars.com/api/?name=Traveler&background=random`)
        : (apiConv.consultant_avatar || `https://ui-avatars.com/api/?name=Local&background=random`),
    },
    lastMessage: apiConv.last_message || "Started a conversation",
    time: apiConv.last_message_at || new Date().toISOString(),
    unread: apiConv.unread_count || 0,
    travelerId: apiConv.traveler_id,
    consultantId: apiConv.consultant_id
  };
};

const ConsultantDashboard = () => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<"inbox" | "bookings" | "profile">("inbox");
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<any[]>([]);
  const [currentMessages, setCurrentMessages] = useState<any[]>([]);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [consultantProfile, setConsultantProfile] = useState<Consultant | null>(null);
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const pollInterval = useRef<NodeJS.Timeout | null>(null);

  // 🟢 Effect 1: Initial Auth & Identity Fetching
  useEffect(() => {
    const loadIdentity = async () => {
      const storedUser = localStorage.getItem("user");
      const token = localStorage.getItem("token");

      if (!storedUser || !token) {
        navigate("/login");
        return;
      }

      try {
        const user = JSON.parse(storedUser);
        setUserRole(user.role);

        // If the user is a consultant, fetch their specific Consultant UUID
        if (user.role === "consultant") {
          const response = await fetch(`http://localhost:8080/api/v1/users/${user.id}/consultant`, {
            headers: { "Authorization": `Bearer ${token}` }
          });

          if (response.ok) {
            const consultantData = await response.json();
            // 🟢 This ID is now the REAL consultant UUID (e.g. CONS_456)
            setConsultantProfile(consultantData);
          } else {
            // Fallback if consultant record isn't found yet
            setConsultantProfile({
              ...fallbackProfile,
              id: user.id,
              name: user.full_name || "User",
            });
          }
        } else {
          // Standard traveler fallback
          setConsultantProfile({
            ...fallbackProfile,
            id: user.id,
            name: user.full_name || "User",
          });
        }
      } catch (error) {
        console.error("Dashboard Identity Error:", error);
        navigate("/login");
      } finally {
        setIsProfileLoading(false);
      }
    };

    loadIdentity();
  }, [navigate]);

  // 🟢 Effect 2: Load Inbox
  useEffect(() => {
    const loadInbox = async () => {
      if (!consultantProfile?.id || isProfileLoading) return;

      try {
        const data = await getInbox();

        const safeData = data ?? [];

        const mapped = safeData.map((apiConv: any) =>
          mapConversationToDashboard(apiConv, consultantProfile.id)
        );

        setConversations(mapped);

        if (!activeConversationId && mapped.length > 0) {
          setActiveConversationId(mapped[0].id);
        }
      } catch (error) {
        console.error("Failed to load inbox", error);
      }
    };

    loadInbox();
  }, [consultantProfile?.id, isProfileLoading, activeConversationId]);

  // 🟢 Effect 3: Poll Messages
  useEffect(() => {
    if (!activeConversationId || !consultantProfile || isProfileLoading) return;

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
  }, [activeConversationId, consultantProfile, isProfileLoading]);

  const handleSendMessage = async (content: string) => {
    if (!activeConversationId || !consultantProfile) return;
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

  const renderConsultantOnly = (component: React.ReactNode) => {
    if (userRole === "consultant") return component;

    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-white text-center">
        <AlertCircle className="w-12 h-12 text-amber-500 mb-4" />
        <h2 className="text-xl font-bold mb-2">Consultant Feature Only</h2>
        <p className="text-muted-foreground max-w-sm mb-6">
          Managing bookings and schedules is only available for local consultants.
        </p>
        <button
          onClick={() => navigate("/become-local")}
          className="bg-primary text-primary-foreground px-6 py-2 rounded-full font-medium"
        >
          Become a Local
        </button>
      </div>
    );
  };

  if (isProfileLoading || !consultantProfile) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#F5F2EE]">
        <div className="animate-pulse text-xl font-semibold text-gray-500">Loading Dashboard...</div>
      </div>
    );
  }

  const foundConversation = conversations.find((c) => c.id === activeConversationId);
  const activeConversationData = foundConversation ? { ...foundConversation, messages: currentMessages } : null;

  return (
    <div className="h-screen flex flex-col bg-[#F5F2EE]">
      <DashboardHeader />

      <div className="flex-1 flex overflow-hidden">
        <DashboardSidebar
          consultant={consultantProfile}
          activeSection={activeSection}
          onSectionChange={setActiveSection}
          userRole={userRole}
        />
        <main className="flex-1 flex overflow-hidden bg-white">
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
                <div className="flex-1 flex items-center justify-center text-muted-foreground">
                  Select a conversation to start chatting
                </div>
              )}
            </>
          )}

          {activeSection === "bookings" &&
            renderConsultantOnly(<BookingsPanel consultantId={consultantProfile.id} />)
          }

          {activeSection === "profile" && (
            <ProfilePanel
              consultant={consultantProfile}
              onSave={(updates) => setConsultantProfile((prev) => prev ? ({ ...prev, ...updates }) : null)}
            />
          )}
        </main>
      </div>
    </div>
  );
};

export default ConsultantDashboard;