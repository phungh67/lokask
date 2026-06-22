import { useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Play, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";

import { getConsultants } from "@/lib/consultants";
import { getBucketImageUrl } from "@/lib/utils";

import SearchBar from "./SearchBar";
import ConsultantCardCompact from "./ConsultantCardCompact";

import heroDesertPoster from "@/assets/hero-desert-poster.jpg";

const SLIDES = [
  {
    video: "index/hero-hanoi.mp4",
    poster: heroDesertPoster,
    location: "Hanoi, Vietnam",
    description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse varius.",
  },
  {
    video: "index/hero-ho-chi-minh-city.mp4",
    poster: heroDesertPoster,
    location: "Ho Chi Minh City, Vietnam",
    description: "Where cliffside villages cascade down to the sparkling Mediterranean.",
  },
  {
    video: "index/hero-hoian.mp4",
    poster: heroDesertPoster,
    location: "Hoian, Vietnam",
    description: "Ancient temples whisper stories among bamboo groves and cherry blossoms.",
  },
  {
    video: "index/hero-sapa.mp4",
    poster: heroDesertPoster,
    location: "Sapa, Vietnam",
    description: "Whitewashed villages perched above the deep blue Aegean Sea.",
  },
];

const HeroSection = () => {
  // hook and state
  const navigate = useNavigate();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [activeSlide, setActiveSlide] = useState(0);

  // data fetching
  const { data: response, isLoading } = useQuery({
    queryKey: ["consultants", "hero-search"],
    queryFn: () => getConsultants({ limit: 100 }),
  });

  const displayedConsultants = response?.data?.slice(0, 5) || [];

  // handler hero section
  const handleHeroSearch = (filters: { where: string; who: string }) => {
    const params = new URLSearchParams();
    if (filters.where) params.append("city", filters.where);
    if (filters.who) params.append("niche", filters.who);
    
    navigate(`/consultants?${params.toString()}`);
  };

  const scrollCarousel = (direction: "left" | "right") => {
    if (scrollContainerRef.current) {
      const scrollAmount = 348; // Card width (324px) + Gap (24px)
      scrollContainerRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  // video render section
  const renderVideoPanel = () => {
    const currentSlide = SLIDES[activeSlide];

    return (
      <div className="lg:w-[42%] relative">
        <div className="rounded-tr-[64px] lg:rounded-tr-[96px] overflow-hidden relative h-[450px] lg:h-full lg:min-h-[calc(100vh-64px)]">
          
          <video
            key={currentSlide.video}
            autoPlay
            muted
            loop
            playsInline
            poster={currentSlide.poster}
            className="absolute inset-0 w-full h-full object-cover"
          >
            <source src={getBucketImageUrl(currentSlide.video)} type="video/mp4" />
          </video>
          
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          
          <button
            className="absolute left-6 lg:left-8 bottom-48 lg:bottom-56 w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors"
            aria-label="Play video"
          >
            <Play size={24} className="text-white ml-1" fill="white" />
          </button>
          
          <div className="absolute bottom-6 lg:bottom-8 left-6 lg:left-8 right-6 lg:right-16">
            <h3 className="text-white text-2xl lg:text-3xl font-display font-semibold mb-2">
              {currentSlide.location}
            </h3>
            <p className="text-white/80 text-sm lg:text-base leading-relaxed max-w-sm">
              {currentSlide.description}
            </p>
            <button className="mt-4 text-white text-xs font-semibold tracking-wider flex items-center gap-1 hover:gap-2 transition-all uppercase">
              Read more
              <span className="text-lg">›</span>
            </button>
          </div>
          
          {/* Pagination Dots */}
          <div className="absolute bottom-8 left-1/2 lg:left-auto lg:right-8 -translate-x-1/2 lg:translate-x-0 flex gap-2">
            {SLIDES.map((_, index) => (
              <button
                key={index}
                onClick={() => setActiveSlide(index)}
                className={`w-2.5 h-2.5 rounded-full transition-all ${
                  index === activeSlide ? "bg-white w-6" : "bg-white/40 hover:bg-white/60"
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderConsultantsCarousel = () => {
    return (
      <div>
        <div className="flex items-center justify-between mb-5 pr-4">
          <h2 className="text-lg font-semibold text-foreground font-sans">
            Top locals travellers trust
          </h2>

          <div className="hidden sm:flex items-center gap-2">
            <button
              onClick={() => scrollCarousel("left")}
              className="w-8 h-8 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
              aria-label="Scroll left"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={() => scrollCarousel("right")}
              className="w-8 h-8 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
              aria-label="Scroll right"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex gap-6 overflow-hidden pb-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="w-[324px] h-[433px] bg-muted/30 animate-pulse rounded-[20px] shrink-0"
              />
            ))}
          </div>
        ) : (
          <div
            ref={scrollContainerRef}
            className="flex gap-6 overflow-x-auto pb-8 pt-2 snap-x px-2 -mx-2 scroll-smooth"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {displayedConsultants.map((consultant) => (
              <div key={consultant.id} className="shrink-0 snap-start">
                <ConsultantCardCompact consultant={consultant} />
              </div>
            ))}

            <div className="shrink-0 snap-start flex items-center justify-center w-[200px] h-[433px]">
              <Link
                to="/consultants"
                className="flex flex-col items-center justify-center gap-4 text-muted-foreground hover:text-primary transition-colors group"
              >
                <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center group-hover:bg-primary/10 group-hover:scale-110 transition-all duration-300">
                  <ArrowRight className="w-8 h-8" />
                </div>
                <span className="font-semibold">Explore all locals</span>
              </Link>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <section className="relative min-h-[calc(100vh-64px)]">
      <div className="flex flex-col lg:flex-row min-h-[calc(100vh-64px)]">
        
        {renderVideoPanel()}

        <div className="lg:w-[58%] px-6 lg:pl-12 lg:pr-8 xl:pr-16 py-8 lg:py-12 flex flex-col justify-center">
          <h1 className="text-4xl lg:text-5xl xl:text-[56px] font-body font-black text-foreground leading-[1.1] mb-4 tracking-tight">
            Ask locals. Travel with
            <br className="hidden lg:block" /> confidence.
          </h1>
          <p className="text-lg lg:text-xl text-muted-foreground mb-8 max-w-xl leading-relaxed">
            Find real people who live there and get honest advice before your trip.
          </p>
          
          <div className="mb-10 w-full xl:max-w-[90%]">
            <SearchBar onSearch={handleHeroSearch} />
          </div>

          {renderConsultantsCarousel()}
        </div>

      </div>
    </section>
  );
};

export default HeroSection;