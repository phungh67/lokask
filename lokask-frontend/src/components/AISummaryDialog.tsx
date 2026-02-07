import { useState, useEffect } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Review } from "@/data/mockData";

interface AISummaryDialogProps {
  consultantName: string;
  reviews: Review[];
}

const AISummaryDialog = ({ consultantName, reviews }: AISummaryDialogProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  // Generate mock AI summary based on reviews
  const generateSummary = () => {
    if (reviews.length === 0) {
      return "No reviews yet. Be the first to share your experience!";
    }

    const avgRating = reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length;
    const tripTypes = [...new Set(reviews.map(r => r.tripType).filter(Boolean))];
    
    // Extract common themes from reviews (mock analysis)
    const themes: string[] = [];
    const allComments = reviews.map(r => r.comment.toLowerCase()).join(" ");
    
    if (allComments.includes("knowledge") || allComments.includes("expert")) {
      themes.push("exceptional expertise");
    }
    if (allComments.includes("hidden") || allComments.includes("secret")) {
      themes.push("insider knowledge of hidden gems");
    }
    if (allComments.includes("friendly") || allComments.includes("passion")) {
      themes.push("warm and passionate personality");
    }
    if (allComments.includes("recommend") || allComments.includes("amazing")) {
      themes.push("highly recommended by travelers");
    }
    if (allComments.includes("family") || allComments.includes("kids")) {
      themes.push("family-friendly approach");
    }
    if (allComments.includes("food") || allComments.includes("restaurant")) {
      themes.push("great food recommendations");
    }
    if (allComments.includes("art") || allComments.includes("museum")) {
      themes.push("deep art and culture insights");
    }

    const themesText = themes.length > 0 
      ? `Travelers consistently praise ${consultantName}'s ${themes.slice(0, 3).join(", ")}.` 
      : "";

    const tripTypesText = tripTypes.length > 0 
      ? `Popular among ${tripTypes.join(", ").toLowerCase()} travelers.` 
      : "";

    return `Based on ${reviews.length} verified reviews, ${consultantName} has an outstanding ${avgRating.toFixed(1)}★ rating. ${themesText} ${tripTypesText} Reviewers highlight the personalized attention and local insights that transform ordinary trips into unforgettable experiences.`;
  };

  useEffect(() => {
    if (isOpen && !summary) {
      setIsLoading(true);
      // Simulate AI processing time
      const timer = setTimeout(() => {
        setSummary(generateSummary());
        setIsLoading(false);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          className="gap-2 rounded-full border-primary/30 hover:bg-primary/5"
        >
          <Sparkles size={18} className="text-primary" />
          See what travelers say
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display text-xl">
            <Sparkles size={20} className="text-primary" />
            AI Summary of Reviews
          </DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-8 gap-3">
              <Loader2 size={32} className="animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Analyzing {reviews.length} reviews...</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-secondary/50 rounded-xl p-4">
                <p className="text-foreground/80 leading-relaxed">{summary}</p>
              </div>
              <p className="text-xs text-muted-foreground text-center">
                This summary is generated from {reviews.length} verified reviews
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AISummaryDialog;
