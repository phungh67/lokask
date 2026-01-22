import { useChat } from "@/context/ChatContext";
import ChatFloatingButton from "./ChatFloatingButton";
import ChatWindow from "./ChatWindow";

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

  return (
    <>
      {isExpanded ? (
        <ChatWindow
          consultant={activeConsultant}
          onMinimize={() => setExpanded(false)}
          onClose={closeChat}
        />
      ) : (
        <ChatFloatingButton
          consultant={activeConsultant}
          onClick={() => setExpanded(true)}
          unreadCount={2}
        />
      )}
    </>
  );
};

export default ChatWidget;
