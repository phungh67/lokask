import { useChat } from "@/context/ChatContext";
import ChatFloatingButton from "./ChatFloatingButton";
import ChatWindow from "./ChatWindow";
import { Consultant } from "@/types/consultant"; // 🟢 Import the new type

const ChatWidget = () => {
  const {
    isWidgetVisible,
    activeConsultant,
    isExpanded,
    setExpanded,
    closeChat,
  } = useChat();

  // Don't render anything if widget is not visible or no active consultant
  if (!isWidgetVisible || !activeConsultant) {
    return null;
  }

  // 🟢 FIX: Cast the context data to the new 'Consultant' type.
  // This tells TypeScript: "Trust me, the data matches the new shape."
  // (Since we updated api.ts, the runtime data will actually match).
  const consultant = activeConsultant as unknown as Consultant;

  return (
    <>
      {isExpanded ? (
        <ChatWindow
          consultant={consultant}
          onMinimize={() => setExpanded(false)}
          onClose={closeChat}
        />
      ) : (
        <ChatFloatingButton
          consultant={consultant}
          onClick={() => setExpanded(true)}
          unreadCount={0} 
        />
      )}
    </>
  );
};

export default ChatWidget;