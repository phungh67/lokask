import { Inbox, Calendar, User, DollarSign, Settings, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { DashboardConsultant } from "@/data/dashboardMockData";

interface DashboardSidebarProps {
  consultant: DashboardConsultant;
  activeSection: "inbox" | "bookings" | "profile";
  onSectionChange: (section: "inbox" | "bookings" | "profile") => void;
}

const DashboardSidebar = ({ consultant, activeSection, onSectionChange }: DashboardSidebarProps) => {
  const navItems = [
    { id: "inbox" as const, label: "Inbox", icon: Inbox },
    { id: "bookings" as const, label: "Bookings", icon: Calendar },
    { id: "profile" as const, label: "Profile", icon: User },
  ];

  const footerItems = [
    { id: "earnings", label: "Earnings", icon: DollarSign, disabled: true, badge: "Coming soon" },
    { id: "settings", label: "Settings", icon: Settings },
    { id: "help", label: "Help", icon: HelpCircle },
  ];

  return (
    <aside className="w-[260px] bg-card border-r border-border flex flex-col h-full">
      {/* Consultant Profile Card */}
      <div className="p-4">
        {/* Large rectangular photo */}
        <div className="relative mb-3">
          <img
            src={consultant.photo}
            alt={consultant.name}
            className="w-full aspect-square object-cover rounded-2xl"
          />
          {/* Online indicator */}
          {consultant.isOnline && (
            <span className="absolute bottom-3 right-3 h-4 w-4 bg-green-500 rounded-full border-2 border-card" />
          )}
        </div>

        {/* Name and location */}
        <h2 className="font-semibold text-lg">{consultant.name}</h2>
        <p className="text-sm text-muted-foreground">
          {consultant.city}, {consultant.country}
        </p>
      </div>

      {/* Divider */}
      <div className="border-t border-border mx-4" />

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => onSectionChange(item.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                  activeSection === item.id
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Divider */}
      <div className="border-t border-border mx-4" />

      {/* Footer */}
      <div className="p-4">
        <ul className="space-y-1">
          {footerItems.map((item) => (
            <li key={item.id}>
              <button
                disabled={item.disabled}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors",
                  item.disabled
                    ? "text-muted-foreground/50 cursor-not-allowed"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.label}</span>
                {item.badge && (
                  <span className="ml-auto text-xs bg-secondary px-2 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
};

export default DashboardSidebar;
