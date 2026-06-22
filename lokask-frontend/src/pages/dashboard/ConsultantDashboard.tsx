import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import InboxPanel from "@/components/dashboard/InboxPanel";
import ChatPanel from "@/components/dashboard/ChatPanel";
import ProfilePanel from "@/components/dashboard/ProfilePanel";
import BookingsPanel from "@/components/dashboard/BookingsPanel";
import BlogPanel from "@/components/dashboard/BlogPanel";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { AlertCircle, MessageSquare, Calendar, User, FileText, ArrowLeft } from "lucide-react";
import {
  getInbox,
  getChatHistory,
  sendMessage,
  startChat,
  getChatSession,
} from "@/lib/chat";
import { ChatMessage } from "@/types/chat";

import { Consultant } from "@/types/consultant";

interface DashboardLocationState {
  intent?: string;
  targetId?: string;
  openChatWith?: string;
  consultantName?: string;
}

const fallbackProfile: Consultant = {
  id: "loading",
  userId: "loading",
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

  const handleLogout = async () => {
    try {
      await fetch("/api/v1/auth/logout", { method: "POST" });
    } catch (e) {
      console.error("Logout request failed", e);
    } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      // Clear saved dashboard state on logout
      localStorage.removeItem("dashboard_active_section");

      window.location.href = "/";
    }
  };

  // Lazily initialize state from localStorage to persist between refreshes
  const [activeSection, setActiveSection] = useState<
    "inbox" | "bookings" | "profile" | "articles"
  >(() => {
    const saved = localStorage.getItem("dashboard_active_section");
    return (saved as "inbox" | "bookings" | "profile" | "articles") || "inbox";
  });

  const [activeSession, setActiveSession] = useState<any>(null);
  const [showPurchaseDialog, setShowPurchaseDialog] = useState(false);
  const [activeConversationId, setActiveConversationId] = useState<
    string | null
  >(null);
  
  const [isMobileChatOpen, setIsMobileChatOpen] = useState(false);
  
  const [conversations, setConversations] = useState<any[]>([]);
  const [currentMessages, setCurrentMessages] = useState<any[]>([]);

  const [userRole, setUserRole] = useState<string | null>(null);

  const [accountUserId, setAccountUserId] = useState<string | null>(null);
  const [consultantProfile, setConsultantProfile] = useState<Consultant | null>(
    null,
  );

  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const pollInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    localStorage.setItem("dashboard_active_section", activeSection);
  }, [activeSection]);

  useEffect(() => {
    const handleIncomingChatIntent = async () => {
      const state = location.state as DashboardLocationState;

      if (
        !state ||
        (!state.targetId && !state.openChatWith) ||
        isProfileLoading
      )
        return;

      const targetConsultantId = state.targetId || state.openChatWith;

      if (state.intent === "startChat" || targetConsultantId) {
        const existingConv = conversations.find(
          (c) =>
            c.consultantId === targetConsultantId ||
            c.id === targetConsultantId,
        );

        if (existingConv) {
          setActiveConversationId(existingConv.id);
          setActiveSection("inbox");
          setIsMobileChatOpen(true); 

          window.history.replaceState({}, document.title);
        } else if (targetConsultantId && accountUserId) {
          try {
            const newConvApi = await startChat(targetConsultantId);

            const mappedNewConv = mapConversationToDashboard(newConvApi);

            setConversations((prev) => {
              if (prev.some((c) => c.id === mappedNewConv.id)) return prev;
              return [mappedNewConv, ...prev];
            });
            setActiveConversationId(mappedNewConv.id);
            setActiveSection("inbox");
            setIsMobileChatOpen(true); 

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

    handleIncomingChatIntent();
  }, [
    location.state,
    conversations,
    isProfileLoading,
    accountUserId,
    consultantProfile,
  ]);

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
        setAccountUserId(user.id); 

        if (user.role === "consultant") {
          const response = await fetch(`/api/v1/users/${user.id}/consultant`, {
            headers: { Authorization: `Bearer ${token}` },
          });

          if (response.ok) {
            const consultantData = await response.json();
            setConsultantProfile(consultantData); 
          } else {
            setConsultantProfile({
              ...fallbackProfile,
              id: user.id,
              name: user.full_name || "User",
              avatarUrl: user.avatar_url || "",
            });
          }
        } else {
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

  useEffect(() => {
    const loadInbox = async () => {
      if (!accountUserId || !consultantProfile || isProfileLoading) return;

      try {
        const data = await getInbox();
        const safeData = data ?? [];

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
            sender: isMe ? "user" : "other", 
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
    return () => {
      if (pollInterval.current) clearInterval(pollInterval.current);
    };
  }, [
    activeConversationId,
    consultantProfile,
    accountUserId,
    isProfileLoading,
  ]);

  const handleSendMessage = async (content: string) => {
    if (!activeConversationId || !accountUserId) {
      toast({ title: "Error", description: "Missing active chat or profile." });
      return;
    }

    const currentConv = conversations.find(
      (c) => c.id === activeConversationId,
    );
    const isActingAsConsultant = currentConv?.consultantId === accountUserId;
    const isSelfChat = currentConv?.consultantId === currentConv?.travelerId;

    const tempId = "temp-" + Date.now();

    const optimisticMsg = {
      id: tempId,
      conversation_id: activeConversationId,
      sender_id: accountUserId,
      content,
      is_read: true,
      created_at: new Date().toISOString(),
      timestamp: new Date(),
      sender: "user" as const,
      type: "text" as const,
    };

    setCurrentMessages((prev) => [...prev, optimisticMsg]);

    try {
      await sendMessage(activeConversationId, content);
    } catch (error: any) {
      setCurrentMessages((prev) => prev.filter((m) => m.id !== tempId));

      const errorStr = JSON.stringify(error).toLowerCase();
      const isSessionError =
        errorStr.includes("expired") ||
        errorStr.includes("package") ||
        error.status === 403 ||
        error.status === 404;

      if (isSessionError) {
        if (isSelfChat) {
          toast({
            title: "Test Chat",
            description:
              "You cannot purchase a package for yourself. (Self-chat exception needed on backend).",
          });
        } else if (isActingAsConsultant) {
          toast({
            title: "Session Ended",
            description:
              "The traveler's paid session has expired. They must top up before you can reply.",
            variant: "destructive",
          });
        } else {
          setShowPurchaseDialog(true);
        }
      } else {
        toast({
          title: "Message Failed",
          description: error.message || "The server rejected your message.",
          variant: "destructive",
        });
      }
    }
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

  const showMobileBottomNav = !isMobileChatOpen || activeSection !== "inbox";

  return (
    <div className="h-[100dvh] flex flex-col bg-[#F5F2EE] overflow-hidden">
      
      <div className={isMobileChatOpen && activeSection === "inbox" ? "hidden md:block" : "block"}>
        <DashboardHeader onLogout={handleLogout} />
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="hidden md:flex">
          <DashboardSidebar
            consultant={consultantProfile}
            activeSection={activeSection}
            onSectionChange={setActiveSection}
            userRole={userRole}
          />
        </div>

        <main className={`flex-1 flex overflow-hidden bg-white relative ${showMobileBottomNav ? 'pb-[64px] md:pb-0' : ''}`}>
          
          {activeSection === "inbox" && (
            <div className="flex-1 flex w-full h-full relative">
              <div className={`w-full md:w-[350px] md:border-r md:flex flex-col h-full bg-white ${isMobileChatOpen ? 'hidden' : 'flex'}`}>
                <InboxPanel
                  conversations={conversations}
                  activeConversationId={activeConversationId}
                  onSelectConversation={(id) => {
                    setActiveConversationId(id);
                    setIsMobileChatOpen(true);
                  }}
                />
              </div>

              <div className={`flex-1 flex-col h-full bg-white md:flex ${isMobileChatOpen ? 'flex w-full absolute inset-0 z-20' : 'hidden'}`}>
                <div className="md:hidden flex items-center p-3 border-b border-border/50 bg-white shadow-sm shrink-0">
                  <button 
                    onClick={() => setIsMobileChatOpen(false)} 
                    className="flex items-center text-[#4A5565] hover:text-[#101828] transition-colors"
                  >
                    <ArrowLeft className="w-5 h-5 mr-2" />
                    <span className="font-medium text-sm">Back to Inbox</span>
                  </button>
                </div>
                
                {activeConversationData ? (
                  <div className="flex-1 overflow-hidden relative">
                    <ChatPanel
                      conversation={activeConversationData}
                      session={activeSession}
                      userRole={userRole}
                      onSendMessage={handleSendMessage}
                      onTriggerPurchase={() => setShowPurchaseDialog(true)}
                      onScheduleCall={() => {}}
                      onCancelCall={() => {}}
                    />
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-muted-foreground bg-gray-50/50">
                    Select a conversation to start chatting
                  </div>
                )}
              </div>
            </div>
          )}

          {activeSection === "bookings" && (
             // 🟢 FIX: Replaced overflow-y-auto with flex and overflow-hidden
             <div className="flex-1 flex w-full h-full overflow-hidden">
               <BookingsPanel
                 consultantId={consultantProfile.id}
                 userId={accountUserId}
                 userRole={userRole}
               />
             </div>
          )}

          {activeSection === "profile" && (
            <div className="flex-1 w-full overflow-y-auto">
              <ProfilePanel
                consultant={consultantProfile}
                onSave={(updates) =>
                  setConsultantProfile((prev) =>
                    prev ? { ...prev, ...updates } : null,
                  )
                }
              />
            </div>
          )}

          {activeSection === "articles" && (
            <div className="flex-1 w-full overflow-y-auto">
              <BlogPanel consultant={consultantProfile} />
            </div>
          )}
        </main>
      </div>

      {showMobileBottomNav && (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around items-center h-[64px] pb-safe z-50">
          <button 
            onClick={() => { setActiveSection("inbox"); setIsMobileChatOpen(false); }} 
            className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${activeSection === 'inbox' ? 'text-[#C77752]' : 'text-[#6A7282]'}`}
          >
            <MessageSquare className="w-5 h-5" />
            <span className="text-[10px] font-semibold tracking-wide">Inbox</span>
          </button>
          
          <button 
            onClick={() => setActiveSection("bookings")} 
            className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${activeSection === 'bookings' ? 'text-[#C77752]' : 'text-[#6A7282]'}`}
          >
            <Calendar className="w-5 h-5" />
            <span className="text-[10px] font-semibold tracking-wide">Bookings</span>
          </button>
          
          <button 
            onClick={() => setActiveSection("profile")} 
            className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${activeSection === 'profile' ? 'text-[#C77752]' : 'text-[#6A7282]'}`}
          >
            <User className="w-5 h-5" />
            <span className="text-[10px] font-semibold tracking-wide">Profile</span>
          </button>
          
          {userRole === "consultant" && (
            <button 
              onClick={() => setActiveSection("articles")} 
              className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${activeSection === 'articles' ? 'text-[#C77752]' : 'text-[#6A7282]'}`}
            >
              <FileText className="w-5 h-5" />
              <span className="text-[10px] font-semibold tracking-wide">Articles</span>
            </button>
          )}
        </nav>
      )}

      {/* Purchase / Top Up Dialog */}
      <Dialog open={showPurchaseDialog} onOpenChange={setShowPurchaseDialog}>
        <DialogContent className="max-w-md rounded-2xl p-6 w-[95vw] md:w-full">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-[#FCE8E0] rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-[#C77752]" />
            </div>
            <h2 className="text-2xl font-bold text-[#101828]">
              Time to top up!
            </h2>
            <p className="text-[#4A5565]">
              Your previous consultation session has ended. To continue getting
              advice and real-time support, please select a new package.
            </p>
            <div className="pt-4 flex flex-col gap-3">
              <button
                onClick={() => {
                  setShowPurchaseDialog(false);
                  navigate(
                    `/consultant/${activeConversationData?.consultantId}/packages`,
                  );
                }}
                className="w-full h-12 rounded-full bg-[#C77752] hover:bg-[#b06745] text-white font-medium transition-colors"
              >
                View Packages
              </button>
              <button
                onClick={() => setShowPurchaseDialog(false)}
                className="w-full h-12 rounded-full text-[#6A7282] hover:bg-gray-100 font-medium transition-colors"
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

export default ConsultantDashboard;