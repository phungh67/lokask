import { useState } from "react";
import { Sparkles, Copy, Check, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConversationSummary } from "@/types/chat";
import { cn } from "@/lib/utils";

interface FloatingAISummaryProps {
  summary: ConversationSummary;
}

const FloatingAISummary = ({ summary }: FloatingAISummaryProps) => {
  const [copied, setCopied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);

  // 🟢 FIX 1: Guard clause to prevent "undefined" crash
  if (!summary) {
    return null; // Or return a small loading state/placeholder
  }

  const handleCopy = () => {
    // 🟢 FIX 2: Optional chaining to safely access properties
    const summaryText = `
AI Conversation Summary

Focus:
${summary.preferences?.map((p) => `• ${p}`).join("\n") || ""}

Places mentioned:
${summary.placesmentioned?.map((p) => `• ${p}`).join("\n") || ""}

Decisions:
${summary.decisions?.map((d) => `• ${d}`).join("\n") || ""}

Next steps:
${summary.nextSteps?.map((n) => `• ${n}`).join("\n") || ""}
    `.trim();

    navigator.clipboard.writeText(summaryText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-72 bg-card rounded-2xl shadow-soft border border-border overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-secondary/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <h3 className="font-medium text-sm">AI Summary</h3>
        </div>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </button>

      <div
        className={cn(
          "overflow-hidden transition-all duration-200",
          isExpanded ? "max-h-96" : "max-h-0"
        )}
      >
        <div className="px-4 pb-4 space-y-3">
          {/* Preferences/Focus - Added optional chaining */}
          {summary.preferences?.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Focus</p>
              <ul className="space-y-1">
                {summary.preferences.slice(0, 3).map((pref, i) => (
                  <li key={i} className="text-sm flex items-start gap-2">
                    <span className="text-primary">•</span>
                    <span>{pref}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Decisions - Added optional chaining */}
          {summary.decisions?.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Decisions</p>
              <ul className="space-y-1">
                {summary.decisions.slice(0, 2).map((decision, i) => (
                  <li key={i} className="text-sm flex items-start gap-2">
                    <span className="text-green-600">✓</span>
                    <span>{decision}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Next steps - Added optional chaining */}
          {summary.nextSteps?.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Next steps</p>
              <ul className="space-y-1">
                {summary.nextSteps.slice(0, 2).map((step, i) => (
                  <li key={i} className="text-sm flex items-start gap-2">
                    <span className="text-blue-600">→</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <Button
            variant="outline"
            size="sm"
            className="w-full mt-2"
            onClick={handleCopy}
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 mr-1" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 mr-1" />
                Copy summary
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default FloatingAISummary;