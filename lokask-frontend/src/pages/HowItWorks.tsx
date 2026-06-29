import { useState } from "react";
import { Link } from "react-router-dom";
import { Search, MessageCircle, Sparkles, User, MessageSquare, Wallet, MapPin, Star } from "lucide-react";

// --- PURE CSS UI MOCKUPS ---
const ConsultantCardMockup = () => (
  <div className="bg-white p-5 rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 w-72 mx-auto rotate-[-2deg] hover:rotate-0 transition-all duration-300">
    <div className="flex items-center gap-4 mb-4">
      <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">H</div>
      <div>
        <div className="font-bold text-gray-800 text-sm mb-1">Huy Hoàng</div>
        <div className="flex items-center gap-1 text-[10px] text-gray-500">
          <MapPin size={10} /> Ha Giang <span className="mx-1">•</span> <Star size={10} className="text-yellow-400 fill-yellow-400"/> 5.0
        </div>
      </div>
    </div>
    <div className="flex gap-2 mb-4">
      <span className="px-2 py-1 bg-gray-100 rounded-full text-[10px] font-medium text-gray-600">Hiking</span>
      <span className="px-2 py-1 bg-gray-100 rounded-full text-[10px] font-medium text-gray-600">Geology</span>
    </div>
    <div className="w-full py-2 bg-primary text-white rounded-lg text-center text-xs font-semibold shadow-sm">
      Ask this local
    </div>
  </div>
);

const ChatInterfaceMockup = () => (
  <div className="bg-white p-4 rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 w-72 mx-auto rotate-[2deg] hover:rotate-0 transition-all duration-300 flex flex-col gap-3">
    <div className="self-end bg-primary text-white text-[11px] py-2 px-3 rounded-2xl rounded-br-none max-w-[85%] shadow-sm">
      Is it safe to walk around District 1 at 2 AM?
    </div>
    <div className="self-start bg-gray-100 text-gray-700 text-[11px] py-2 px-3 rounded-2xl rounded-bl-none max-w-[85%] shadow-sm">
      Absolutely! Just stick to the main lit streets. I can send you a map of the best late-night food spots there if you want!
    </div>
  </div>
);

const ItineraryMockup = () => (
  <div className="bg-white p-3 rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 w-72 mx-auto rotate-[-2deg] hover:rotate-0 transition-all duration-300 relative overflow-hidden">
    <div className="w-full h-32 bg-emerald-50 rounded-xl border border-emerald-100 flex items-center justify-center relative overflow-hidden mb-3">
      <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-emerald-400 via-transparent to-transparent"></div>
      <MapPin className="text-emerald-500 w-10 h-10 absolute animate-bounce" />
    </div>
    <div className="h-2 w-24 bg-gray-200 rounded-full mb-2"></div>
    <div className="h-2 w-16 bg-gray-100 rounded-full"></div>
  </div>
);

const ProfileEditorMockup = () => (
  <div className="bg-white p-5 rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 w-72 mx-auto rotate-[-2deg] hover:rotate-0 transition-all duration-300 text-center">
    <div className="w-16 h-16 rounded-full bg-gray-50 mx-auto mb-4 border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400">
      <User size={24} />
    </div>
    <div className="w-32 h-3 bg-gray-200 rounded-full mx-auto mb-3"></div>
    <div className="w-20 h-2 bg-gray-100 rounded-full mx-auto mb-5"></div>
    <div className="flex justify-center gap-2">
      <span className="w-12 h-5 bg-primary/10 rounded-full"></span>
      <span className="w-16 h-5 bg-primary/10 rounded-full"></span>
    </div>
  </div>
);

const InboxMockup = () => (
  <div className="bg-white p-3 rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 w-72 mx-auto rotate-[2deg] hover:rotate-0 transition-all duration-300 flex flex-col gap-2">
    {[1, 2, 3].map((i, idx) => (
      <div key={i} className={`flex gap-3 items-center p-2.5 rounded-xl ${idx === 0 ? 'bg-primary/5 border border-primary/10' : 'bg-transparent'}`}>
        <div className="w-10 h-10 rounded-full bg-gray-200 shrink-0"></div>
        <div className="flex-1">
          <div className="w-20 h-2.5 bg-gray-300 rounded-full mb-2"></div>
          <div className="w-full h-2 bg-gray-100 rounded-full"></div>
        </div>
        {idx === 0 && <div className="w-2 h-2 rounded-full bg-primary shrink-0"></div>}
      </div>
    ))}
  </div>
);

const EarningsMockup = () => (
  <div className="bg-white p-6 rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 w-72 mx-auto rotate-[-2deg] hover:rotate-0 transition-all duration-300 text-center">
    <div className="w-14 h-14 rounded-full bg-green-50 text-green-600 flex items-center justify-center mx-auto mb-4">
      <Wallet size={28} />
    </div>
    <div className="text-3xl font-bold text-gray-800 mb-1">$150.00</div>
    <div className="text-xs text-gray-400 font-medium tracking-wide uppercase">Available Balance</div>
  </div>
);
// ----------------------------

