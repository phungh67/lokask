import { Link } from "react-router-dom";
import { Star, Heart } from "lucide-react";
import { Consultant } from "@/data/mockData";
import { Button } from "@/components/ui/button";
interface ConsultantCardProps {
  consultant: Consultant;
}
const ConsultantCard = ({
  consultant
}: ConsultantCardProps) => {
  return <div className="relative bg-gradient-to-b from-terracotta-light to-white rounded-2xl p-6 shadow-sm border border-primary/10 hover:shadow-md transition-shadow duration-300 w-full max-w-[250px]">
      {/* Badge - Highly Trusted Local - Top Right */}
      {consultant.isHighlyTrusted && (
        <span className="absolute -top-2 -right-2 inline-flex items-center gap-1 bg-primary text-primary-foreground rounded-full px-2.5 py-1 text-[10px] font-semibold shadow-md z-10">
          <Heart className="w-3 h-3 fill-primary-foreground" />
          Highly trusted
        </span>
      )}

      {/* Avatar - Centered Circle */}
      <div className="flex justify-center mb-3">
        <div className="w-36 h-36 rounded-full overflow-hidden ring-2 ring-background shadow-md">
          <img src={consultant.avatarUrl} alt={consultant.name} className="w-full h-full object-cover object-top" />
        </div>
      </div>

      {/* Name & City */}
      <div className="mb-3">
        <h3 className="font-bold text-xl text-foreground font-sans">{consultant.name}</h3>
        <p className="text-sm text-muted-foreground">{consultant.city}</p>
      </div>

      {/* Quote */}
      <p className="text-sm text-muted-foreground italic mb-4">
        "{consultant.quote}"
      </p>

      {/* Tag - Only show first tag */}
      <div className="mb-4">
        {consultant.tags[0] && <span className="border border-primary/30 text-primary rounded-full px-3 py-1 text-xs">
            {consultant.tags[0]}
          </span>}
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
        <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-full py-2.5">
          Ask this local
        </Button>
      </Link>
    </div>;
};
export default ConsultantCard;