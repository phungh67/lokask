import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Star, MessageCircle, Clock, Globe, Heart, Share2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ReviewCard from "@/components/ReviewCard";
import AISummaryDialog from "@/components/AISummaryDialog";
import LocalsCarousel from "@/components/LocalsCarousel";
import { 
  consultants, 
  thailandConsultants, 
  parisConsultants, 
  reviews,
  type Consultant 
} from "@/data/mockData";

const ConsultantPage = () => {
  const { id } = useParams<{ id: string }>();

  // Find consultant from all arrays
  const allConsultants = [...consultants, ...thailandConsultants, ...parisConsultants];
  const consultant = allConsultants.find((c) => c.id === id);

  // Get reviews for this consultant
  const consultantReviews = reviews.filter((r) => r.consultantId === id);

  // Get related consultants from same city (excluding current)
  const relatedConsultants = allConsultants.filter(
    (c) => c.city === consultant?.city && c.id !== id
  );

  if (!consultant) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-6 py-20 text-center">
          <h1 className="text-2xl font-display mb-4">Consultant not found</h1>
          <Link to="/" className="text-primary hover:underline">
            ← Back to home
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const badgeType = consultant.isHighlyTrusted ? "trusted" : (consultant.helpedCount >= 160 ? "mostAsked" : null);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Banner Section */}
      <section className="relative min-h-[650px] py-16 overflow-hidden">
        <div className="container mx-auto px-6 relative">
          {/* Back button */}
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
          >
            <ArrowLeft size={18} />
            <span>Back</span>
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            {/* Left: Consultant Profile Card with decorative circles */}
            <div className="relative max-w-md mx-auto lg:mx-0">
              {/* Orange/Coral circle - BEHIND card, extending to the right */}
              <div className="pointer-events-none absolute -top-8 -right-16 lg:-right-24 w-[280px] h-[280px] lg:w-[340px] lg:h-[340px] rounded-full bg-gradient-to-br from-[#E07A5F] to-[#D97706] opacity-75 blur-[2px] z-0" />
              
              {/* Yellow circle - BEHIND card, overlapping bottom-left */}
              <div className="pointer-events-none absolute bottom-12 -left-12 lg:-left-16 w-[160px] h-[160px] lg:w-[200px] lg:h-[200px] rounded-full bg-gradient-to-br from-[#F2A93B] to-[#E8941C] opacity-90 z-[5]" />
              
              {/* Sparkle inside yellow circle - also behind card */}
              <div className="pointer-events-none absolute bottom-20 -left-4 lg:-left-6 z-[6]">
                <Sparkles className="text-amber-200 w-6 h-6" />
              </div>

              {/* Card - z-10 to sit between purple (z-0) and yellow (z-20) */}
              <div className="relative z-10 bg-card rounded-3xl shadow-strong overflow-hidden">
                {/* Card Header with actions */}
                <div className="absolute top-4 left-4 right-4 z-10 flex justify-between">
                  <button className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-colors shadow-soft">
                    <Heart size={18} className="text-foreground/70" />
                  </button>
                  <button className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-colors shadow-soft">
                    <Share2 size={18} className="text-foreground/70" />
                  </button>
                </div>

                {/* Cover Image */}
                <div className="relative h-48">
                  <img
                    src={consultant.coverUrl}
                    alt={`${consultant.city} cover`}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                </div>

                {/* Profile Content */}
                <div className="p-6 -mt-12 relative">
                  {/* Avatar */}
                  <div className={`w-24 h-24 rounded-full border-4 overflow-hidden mb-4 ${
                    badgeType === "trusted" 
                      ? "border-emerald-500" 
                      : badgeType === "mostAsked" 
                        ? "border-primary" 
                        : "border-white"
                  }`}>
                    <img
                      src={consultant.avatarUrl}
                      alt={consultant.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Name and Badge */}
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h2 className="text-xl font-display font-semibold">{consultant.name}</h2>
                    {badgeType === "trusted" && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-medium">
                        <Star size={12} className="fill-current" />
                        Highly trusted
                      </span>
                    )}
                    {badgeType === "mostAsked" && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                        <Star size={12} className="fill-current" />
                        Most asked local
                      </span>
                    )}
                  </div>

                  {/* City */}
                  <p className="text-muted-foreground mb-4">{consultant.city}</p>

                  {/* Rating and Stats */}
                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          size={14}
                          className={i < Math.floor(consultant.rating) ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}
                        />
                      ))}
                      <span className="text-sm font-medium ml-1">{consultant.rating}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {consultant.helpedCount} travellers helped
                    </span>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2 mb-6">
                    {consultant.tags.map((tag) => (
                      <span key={tag} className="tag-pill">
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* CTA Button */}
                  <Button className="w-full rounded-full gap-2" size="lg">
                    <MessageCircle size={18} />
                    Send a message
                  </Button>
                </div>
              </div>
            </div>

            {/* Right: Content */}
            <div className="relative flex flex-col justify-center lg:pl-8 lg:pt-4">
              {/* Sparkle decoration near headline */}
              <div className="pointer-events-none absolute top-0 right-4 lg:right-8">
                <Sparkles className="text-amber-400/60 w-5 h-5" />
              </div>

              <h1 className="font-display text-4xl lg:text-5xl font-semibold text-foreground mb-6 leading-tight">
                Seamless Travel<br />
                Experiences with<br />
                <span className="text-[#1E3A5F]">{consultant.name}</span>
              </h1>

              <p className="text-lg text-muted-foreground mb-8 leading-relaxed max-w-lg">
                Effortless and unforgettable travel adventures. We understand that travel should be about experiencing beauty and wonder. That's why we've crafted a platform that puts seamless travel experiences at the forefront of your journey.
              </p>

              {/* Get Started CTA */}
              <Button 
                className="bg-[#E07A5F] hover:bg-[#D06A4F] text-white rounded-lg px-8 py-3 text-base font-medium"
                size="lg"
              >
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-16 bg-secondary/30">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl">
            <h2 className="font-display text-2xl font-semibold mb-6">
              About {consultant.name}
            </h2>
            
            <p className="text-foreground/80 leading-relaxed mb-8">
              {consultant.bio || `${consultant.name} is a passionate local expert based in ${consultant.city}. With extensive knowledge of the area and a love for sharing hidden gems, they help travelers experience the authentic side of the city.`}
            </p>

            {/* Info Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {consultant.languages && (
                <div className="flex items-center gap-3 bg-card rounded-xl p-4">
                  <Globe size={20} className="text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Languages</p>
                    <p className="text-sm font-medium">{consultant.languages.join(", ")}</p>
                  </div>
                </div>
              )}
              {consultant.responseTime && (
                <div className="flex items-center gap-3 bg-card rounded-xl p-4">
                  <Clock size={20} className="text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Response time</p>
                    <p className="text-sm font-medium">{consultant.responseTime}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Reviews Section */}
      <section className="py-16">
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between mb-8">
            <h2 className="font-display text-2xl font-semibold">
              What travelers say
            </h2>
            {consultantReviews.length > 3 && (
              <Button variant="ghost" className="text-primary">
                See all {consultantReviews.length} reviews
              </Button>
            )}
          </div>

          {consultantReviews.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {consultantReviews.slice(0, 6).map((review) => (
                <ReviewCard key={review.id} review={review} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-card rounded-2xl">
              <p className="text-muted-foreground">No reviews yet. Be the first to share your experience!</p>
            </div>
          )}
        </div>
      </section>

      {/* Related Locals Section */}
      {relatedConsultants.length > 0 && (
        <section className="py-16 bg-secondary/30">
          <div className="container mx-auto px-6">
            <LocalsCarousel
              title={`Other locals in ${consultant.city}`}
              consultants={relatedConsultants}
            />
          </div>
        </section>
      )}

      {/* Final CTA */}
      <section className="py-16">
        <div className="container mx-auto px-6 text-center">
          <h2 className="font-display text-2xl font-semibold mb-4">
            Ready to explore {consultant.city} with {consultant.name}?
          </h2>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            Send a message to start planning your authentic local experience.
          </p>
          <Button size="lg" className="rounded-full gap-2 px-8">
            <MessageCircle size={18} />
            Ask {consultant.name}
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default ConsultantPage;
