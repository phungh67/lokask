import { MapPin } from "lucide-react";

interface LocationCardProps {
  name: string;
  image: string;
  hashtags: string[];
}

const LocationCard = ({ name, image, hashtags }: LocationCardProps) => {
  return (
    <div className="max-w-[280px] rounded-2xl overflow-hidden bg-card border border-border shadow-soft">
      {/* Image */}
      <div className="relative aspect-[4/3]">
        <img
          src={image}
          alt={name}
          className="w-full h-full object-cover"
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        
        {/* Location name */}
        <div className="absolute bottom-3 left-3 right-3">
          <div className="flex items-center gap-1.5 text-white">
            <MapPin className="h-4 w-4" />
            <span className="font-medium text-sm">{name}</span>
          </div>
        </div>
      </div>

      {/* Hashtags */}
      <div className="p-3 flex flex-wrap gap-2">
        {hashtags.map((tag) => (
          <span
            key={tag}
            className="text-xs text-primary bg-primary/10 px-2 py-1 rounded-full"
          >
            #{tag}
          </span>
        ))}
      </div>
    </div>
  );
};

export default LocationCard;
