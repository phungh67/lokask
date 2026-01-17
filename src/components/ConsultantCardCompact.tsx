import { Star } from "lucide-react";
import { Link } from "react-router-dom";
import type { Consultant } from "@/data/mockData";

interface ConsultantCardCompactProps {
  consultant: Consultant;
}

const ConsultantCardCompact = ({ consultant }: ConsultantCardCompactProps) => {
  return (
    <div className="card-soft p-4 flex flex-col items-center text-center min-w-[190px] max-w-[210px]">
      {/* Cover Image */}
      <div className="w-full h-20 rounded-xl overflow-hidden mb-[-22px] relative z-0">
        <img
          src={consultant.coverUrl}
          alt=""
          className="w-full h-full object-cover"
        />
      </div>

      {/* Avatar */}
      <div className="relative z-10 mb-3">
        <img
          src={consultant.avatarUrl}
          alt={`${consultant.name}'s profile`}
          className="w-11 h-11 rounded-full object-cover border-2 border-card shadow-soft"
        />
      </div>

      {/* Name */}
      <h3 className="font-bold text-base text-foreground">{consultant.name}</h3>

      {/* City */}
      <p className="text-xs text-muted-foreground mb-2">{consultant.city}</p>

      {/* Tag */}
      <span className="tag-pill mb-3">{consultant.tag}</span>

      {/* Rating & Helped */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
        <span className="flex items-center gap-0.5">
          <Star size={12} className="fill-primary text-primary" />
          {consultant.rating} stars
        </span>
        <span className="text-border">|</span>
        <span>{consultant.helpedCount} travellers helped</span>
      </div>

      {/* CTA Button */}
      <Link
        to={`/explore-locals?consultant=${consultant.id}`}
        className="w-full py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity text-center"
        aria-label={`Ask ${consultant.name} for travel advice`}
      >
        Ask this local
      </Link>
    </div>
  );
};

export default ConsultantCardCompact;
