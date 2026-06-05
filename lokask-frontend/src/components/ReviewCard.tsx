import { useState } from "react";
import { Star } from "lucide-react";
import { Review } from "@/types/consultant"; 

interface ReviewCardProps {
  review: Review;
}

const ReviewCard = ({ review }: ReviewCardProps) => {
  const initialAvatar = review.review_avatar || "https://placehold.co/40x40";
  const [imgSrc, setImgSrc] = useState(initialAvatar);

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Recent";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Recent";
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getInitial = (name: string) => {
    return name ? name.charAt(0).toUpperCase() : "?";
  };

  return (
    <div className="bg-white border border-[#E5E7EB] rounded-[14px] p-6 flex flex-col h-full">
      
      {/* 1. Stars & Rating (top: 25 in Figma) */}
      <div className="flex items-center gap-1 mb-6">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            size={16}
            className={i < review.rating ? "fill-[#FDC700] text-[#FDC700]" : "text-zinc-200"}
          />
        ))}
        <span className="text-[#101828] text-[14px] font-semibold leading-[20px] ml-1">
          {review.rating || 5}
        </span>
      </div>

      {/* 2. Reviewer Info (top: 81 in Figma) */}
      <div className="flex items-center gap-3 mb-6">
        <img
          src={imgSrc} 
          alt={review.review_name}
          onError={() => {
            setImgSrc(`https://placehold.co/40x40/C56A49/FFFFFF?text=${getInitial(review.review_name)}`);
          }}
          className="w-[40px] h-[40px] rounded-full object-cover bg-zinc-100 shrink-0"
        />
        <div className="flex flex-col">
          <p className="text-[#101828] text-[16px] font-semibold leading-[24px]">
            {review.review_name}
          </p>
          <p className="text-[#6A7282] text-[12px] font-normal leading-[16px]">
            {formatDate(review.date)} {review.verified_stay && "· Verified booking"}
          </p>
        </div>
      </div>

      {/* 3. Comment (top: 159 in Figma) */}
      <p className="text-[#364153] text-[14px] font-normal leading-[20px] mb-6 flex-grow line-clamp-3">
        "{review.comment}"
      </p>

      {/* 4. Read More Link (Centered per Figma specs) */}
      <button className="w-full py-2 flex justify-center items-center rounded-lg hover:bg-zinc-50 transition-colors text-[#C77752] text-[14px] font-medium leading-[20px] mt-auto">
        Read more
      </button>

    </div>
  );
};

export default ReviewCard;