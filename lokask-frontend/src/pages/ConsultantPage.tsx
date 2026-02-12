import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Star, MessageCircle, Clock, Globe, Heart, Share2, Sparkles, MapPin, Trophy, Award, Calendar, CheckCircle, Images, Users, Play, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ReviewCard from "@/components/ReviewCard";
import ReviewCardCompact from "@/components/ReviewCardCompact";
import LocalsCarousel from "@/components/LocalsCarousel";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
// 🟢 Replace mock imports with real API helpers
import { getConsultantById, getConsultants } from "@/lib/api";
import { Consultant } from "@/types/consultant";
import { useQuery } from "@tanstack/react-query";
import { useChat } from "@/context/ChatContext";
import AuthPromptDialog from "@/components/auth/AuthPromptDialog";
import { useAuthPrompt } from "@/hooks/useAuthPrompt";

const ConsultantPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { openChat } = useChat();
  const { showPrompt, setShowPrompt, promptMessage, requireAuth } = useAuthPrompt();
  
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);

  // 🟢 1. Fetch real Consultant details by ID
  const { data: consultant, isLoading: isProfileLoading } = useQuery({
    queryKey: ["consultant", id],
    queryFn: () => getConsultantById(id!),
    enabled: !!id,
  });

  // 🟢 2. Fetch related consultants in the same city
  const { data: relatedConsultants = [] } = useQuery({
    queryKey: ["consultants", "related", consultant?.city],
    queryFn: () => getConsultants({ city: consultant?.city }),
    enabled: !!consultant?.city,
  });

  // 🟢 3. Handle Loading State
  if (isProfileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!consultant) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="container mx-auto px-6 py-20 text-center">
          <h1 className="text-2xl font-display mb-4">Consultant not found</h1>
          <Link to="/" className="text-primary hover:underline">← Back to home</Link>
        </div>
        <Footer />
      </div>
    );
  }

  // Gallery logic using real data (fallback to city-themed images if empty)
  const galleryImages = consultant.galleryImages?.length 
    ? consultant.galleryImages 
    : [consultant.coverUrl, consultant.coverUrl, consultant.coverUrl];

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <section className="relative min-h-[650px] py-16 overflow-hidden">
        <div className="container mx-auto px-6 relative">
          <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8">
            <ArrowLeft size={18} />
            <span>Back</span>
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-20 items-center max-w-5xl mx-auto">
            {/* Left: Consultant Profile Card */}
            <div className="relative max-w-md mx-auto lg:ml-auto lg:mr-0">
              <div className="relative z-10 bg-white rounded-[40px] shadow-xl p-5 w-[280px] lg:w-[320px] transition-all">
                <div className="relative aspect-square rounded-2xl overflow-hidden mb-3 bg-gray-100">
                  <img src={consultant.avatarUrl} alt={consultant.name} className="w-full h-full object-cover" />
                  <div className="absolute top-3 left-3 w-8 h-8 bg-black/60 rounded-full flex items-center justify-center">
                    <Play className="w-4 h-4 text-white fill-white" />
                  </div>
                </div>

                <div className="text-center mb-2">
                  <h3 className="font-display text-lg font-semibold">{consultant.displayName || consultant.name}</h3>
                  <p className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                    <MapPin size={12} /> {consultant.city}
                  </p>
                </div>

                <p className="text-xs text-muted-foreground text-center italic mb-3 px-2 line-clamp-2">
                  "{consultant.quote}"
                </p>

                <div className="flex flex-wrap justify-center gap-1 mb-3">
                  {consultant.tags?.map(tag => (
                    <span key={tag} className="text-xs bg-secondary text-foreground/70 px-2 py-0.5 rounded-full">#{tag}</span>
                  ))}
                </div>

                <div className="flex items-center justify-between mb-3 px-1">
                  <div className="flex items-center gap-0.5">
                    <Star size={12} className="fill-amber-400 text-amber-400" />
                    <span className="text-sm font-medium ml-1">{consultant.rating}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{consultant.helpedCount}+ helped</span>
                </div>

                <Button 
                  onClick={() => requireAuth(
                    () => openChat(consultant),
                    { actionType: 'ask', consultantName: consultant.name }
                  )}
                  className="w-full bg-primary rounded-full"
                >
                  Ask now
                </Button>
              </div>
            </div>

            {/* Right: AI Content */}
            <div className="relative flex flex-col justify-center">
              <button 
                onClick={() => requireAuth(
                  () => setIsWishlisted(!isWishlisted),
                  { actionType: 'wishlist', consultantName: consultant.name }
                )} 
                className="absolute -top-8 right-0 flex items-center gap-2 font-extrabold"
              >
                <Heart size={18} className={isWishlisted ? "fill-red-500 text-red-500" : ""} />
                <span className="text-sm underline">{isWishlisted ? "Saved" : "Add to wishlist"}</span>
              </button>

              <h1 className="text-4xl lg:text-5xl font-extrabold text-foreground mb-4">
                Travel with<br />
                <span className="text-[#1E3A5F]">{consultant.displayName || consultant.name}</span>
              </h1>

              <div className="flex items-center gap-2 mb-6">
                <Users size={14} className="text-[#1E3A5F]" />
                <span className="text-sm italic text-lime-600">AI-generated summary of reviews</span>
              </div>

              <p className="text-lg text-muted-foreground mb-8 max-w-lg">
                {consultant.bio || "Consistently described as a passionate local expert."}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Info Sections */}
      <section className="py-16 bg-secondary/30">
        <div className="container mx-auto px-6 max-w-3xl">
          <h2 className="text-2xl font-semibold mb-6">About {consultant.name}</h2>
          <p className="text-foreground/80 mb-8">{consultant.bio}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-card rounded-xl p-4">
              <Globe size={20} className="text-primary mb-2" />
              <p className="text-xs text-muted-foreground uppercase">Languages</p>
              <p className="text-sm font-medium">{consultant.languages?.join(", ") || "English"}</p>
            </div>
            <div className="bg-card rounded-xl p-4">
              <Clock size={20} className="text-primary mb-2" />
              <p className="text-xs text-muted-foreground uppercase">Response time</p>
              <p className="text-sm font-medium">{consultant.responseTime || "Within an hour"}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Gallery */}
      <section className="py-16">
        <div className="container mx-auto px-6">
          <h2 className="text-2xl font-semibold mb-6">Experience {consultant.city}</h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[400px]">
            <img src={galleryImages[0]} className="lg:col-span-2 w-full h-full object-cover rounded-xl" alt="Gallery" />
            <div className="grid grid-rows-2 gap-4">
              <img src={galleryImages[1]} className="w-full h-full object-cover rounded-xl" alt="Gallery" />
              <img src={galleryImages[2]} className="w-full h-full object-cover rounded-xl" alt="Gallery" />
            </div>
          </div>
        </div>
      </section>

      {/* Related Section */}
      {relatedConsultants.length > 0 && (
        <section className="py-16 bg-secondary/30">
          <div className="container mx-auto px-6">
            <LocalsCarousel title={`Other locals in ${consultant.city}`} consultants={relatedConsultants.filter(c => c.id !== id)} />
          </div>
        </section>
      )}

      <Footer />
      <AuthPromptDialog
        open={showPrompt}
        onOpenChange={setShowPrompt}
        message={promptMessage}
        onLogin={() => navigate('/login')}
        onSignup={() => navigate('/signup')}
      />
    </div>
  );
};

export default ConsultantPage;