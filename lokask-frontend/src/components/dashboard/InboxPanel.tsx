import { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import ConversationCard from "./ConversationCard";

// 🟢 Removed import of DashboardConversation and getConversationCounts from mock data

interface InboxPanelProps {
  // 🟢 Updated type to use the mapped conversation structure from your dashboard
  conversations: any[]; 
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
}

type FilterTab = "all" | "new" | "booked" | "archived";

const InboxPanel = ({ conversations, activeConversationId, onSelectConversation }: InboxPanelProps) => {
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // 🟢 Dynamically calculate counts instead of using mock data
  const counts = {
    all: conversations.length,
    new: conversations.filter(c => c.unread > 0).length, // Example logic for 'new'
    booked: 0, // Hardcoded for now until status exists in API
  };

  const tabs: { id: FilterTab; label: string; count?: number }[] = [
    { id: "all", label: "All", count: counts.all },
    { id: "new", label: "New", count: counts.new },
    { id: "booked", label: "Booked", count: counts.booked },
    { id: "archived", label: "Archived" },
  ];

  // Filter conversations
  const filteredConversations = conversations.filter((conv) => {
    // 🟢 Filter by tab - Updated to handle potential missing 'status' field from API
    if (activeTab !== "all" && conv.status !== activeTab) {
      return false;
    }

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        // 🟢 Access nested traveller name as defined in your dashboard mapping
        conv.traveller?.name.toLowerCase().includes(query) ||
        conv.lastMessage?.toLowerCase().includes(query)
      );
    }

    return true;
  });

  return (
    <div className="w-[360px] bg-card border-r border-border flex flex-col h-full">
      {/* Header */}
      <div className="p-4 shrink-0">
        <h1 className="text-xl font-semibold mb-4">Inbox</h1>

        {/* Tabs */}
        <div className="flex gap-1 mb-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "px-3 py-1.5 rounded-full text-sm font-medium transition-colors",
                activeTab === tab.id
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-secondary"
              )}
            >
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span className="ml-1.5">({tab.count})</span>
              )}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 rounded-xl border-secondary bg-secondary/50"
          />
        </div>
      </div>

      {/* Conversation list */}
      <ScrollArea className="flex-1 px-2">
        <div className="space-y-1 pb-4">
          {filteredConversations.length > 0 ? (
            filteredConversations.map((conversation) => (
              <ConversationCard
                key={conversation.id}
                conversation={conversation}
                isActive={conversation.id === activeConversationId}
                onClick={() => onSelectConversation(conversation.id)}
              />
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">No conversations found</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default InboxPanel;