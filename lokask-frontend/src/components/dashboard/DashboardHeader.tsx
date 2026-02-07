import { Link } from "react-router-dom";
import { Bell } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DashboardConsultant } from "@/data/dashboardMockData";

interface DashboardHeaderProps {
  consultant: DashboardConsultant;
}

const DashboardHeader = ({ consultant }: DashboardHeaderProps) => {
  return (
    <header className="h-16 border-b border-border bg-card flex items-center justify-between px-6 shrink-0">
      {/* Logo */}
      <Link to="/" className="text-xl font-bold text-primary">
        Lokask
      </Link>

      {/* Right section */}
      <div className="flex items-center gap-4">
        {/* Weekly earnings badge */}
        <Badge className="bg-green-100 text-green-700 hover:bg-green-100 px-3 py-1">
          This week ${consultant.weeklyEarnings}
        </Badge>

        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-destructive rounded-full" />
        </Button>

        {/* Consultant avatar (circular) */}
        <Avatar className="h-9 w-9">
          <AvatarImage src={consultant.avatar} alt={consultant.name} />
          <AvatarFallback>{consultant.name[0]}</AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
};

export default DashboardHeader;
