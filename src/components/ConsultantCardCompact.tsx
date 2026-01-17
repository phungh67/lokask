import { Star } from "lucide-react";
import { Link } from "react-router-dom";
import type { Consultant } from "@/data/mockData";

interface ConsultantCardCompactProps {
  consultant: Consultant;
}

const ConsultantCardCompact = ({ consultant }: ConsultantCardCompactProps) => {
  return (
    <div 
      className="bg-white rounded-[18px] p-4 flex flex-col items-center text-center min-w-[190px] max-w-[210px]"
      style={{ boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }}
    >
      {/* Avatar - No cover image, just centered avatar */}
      <div className="mb-3">
        <img
          src={consultant.avatarUrl}
          alt={`${consultant.name}'s profile`}
          className="w-11 h-11 rounded-full object-cover border-2 border-white"
          style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
        />
      </div>

      {/* Name */}
      <h3 className="font-bold text-[16px] text-foreground leading-tight">
        {consultant.name}
      </h3>

      {/* City */}
      <p className="text-[12px] text-muted-foreground mb-2">
        {consultant.city}
      </p>

      {/* Tag Pill */}
      <span 
        className="inline-block px-[10px] py-[6px] text-[12px] font-medium rounded-full mb-3"
        style={{ 
          backgroundColor: 'rgba(196, 106, 74, 0.12)',
          color: '#C46A4A'
        }}
      >
        {consultant.tag}
      </span>

      {/* Rating & Helped */}
      <div className="flex items-center gap-2 text-[12px] text-muted-foreground mb-4">
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
        className="w-full h-[38px] rounded-full bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity flex items-center justify-center"
        aria-label={`Ask ${consultant.name} for travel advice`}
      >
        Ask this local
      </Link>
    </div>
  );
};

export default ConsultantCardCompact;
