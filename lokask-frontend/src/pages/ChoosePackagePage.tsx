import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Loader2, Check, Star } from "lucide-react";
import { getConsultantById } from "@/lib/consultants";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useToast } from "@/hooks/use-toast";

const PACKAGES = [
  {
    id: "pkg_basic",
    name: "Quick Question",
    price: 15,
    duration: "15 minutes",
    description: "Perfect for a few quick recommendations or specific questions about your itinerary.",
    features: [
      "15 minutes of live chat",
      "Response within 24 hours",
      "Text and voice messages",
    ],
    popular: false,
  },
  {
    id: "pkg_standard",
    name: "Deep Dive",
    price: 35,
    duration: "45 minutes",
    description: "Our most popular option. Get your entire itinerary reviewed with hidden gem suggestions.",
    features: [
      "45 minutes of live chat",
      "Priority response",
      "Custom map pins & links",
      "Restaurant reservations advice",
    ],
    popular: true,
  },
  {
    id: "pkg_premium",
    name: "Full Concierge",
    price: 75,
    duration: "2 hours",
    description: "Comprehensive planning. I will help you build your trip from scratch over an extended session.",
    features: [
      "2 hours of live chat (splitable)",
      "Instant priority response",
      "Full daily itinerary review",
      "On-trip emergency text support",
    ],
    popular: false,
  },
];

const ChoosePackagePage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Fetch the consultant's profile so we can show who they are buying a package for
  const { data: consultant, isLoading, error } = useQuery({
    queryKey: ["consultant", id],
    queryFn: () => getConsultantById(id!),
    enabled: !!id,
  });

  const handleSelectPackage = (pkgId: string) => {
    // For MVP: Show a toast and redirect back to the dashboard to simulate a successful purchase
    toast({
      title: "Package Selected!",
      description: "Redirecting to secure checkout...",
    });
    
    // TODO: Integrate Stripe/Payment gateway here
    // After success, navigate back to the chat
    setTimeout(() => {
      navigate("/dashboard", {
        state: { intent: "startChat", targetId: id },
      });
    }, 1500);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-[#F9F8F6]">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-10 h-10 animate-spin text-[#C77752]" />
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !consultant) {
    return (
      <div className="min-h-screen flex flex-col bg-[#F9F8F6]">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center">
          <h1 className="text-2xl font-bold text-zinc-900 mb-4">Consultant not found</h1>
          <button onClick={() => navigate(-1)} className="text-[#C77752] hover:underline">
            ← Go back
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  const displayName = consultant.displayName || consultant.name || "Local Expert";

  return (
    <div className="min-h-screen bg-[#F9F8F6] font-sans flex flex-col">
      <Navbar />

      <main className="flex-1 px-6 pt-12 pb-24">
        <div className="max-w-6xl mx-auto">
          
          {/* Back Navigation */}
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-zinc-500 hover:text-zinc-900 transition-colors mb-10"
          >
            <ArrowLeft size={18} />
            <span className="text-sm font-medium">Back to profile</span>
          </button>

          {/* Header Section */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center justify-center p-1.5 bg-white rounded-full border border-zinc-200 shadow-sm mb-6">
              <img 
                src={consultant.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}`} 
                alt={displayName}
                className="w-12 h-12 rounded-full object-cover"
              />
              <div className="px-4 text-left">
                <div className="text-sm font-bold text-zinc-900 leading-none mb-1">Chat with {displayName}</div>
                <div className="text-xs text-zinc-500 flex items-center gap-1">
                  <Star className="w-3 h-3 fill-[#FBBF24] text-[#FBBF24]" />
                  <span>{consultant.rating || "5.0"} Local Expert in {consultant.city}</span>
                </div>
              </div>
            </div>

            <h1 className="text-4xl md:text-5xl font-display font-bold text-zinc-900 mb-4 tracking-tight">
              Choose your consultation package
            </h1>
            <p className="text-lg text-zinc-500 max-w-2xl mx-auto">
              Unlock dedicated 1-on-1 time with {displayName.split(' ')[0]} to get personalized travel advice, itinerary reviews, and hidden gem recommendations.
            </p>
          </div>

          {/* Pricing Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto items-start">
            {PACKAGES.map((pkg) => (
              <div 
                key={pkg.id}
                className={`relative bg-white rounded-3xl p-8 border transition-all duration-300 hover:shadow-lg flex flex-col h-full ${
                  pkg.popular ? "border-[#C77752] shadow-md scale-100 md:scale-105 z-10" : "border-zinc-200"
                }`}
              >
                {pkg.popular && (
                  <div className="absolute -top-4 left-0 right-0 flex justify-center">
                    <span className="bg-[#C77752] text-white text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="mb-8">
                  <h3 className="text-xl font-bold text-zinc-900 mb-2">{pkg.name}</h3>
                  <div className="flex items-baseline gap-1 mb-4">
                    <span className="text-4xl font-black text-zinc-900">${pkg.price}</span>
                    <span className="text-zinc-500">/ {pkg.duration}</span>
                  </div>
                  <p className="text-sm text-zinc-600 leading-relaxed">
                    {pkg.description}
                  </p>
                </div>

                <div className="flex-1 space-y-4 mb-8">
                  {pkg.features.map((feature, i) => (
                    <div key={i} className="flex items-start gap-3 text-sm text-zinc-700">
                      <div className="mt-0.5 bg-[#FCE8E0] rounded-full p-0.5 shrink-0">
                        <Check className="w-3.5 h-3.5 text-[#C77752]" />
                      </div>
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>

                <button 
                  onClick={() => handleSelectPackage(pkg.id)}
                  className={`w-full py-3.5 rounded-full font-semibold transition-colors mt-auto ${
                    pkg.popular 
                      ? "bg-[#C77752] hover:bg-[#A86444] text-white" 
                      : "bg-zinc-100 hover:bg-zinc-200 text-zinc-900"
                  }`}
                >
                  Select Package
                </button>
              </div>
            ))}
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ChoosePackagePage;