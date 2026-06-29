import { useState } from "react";
import { Link } from "react-router-dom";
import { Search, MessageCircle, Sparkles, User, MessageSquare, Wallet } from "lucide-react";

const travelerSteps = [
  {
    icon: Search,
    title: "Find a local",
    description: "Search for locals by destination and expertise. Browse profiles to find someone who matches your travel style.",
  },
  {
    icon: MessageCircle,
    title: "Ask your questions",
    description: "Reach out and ask anything about your destination. Get honest, personal recommendations from someone who actually lives there.",
  },
  {
    icon: Sparkles,
    title: "Travel with confidence",
    description: "With local insights, you'll discover hidden gems, avoid tourist traps, and experience your destination like a local.",
  },
];

const localSteps = [
  {
    icon: User,
    title: "Create your profile",
    description: "Set up your profile, highlight your local expertise, and define your own hourly rate and availability.",
  },
  {
    icon: MessageSquare,
    title: "Share your knowledge",
    description: "Chat with travelers planning a trip to your city. Answer their questions and curate personalized recommendations.",
  },
  {
    icon: Wallet,
    title: "Get paid",
    description: "Turn your hometown pride into income. Earn money safely and securely for every consultation session you provide.",
  },
];

const HowItWorks = () => {
  const [view, setView] = useState<"traveler" | "local">("traveler");

  const currentSteps = view === "traveler" ? travelerSteps : localSteps;

  return (
    <div className="w-full">
      <div className="py-12 lg:py-20">
        
        {/* Header & Toggle Section */}
        <div className="max-w-3xl mx-auto text-center mb-12">
          <h1 className="text-4xl lg:text-5xl font-display font-bold text-foreground mb-4 transition-all">
            How Lokask works
          </h1>
          <p className="text-lg text-muted-foreground mb-10 min-h-[56px] transition-all">
            {view === "traveler" 
              ? "Get real travel advice from real people who live there. No tours, no bookings — just honest local knowledge."
              : "Turn your local expertise into income. Help travelers experience your city the authentic way."}
          </p>

          {/* Dual-Audience Toggle */}
          <div className="inline-flex items-center p-1.5 bg-gray-100 rounded-full border border-gray-200">
            <button
              onClick={() => setView("traveler")}
              className={`px-8 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ${
                view === "traveler"
                  ? "bg-white text-primary shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              For Travelers
            </button>
            <button
              onClick={() => setView("local")}
              className={`px-8 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ${
                view === "local"
                  ? "bg-white text-primary shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              For Locals
            </button>
          </div>
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto mb-16 px-6">
          {currentSteps.map((step, index) => (
            <div 
              key={`${view}-${index}`} // Forces React to re-trigger the animation on toggle
              className="text-center animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
                <step.icon size={28} className="text-primary" />
              </div>
              <h2 className="text-xl font-display font-semibold text-foreground mb-3">
                {index + 1}. {step.title}
              </h2>
              <p className="text-muted-foreground">
                {step.description}
              </p>
            </div>
          ))}
        </div>

        {/* Dynamic CTA Button */}
        <div className="text-center">
          {view === "traveler" ? (
            <Link
              to="/explore-locals"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity animate-in fade-in"
            >
              Start exploring locals
            </Link>
          ) : (
            <Link
              to="/become-local"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity animate-in fade-in"
            >
              Become a local on Lokask
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default HowItWorks;