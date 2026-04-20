import { Star, CheckCircle2 } from "lucide-react";
import { Review } from "@/types/consultant";
interface ReviewCardProps {
  review: Review;
}

const ReviewCard = ({ review }: ReviewCardProps) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  return (
    <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col h-full">
      {/* Rating stars */}
      <div className="flex items-center gap-1 mb-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            size={16}
            className={i < review.rating ? "fill-[#FBBF24] text-[#FBBF24]" : "text-zinc-200"}
          />
        ))}
      </div>

      {/* Comment (Flex-grow pushes the user info to the bottom evenly) */}
      <p className="text-zinc-700 text-[15px] leading-relaxed mb-6 flex-grow">
        "{review.comment}"
      </p>

      {/* Reviewer info */}
      <div className="flex items-center gap-3 mt-auto">
        <img
          src={review.review_avatar || "https://placehold.co/100x100"} 
          alt={review.review_name}
          className="w-10 h-10 rounded-full object-cover bg-zinc-100"
        />
        <div>
          <p className="text-sm font-bold text-zinc-900">
            {review.review_name}
          </p>
          <div className="flex items-center gap-2">
            <p className="text-xs text-zinc-500">
              {formatDate(review.created_at)}
            </p>
            {review.verified_stay && (
              <span className="flex items-center gap-0.5 text-xs text-green-600 font-medium bg-green-50 px-1.5 py-0.5 rounded-md">
                <CheckCircle2 size={10} /> Verified
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewCard;