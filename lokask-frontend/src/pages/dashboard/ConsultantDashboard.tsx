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
  startChat,
  ChatMessage,
  getChatSession,
} from "@/lib/api";

import { Consultant } from "@/types/consultant";

interface DashboardLocationState {
  intent?: string;
  targetId?: string;
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
  galleryImages: [],
};

const mapConversationToDashboard = (apiConv: any) => {
  const displayName = apiConv.other_user_name || "User";

  const displayAvatar = apiConv.other_user_avatar
    ? apiConv.other_user_avatar
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=random`;

  return {
    id: apiConv.id,
    otherUser: {
      name: displayName,
      avatar: displayAvatar,
    },
    lastMessage: apiConv.last_message || "Started a conversation",
    time: apiConv.last_message_at || new Date().toISOString(),
    unread: apiConv.unread_count || 0,
    travelerId: apiConv.traveler_id,
    consultantId: apiConv.consultant_id,
  };
};

const ConsultantDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as DashboardLocationState;

  const [activeSection, setActiveSection] = useState<
    "inbox" | "bookings" | "profile"
  >("inbox");
  const [activeSession, setActiveSession] = useState<any>(null);
  const [showPurchaseDialog, setShowPurchaseDialog] = useState(false);
  const [activeConversationId, setActiveConversationId] = useState<
    string | null
  >(null);
  const [conversations, setConversations] = useState<any[]>([]);
  const [currentMessages, setCurrentMessages] = useState<any[]>([]);

  const [userRole, setUserRole] = useState<string | null>(null);

  // Store both id, consultant ID and user ID
  const [accountUserId, setAccountUserId] = useState<string | null>(null);
  const [consultantProfile, setConsultantProfile] = useState<Consultant | null>(
    null,
  );

  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const pollInterval = useRef<NodeJS.Timeout | null>(null);

  // Handles jumping to existing chats OR creating new ones
  useEffect(() => {
    const handleIncomingChatIntent = async () => {
      const state = location.state as DashboardLocationState;

      // If no intent, or profiles are still loading, do nothing
      if (
        !state ||
        (!state.targetId && !state.openChatWith) ||
        isProfileLoading
      )
        return;

      const targetConsultantId = state.targetId || state.openChatWith;

      if (state.intent === "startChat" || targetConsultantId) {
        // 1. Check if we already have an active conversation with this consultant
        const existingConv = conversations.find(
          (c) =>
            c.consultantId === targetConsultantId ||
            c.id === targetConsultantId,
        );

        if (existingConv) {
          // If it exists, just open it
          setActiveConversationId(existingConv.id);
          setActiveSection("inbox");

          // Clear the router state so it doesn't re-trigger on refresh
          window.history.replaceState({}, document.title);
        } else if (targetConsultantId && accountUserId) {
          // 2. If it DOES NOT exist, we must create a new chat via the API
          try {
            const newConvApi = await startChat(targetConsultantId);

            // Map the newly created backend conversation to our frontend UI format
            const mappedNewConv = mapConversationToDashboard(newConvApi);

            // Inject it into the top of our inbox list and switch to it
            setConversations((prev) => {
              if (prev.some((c) => c.id === mappedNewConv.id)) return prev;
              return [mappedNewConv, ...prev];
            });
            setActiveConversationId(mappedNewConv.id);
            setActiveSection("inbox");

            // Clear the router state
            window.history.replaceState({}, document.title);
          } catch (error) {
            console.error("Failed to start new chat:", error);
            toast({
              title: "Error",
              description: "Could not start a chat with this expert.",
              variant: "destructive",
            });
          }
        }
      }
    };

    // We only want to run this once the initial conversations list has loaded
    handleIncomingChatIntent();
  }, [
    location.state,
    conversations,
    isProfileLoading,
    accountUserId,
    consultantProfile,
  ]);

  // 1. Check the stored ID pair (Updated Traveler Fallback)
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
          const response = await fetch(`/api/v1/users/${user.id}/consultant`, {
            headers: { Authorization: `Bearer ${token}` },
          });

          if (response.ok) {
            const consultantData = await response.json();
            setConsultantProfile(consultantData); // consultantID
          } else {
            setConsultantProfile({
              ...fallbackProfile,
              id: user.id,
              name: user.full_name || "User",
              avatarUrl: user.avatar_url || "",
            });
          }
        } else {
          // Clean state for travelers (empty ID instead of duplicated User ID)
          setConsultantProfile({
            ...fallbackProfile,
            id: "",
            name: user.full_name || "User",
            avatarUrl: user.avatar_url || "",
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

  // 2. Load inbox
  useEffect(() => {
    const loadInbox = async () => {
      if (!accountUserId || !consultantProfile || isProfileLoading) return;

      try {
        const data = await getInbox();
        const safeData = data ?? [];

        // Pass BOTH IDs to correctly map the "Other User"
        const mapped = safeData.map((apiConv: any) =>
          mapConversationToDashboard(apiConv),
        );

        const uniqueConversations = Array.from(
          new Map(mapped.map((item: any) => [item.id, item])).values(),
        );

        setConversations(mapped);

        if (!activeConversationId && uniqueConversations.length > 0) {
          setActiveConversationId(uniqueConversations[0].id);
        }
      } catch (error) {
        console.error("Failed to load inbox", error);
      }
    };

    loadInbox();
  }, [
    consultantProfile,
    accountUserId,
    isProfileLoading,
    activeConversationId,
  ]);

  // 3. Poll message
  useEffect(() => {
    if (
      !activeConversationId ||
      !accountUserId ||
      !consultantProfile ||
      isProfileLoading
    )
      return;

    const fetchMessages = async () => {
      try {
        const history = await getChatHistory(activeConversationId);
        const safeHistory = history ?? [];

        const uiMessages = safeHistory.map((m: any) => {
          const actualSenderId =
            m.sender_id || m.senderId || m.SenderID || m.SenderId;
          const isMe =
            actualSenderId === accountUserId ||
            actualSenderId === consultantProfile.id;

          return {
            id: (m.id || Date.now()).toString(),
            content: m.content,
            sender: isMe ? "user" : "other", // "user" guarantees right-side alignment
            timestamp: new Date(m.created_at || m.createdAt || Date.now()),
            type: m.type || "text",
          };
        });

        setCurrentMessages(uiMessages);

        const sessionData = await getChatSession(activeConversationId);
        setActiveSession(sessionData);
      } catch (error) {
        console.error("Failed to load history", error);
      }
    };

    fetchMessages();
    pollInterval.current = setInterval(fetchMessages, 3000);
    return () => {
      if (pollInterval.current) clearInterval(pollInterval.current);
    };
  }, [
    activeConversationId,
    consultantProfile,
    accountUserId,
    isProfileLoading,
  ]);

  // 4. Handle Send Message
  const handleSendMessage = async (content: string) => {
    console.log("[DEBUG] Attempting to send message...");
    console.log("  - Active Conv ID:", activeConversationId);
    console.log("  - My Account ID:", accountUserId);
    console.log("  - My Consultant ID:", consultantProfile?.id);

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
      type: "text",
    };
    setCurrentMessages((prev) => [...prev, optimisticMsg]);

    try {
      await sendMessage(activeConversationId, content);
      console.log("[DEBUG] Message sent successfully to API!");
    } catch (error: any) {
      console.error("[DEBUG] Backend rejected the message:", error);
      setCurrentMessages((prev) => prev.filter((m) => m.id !== tempId));
      if (
        error.message?.toLowerCase().include("expired") ||
        error.status === 403
      ) {
        setShowPurchaseDialog(true);
      } else {
        toast({
          title: "Message Failed",
          description: error.message || "The server rejected your message.",
          variant: "destructive",
        });
      }
    }
  };

  const renderConsultantOnly = (component: React.ReactNode) => {
    if (userRole === "consultant") return component;

    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-white text-center">
        <AlertCircle className="w-12 h-12 text-amber-500 mb-4" />
        <h2 className="text-xl font-bold mb-2">Consultant Feature Only</h2>
        <p className="text-muted-foreground max-w-sm mb-6">
          Managing bookings and schedules is only available for local
          consultants.
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
        <div className="animate-pulse text-xl font-semibold text-gray-500">
          Loading Dashboard...
        </div>
      </div>
    );
  }

  const foundConversation = conversations.find(
    (c) => c.id === activeConversationId,
  );
  const activeConversationData = foundConversation
    ? { ...foundConversation, messages: currentMessages }
    : null;

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
                  session={activeSession}
                  userRole={userRole}
                  onSendMessage={handleSendMessage}
                  onTriggerPurchase{() => setShowPurchaseDialog(true)}
                  onScheduleCall={() => {}}
                  onCancelCall={() => {}}
                  
                />
              ) : (
                <div className="flex-1 flex items-center justify-center text-muted-foreground">
                  Select a conversation to start chatting
                </div>
              )}
            </>
          )}

          {activeSection === "bookings" && (
            // renderConsultantOnly(<BookingsPanel consultantId={consultantProfile.id} />)
            <BookingsPanel
              consultantId={consultantProfile.id}
              userId={accountUserId}
              userRole={userRole}
            />
          )}

          {activeSection === "profile" && (
            <ProfilePanel
              consultant={consultantProfile}
              onSave={(updates) =>
                setConsultantProfile((prev) =>
                  prev ? { ...prev, ...updates } : null,
                )
              }
            />
          )}
        </main>
      </div>
    </div>
  );
};

export default ConsultantDashboard;
