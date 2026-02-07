import { useState } from "react";
import { Star } from "lucide-react";
import { Review } from "@/data/mockData";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface ReviewCardCompactProps {
  review: Review;
}

const ReviewCardCompact = ({ review }: ReviewCardCompactProps) => {
  const [expanded, setExpanded] = useState(false);
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const isLongComment = review.comment.length > 150;
  const displayComment = expanded ? review.comment : review.comment.slice(0, 150);

  return (
    <div className="bg-card rounded-xl p-4 border border-border">
      {/* Rating */}
      <div className="flex items-center gap-1 mb-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            size={14}
            className={i < review.rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}
          />
        ))}
        <span className="text-sm font-medium ml-1">{review.rating}.0</span>
      </div>
      
      {/* Reviewer info */}
      <div className="flex items-center gap-3 mb-3">
        <Avatar className="w-8 h-8">
          <AvatarImage src={review.reviewerAvatar} alt={review.reviewerName} />
          <AvatarFallback className="text-xs bg-primary/10 text-primary">
            {getInitials(review.reviewerName)}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="text-sm font-medium">{review.reviewerName}</p>
          <p className="text-xs text-muted-foreground">
            {formatDate(review.date)} · Verified booking
          </p>
        </div>
      </div>
      
      {/* Comment */}
      <p className="text-sm text-foreground/80 leading-relaxed">
        "{displayComment}{isLongComment && !expanded && '...'}"
      </p>
      
      {/* Read more link */}
      {isLongComment && (
        <button 
          onClick={() => setExpanded(!expanded)}
          className="text-sm font-medium underline mt-2 text-primary hover:text-primary/80"
        >
          {expanded ? 'Show less' : 'Read more'}
        </button>
      )}
    </div>
  );
};

export default ReviewCardCompact;
