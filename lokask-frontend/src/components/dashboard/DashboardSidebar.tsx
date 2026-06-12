// src/components/dashboard/DashboardSidebar.tsx
import {
  Inbox,
  Calendar,
  User,
  DollarSign,
  Settings,
  HelpCircle,
  Lock,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Consultant } from "@/types/consultant";

interface DashboardSidebarProps {
  consultant: Consultant;
  activeSection: "inbox" | "bookings" | "profile" | "articles";
  onSectionChange: (
    section: "inbox" | "bookings" | "profile" | "articles",
  ) => void;
  userRole: string | null;
}

const DashboardSidebar = ({
  consultant,
  activeSection,
  onSectionChange,
  userRole,
}: DashboardSidebarProps) => {
  const isConsultant = userRole === "consultant";

  const navItems = [
    { id: "inbox" as const, label: "Inbox", icon: Inbox, restricted: false },
    {
      id: "bookings" as const,
      label: "Bookings",
      icon: Calendar,
      restricted: false,
    },
    { id: "profile" as const, label: "Profile", icon: User, restricted: false },
    {
      id: "articles" as const,
      label: "Articles",
      icon: FileText,
      restricted: !isConsultant,
    },
  ];

  const footerItems = [
    {
      id: "earnings",
      label: "Earnings",
      icon: DollarSign,
      disabled: true,
      badge: "Coming soon",
      restricted: !isConsultant,
    },
    { id: "settings", label: "Settings", icon: Settings, restricted: false },
    { id: "help", label: "Help", icon: HelpCircle, restricted: false },
  ];

  return (
    <aside className="w-[260px] bg-card border-r border-border flex flex-col h-full">
      {/* Consultant Profile Card */}
      <div className="p-4">
        <div className="relative mb-3">
          <img
            src={consultant.avatarUrl || consultant.coverUrl}
            alt={consultant.name}
            className="w-full aspect-square object-cover rounded-2xl"
          />
          {consultant.isOnline && (
            <span className="absolute bottom-3 right-3 h-4 w-4 bg-green-500 rounded-full border-2 border-card" />
          )}
        </div>

        <h2 className="font-semibold text-lg">{consultant.name}</h2>
        <p className="text-sm text-muted-foreground">
          {consultant.city}
          {consultant.country ? `, ${consultant.country}` : ""}
        </p>

        {/* Optional: Show role badge */}
        <div className="mt-2">
          <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-secondary text-muted-foreground">
            {userRole}
          </span>
        </div>
      </div>

      <div className="border-t border-border mx-4" />

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => {
                  if (!item.restricted) {
                    onSectionChange(item.id);
                  }
                }}
                disabled={item.restricted}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                  activeSection === item.id
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                )}
              >
                <div className="flex items-center gap-3">
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </div>
                {item.restricted && <Lock className="h-3.5 w-3.5 opacity-50" />}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* ... rest of the footer rendering logic ... */}
    </aside>
  );
};

export default DashboardSidebar;
