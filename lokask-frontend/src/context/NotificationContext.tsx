import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
} from "react";
import { useLocation } from "react-router-dom";
import { AuthStorage } from "@/lib/storage";
import NotificationBanner from "@/components/notification/NotificationBanner";
import { useWebSocket } from "@/lib/websocket";
import { getAvatar } from "@/lib/consultants";
import { toast } from "@/hooks/use-toast";

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

interface NotificationContextType {
  notifications: NotificationPayload[];
  dismissNotification: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined,
);

export const NotificationProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [notifications, setNotifications] = useState<NotificationPayload[]>([]);
  const location = useLocation();

  const isDashboardRoute =
    location.pathname.startsWith("/consultant/dashboard") ||
    location.pathname.startsWith("/dashboard");

  const wsUrl = useMemo(() => {
    const token = AuthStorage.getToken();
    if (!token) return null;

    const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    return `${wsProtocol}//${window.location.host}/ws/notifications?token=${token}`;
  }, []);

  const handleIncomingNotification = useCallback((payload: any) => {
    const bookingEvents = [
      "new_booking",
      "booking_confirmed",
      "booking_cancelled",
    ];

    if (bookingEvents.includes(payload.type)) {
      const titles: Record<string, string> = {
        new_booking: "New Booking Request",
        booking_confirmed: "Booking Confirmed",
        booking_cancelled: "Booking Cancelled",
      };

      toast({
        title: titles[payload.type] || "Booking Update",
        description: payload.preview,
        className:
          payload.type === "booking_cancelled"
            ? "border-destructive bg-destructive/5 text-destructive"
            : "border-primary bg-primary/5",
      });

      return;
    }

    const newNotification: NotificationPayload = {
      id: payload.id || Date.now().toString(),
      type: payload.type,
      senderName: payload.sender_name,
      senderAvatar: getAvatar(payload.sender_avatar, payload.sender_name),
      preview: payload.preview,
      conversation_id: payload.conversation_id,
    };

    setNotifications((prev) => [...prev, newNotification]);
  }, []);

  useWebSocket(wsUrl, handleIncomingNotification);

  const dismissNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const handleNotificationClick = (notification: NotificationPayload) => {
    if (notification.type === "new_message" && notification.conversation_id) {
      window.location.href = `/dashboard?chat=${notification.conversation_id}`;
    }
    dismissNotification(notification.id);
  };

  return (
    <NotificationContext.Provider
      value={{ notifications, dismissNotification }}
    >
      {children}

      {!isDashboardRoute && (
        <div className="fixed bottom-0 right-0 z-[9999] p-4 flex flex-col gap-2 pointer-events-none">
          {notifications.map((notif) => (
            <div key={notif.id} className="pointer-events-auto">
              <NotificationBanner
                notification={{
                  ...notif,
                  senderAvatar:
                    notif.senderAvatar ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(notif.senderName)}&background=random`,
                }}
                onClose={dismissNotification}
                onClick={handleNotificationClick}
              />
            </div>
          ))}
        </div>
      )}
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
