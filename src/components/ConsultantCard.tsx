import { Link } from "react-router-dom";
import { Star } from "lucide-react";
import { Consultant } from "@/data/mockData";

interface ConsultantCardProps {
  consultant: Consultant;
}

const ConsultantCard = ({ consultant }: ConsultantCardProps) => {
  return (
    <Link to={`/consultant/${consultant.id}`} className="group block">
      {/* Cover Image */}
      <div className="aspect-[4/3] rounded-xl overflow-hidden mb-3">
        <img
          src={consultant.coverUrl}
          alt={`${consultant.name}'s cover`}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </div>

      {/* Info Section */}
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <img
          src={consultant.avatarUrl}
          alt={consultant.name}
          className="w-10 h-10 rounded-full border-2 border-white shadow-sm object-cover flex-shrink-0"
        />

        {/* Text Info */}
        <div className="min-w-0">
          <h3 className="font-semibold text-[15px] text-foreground truncate">
            {consultant.name}
          </h3>
          <p className="text-sm text-muted-foreground truncate">
            {consultant.city} · {consultant.tag}
          </p>
          <div className="flex items-center gap-1 mt-0.5">
            <Star className="w-3.5 h-3.5 fill-yellow-500 text-yellow-500" />
            <span className="text-sm font-medium text-foreground">
              {consultant.rating}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ConsultantCard;
