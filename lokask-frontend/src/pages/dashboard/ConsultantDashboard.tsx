import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
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

interface DashboardLocationState {
  openChatWith?: string;
  consultantName?: string;
}

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

// Check the "other_user_id" to correctly display the avatar and name instead of hardcode these things
const mapConversationToDashboard = (apiConv: any, accountId: string | null, consultantId: string | null) => {
  // Check if my ID pair matches the consultant_id of this conversation
  const amIConsultant = apiConv.consultant_id === accountId || apiConv.consultant_id === consultantId;

  return {
    id: apiConv.id,
    otherUser: {
      name: amIConsultant
        ? (apiConv.traveler_name || "Traveler")
        : (apiConv.consultant_name || "Local Expert"),
      avatar: amIConsultant
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
  const location = useLocation();
  const state = location.state as DashboardLocationState;

  const [activeSection, setActiveSection] = useState<"inbox" | "bookings" | "profile">("inbox");
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<any[]>([]);
  const [currentMessages, setCurrentMessages] = useState<any[]>([]);

  const [userRole, setUserRole] = useState<string | null>(null);

  // Store both id, consultant ID and user ID
  const [accountUserId, setAccountUserId] = useState<string | null>(null);
  const [consultantProfile, setConsultantProfile] = useState<Consultant | null>(null);

  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const pollInterval = useRef<NodeJS.Timeout | null>(null);

  // Navigate from "ask" to inbox
  useEffect(() => {
    if (location.state?.openChatWith && conversations.length > 0) {
      const existingConv = conversations.find(c =>
        c.consultantId === location.state.openChatWith ||
        c.id === location.state.openChatWith
      );

      if (existingConv) {
        setActiveConversationId(existingConv.id);
        setActiveSection("inbox");
      }
    }
  }, [location.state, conversations]);

  // 🟢 1. Check the stored ID pair (Updated Traveler Fallback)
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
        setAccountUserId(user.id); // userID

        if (user.role === "consultant") {
          const response = await fetch(`http://localhost:8080/api/v1/users/${user.id}/consultant`, {
            headers: { "Authorization": `Bearer ${token}` }
          });

          if (response.ok) {
            const consultantData = await response.json();
            setConsultantProfile(consultantData); // consultantID
          } else {
            setConsultantProfile({ ...fallbackProfile, id: user.id, name: user.full_name || "User" });
          }
        } else {
          // 🟢 FIX 1: Clean state for travelers (empty ID instead of duplicated User ID)
          setConsultantProfile({ ...fallbackProfile, id: "", name: user.full_name || "User" });
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

  // 🟢 2. Load inbox (Updated Guard)
  useEffect(() => {
    const loadInbox = async () => {
      // 🟢 FIX 2: Gate purely on accountUserId and consultantProfile existence (not truthy ID)
      if (!accountUserId || !consultantProfile || isProfileLoading) return;

      try {
        const data = await getInbox();
        const safeData = data ?? [];

        // Pass BOTH IDs to correctly map the "Other User"
        const mapped = safeData.map((apiConv: any) =>
          mapConversationToDashboard(apiConv, accountUserId, consultantProfile.id)
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
  }, [consultantProfile, accountUserId, isProfileLoading, activeConversationId]);

  // Poll message
  useEffect(() => {
    if (!activeConversationId || !accountUserId || !consultantProfile || isProfileLoading) return;

    const fetchMessages = async () => {
      try {
        const history = await getChatHistory(activeConversationId);
        const safeHistory = history ?? [];

        const uiMessages = safeHistory.map((m: any) => {
          const actualSenderId = m.sender_id || m.senderId || m.SenderID || m.SenderId;

          const isMe = actualSenderId === accountUserId || actualSenderId === consultantProfile.id;

          console.log(`[POLL] Msg: "${m.content}" | Backend ID: ${actualSenderId} | isMe: ${isMe}`);

          return {
            id: (m.id || Date.now()).toString(),
            content: m.content,
            sender: isMe ? "user" : "other", // "user" guarantees right-side alignment
            timestamp: new Date(m.created_at || m.createdAt || Date.now()),
            type: m.type || "text",
          };
        });

        setCurrentMessages(uiMessages);
      } catch (error) {
        console.error("Failed to load history", error);
      }
    };

    fetchMessages();
    pollInterval.current = setInterval(fetchMessages, 3000);
    return () => { if (pollInterval.current) clearInterval(pollInterval.current); };
  }, [activeConversationId, consultantProfile, accountUserId, isProfileLoading]);

  // 🟢 4. Handle Send Message (Updated Guard)
  const handleSendMessage = async (content: string) => {
    console.log("[DEBUG] Attempting to send message...");
    console.log("  - Active Conv ID:", activeConversationId);
    console.log("  - My Account ID:", accountUserId);
    console.log("  - My Consultant ID:", consultantProfile?.id);

    // 🟢 FIX 4: Gate entirely on accountUserId, which every user guarantees to have.
    if (!activeConversationId || !accountUserId) {
      toast({ title: "Error", description: "Missing active chat or profile." });
      return;
    }

    const tempId = "temp-" + Date.now();

    const optimisticMsg = {
      id: tempId,
      content,
      sender: "user",
      timestamp: new Date(),
      type: "text"
    };
    setCurrentMessages((prev) => [...prev, optimisticMsg]);

    try {
      await sendMessage(activeConversationId, content);
      console.log("[DEBUG] Message sent successfully to API!");
    } catch (error: any) {
      console.error("[DEBUG] Backend rejected the message:", error);
      toast({
        title: "Message Failed",
        description: error.message || "The server rejected your message.",
        variant: "destructive"
      });
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