const travelerSteps = [
  {
    icon: Search,
    title: "Find a local",
    description: "Search for locals by destination and expertise. Browse profiles to find someone who matches your travel style.",
    visual: <ConsultantCardMockup />
  },
  {
    icon: MessageCircle,
    title: "Ask your questions",
    description: "Reach out and ask anything about your destination. Get honest, personal recommendations from someone who actually lives there.",
    visual: <ChatInterfaceMockup />
  },
  {
    icon: Sparkles,
    title: "Travel with confidence",
    description: "With local insights, you'll discover hidden gems, avoid tourist traps, and experience your destination like a local.",
    visual: <ItineraryMockup />
  },
];

const localSteps = [
  {
    icon: User,
    title: "Create your profile",
    description: "Set up your profile, highlight your local expertise, and define your own hourly rate and availability.",
    visual: <ProfileEditorMockup />
  },
  {
    icon: MessageSquare,
    title: "Share your knowledge",
    description: "Chat with travelers planning a trip to your city. Answer their questions and curate personalized recommendations.",
    visual: <InboxMockup />
  },
  {
    icon: Wallet,
    title: "Get paid",
    description: "Turn your hometown pride into income. Earn money safely and securely for every consultation session you provide.",
    visual: <EarningsMockup />
  },
];

const HowItWorks = () => {
  const [view, setView] = useState<"traveler" | "local">("traveler");

  const currentSteps = view === "traveler" ? travelerSteps : localSteps;

  return (
    <div className="w-full bg-[#F5F2EE] min-h-screen"> 
      <div className="py-16 lg:py-24">
        
        {/* Header & Toggle Section */}
        <div className="max-w-3xl mx-auto text-center mb-20 px-6">
          <h1 className="text-4xl lg:text-6xl font-display font-bold text-foreground mb-6 transition-all">
            How Lokask works
          </h1>
          <p className="text-lg lg:text-xl text-muted-foreground mb-10 min-h-[56px] transition-all">
            {view === "traveler" 
              ? "Get real travel advice from real people who live there. No tours, no bots — just honest local knowledge."
              : "Turn your local expertise into income. Help travelers experience your city the authentic way."}
          </p>

          <div className="inline-flex items-center p-1.5 bg-gray-200/50 rounded-full border border-gray-200 shadow-inner">
            <button
              onClick={() => setView("traveler")}
              className={`px-8 py-3 rounded-full text-sm font-bold transition-all duration-300 ${
                view === "traveler"
                  ? "bg-white text-primary shadow-md"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              For Travelers
            </button>
            <button
              onClick={() => setView("local")}
              className={`px-8 py-3 rounded-full text-sm font-bold transition-all duration-300 ${
                view === "local"
                  ? "bg-white text-primary shadow-md"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              For Locals
            </button>
          </div>
        </div>

        {/* Alternating Steps Section */}
        <div className="max-w-5xl mx-auto px-6 space-y-24 mb-24">
          {currentSteps.map((step, index) => {
            // Determine if the image should be on the left or right
            const isImageLeft = index % 2 !== 0;

            return (
              <div 
                key={`${view}-${index}`} 
                className={`flex flex-col gap-12 items-center md:flex-row animate-in fade-in slide-in-from-bottom-8 duration-700 fill-mode-both ${isImageLeft ? 'md:flex-row-reverse' : ''}`}
                style={{ animationDelay: `${index * 150}ms` }}
              >
                {/* Text Side */}
                <div className="flex-1 text-center md:text-left">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto md:mx-0 mb-6">
                    <step.icon size={32} className="text-primary" />
                  </div>
                  <h2 className="text-2xl lg:text-3xl font-display font-bold text-foreground mb-4">
                    {index + 1}. {step.title}
                  </h2>
                  <p className="text-lg text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                </div>

                {/* Visual Side */}
                <div className="flex-1 w-full flex justify-center py-6">
                  <div className="relative">
                    {/* Decorative background blob */}
                    <div className="absolute inset-0 bg-primary/5 rounded-full blur-3xl transform scale-150"></div>
                    {/* The UI Mockup */}
                    <div className="relative z-10">
                      {step.visual}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Dynamic CTA Button */}
        <div className="text-center px-6">
          {view === "traveler" ? (
            <Link
              to="/explore-locals"
              className="inline-flex items-center gap-2 px-10 py-5 rounded-full bg-primary text-primary-foreground font-bold text-lg hover:opacity-90 hover:scale-105 transition-all shadow-lg shadow-primary/20 animate-in fade-in"
            >
              Start exploring locals
            </Link>
          ) : (
            <Link
              to="/become-local"
              className="inline-flex items-center gap-2 px-10 py-5 rounded-full bg-primary text-primary-foreground font-bold text-lg hover:opacity-90 hover:scale-105 transition-all shadow-lg shadow-primary/20 animate-in fade-in"
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