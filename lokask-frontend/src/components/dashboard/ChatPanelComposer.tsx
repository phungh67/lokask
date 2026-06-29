import { useState } from "react";
import { Paperclip, Smile, Send } from "lucide-react";

interface ChatPanelComposerProps {
  onSendMessage: (message: string) => void;
}

const ChatPanelComposer = ({ onSendMessage }: ChatPanelComposerProps) => {
  const [message, setMessage] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      onSendMessage(message.trim());
      setMessage("");
    }
  };

  return (
    <div className="p-4 md:px-6 border-t border-border/40 bg-white shrink-0">
      <form onSubmit={handleSubmit}>
        <div className="flex items-center gap-2 bg-gray-50/80 border border-border/40 rounded-full px-4 py-2 shadow-sm transition-colors focus-within:border-border/80 focus-within:bg-white">
          <button
            type="button"
            className="p-1.5 rounded-full hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
            aria-label="Attach file"
          >
            <Paperclip size={18} />
          </button>

          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Ask anything..."
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
          />

          <button
            type="button"
            className="p-1.5 rounded-full hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
            aria-label="Add emoji"
          >
            <Smile size={18} />
          </button>

          <button
            type="submit"
            disabled={!message.trim()}
            className="bg-primary text-primary-foreground rounded-full p-2 hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            aria-label="Send message"
          >
            <Send size={16} />
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatPanelComposer;