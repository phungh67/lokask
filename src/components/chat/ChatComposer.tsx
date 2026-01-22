import { useState } from "react";
import { Paperclip, Smile, Send } from "lucide-react";

interface ChatComposerProps {
  onSendMessage: (message: string) => void;
}

const ChatComposer = ({ onSendMessage }: ChatComposerProps) => {
  const [message, setMessage] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      onSendMessage(message.trim());
      setMessage("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="p-4 border-t border-border bg-card shrink-0">
      <form onSubmit={handleSubmit}>
        <div className="flex items-center gap-2 bg-secondary/50 rounded-full px-4 py-2">
          <button
            type="button"
            className="p-1.5 rounded-full hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
            aria-label="Attach file"
          >
            <Paperclip size={20} />
          </button>

          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
          />

          <button
            type="button"
            className="p-1.5 rounded-full hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
            aria-label="Add emoji"
          >
            <Smile size={20} />
          </button>

          <button
            type="submit"
            disabled={!message.trim()}
            className="bg-primary text-primary-foreground rounded-full p-2 hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Send message"
          >
            <Send size={18} />
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatComposer;
