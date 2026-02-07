import { useState } from "react";
import { Sparkles, ChevronDown, Copy, ExternalLink, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ConversationSummary } from "./types";

interface ChatAISummaryProps {
  summary: ConversationSummary;
}

const ChatAISummary = ({ summary }: ChatAISummaryProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopySummary = () => {
    const summaryText = `
Preferences: ${summary.preferences.join(", ")}
Places mentioned: ${summary.placesmentioned.join(", ")}
Decisions: ${summary.decisions.join(", ")}
Next steps: ${summary.nextSteps.join(", ")}
    `.trim();

    navigator.clipboard.writeText(summaryText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className="border-b border-border shrink-0"
    >
      <CollapsibleTrigger className="flex items-center justify-between w-full p-3 hover:bg-secondary/50 transition-colors">
        <span className="flex items-center gap-2">
          <Sparkles size={16} className="text-primary" />
          <span className="font-medium text-sm">AI recap</span>
        </span>
        <ChevronDown
          size={16}
          className={`text-muted-foreground transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </CollapsibleTrigger>

      <CollapsibleContent className="p-4 pt-0 bg-secondary/30">
        <ul className="space-y-2 text-sm text-foreground/80">
          {summary.preferences.length > 0 && (
            <li>
              <span className="font-medium">• Preferences:</span>{" "}
              {summary.preferences.join(", ")}
            </li>
          )}
          {summary.placesmentioned.length > 0 && (
            <li>
              <span className="font-medium">• Places mentioned:</span>{" "}
              {summary.placesmentioned.join(", ")}
            </li>
          )}
          {summary.decisions.length > 0 && (
            <li>
              <span className="font-medium">• Decisions:</span>{" "}
              {summary.decisions.join(", ")}
            </li>
          )}
          {summary.nextSteps.length > 0 && (
            <li>
              <span className="font-medium">• Next steps:</span>{" "}
              {summary.nextSteps.join(", ")}
            </li>
          )}
        </ul>

        <div className="flex items-center gap-2 mt-4">
          <Button
            size="sm"
            variant="outline"
            onClick={handleCopySummary}
            className="text-xs"
          >
            {copied ? (
              <>
                <Check size={14} className="mr-1" />
                Copied!
              </>
            ) : (
              <>
                <Copy size={14} className="mr-1" />
                Copy summary
              </>
            )}
          </Button>
          <Button size="sm" variant="link" className="text-xs text-primary">
            <ExternalLink size={14} className="mr-1" />
            Open full chat
          </Button>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

export default ChatAISummary;
