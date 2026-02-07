import { Sparkles } from "lucide-react";

interface BookingAISummaryProps {
  summary: string[];
}

const BookingAISummary = ({ summary }: BookingAISummaryProps) => {
  if (!summary || summary.length === 0) {
    return null;
  }

  return (
    <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-xl p-4 border border-primary/20">
      <h3 className="font-medium mb-3 flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary" />
        AI Booking Summary
      </h3>

      <ul className="space-y-2 mb-3">
        {summary.map((item, index) => (
          <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
            <span className="text-primary mt-0.5">•</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>

      <p className="text-xs text-muted-foreground italic">
        Generated from chat conversation
      </p>
    </div>
  );
};

export default BookingAISummary;
