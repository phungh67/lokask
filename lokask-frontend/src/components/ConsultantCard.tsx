import { Link, useNavigate } from "react-router-dom";
import { Star, Heart, MessageCircleQuestion } from "lucide-react";
import { Consultant } from "@/types/consultant";
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

  // 🟢 Navigation handler for the whole card
  const handleCardClick = () => {
    navigate(`/consultant/${consultant.id}`);
  };

  return (
    <div 
      onClick={handleCardClick} // 🟢 Make the card clickable
      className="relative bg-gradient-to-b from-terracotta-light to-white rounded-2xl p-6 shadow-sm border border-primary/10 hover:shadow-lg hover:scale-[1.02] transition-all duration-300 w-full max-w-[280px] cursor-pointer group h-full flex flex-col"
    >
      
      {/* Badge Logic */}
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

      {/* Avatar */}
      <div className="flex justify-center mb-3">
        <div className={`w-36 h-36 rounded-full overflow-hidden shadow-md shrink-0 ${
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
      <div className="mb-2 text-center">
        <div className="flex items-center justify-center gap-2 relative">
          <h3 className="font-bold text-xl text-foreground font-sans truncate px-4">
            {consultant.displayName || consultant.name}
          </h3>
          
          {/* Heart Button */}
          <button 
            className="absolute right-0 p-1.5 rounded-full hover:bg-gray-100 transition-all"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation(); // 🟢 Prevent triggering the card click
              requireAuth(() => {}, { actionType: 'wishlist', consultantName: consultant.name });
            }}
          >
            <Heart className="w-5 h-5 text-gray-400 hover:text-red-500 transition-colors" />
          </button>
        </div>
        <p className="text-sm text-muted-foreground">{consultant.city}</p>
      </div>

      {/* Quote */}
      <div className="min-h-[60px] flex items-center justify-center mb-4">
        <p className="text-sm text-muted-foreground italic text-center line-clamp-3">
          "{consultant.quote}"
        </p>
      </div>

      {/* Tags */}
      <div className="h-[32px] mb-4 flex justify-center">
        {consultant.tags && consultant.tags[0] && (
          <span className={`rounded-full px-3 py-1 text-xs inline-block ${
            showMostAskedBadge
              ? 'border border-[#D88C1D] text-[#D88C1D]'
              : consultant.isHighlyTrusted
                ? 'border border-[#1F6F54] text-[#1F6F54]'
                : 'border border-primary/30 text-primary'
          }`}>
            {consultant.tags[0]}
          </span>
        )}
      </div>

      {/* Rating Stats */}
      <div className="mt-auto">
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-4">
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
            <span className="font-medium text-foreground">{consultant.rating}</span>
          </div>
          <span className="text-muted-foreground/50">|</span>
          <span>{consultant.helpedCount} travellers helped</span>
        </div>

        {/* 🟢 Swapped Link for a Button to prevent nested <a> tag behavior */}
        <Button 
          onClick={(e) => {
            e.stopPropagation(); // Prevent duplicate navigation
            navigate(`/consultant/${consultant.id}`);
          }}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-full py-2.5"
        >
          Ask this local
        </Button>
      </div>

      <AuthPromptDialog
        open={showPrompt}
        onOpenChange={setShowPrompt}
        message={promptMessage}
        defaultStep="login"
        defaultRole="traveller"
      />
    </div>
  );
};
export default ConsultantCard;