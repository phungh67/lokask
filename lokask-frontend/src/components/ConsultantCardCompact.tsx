import { Star, Heart } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import type { Consultant } from "@/types/consultant";
import AuthPromptDialog from "@/components/auth/AuthPromptDialog";
import { useAuthPrompt } from "@/hooks/useAuthPrompt";

interface ConsultantCardCompactProps {
  consultant: Consultant;
}

const ConsultantCardCompact = ({ consultant }: ConsultantCardCompactProps) => {
  const navigate = useNavigate();
  const { showPrompt, setShowPrompt, promptMessage, requireAuth } =
    useAuthPrompt();

  const handleCardClick = () => {
    navigate(`/consultant/${consultant.id}`);
  };

  const finalName = consultant.displayName || consultant.name;

  return (
    <div
      onClick={handleCardClick}
      className="bg-white rounded-[20px] overflow-hidden w-[324px] h-[433px] flex flex-col transition-all duration-300 hover:scale-[1.02] hover:shadow-strong group cursor-pointer mx-auto"
      style={{ boxShadow: "0 8px 24px rgba(0,0,0,0.08)" }}
    >
      {/* Cover Image */}
      <div className="relative h-[130px] overflow-hidden">
        <img
          src={consultant.coverUrl}
          alt=""
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
      </div>

      {/* Content with overlapping avatar */}
      <div className="flex flex-col items-center text-center px-6 pb-6 -mt-14 relative flex-1">
        {/* Avatar - Large, overlapping the cover */}
        <div className="mb-3">
          <img
            src={consultant.avatarUrl}
            alt={`${consultant.name}'s profile`}
            className="w-[104px] h-[104px] rounded-full object-cover border-[4px] border-white transition-transform duration-300 group-hover:scale-105"
            style={{
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            }}
          />
        </div>

        {/* Name with Wishlist */}
        <div className="flex items-center justify-between w-full gap-2 overflow-hidden">
          <h3
            className="font-bold text-[18px] text-foreground leading-tight font-sans truncate flex-1 text-left"
            title={consultant.name} // Native HTML tooltip shows their full name on hover
          >
            {finalName}
          </h3>
          <button
            className="p-1 shrink-0 rounded-full hover:bg-gray-100 transition-all duration-200 hover:scale-110"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              requireAuth(
                () => {
                  /* Toggle wishlist logic */
                },
                { actionType: "wishlist", consultantName: consultant.name },
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
        <span
          className="inline-block px-4 py-1.5 text-[13px] font-medium rounded-full mb-auto transition-colors shrink-0"
          style={{
            backgroundColor: "rgba(196, 106, 74, 0.12)",
            color: "#C46A4A",
          }}
        >
          {consultant.tag}
        </span>

        {/* Rating & Helped - Single line */}
        <div className="flex items-center gap-1 text-[12px] text-muted-foreground mb-4 flex-wrap justify-center">
          <span className="flex items-center gap-1">
            <Star size={12} className="fill-primary text-primary" />
            <span className="font-medium text-foreground">
              {consultant.rating} stars
            </span>
          </span>
          <span className="mx-1">|</span>
          <span>{consultant.helpedCount} travellers helped</span>
        </div>

        {/* 🟢 Swapped Link for a Button element */}
        <button
          onClick={(e) => {
            e.stopPropagation(); // Prevent duplicate navigation
            navigate(`/consultant/${consultant.id}`);
          }}
          className="w-full h-[46px] shrink-0 rounded-full bg-primary text-primary-foreground text-[15px] font-semibold hover:bg-primary/90 transition-all flex items-center justify-center active:scale-[0.98]"
          aria-label={`Ask ${consultant.name} for travel advice`}
        >
          Ask this local
        </button>
      </div>

      {/* Auth Prompt Dialog */}
      <AuthPromptDialog
        open={showPrompt}
        onOpenChange={setShowPrompt}
        message={promptMessage}
        onLogin={() => navigate("/login")}
        onSignup={() => navigate("/signup")}
        onGoogleAuth={() => navigate("/login")}
        onFacebookAuth={() => navigate("/login")}
      />
    </div>
  );
};
export default ConsultantCardCompact;
