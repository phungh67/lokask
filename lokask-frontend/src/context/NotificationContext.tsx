import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useEffect,
} from "react";
import { useLocation } from "react-router-dom";
import { AuthStorage } from "@/lib/storage";
import NotificationBanner from "@/components/notification/NotificationBanner";
import { useWebSocket } from "@/lib/websocket";
import { getAvatar } from "@/lib/consultants";

// For the transient floating banners
interface NotificationPayload {
  id: string;
  type:
    | "new_message"
    | "new_booking"
    | "booking_confirmed"
    | "booking_cancelled";
  senderName: string;
  senderAvatar?: string;
  preview: string;
  conversation_id?: string;
}

// For the persistent dropdown history
export interface AppNotification {
  id: string;
  type: string;
  content: string;
  is_read: boolean;
  created_at: string;
  reference_id?: string;
}

interface NotificationContextType {
  notifications: AppNotification[]; // Dropdown History
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  dismissBanner: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined,
);

export const NotificationProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  // --- SPLIT STATES ---
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeBanners, setActiveBanners] = useState<NotificationPayload[]>([]);

  const [token, setToken] = useState<string | null>(AuthStorage.getToken());
  const location = useLocation();
  const isDashboardRoute =
    location.pathname.startsWith("/consultant/dashboard") ||
    location.pathname.startsWith("/dashboard");

  // Listen to global auth-changed event
  useEffect(() => {
    const handleAuthChange = () => {
      setToken(AuthStorage.getToken());
    };
    window.addEventListener("auth-changed", handleAuthChange);
    return () => window.removeEventListener("auth-changed", handleAuthChange);
  }, []);

  // The Catch-Up Fetch depends on the token
  useEffect(() => {
    const fetchHistory = async () => {
      if (!token) {
        setNotifications([]);
        setUnreadCount(0);
        return;
      }

      try {
        const res = await fetch("/api/v1/notifications", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setNotifications(data || []);
          setUnreadCount((data || []).filter((n: any) => !n.is_read).length);
        }
      } catch (error) {
        console.error("Failed to load notification history", error);
      }
    };

    fetchHistory();
  }, [token]);

  const wsUrl = useMemo(() => {
    if (!token) return null;
    const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    return `${wsProtocol}//${window.location.host}/ws/notifications?token=${token}`;
  }, [token]);

  // 2. Handle Incoming Real-Time WebSocket Events
  const handleIncomingNotification = useCallback((payload: any) => {
    const id = payload.id || Date.now().toString();

    // A. Add to Dropdown History
    const historyItem: AppNotification = {
      id,
      type: payload.type,
      content: payload.preview || payload.content,
      is_read: false,
      created_at: payload.created_at || new Date().toISOString(),
      reference_id: payload.reference_id || payload.conversation_id,
    };

    setNotifications((prev) => [historyItem, ...prev]);
    setUnreadCount((prev) => prev + 1);

    // B. Add to Floating Banners
    const bannerItem: NotificationPayload = {
      id,
      type: payload.type as
        | "new_message"
        | "new_booking"
        | "booking_confirmed"
        | "booking_cancelled",
      senderName: payload.sender_name || "System",
      senderAvatar: getAvatar(payload.sender_avatar, payload.sender_name),
      preview: payload.preview,
      conversation_id: payload.conversation_id,
    };

    setActiveBanners((prev) => [...prev, bannerItem]);
  }, []);

  useWebSocket(wsUrl, handleIncomingNotification);

  // 3. Mark As Read API Calls
  const markAsRead = async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)),
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));

    if (token) {
      fetch(`/api/v1/notifications/${id}/read`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
    }
  };

  const markAllAsRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);

    if (token) {
      fetch(`/api/v1/notifications`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
    }
  };

  // 4. Dismiss Banner (Removes from screen, keeps in history dropdown)
  const dismissBanner = useCallback((id: string) => {
    setActiveBanners((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const handleBannerClick = (banner: NotificationPayload) => {
    if (banner.type === "new_message" && banner.conversation_id) {
      window.location.href = `/dashboard?chat=${banner.conversation_id}`;
    }
    dismissBanner(banner.id);
  };

  const visibleBanners = activeBanners.filter((notif) => {
    if (isDashboardRoute) {
      return ["new_booking", "booking_confirmed", "booking_cancelled"].includes(
        notif.type,
      );
    }
    return true;
  });

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        dismissBanner,
      }}
    >
      {children}

      <div className="fixed bottom-0 right-0 z-[9999] p-4 flex flex-col gap-2 pointer-events-none">
        {visibleBanners.map((banner) => (
          <div
            key={banner.id}
            className="pointer-events-auto animate-in slide-in-from-right-8 duration-300"
          >
            <NotificationBanner
              notification={{
                ...banner,
                senderAvatar:
                  banner.senderAvatar ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(banner.senderName)}&background=random`,
              }}
              onClose={dismissBanner}
              onClick={handleBannerClick}
            />
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error(
      "useNotifications must be used within a NotificationProvider",
    );
  }
  return context;
};
