import { useState, useCallback } from "react";

type ActionType = "ask" | "wishlist";

interface UseAuthPromptOptions {
  actionType: ActionType;
  consultantName?: string;
}

const getMessageForAction = (options: UseAuthPromptOptions): string => {
  const { actionType, consultantName } = options;

  switch (actionType) {
    case "ask":
      return consultantName
        ? `Sign in to save your conversation with ${consultantName} and access it anytime.`
        : "Sign in to save your conversations and access them anytime.";
    case "wishlist":
      return consultantName
        ? `Sign in to save ${consultantName} to your favorites and build your travel wishlist.`
        : "Sign in to save your favorite locals and access them later.";
    default:
      return "Please sign in to continue.";
  }
};

export const useAuthPrompt = () => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [promptMessage, setPromptMessage] = useState("");
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  // Temporary - will use useAuth() when Supabase is integrated
  const isAuthenticated = false;

  const requireAuth = useCallback(
    (action: () => void, options: UseAuthPromptOptions) => {
      if (isAuthenticated) {
        action();
      } else {
        setPromptMessage(getMessageForAction(options));
        setPendingAction(() => action);
        setShowPrompt(true);
      }
    },
    [isAuthenticated]
  );

  const handleAuthSuccess = useCallback(() => {
    setShowPrompt(false);
    if (pendingAction) {
      pendingAction();
      setPendingAction(null);
    }
  }, [pendingAction]);

  return {
    showPrompt,
    setShowPrompt,
    promptMessage,
    requireAuth,
    handleAuthSuccess,
  };
};
