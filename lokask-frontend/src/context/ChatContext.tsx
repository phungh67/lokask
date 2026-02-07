import { createContext, useContext, useState, ReactNode } from "react";
import { Consultant } from "@/data/mockData";

interface ChatContextType {
  isWidgetVisible: boolean;
  activeConsultant: Consultant | null;
  isExpanded: boolean;
  openChat: (consultant: Consultant) => void;
  closeChat: () => void;
  toggleExpand: () => void;
  setExpanded: (expanded: boolean) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider = ({ children }: { children: ReactNode }) => {
  const [isWidgetVisible, setIsWidgetVisible] = useState(false);
  const [activeConsultant, setActiveConsultant] = useState<Consultant | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const openChat = (consultant: Consultant) => {
    setActiveConsultant(consultant);
    setIsWidgetVisible(true);
    setIsExpanded(true); // Auto-expand when opening
  };

  const closeChat = () => {
    setIsWidgetVisible(false);
    setIsExpanded(false);
  };

  const toggleExpand = () => {
    setIsExpanded((prev) => !prev);
  };

  const setExpanded = (expanded: boolean) => {
    setIsExpanded(expanded);
  };

  return (
    <ChatContext.Provider
      value={{
        isWidgetVisible,
        activeConsultant,
        isExpanded,
        openChat,
        closeChat,
        toggleExpand,
        setExpanded,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChat must be used within ChatProvider");
  }
  return context;
};
