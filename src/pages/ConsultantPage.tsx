import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Star, MessageCircle, Clock, Globe, Heart, Share2, Sparkles, MapPin, Trophy, Award, Calendar, CheckCircle, Images } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ReviewCard from "@/components/ReviewCard";
import ReviewCardCompact from "@/components/ReviewCardCompact";
import AISummaryDialog from "@/components/AISummaryDialog";
import LocalsCarousel from "@/components/LocalsCarousel";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  consultants, 
  thailandConsultants, 
  parisConsultants, 
  reviews,
  type Consultant 
} from "@/data/mockData";

const ConsultantPage = () => {
  const [showAllReviews, setShowAllReviews] = useState(false);
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
      <div className="min-h-screen bg-white">
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
    <div className="min-h-screen bg-white">
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

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-20 items-center max-w-5xl mx-auto">
            {/* Left: Consultant Profile Card with decorative circles */}
            <div className="relative max-w-md mx-auto lg:ml-auto lg:mr-0">
              {/* Orange/Coral circle - BEHIND card, extending to the right */}
              <div className="pointer-events-none absolute -top-8 -right-16 lg:-right-24 w-[280px] h-[280px] lg:w-[340px] lg:h-[340px] rounded-full bg-gradient-to-br from-[#E07A5F] to-[#D97706] opacity-75 blur-[2px] z-0" />
              
              {/* Yellow circle - BEHIND card, overlapping bottom-left */}
              <div className="pointer-events-none absolute bottom-12 -left-12 lg:-left-16 w-[160px] h-[160px] lg:w-[200px] lg:h-[200px] rounded-full bg-gradient-to-br from-[#F2A93B] to-[#E8941C] opacity-90 z-[5]" />
              
              {/* Sparkle inside yellow circle - also behind card */}
              <div className="pointer-events-none absolute bottom-20 -left-4 lg:-left-6 z-[6]">
                <Sparkles className="text-amber-200 w-6 h-6" />
              </div>

              {/* Phone Mockup Card */}
              <div className="relative z-10 bg-white rounded-[40px] shadow-xl p-5 w-[280px] lg:w-[320px]">
                {/* Square Photo */}
                <div className="aspect-square rounded-2xl overflow-hidden mb-3 bg-gray-100">
                  <img
                    src={consultant.avatarUrl}
                    alt={consultant.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Name + Location */}
                <div className="text-center mb-2">
                  <h3 className="font-display text-lg font-semibold text-foreground">{consultant.name}</h3>
                  <p className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                    <MapPin size={12} />
                    {consultant.city}
                  </p>
                </div>

                {/* Quote */}
                <p className="text-xs text-muted-foreground text-center italic mb-3 line-clamp-2 px-2">
                  "{consultant.quote || `Your local guide to ${consultant.city}`}"
                </p>

                {/* Hashtags */}
                <div className="flex flex-wrap justify-center gap-1 mb-3">
                  {consultant.tags?.slice(0, 3).map((tag) => (
                    <span key={tag} className="text-xs bg-secondary text-foreground/70 px-2 py-0.5 rounded-full">
                      #{tag}
                    </span>
                  ))}
                </div>

                {/* Avatars + Rating Row */}
                <div className="flex items-center justify-between mb-3 px-1">
                  <div className="flex -space-x-2">
                    <div className="w-7 h-7 rounded-full bg-gray-300 border-2 border-white" />
                    <div className="w-7 h-7 rounded-full bg-gray-400 border-2 border-white" />
                    <div className="w-7 h-7 rounded-full bg-gray-500 border-2 border-white" />
                  </div>
                  <div className="flex items-center gap-0.5">
                    {[1,2,3,4,5].map((i) => (
                      <Star key={i} size={12} className={i <= Math.floor(consultant.rating) ? "fill-amber-400 text-amber-400" : "text-gray-300"} />
                    ))}
                    <span className="text-sm font-medium ml-1">{consultant.rating}</span>
                  </div>
                </div>

                {/* Map Preview */}
                <div className="rounded-2xl border-4 border-teal-300 overflow-hidden mb-3 h-[80px] bg-teal-50 flex items-center justify-center">
                  <MapPin className="text-teal-400 w-6 h-6" />
                </div>

                {/* Booknow Button */}
                <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-full py-2.5 text-sm">
                  Ask now
                </Button>
              </div>
            </div>

            {/* Right: Content */}
            <div className="relative flex flex-col justify-center lg:pl-0 lg:pt-4">
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
                className="bg-[#E07A5F] hover:bg-[#D06A4F] text-white rounded-lg px-4 py-2 text-sm font-medium w-fit"
                size="sm"
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

      {/* Awards/Achievements Section */}
      <section className="py-10 border-b">
        <div className="container mx-auto px-6">
          
          {/* Main Badge Card */}
          <div className="bg-white border rounded-2xl p-6 mb-8">
            <div className="flex items-center justify-between flex-wrap gap-6">
              {/* Left: Local Favorite badge */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1 text-amber-600">
                  <span className="text-2xl">🏆</span>
                  <div className="text-center font-display font-semibold">
                    <p className="text-lg leading-tight">Local</p>
                    <p className="text-lg leading-tight">Favorite</p>
                  </div>
                  <span className="text-2xl">🏆</span>
                </div>
                <div className="hidden sm:block h-12 w-px bg-border" />
                <p className="text-muted-foreground text-sm max-w-[260px]">
                  One of the most loved locals on LokaAsk, according to travelers
                </p>
              </div>
              
              {/* Right: Rating + Reviews */}
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <p className="text-2xl font-bold">{consultant.rating}</p>
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star key={i} size={12} className={i <= Math.floor(consultant.rating) ? "fill-amber-400 text-amber-400" : "text-gray-300"} />
                    ))}
                  </div>
                </div>
                <div className="h-12 w-px bg-border" />
                <div className="text-center">
                  <p className="text-2xl font-bold">{consultantReviews.length}</p>
                  <p className="text-sm text-muted-foreground">Reviews</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Host Info Row */}
          <div className="flex items-center gap-4 pb-6 border-b">
            <img 
              src={consultant.avatarUrl} 
              alt={consultant.name}
              className="w-14 h-14 rounded-full object-cover"
            />
            <div>
              <p className="font-semibold text-lg">Connected with {consultant.name}</p>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                {consultant.isHighlyTrusted && (
                  <span className="flex items-center gap-1">
                    <Award size={14} className="text-primary" />
                    Highly Trusted
                  </span>
                )}
                <span>{consultant.helpedCount}+ travelers helped</span>
              </div>
            </div>
          </div>
          
          {/* Achievement Items + Gallery Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-8 pt-6">
            
            {/* Left Column: All Achievement Items */}
            <div className="space-y-5">
              {/* Certified Expert */}
              <div className="flex items-start gap-4">
                <Award className="w-6 h-6 text-primary shrink-0" />
                <div>
                  <p className="font-semibold">Certified Local Expert</p>
                  <p className="text-sm text-muted-foreground">
                    Verified expertise in {consultant.tags?.slice(0, 2).join(" & ") || consultant.city}
                  </p>
                </div>
              </div>
              
              {/* Identity verified */}
              <div className="flex items-start gap-4">
                <CheckCircle className="w-6 h-6 text-green-500 shrink-0" />
                <div>
                  <p className="font-semibold">Identity verified</p>
                  <p className="text-sm text-muted-foreground">
                    Personal info confirmed. You're in safe hands.
                  </p>
                </div>
              </div>
              
              {/* Quick Responder */}
              {consultant.responseTime && (
                <div className="flex items-start gap-4">
                  <Clock className="w-6 h-6 text-muted-foreground shrink-0" />
                  <div>
                    <p className="font-semibold">Quick Responder</p>
                    <p className="text-sm text-muted-foreground">
                      {consultant.responseTime}
                    </p>
                  </div>
                </div>
              )}
              
              {/* Member since */}
              <div className="flex items-start gap-4">
                <Calendar className="w-6 h-6 text-muted-foreground shrink-0" />
                <div>
                  <p className="font-semibold">3+ years on LokaAsk</p>
                  <p className="text-sm text-muted-foreground">
                    Member since 2022. Experienced local guide.
                  </p>
                </div>
              </div>
              
              {/* Top Rated */}
              {consultant.rating >= 4.8 && (
                <div className="flex items-start gap-4">
                  <Trophy className="w-6 h-6 text-amber-500 shrink-0" />
                  <div>
                    <p className="font-semibold">Top Rated Local</p>
                    <p className="text-sm text-muted-foreground">
                      Highly ranked based on ratings and reliability.
                    </p>
                  </div>
                </div>
              )}
              
              {/* Most Asked */}
              {consultant.helpedCount >= 150 && (
                <div className="flex items-start gap-4">
                  <MessageCircle className="w-6 h-6 text-muted-foreground shrink-0" />
                  <div>
                    <p className="font-semibold">Most Asked</p>
                    <p className="text-sm text-muted-foreground">
                      Helped {consultant.helpedCount}+ travelers with local insights.
                    </p>
                  </div>
                </div>
              )}
              
              {/* Highlighted Reviews */}
              {consultantReviews.length > 0 && (
                <div className="mt-8 pt-8 border-t">
                  <h3 className="font-display text-lg font-semibold mb-4">
                    Highlighted reviews from travelers
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {consultantReviews.slice(0, 2).map((review) => (
                      <ReviewCardCompact key={review.id} review={review} />
                    ))}
                  </div>
                  
                  {consultantReviews.length > 2 && (
                    <button 
                      onClick={() => setShowAllReviews(true)}
                      className="text-sm font-medium underline mt-4 text-primary hover:text-primary/80"
                    >
                      See more reviews ({consultantReviews.length})
                    </button>
                  )}
                </div>
              )}
            </div>
            
            {/* Right Column: Image Gallery */}
            <div className="relative min-h-[280px] lg:min-h-[320px] self-start">
              <div className="grid grid-cols-[2fr_1fr] gap-2 h-full rounded-xl overflow-hidden">
                
                {/* Large image on left */}
                <img 
                  src={consultant.avatarUrl} 
                  alt="Gallery main"
                  className="w-full h-full object-cover rounded-l-xl"
                />
                
                {/* Right column: 2 stacked images */}
                <div className="flex flex-col gap-2">
                  {/* Top smaller image */}
                  <div className="flex-1">
                    <img 
                      src={consultant.avatarUrl} 
                      alt="Gallery 2"
                      className="w-full h-full object-cover rounded-tr-xl"
                    />
                  </div>
                  
                  {/* Bottom smaller image with overlay */}
                  <div className="relative flex-1">
                    <img 
                      src={consultant.avatarUrl} 
                      alt="Gallery 3"
                      className="w-full h-full object-cover rounded-br-xl"
                    />
                    <button className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-sm text-gray-800 px-3 py-2 rounded-full flex items-center gap-2 shadow-lg hover:bg-white transition-colors text-sm font-medium">
                      <Images size={16} />
                      <span>18</span>
                    </button>
                  </div>
                </div>
                
              </div>
            </div>
            
          </div>
        </div>
      </section>

      {/* All Reviews Modal */}
      <Dialog open={showAllReviews} onOpenChange={setShowAllReviews}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">
              Customer reviews
            </DialogTitle>
            <div className="flex items-center gap-2 pt-2">
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    size={16}
                    className={i < Math.floor(consultant.rating) ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}
                  />
                ))}
              </div>
              <span className="text-sm font-medium">{consultant.rating} / 5</span>
              <span className="text-sm text-muted-foreground">({consultantReviews.length} reviews)</span>
            </div>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            {consultantReviews.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))}
          </div>
        </DialogContent>
      </Dialog>

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
