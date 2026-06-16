import { Link, useNavigate } from "react-router-dom";
import { MapPin, Star, MessageCircle } from "lucide-react";
import { Consultant } from "@/types/consultant";

interface ConsultantBannerFullProps {
  consultant: Consultant;
}

const ConsultantBannerFull = ({ consultant }: ConsultantBannerFullProps) => {
  const navigate = useNavigate();

  const handleAskClick = () => {
    // Standard dashboard intent routing pattern
    navigate("/dashboard", {
      state: { intent: "startChat", targetId: consultant.id },
    });
  };

  const displayName = consultant.displayName || consultant.name || "Local Expert";
  const avatarUrl = consultant.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=FCE8E0&color=C77752`;

  return (
    <section className="bg-white rounded-[32px] p-6 md:p-8 shadow-sm border border-zinc-100 my-16">
      <div className="flex flex-col sm:flex-row gap-6 md:gap-8 items-start">
        
        {/* Avatar */}
        <Link to={`/consultant/${consultant.id}`} className="shrink-0">
          <img
            src={avatarUrl}
            alt={displayName}
            className="w-24 h-24 md:w-28 md:h-28 rounded-full object-cover border-4 border-white shadow-sm transition-transform hover:scale-105"
          />
        </Link>

        {/* Content */}
        <div className="flex-1 w-full">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
            <div>
              <h3 className="text-2xl font-bold text-zinc-900 mb-2">
                {displayName}
              </h3>
              
              <div className="flex flex-wrap items-center text-sm text-zinc-500 gap-y-2 gap-x-4">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-[#C77752]" />
                  <span>{consultant.city}{consultant.country ? `, ${consultant.country}` : ''}</span>
                </div>
                
                <div className="flex items-center gap-1.5">
                  <Star className="w-4 h-4 fill-[#FBBF24] text-[#FBBF24]" />
                  <span className="font-bold text-zinc-900">{consultant.rating || "4.9"}</span>
                  <span>({consultant.helpedCount || "0"} reviews)</span>
                </div>
              </div>
            </div>

            <Link 
              to={`/consultant/${consultant.id}`}
              className="inline-flex items-center justify-center px-6 py-2.5 border-2 border-[#C77752] text-[#C77752] rounded-full text-sm font-medium hover:bg-[#FCE8E0] transition-colors shrink-0 w-full md:w-auto"
            >
              View Profile
            </Link>
          </div>

          <p className="text-zinc-600 leading-relaxed mb-6">
            {consultant.bio || consultant.quote || `Local expert from ${consultant.city}. I've spent years exploring every museum, gallery, and hidden corner of this city.`}
          </p>

          <button 
            onClick={handleAskClick}
            className="inline-flex items-center justify-center gap-2 bg-[#C77752] hover:bg-[#A86444] text-white px-8 py-3 rounded-full text-sm font-medium transition-colors w-full sm:w-auto"
          >
            <MessageCircle className="w-4 h-4" />
            Ask {displayName.split(' ')[0]}
          </button>
        </div>
      </div>
    </section>
  );
};

export default ConsultantBannerFull;