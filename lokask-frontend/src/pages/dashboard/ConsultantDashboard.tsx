import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import InboxPanel from "@/components/dashboard/InboxPanel";
import DashboardChatRoom from "@/components/dashboard/ChatRoom";
import ProfilePanel from "@/components/dashboard/ProfilePanel";
import BookingsPanel from "@/components/dashboard/BookingsPanel";
import BlogPanel from "@/components/dashboard/BlogPanel";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import {
  AlertCircle,
  MessageSquare,
  Calendar,
  User,
  FileText,
  ArrowLeft,
} from "lucide-react";
import { getInbox, startChat } from "@/lib/chat";
import { getConsultantByUserId } from "@/lib/consultants";
import { getConsultantBookings, getMyTrips } from "@/lib/bookings";
import { Booking } from "@/types/booking";
import { Consultant } from "@/types/consultant";
import { AuthStorage } from "@/lib/storage";
import { useNotifications } from "@/context/NotificationContext";

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
      id:
        apiConv.other_user_id ||
        apiConv.traveler_id ||
        apiConv.consultant_id ||
        "",
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

  const { notifications, markAsRead } = useNotifications();
  const latestNotifId = notifications[0]?.id;

  const handleLogout = async () => {
    try {
      await fetch("/api/v1/auth/logout", { method: "POST" });
    } catch (e) {
      console.error("Logout request failed", e);
    } finally {
      AuthStorage.clearAll();
      window.location.href = "/";
    }
  };

  const [activeSection, setActiveSection] = useState<
    "inbox" | "bookings" | "profile" | "articles"
  >(() => {
    const saved = AuthStorage.getDashboardSection();
    return (saved as "inbox" | "bookings" | "profile" | "articles") || "inbox";
  });

  const [showPurchaseDialog, setShowPurchaseDialog] = useState(false);
  const [activeConversationId, setActiveConversationId] = useState<
    string | null
  >(null);
  const [isMobileChatOpen, setIsMobileChatOpen] = useState(false);

  const [conversations, setConversations] = useState<any[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);

  const [userRole, setUserRole] = useState<string | null>(null);
  const [accountUserId, setAccountUserId] = useState<string | null>(null);
  const [consultantProfile, setConsultantProfile] = useState<Consultant | null>(
    null,
  );
  const [isProfileLoading, setIsProfileLoading] = useState(true);

  const hasUnreadMessages = useMemo(() => {
    return conversations.some((c) => c.unread > 0);
  }, [conversations]);

  const hasUnreadBookings = useMemo(() => {
    return notifications.some(
      (n) =>
        ["new_booking", "booking_confirmed", "booking_cancelled"].includes(
          n.type,
        ) && !n.is_read,
    );
  }, [notifications]);

  useEffect(() => {
    if (activeSection === "bookings" && hasUnreadBookings) {
      notifications.forEach((n) => {
        if (
          ["new_booking", "booking_confirmed", "booking_cancelled"].includes(
            n.type,
          ) &&
          !n.is_read
        ) {
          markAsRead(n.id);
        }
      });
    }
  }, [activeSection, hasUnreadBookings, notifications, markAsRead]);

  useEffect(() => {
    AuthStorage.setDashboardSection(activeSection);
  }, [activeSection]);

  // Load Identity
  useEffect(() => {
    const loadIdentity = async () => {
      const storedUser = AuthStorage.getUser();
      const token = AuthStorage.getToken();

      if (!storedUser || !token) {
        navigate("/login");
        return;
      }

      try {
        const user = storedUser;
        setUserRole(user.role);
        setAccountUserId(user.id);

        if (user.role === "consultant") {
          try {
            const consultantData = await getConsultantByUserId(user.id);
            setConsultantProfile(consultantData);
          } catch (error) {
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

  // Load Inbox
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
    latestNotifId
  ]);

  // Fetch Global Bookings for State Sharing
  useEffect(() => {
    const loadBookings = async () => {
      if (!accountUserId || !consultantProfile || isProfileLoading) return;

      try {
        let data: any;
        if (userRole === "consultant" && consultantProfile.id) {
          data = await getConsultantBookings(consultantProfile.id);
        } else {
          data = await getMyTrips(accountUserId);
        }
        const bookingsArray = Array.isArray(data) ? data : data?.data || [];
        setBookings(bookingsArray);
      } catch (error) {
        console.error("Failed to fetch global bookings", error);
      }
    };

    loadBookings();
    const intervalId = setInterval(loadBookings, 30000);
    return () => clearInterval(intervalId);
  }, [consultantProfile, accountUserId, userRole, isProfileLoading, latestNotifId]);

  // Handle Incoming Chat Intent
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

  const handleInboxMessageUpdate = (convId: string, newMsg: any) => {
    setConversations((prev) =>
      prev.map((conv) => {
        if (conv.id === convId) {
          return {
            ...conv,
            lastMessage: newMsg.content,
            time: newMsg.timestamp,
          };
        }
        return conv;
      }),
    );
  };

  const foundConversation = conversations.find(
    (c) => c.id === activeConversationId,
  );

  const activeBooking = useMemo(() => {
    if (!foundConversation || bookings.length === 0 || !accountUserId)
      return null;

    const now = new Date();
    const otherUserId = foundConversation.otherUser?.id;

    return bookings.find((b) => {
      let isCorrectParticipants = false;

      if (userRole === "consultant") {
        const chatTravelerId = foundConversation.travelerId || otherUserId;
        isCorrectParticipants =
          b.consultant_id === consultantProfile?.id &&
          b.user_id === chatTravelerId;
      } else {
        const chatConsultantId = foundConversation.consultantId || otherUserId;
        isCorrectParticipants =
          b.user_id === accountUserId && b.consultant_id === chatConsultantId;
      }

      const isConfirmed = b.status === "confirmed";

      const endTime = new Date(b.end_time);
      const isNotExpired = endTime >= now;

      return isCorrectParticipants && isConfirmed && isNotExpired;
    });
  }, [bookings, foundConversation, accountUserId, userRole, consultantProfile]);

  if (isProfileLoading || !consultantProfile) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#F5F2EE]">
        <div className="animate-pulse text-xl font-semibold text-gray-500">
          Loading Dashboard...
        </div>
      </div>
    );
  }

  const showMobileBottomNav = !isMobileChatOpen || activeSection !== "inbox";

  return (
    <div className="h-[100dvh] flex flex-col bg-[#F5F2EE] overflow-hidden">
      <div
        className={
          isMobileChatOpen && activeSection === "inbox"
            ? "hidden md:block"
            : "block"
        }
      >
        <DashboardHeader onLogout={handleLogout} />
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="hidden md:flex">
          <DashboardSidebar
            consultant={consultantProfile}
            activeSection={activeSection}
            onSectionChange={setActiveSection}
            userRole={userRole}
            hasUnreadMessages={hasUnreadMessages}
            hasUnreadBookings={hasUnreadBookings}
          />
        </div>

        <main
          className={`flex-1 flex overflow-hidden bg-white relative ${showMobileBottomNav ? "pb-[64px] md:pb-0" : ""}`}
        >
          {activeSection === "inbox" && (
            <div className="flex-1 flex w-full h-full relative">
              <div
                className={`w-full md:w-[350px] md:border-r md:flex flex-col h-full bg-white ${isMobileChatOpen ? "hidden" : "flex"}`}
              >
                <InboxPanel
                  conversations={conversations}
                  activeConversationId={activeConversationId}
                  onSelectConversation={(id) => {
                    setActiveConversationId(id);
                    setIsMobileChatOpen(true);
                  }}
                />
              </div>

              <div
                className={`flex-1 flex-col h-full bg-white md:flex ${isMobileChatOpen ? "flex w-full absolute md:relative inset-0 md:inset-auto z-20 md:z-auto" : "hidden"}`}
              >
                <div className="md:hidden flex items-center p-3 border-b border-border/50 bg-white shadow-sm shrink-0">
                  <button
                    onClick={() => setIsMobileChatOpen(false)}
                    className="flex items-center text-[#4A5565] hover:text-[#101828] transition-colors"
                  >
                    <ArrowLeft className="w-5 h-5 mr-2" />
                    <span className="font-medium text-sm">Back to Inbox</span>
                  </button>
                </div>

                {foundConversation ? (
                  <DashboardChatRoom
                    activeConversationId={activeConversationId!}
                    accountUserId={accountUserId!}
                    consultantProfile={consultantProfile}
                    userRole={userRole}
                    conversationData={foundConversation}
                    onTriggerPurchase={() => setShowPurchaseDialog(true)}
                    onMessageUpdate={handleInboxMessageUpdate}
                    activeBooking={activeBooking || null}
                  />
                ) : (
                  <div className="flex-1 flex items-center justify-center text-muted-foreground bg-gray-50/50">
                    Select a conversation to start chatting
                  </div>
                )}
              </div>
            </div>
          )}

          {activeSection === "bookings" && (
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
            onClick={() => {
              setActiveSection("inbox");
              setIsMobileChatOpen(false);
            }}
            className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${activeSection === "inbox" ? "text-[#C77752]" : "text-[#6A7282]"}`}
          >
            <div className="relative">
              <MessageSquare className="w-5 h-5" />
              {/* 🟢 Unread Message Dot */}
              {hasUnreadMessages && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border border-white" />
              )}
            </div>
            <span className="text-[10px] font-semibold tracking-wide">
              Inbox
            </span>
          </button>

          <button
            onClick={() => setActiveSection("bookings")}
            className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${activeSection === "bookings" ? "text-[#C77752]" : "text-[#6A7282]"}`}
          >
            <div className="relative">
              <Calendar className="w-5 h-5" />
              {/* 🟢 Unread Booking Dot */}
              {hasUnreadBookings && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border border-white" />
              )}
            </div>
            <span className="text-[10px] font-semibold tracking-wide">
              Bookings
            </span>
          </button>

          <button
            onClick={() => setActiveSection("profile")}
            className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${activeSection === "profile" ? "text-[#C77752]" : "text-[#6A7282]"}`}
          >
            <User className="w-5 h-5" />
            <span className="text-[10px] font-semibold tracking-wide">
              Profile
            </span>
          </button>

          {userRole === "consultant" && (
            <button
              onClick={() => setActiveSection("articles")}
              className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${activeSection === "articles" ? "text-[#C77752]" : "text-[#6A7282]"}`}
            >
              <FileText className="w-5 h-5" />
              <span className="text-[10px] font-semibold tracking-wide">
                Articles
              </span>
            </button>
          )}
        </nav>
      )}

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
                    `/consultant/${foundConversation?.consultantId}/packages`,
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
