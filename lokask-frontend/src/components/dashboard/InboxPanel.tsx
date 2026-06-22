import { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import ConversationCard from "./ConversationCard";

interface InboxPanelProps {
  conversations: any[]; 
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
}

type FilterTab = "all" | "new" | "booked" | "archived";

const InboxPanel = ({ conversations, activeConversationId, onSelectConversation }: InboxPanelProps) => {
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const counts = {
    all: conversations.length,
    new: conversations.filter(c => c.unread > 0).length, 
    booked: 0, 
  };

  const tabs: { id: FilterTab; label: string; count?: number }[] = [
    { id: "all", label: "All", count: counts.all },
    { id: "new", label: "New", count: counts.new },
    { id: "booked", label: "Booked", count: counts.booked },
    { id: "archived", label: "Archived" },
  ];

  const filteredConversations = conversations.filter((conv) => {
    if (activeTab !== "all" && conv.status !== activeTab) {
      return false;
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        conv.traveller?.name.toLowerCase().includes(query) ||
        conv.lastMessage?.toLowerCase().includes(query)
      );
    }

    return true;
  });

  return (
    <div className="w-full md:w-[360px] bg-card border-r border-border flex flex-col h-full shrink-0">
      {/* Header */}
      <div className="p-4 shrink-0">
        <h1 className="text-xl font-semibold mb-4">Inbox</h1>

        {/* Tabs */}
        <div className="flex gap-1 mb-4 overflow-x-auto no-scrollbar">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "px-3 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap",
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