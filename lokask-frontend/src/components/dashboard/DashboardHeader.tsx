import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { Bell, User, LogOut } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AuthStorage } from "@/lib/storage";
import { useNotifications } from "@/context/NotificationContext"; // 🟢 Hooked in
import { formatDistanceToNow } from "date-fns";

interface DashboardHeaderProps {
  onLogout: () => void;
}

const DashboardHeader = ({ onLogout }: DashboardHeaderProps) => {
  const user = AuthStorage.getUser();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fallback values if data is missing
  const displayName = user?.full_name || "Consultant";
  const avatarUrl = user?.avatar_url || "";
  const initial = displayName.charAt(0).toUpperCase();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="h-16 border-b border-border bg-card flex items-center justify-between px-6 shrink-0 sticky top-0 z-10">
      {/* Unified Logo Styling */}
      <Link to="/" className="flex items-center shrink-0">
        <span className="text-2xl font-black font-body tracking-tight">
          <span className="text-foreground font-extrabold text-3xl">Lok</span>
          <span className="text-primary text-3xl">ask</span>
        </span>
      </Link>

      {/* Right section */}
      <div className="flex items-center gap-4">
        {/* Earnings Badge */}
        <Badge className="hidden md:inline-flex bg-green-100 text-green-700 hover:bg-green-100 px-3 py-1 font-medium border-none">
          This week $0.00
        </Badge>

        {/* 🟢 Notifications Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <Button
            variant="ghost"
            size="icon"
            className="relative hover:bg-muted transition-colors"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          >
            <Bell className="h-5 w-5 text-muted-foreground" />
            {unreadCount > 0 && (
              <span className="absolute top-2.5 right-2.5 h-2.5 w-2.5 bg-destructive border-2 border-card rounded-full animate-in zoom-in" />
            )}
          </Button>

          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-border/50 rounded-xl shadow-xl z-50 flex flex-col max-h-[70vh] overflow-hidden animate-in slide-in-from-top-2 fade-in duration-200">
              <div className="p-4 border-b border-border/50 flex justify-between items-center bg-gray-50/50 shrink-0">
                <h3 className="font-semibold text-sm">Notifications</h3>
                {unreadCount > 0 && (
                  <button onClick={markAllAsRead} className="text-xs text-primary hover:underline font-medium">
                    Mark all as read
                  </button>
                )}
              </div>
              
              <div className="overflow-y-auto flex-1">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-sm text-muted-foreground flex flex-col items-center">
                    <Bell className="w-8 h-8 mb-3 opacity-20" />
                    No notifications yet
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => markAsRead(notif.id)}
                      className={`p-4 border-b border-border/30 hover:bg-muted/50 cursor-pointer transition-colors flex gap-3 ${!notif.is_read ? 'bg-primary/5' : ''}`}
                    >
                      <div className="flex-1 space-y-1">
                        <p className={`text-sm leading-tight ${!notif.is_read ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>
                          {notif.content}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
                        </p>
                      </div>
                      {!notif.is_read && (
                        <div className="w-2 h-2 bg-primary rounded-full mt-1.5 shrink-0" />
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Real User Profile Section */}
        <div className="flex items-center gap-3 pl-2 border-l border-border ml-1 md:ml-2">
          <div className="hidden sm:block text-right">
            <p className="text-sm font-bold leading-none">{displayName}</p>
            <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wider font-semibold">
              {user?.role || "Consultant"}
            </p>
          </div>
          <Avatar className="h-9 w-9 border-2 border-primary/10">
            {avatarUrl ? (
              <AvatarImage
                src={avatarUrl}
                alt={displayName}
                className="object-cover"
              />
            ) : null}
            <AvatarFallback className="bg-primary/5 text-primary font-bold">
              {initial || <User size={16} />}
            </AvatarFallback>
          </Avatar>
        </div>

        {/* Actionable Logout Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={onLogout}
          className="hidden sm:flex rounded-full px-4 border-border text-muted-foreground hover:text-destructive hover:border-destructive/30 items-center gap-2 transition-all ml-2 h-9"
        >
          <LogOut size={14} />
          <span className="text-xs font-semibold">Logout</span>
        </Button>
      </div>
    </header>
  );
};

export default DashboardHeader;