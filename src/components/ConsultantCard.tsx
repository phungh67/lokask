import { Link } from "react-router-dom";
import { Star } from "lucide-react";
import { Consultant } from "@/data/mockData";
import { Button } from "@/components/ui/button";

interface ConsultantCardProps {
  consultant: Consultant;
}

const ConsultantCard = ({ consultant }: ConsultantCardProps) => {
  return (
    <div className="bg-gradient-to-b from-orange-50 to-white rounded-2xl p-6 shadow-sm border border-orange-100/50 hover:shadow-md transition-shadow duration-300">
      {/* Avatar - Centered Circle */}
      <div className="flex justify-center mb-4">
        <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-lg">
          <img
            src={consultant.avatarUrl}
            alt={consultant.name}
            className="w-full h-full object-cover object-top"
          />
        </div>
      </div>

      {/* Name & City */}
      <div className="mb-3">
        <h3 className="font-bold text-xl text-foreground">{consultant.name}</h3>
        <p className="text-sm text-muted-foreground">{consultant.city}</p>
      </div>

      {/* Quote */}
      <p className="text-sm text-muted-foreground italic mb-4">
        "{consultant.quote}"
      </p>

      {/* Tags */}
      <div className="flex flex-wrap gap-2 mb-4">
        {consultant.tags.map((tag, index) => (
          <span
            key={index}
            className="border border-[#A0695E]/30 text-[#A0695E] rounded-full px-3 py-1 text-xs"
          >
            {tag}
          </span>
        ))}
      </div>

      {/* Rating & Helped Count */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
        <div className="flex items-center gap-1">
          <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
          <span className="font-medium text-foreground">{consultant.rating}</span>
        </div>
        <span className="text-muted-foreground/50">|</span>
        <span>{consultant.helpedCount} travellers helped</span>
      </div>

      {/* CTA Button */}
      <Link to={`/consultant/${consultant.id}`} className="block">
        <Button 
          className="w-full bg-[#A0695E] hover:bg-[#8B5A4F] text-white rounded-full py-2.5"
        >
          Ask this local
        </Button>
      </Link>
    </div>
  );
};

export default ConsultantCard;
