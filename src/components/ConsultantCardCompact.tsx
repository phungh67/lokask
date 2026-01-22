import { Star, Heart } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import type { Consultant } from "@/data/mockData";
import AuthPromptDialog from "@/components/auth/AuthPromptDialog";
import { useAuthPrompt } from "@/hooks/useAuthPrompt";

interface ConsultantCardCompactProps {
  consultant: Consultant;
}

const ConsultantCardCompact = ({
  consultant
}: ConsultantCardCompactProps) => {
  const navigate = useNavigate();
  const { showPrompt, setShowPrompt, promptMessage, requireAuth } = useAuthPrompt();
  return <div className="bg-white rounded-[20px] overflow-hidden w-[200px] flex-shrink-0 flex flex-col transition-all duration-300 hover:scale-[1.02] hover:shadow-strong group cursor-pointer" style={{
    boxShadow: '0 8px 24px rgba(0,0,0,0.08)'
  }}>
      {/* Cover Image */}
      <div className="relative h-[90px] overflow-hidden">
        <img src={consultant.coverUrl} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
      </div>

      {/* Content with overlapping avatar */}
      <div className="flex flex-col items-center text-center px-4 pb-5 -mt-14 relative">
        {/* Avatar - Large, overlapping the cover */}
        <div className="mb-3">
          <img src={consultant.avatarUrl} alt={`${consultant.name}'s profile`} className="w-[96px] h-[96px] rounded-full object-cover border-[4px] border-white transition-transform duration-300 group-hover:scale-105" style={{
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
        }} />
        </div>

        {/* Name with Wishlist */}
        <div className="flex items-center justify-between w-full gap-2">
          <h3 className="font-bold text-[18px] text-foreground leading-tight font-sans">
            {consultant.name}
          </h3>
          <button 
            className="p-1 rounded-full hover:bg-gray-100 transition-all duration-200 hover:scale-110"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              requireAuth(
                () => {/* Toggle wishlist logic will be added when auth is connected */},
                { actionType: 'wishlist', consultantName: consultant.name }
              );
            }}
          >
            <Heart className="w-4 h-4 text-gray-400 hover:text-red-500 transition-colors" />
          </button>
        </div>

        {/* City */}
        <p className="text-[13px] text-muted-foreground mb-3">
          {consultant.city}
        </p>

        {/* Tag Pill */}
        <span className="inline-block px-3 py-1.5 text-[12px] font-medium rounded-full mb-3 transition-colors" style={{
        backgroundColor: 'rgba(196, 106, 74, 0.12)',
        color: '#C46A4A'
      }}>
          {consultant.tag}
        </span>

        {/* Rating & Helped - Single line */}
        <div className="flex items-center gap-1 text-[12px] text-muted-foreground mb-4 flex-wrap justify-center">
          <span className="flex items-center gap-1">
            <Star size={12} className="fill-primary text-primary" />
            <span className="font-medium text-foreground">{consultant.rating} stars</span>
          </span>
          <span className="mx-1">|</span>
          <span>{consultant.helpedCount} travellers helped</span>
        </div>

        {/* CTA Button */}
        <Link to={`/explore-locals?consultant=${consultant.id}`} className="w-full h-[42px] rounded-full bg-primary text-primary-foreground text-[14px] font-semibold hover:bg-primary/90 transition-all flex items-center justify-center active:scale-[0.98]" aria-label={`Ask ${consultant.name} for travel advice`}>
          Ask this local
        </Link>
      </div>

      {/* Auth Prompt Dialog */}
      <AuthPromptDialog
        open={showPrompt}
        onOpenChange={setShowPrompt}
        message={promptMessage}
        onLogin={() => navigate('/login')}
        onSignup={() => navigate('/signup')}
        onGoogleAuth={() => navigate('/login')}
      />
    </div>;
};
export default ConsultantCardCompact;