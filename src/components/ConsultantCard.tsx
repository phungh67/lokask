import { Link } from "react-router-dom";
import { Star } from "lucide-react";
import { Consultant } from "@/data/mockData";

interface ConsultantCardProps {
  consultant: Consultant;
}

const ConsultantCard = ({ consultant }: ConsultantCardProps) => {
  return (
    <Link to={`/consultant/${consultant.id}`} className="group block">
      {/* Person Image - Portrait Style */}
      <div className="aspect-[3/4] rounded-xl overflow-hidden mb-3">
        <img
          src={consultant.avatarUrl}
          alt={consultant.name}
          className="w-full h-full object-cover object-top transition-transform duration-300 group-hover:scale-105"
        />
      </div>

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
    </Link>
  );
};

export default ConsultantCard;
