import { Link } from "react-router-dom";
import { Bell, User, LogOut } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AuthStorage } from "@/lib/storage";

interface DashboardHeaderProps {
  onLogout: () => void;
}

const DashboardHeader = ({ onLogout }: DashboardHeaderProps) => {
  const user = AuthStorage.getUser();

  // Fallback values if data is missing
  const displayName = user?.full_name || "Consultant";
  const avatarUrl = user?.avatar_url || "";
  const initial = displayName.charAt(0).toUpperCase();

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
        <Badge className="bg-green-100 text-green-700 hover:bg-green-100 px-3 py-1 font-medium border-none">
          This week $0.00
        </Badge>

        {/* Notifications */}
        <Button
          variant="ghost"
          size="icon"
          className="relative hover:bg-muted transition-colors"
        >
          <Bell className="h-5 w-5 text-muted-foreground" />
          <span className="absolute top-2.5 right-2.5 h-2 w-2 bg-destructive border-2 border-card rounded-full" />
        </Button>

        {/* Real User Profile Section */}
        <div className="flex items-center gap-3 pl-2 border-l border-border ml-2">
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

        {/* 🟢 Actionable Logout Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={onLogout}
          className="rounded-full px-4 border-border text-muted-foreground hover:text-destructive hover:border-destructive/30 flex items-center gap-2 transition-all ml-2 h-9"
        >
          <LogOut size={14} />
          <span className="hidden md:inline text-xs font-semibold">Logout</span>
        </Button>
      </div>
    </header>
  );
};

export default DashboardHeader;
