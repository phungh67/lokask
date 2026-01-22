import { useState } from "react";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import InboxPanel from "@/components/dashboard/InboxPanel";
import ChatPanel from "@/components/dashboard/ChatPanel";
import ProfilePanel from "@/components/dashboard/ProfilePanel";
import { currentConsultant, mockConversations, DashboardConversation, DashboardConsultant, ScheduledCall } from "@/data/dashboardMockData";
import { toast } from "@/hooks/use-toast";

const ConsultantDashboard = () => {
  const [activeSection, setActiveSection] = useState<"inbox" | "bookings" | "profile">("inbox");
  const [activeConversationId, setActiveConversationId] = useState<string | null>(
    mockConversations[0]?.id || null
  );
  const [conversations, setConversations] = useState<DashboardConversation[]>(mockConversations);
  const [consultantProfile, setConsultantProfile] = useState<DashboardConsultant>(currentConsultant);

  const activeConversation = conversations.find((c) => c.id === activeConversationId) || null;

  const handleSendMessage = (content: string) => {
    if (!activeConversationId) return;

    setConversations((prev) =>
      prev.map((conv) => {
        if (conv.id === activeConversationId) {
          return {
            ...conv,
            messages: [
              ...conv.messages,
              {
                id: `msg-${Date.now()}`,
                content,
                sender: "consultant" as const,
                timestamp: new Date(),
                type: "text" as const,
              },
            ],
            lastMessage: content,
            timestamp: new Date(),
          };
        }
        return conv;
      })
    );
  };

  const handleScheduleCall = (callData: Omit<ScheduledCall, "id" | "conversationId" | "createdAt">) => {
    if (!activeConversationId) return;

    const newCall: ScheduledCall = {
      ...callData,
      id: `call-${Date.now()}`,
      conversationId: activeConversationId,
      createdAt: new Date(),
    };

    setConversations((prev) =>
      prev.map((conv) => {
        if (conv.id === activeConversationId) {
          return {
            ...conv,
            scheduledCalls: [...(conv.scheduledCalls || []), newCall],
            messages: [
              ...conv.messages,
              {
                id: `msg-${Date.now()}`,
                content: `Scheduled a ${callData.type} call`,
                sender: "consultant" as const,
                timestamp: new Date(),
                type: "scheduled_call" as const,
                scheduledCallData: newCall,
              },
            ],
          };
        }
        return conv;
      })
    );

    toast({
      title: "Call scheduled!",
      description: `${callData.type === "video" ? "Video" : "Voice"} call scheduled successfully.`,
    });
  };

  const handleCancelCall = (callId: string) => {
    if (!activeConversationId) return;

    setConversations((prev) =>
      prev.map((conv) => {
        if (conv.id === activeConversationId) {
          return {
            ...conv,
            scheduledCalls: conv.scheduledCalls?.map(call =>
              call.id === callId ? { ...call, status: "cancelled" as const } : call
            ),
            messages: conv.messages.map(msg =>
              msg.scheduledCallData?.id === callId
                ? { ...msg, scheduledCallData: { ...msg.scheduledCallData, status: "cancelled" as const } }
                : msg
            ),
          };
        }
        return conv;
      })
    );

    toast({
      title: "Call cancelled",
      description: "The scheduled call has been cancelled.",
    });
  };

  const renderMainContent = () => {
    switch (activeSection) {
      case "inbox":
        return (
          <>
            <InboxPanel
              conversations={conversations}
              activeConversationId={activeConversationId}
              onSelectConversation={setActiveConversationId}
            />
            <ChatPanel
              conversation={activeConversation}
              onSendMessage={handleSendMessage}
              onScheduleCall={handleScheduleCall}
              onCancelCall={handleCancelCall}
            />
          </>
        );
      case "bookings":
        return (
          <div className="flex-1 flex items-center justify-center bg-secondary/20">
            <div className="text-center text-muted-foreground">
              <p className="text-lg font-medium">Bookings</p>
              <p className="text-sm">Coming soon...</p>
            </div>
          </div>
        );
      case "profile":
        return (
          <ProfilePanel
            consultant={consultantProfile}
            onSave={(updates) => {
              setConsultantProfile((prev) => ({ ...prev, ...updates }));
            }}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="h-screen flex flex-col bg-[#F5F2EE]">
      {/* Top Header */}
      <DashboardHeader consultant={currentConsultant} />

      {/* Main 3-column layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - Column 1 */}
        <DashboardSidebar
          consultant={currentConsultant}
          activeSection={activeSection}
          onSectionChange={setActiveSection}
        />

        {/* Dynamic content - Columns 2 & 3 */}
        {renderMainContent()}
      </div>
    </div>
  );
};

export default ConsultantDashboard;
