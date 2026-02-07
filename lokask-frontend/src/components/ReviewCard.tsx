import { Star } from "lucide-react";
import { Review } from "@/data/mockData";

interface ReviewCardProps {
  review: Review;
}

const ReviewCard = ({ review }: ReviewCardProps) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  return (
    <div className="bg-card rounded-2xl p-6 shadow-soft">
      {/* Rating stars */}
      <div className="flex items-center gap-1 mb-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            size={16}
            className={i < review.rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}
          />
        ))}
      </div>

      {/* Comment */}
      <p className="text-foreground/80 text-sm leading-relaxed mb-4">
        "{review.comment}"
      </p>

      {/* Reviewer info */}
      <div className="flex items-center gap-3">
        <img
          src={review.reviewerAvatar}
          alt={review.reviewerName}
          className="w-10 h-10 rounded-full object-cover"
        />
        <div>
          <p className="text-sm font-medium text-foreground">{review.reviewerName}</p>
          <p className="text-xs text-muted-foreground">
            {review.tripType && `${review.tripType} · `}
            {formatDate(review.date)}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ReviewCard;
