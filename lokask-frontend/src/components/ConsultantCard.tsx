import { Link, useNavigate } from "react-router-dom";
import { Star, Heart, MessageCircleQuestion } from "lucide-react";
import { Consultant } from "@/data/mockData";
import { Button } from "@/components/ui/button";
import AuthPromptDialog from "@/components/auth/AuthPromptDialog";
import { useAuthPrompt } from "@/hooks/useAuthPrompt";

interface ConsultantCardProps {
  consultant: Consultant;
  showMostAskedBadge?: boolean;
}

const ConsultantCard = ({
  consultant,
  showMostAskedBadge = false
}: ConsultantCardProps) => {
  const navigate = useNavigate();
  const { showPrompt, setShowPrompt, promptMessage, requireAuth } = useAuthPrompt();
  return <div className="relative bg-gradient-to-b from-terracotta-light to-white rounded-2xl p-6 shadow-sm border border-primary/10 hover:shadow-lg hover:scale-[1.02] transition-all duration-300 w-full max-w-[250px] cursor-pointer group">
      {/* Badge - Most Asked Local - Top Right (priority over Highly Trusted) */}
      {showMostAskedBadge ? (
        <span className="absolute top-3 right-3 inline-flex items-center gap-1 bg-[#F2A93B] text-white rounded-full px-2.5 py-1 text-[10px] font-semibold shadow-md z-10">
          <MessageCircleQuestion className="w-3 h-3" />
          Most asked local
        </span>
      ) : consultant.isHighlyTrusted && (
        <span className="absolute top-3 right-3 inline-flex items-center gap-1 bg-[#2F8F6B] text-white rounded-full px-2.5 py-1 text-[10px] font-semibold shadow-md z-10">
          <Heart className="w-3 h-3 fill-white" />
          Highly trusted
        </span>
      )}

      {/* Avatar - Centered Circle */}
      <div className="flex justify-center mb-3">
        <div className={`w-36 h-36 rounded-full overflow-hidden shadow-md ${
          showMostAskedBadge 
            ? 'ring-[3px] ring-[#D88C1D]'
            : consultant.isHighlyTrusted 
              ? 'ring-[3px] ring-[#1F6F54]' 
              : 'ring-2 ring-background'
        }`}>
          <img src={consultant.avatarUrl} alt={consultant.name} className="w-full h-full object-cover object-top transition-transform duration-300 group-hover:scale-105" />
        </div>
      </div>

      {/* Name & City */}
      <div className="mb-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-xl text-foreground font-sans">{consultant.name}</h3>
          <button 
            className="p-1.5 rounded-full hover:bg-gray-100 transition-all duration-200 hover:scale-110"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              requireAuth(
                () => {/* Toggle wishlist logic will be added when auth is connected */},
                { actionType: 'wishlist', consultantName: consultant.name }
              );
            }}
          >
            <Heart className="w-5 h-5 text-gray-400 hover:text-red-500 transition-colors" />
          </button>
        </div>
        <p className="text-sm text-muted-foreground">{consultant.city}</p>
      </div>

      {/* Quote */}
      <p className="text-sm text-muted-foreground italic mb-4">
        "{consultant.quote}"
      </p>

      {/* Tag - Only show first tag */}
      <div className="mb-4">
        {consultant.tags[0] && <span className={`rounded-full px-3 py-1 text-xs ${
          showMostAskedBadge
            ? 'border border-[#D88C1D] text-[#D88C1D]'
            : consultant.isHighlyTrusted
              ? 'border border-[#1F6F54] text-[#1F6F54]'
              : 'border border-primary/30 text-primary'
        }`}>
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

      {/* Auth Prompt Dialog */}
      <AuthPromptDialog
        open={showPrompt}
        onOpenChange={setShowPrompt}
        message={promptMessage}
        onLogin={() => navigate('/login')}
        onSignup={() => navigate('/signup')}
        onGoogleAuth={() => navigate('/login')}
        onFacebookAuth={() => navigate('/login')}
      />
    </div>;
};
export default ConsultantCard;