import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Star, MessageCircle, Clock, Globe, Heart, MapPin, Trophy, Award, Calendar, CheckCircle, Images, Users, Play, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import ReviewCard from "@/components/ReviewCard";
import ReviewCardCompact from "@/components/ReviewCardCompact";
import LocalsCarousel from "@/components/LocalsCarousel";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
// 🟢 Use real API helpers
import { getConsultantById, getConsultants } from "@/lib/api";
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
  const { data: relatedResponse } = useQuery({
    queryKey: ["consultants", "related", consultant?.city],
    queryFn: () => getConsultants({ city: consultant?.city }),
    enabled: !!consultant?.city,
  });

  // 🟢 Fix: Safely extract the data array from the paginated response
  const relatedConsultants = Array.isArray(relatedResponse)
    ? relatedResponse
    : relatedResponse?.data || [];

  // 🟢 3. Loading & Error States
  if (isProfileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!consultant) {
    return (
      <div className="container mx-auto px-6 py-20 text-center">
        <h1 className="text-2xl font-display mb-4">Consultant not found</h1>
        <Link to="/" className="text-primary hover:underline">← Back to home</Link>
      </div>
    );
  }

  // 🟢 4. Gallery Logic using mapped backend data
  const galleryImages = consultant.galleryImages?.length
    ? consultant.galleryImages
    : [consultant.coverUrl, consultant.coverUrl, consultant.coverUrl];

  return (
    <div className="min-h-screen bg-white">
      <section className="relative min-h-[650px] py-16 overflow-hidden">
        <div className="container mx-auto px-6 relative">
          <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8">
            <ArrowLeft size={18} />
            <span>Back</span>
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-20 items-center max-w-5xl mx-auto">
            {/* Profile Card */}
            <div className="relative max-w-md mx-auto lg:ml-auto lg:mr-0">
              <div className="relative z-10 bg-white rounded-[40px] shadow-xl p-5 w-[280px] lg:w-[320px] transition-all duration-300 hover:shadow-2xl">
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
                  onClick={() => {
                    const isAuthenticated = !!localStorage.getItem("token");

                    if (isAuthenticated) {
                      navigate("/dashboard", {
                        state: {
                          openChatWith: consultant.id,
                          consultantName: consultant.name
                        }
                      });
                    } else {
                      requireAuth(
                        () => {
                          navigate("/dashboard", {
                            state: {
                              openChatWith: consultant.id,
                              consultantName: consultant.name
                            }
                          });
                        },
                        { actionType: 'ask', consultantName: consultant.name }
                      );
                    }
                  }}
                  className="w-full bg-primary rounded-full"
                >
                  Ask now
                </Button>
              </div>
            </div>

            {/* AI Summary Section */}
            <div className="relative flex flex-col justify-center">
              <button
                onClick={() => requireAuth(
                  () => setIsWishlisted(!isWishlisted),
                  { actionType: 'wishlist', consultantName: consultant.name }
                )}
                className="absolute -top-8 right-0 flex items-center gap-2"
              >
                <Heart size={18} className={isWishlisted ? "fill-red-500 text-red-500" : ""} />
                <span className="text-sm underline font-extrabold">{isWishlisted ? "Saved" : "Add to wishlist"}</span>
              </button>

              <h1 className="text-4xl lg:text-5xl font-extrabold text-foreground mb-4">
                Travel with<br />
                <span className="text-[#1E3A5F]">{consultant.displayName || consultant.name}</span>
              </h1>

              <div className="flex items-center gap-2 mb-6">
                <Users size={14} className="text-[#1E3A5F]" />
                <span className="text-sm italic text-lime-600">AI-generated summary of reviews</span>
              </div>

              <p className="text-lg text-muted-foreground mb-8 max-w-lg leading-relaxed">
                {consultant.bio || "Travellers consistently describe this local as friendly, patient, and easy to talk to."}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Info Section */}
      <section className="py-16 bg-secondary/30">
        <div className="container mx-auto px-6 max-w-3xl">
          <h2 className="text-2xl font-semibold mb-6">About {consultant.name}</h2>
          <p className="text-foreground/80 mb-8 leading-relaxed">{consultant.bio}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-card rounded-xl p-4 flex items-center gap-3">
              <Globe size={20} className="text-primary" />
              <div>
                <p className="text-xs text-muted-foreground uppercase">Languages</p>
                <p className="text-sm font-medium">{consultant.languages?.join(", ") || "English"}</p>
              </div>
            </div>
            <div className="bg-card rounded-xl p-4 flex items-center gap-3">
              <Clock size={20} className="text-primary" />
              <div>
                <p className="text-xs text-muted-foreground uppercase">Response time</p>
                <p className="text-sm font-medium">{consultant.responseTime || "Within an hour"}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Gallery */}
      <section className="py-10 border-b">
        <div className="container mx-auto px-6">
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 mb-8 flex flex-wrap items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <span className="text-2xl">🏆</span>
              <div className="font-bold text-rose-600 leading-tight">LOCAL<br />FAVORITE</div>
              <span className="text-2xl">🏆</span>
              <p className="text-sm text-muted-foreground font-bold ml-4 max-w-[260px]">One of the most loved locals on Lokask, according to travelers</p>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-center"><p className="text-2xl font-bold">{consultant.rating}</p><div className="flex text-amber-400"><Star size={12} fill="currentColor" /></div></div>
              <div className="h-12 w-px bg-border" />
              <div className="text-center"><p className="text-2xl font-bold">{consultant.helpedCount}</p><p className="text-xs text-muted-foreground">Reviews</p></div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="space-y-6">
              {consultant.badges && consultant.badges.length > 0 ? (
                consultant.badges.map((badge) => (
                  <div key={badge.id} className="flex items-start gap-4 transition-all hover:translate-x-1">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Award className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold">{badge.title}</p>
                      <p className="text-sm text-muted-foreground">{badge.description}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground italic">No specific achievements listed yet.</p>
              )}

              <div className="flex items-start gap-4">
                <CheckCircle className="w-6 h-6 text-green-500" />
                <div>
                  <p className="font-semibold">Identity verified</p>
                  <p className="text-sm text-muted-foreground">Personal info confirmed.</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-[2fr_1fr] gap-2 h-[380px] rounded-xl overflow-hidden">
              <img src={galleryImages[0]} className="w-full h-full object-cover" alt="Gallery 1" />
              <div className="flex flex-col gap-2">
                <img src={galleryImages[1]} className="h-1/2 w-full object-cover" alt="Gallery 2" />
                <div className="relative h-1/2">
                  <img src={galleryImages[2]} className="w-full h-full object-cover" alt="Gallery 3" />
                  <button className="absolute bottom-3 right-3 bg-white/90 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                    <Images size={14} /> {galleryImages.length}+
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Related Section */}
      {relatedConsultants.length > 0 && (
        <section className="py-16 bg-secondary/30">
          <div className="container mx-auto px-6">
            <LocalsCarousel
              title={`Other locals in ${consultant.city}`}
              consultants={relatedConsultants.filter((c: any) => c.id !== id)}
            />
          </div>
        </section>
      )}

      {/* Final CTA */}
      <section className="py-20 border-t border-border">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl font-extrabold mb-4 text-foreground">
            Ready to explore {consultant.city} with {consultant.displayName || consultant.name}?
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-md mx-auto">
            Send a message to start planning your authentic local experience directly with {consultant.displayName || consultant.name}.
          </p>
          <Button
            size="lg"
            className="rounded-full gap-2 px-10 py-6 text-lg shadow-lg hover:shadow-xl transition-all"
            onClick={() => requireAuth(
              () => openChat(consultant),
              { actionType: 'ask', consultantName: consultant.name }
            )}
          >
            <MessageCircle size={20} />
            Ask {consultant.displayName || consultant.name} now
          </Button>
        </div>
      </section>

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