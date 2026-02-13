import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import InboxPanel from "@/components/dashboard/InboxPanel";
import ChatPanel from "@/components/dashboard/ChatPanel";
import ProfilePanel from "@/components/dashboard/ProfilePanel";
import BookingsPanel from "@/components/dashboard/BookingsPanel";
import { toast } from "@/hooks/use-toast";
import { AlertCircle } from "lucide-react"; // 🟢 Added for restricted notices
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
  // Determine if the "other person" is the consultant or the traveler
  // If the current user is the consultant, we want to show the traveler's info
  // If the current user is the traveler, we want to show the consultant's info
  const isCurrentUserConsultant = apiConv.consultant_id === currentUserId;

  return {
    id: apiConv.id,
    otherUser: {
      // 🟢 Show the name of the person you are NOT
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
    // Pass original IDs for reference
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
  const [userRole, setUserRole] = useState<string | null>(null); // 🟢 Added role state

  const handleScheduleCall = async (callData: any) => {
  if (!activeConversationId) return;

  try {
    // 🟢 Replace with your real API call (e.g., in api.ts)
    // await createScheduledCall(activeConversationId, callData);
    
    toast({
      title: "Success",
      description: `Call scheduled for ${new Date(callData.scheduledAt).toLocaleString()}`,
    });

    // Optionally refresh history or inbox to show the "Call Scheduled" message
  } catch (error) {
    toast({
      title: "Error",
      description: "Failed to schedule the call. Please try again.",
      variant: "destructive",
    });
  }
};

  const [consultantProfile, setConsultantProfile] = useState<Consultant | null>(null);
  const pollInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      navigate("/login");
      return;
    }

    try {
      const user = JSON.parse(storedUser);
      setUserRole(user.role); // 🟢 Store user role

      setConsultantProfile({
        ...fallbackProfile,
        id: user.id,
        name: user.full_name || user.name || "User",
        displayName: user.full_name || user.name || "User",
        avatarUrl: user.avatar_url || "",
        coverUrl: (user as any).cover_url || "",
      });
    } catch (error) {
      console.error("Error parsing user data", error);
      navigate("/login");
    }
  }, [navigate]);

  useEffect(() => {
    const loadInbox = async () => {
      if (!consultantProfile?.id) return;
      try {
        const data = await getInbox();
        // 🟢 Pass current profile ID to the mapper
        const mapped = data.map((apiConv: any) =>
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
  }, [consultantProfile?.id]);

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

  // 🟢 Helper for Role-Based Feature Gating
  const renderConsultantOnly = (component: React.ReactNode) => {
    if (userRole === "consultant") return component;

    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-white text-center">
        <AlertCircle className="w-12 h-12 text-amber-500 mb-4" />
        <h2 className="text-xl font-bold mb-2">Consultant Feature Only</h2>
        <p className="text-muted-foreground max-w-sm mb-6">
          Managing bookings and schedules is only available for local consultants.
          Want to share your expertise?
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
      <DashboardHeader />

      <div className="flex-1 flex overflow-hidden">
        <DashboardSidebar
          consultant={consultantProfile as any}
          activeSection={activeSection}
          onSectionChange={setActiveSection}
          userRole={userRole} // 🟢 Pass role to sidebar if needed later
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
          {/* 🟢 Restricted Section */}
          {activeSection === "bookings" && renderConsultantOnly(<BookingsPanel />)}

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