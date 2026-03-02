import { useState, useRef } from "react"; // 🟢 Added useRef
import { Play, Loader2, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react"; // 🟢 Added Chevron icons
import { useQuery } from "@tanstack/react-query";
import { getConsultants } from "@/lib/api";
import SearchBar from "./SearchBar";
import ConsultantCardCompact from "./ConsultantCardCompact";
import heroDesertPoster from "@/assets/hero-desert-poster.jpg";
import { useNavigate, Link } from "react-router-dom";

const slides = [{
  video: "https://videos.pexels.com/video-files/3015488/3015488-uhd_2560_1440_24fps.mp4",
  poster: heroDesertPoster,
  location: "Siwa Oasis, Egypt",
  description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse varius."
}, {
  video: "https://videos.pexels.com/video-files/1721294/1721294-uhd_2560_1440_25fps.mp4",
  poster: heroDesertPoster,
  location: "Amalfi Coast, Italy",
  description: "Where cliffside villages cascade down to the sparkling Mediterranean."
}, {
  video: "https://videos.pexels.com/video-files/2169880/2169880-uhd_2560_1440_30fps.mp4",
  poster: heroDesertPoster,
  location: "Kyoto, Japan",
  description: "Ancient temples whisper stories among bamboo groves and cherry blossoms."
}, {
  video: "https://videos.pexels.com/video-files/857195/857195-hd_1920_1080_25fps.mp4",
  poster: heroDesertPoster,
  location: "Santorini, Greece",
  description: "Whitewashed villages perched above the deep blue Aegean Sea."
}];

const HeroSection = () => {
  const navigate = useNavigate();
  // 🟢 1. Create a reference to the scrollable container
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const handleHeroSearch = (filters: { where: string; who: string }) => {
    const params = new URLSearchParams();
    if (filters.where) params.append("city", filters.where);
    if (filters.who) params.append("niche", filters.who);

    navigate(`/consultants?${params.toString()}`);
  };
  const [activeSlide, setActiveSlide] = useState(0);

  const { data: response, isLoading } = useQuery({
    queryKey: ["consultants", "hero-search"],
    queryFn: () => getConsultants({ limit: 100 }), 
  });

  const consultants = response?.data || [];
  const displayedConsultants = consultants.slice(0, 5);

  // 🟢 2. The scroll function
  const scroll = (direction: "left" | "right") => {
    if (scrollContainerRef.current) {
      // 348px equals the exact width of one card (324px) plus the gap (24px)
      const scrollAmount = 348; 
      scrollContainerRef.current.scrollBy({ 
        left: direction === "left" ? -scrollAmount : scrollAmount, 
        behavior: "smooth" 
      });
    }
  };

  return (
    <section className="relative min-h-[calc(100vh-64px)]">
      <div className="flex flex-col lg:flex-row min-h-[calc(100vh-64px)]">
        {/* Left Column - Video Panel */}
        <div className="lg:w-[42%] relative">
          <div className="rounded-tr-[64px] lg:rounded-tr-[96px] overflow-hidden relative h-[450px] lg:h-full lg:min-h-[calc(100vh-64px)]">
            <video key={slides[activeSlide].video} autoPlay muted loop playsInline poster={slides[activeSlide].poster} className="absolute inset-0 w-full h-full object-cover">
              <source src={slides[activeSlide].video} type="video/mp4" />
            </video>
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
            <button className="absolute left-6 lg:left-8 bottom-48 lg:bottom-56 w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors" aria-label="Play video">
              <Play size={24} className="text-white ml-1" fill="white" />
            </button>
            <div className="absolute bottom-6 lg:bottom-8 left-6 lg:left-8 right-6 lg:right-16">
              <h3 className="text-white text-2xl lg:text-3xl font-display font-semibold mb-2">
                {slides[activeSlide].location}
              </h3>
              <p className="text-white/80 text-sm lg:text-base leading-relaxed max-w-sm">
                {slides[activeSlide].description}
              </p>
              <button className="mt-4 text-white text-xs font-semibold tracking-wider flex items-center gap-1 hover:gap-2 transition-all uppercase">
                Read more
                <span className="text-lg">›</span>
              </button>
            </div>
            <div className="absolute bottom-8 left-1/2 lg:left-auto lg:right-8 -translate-x-1/2 lg:translate-x-0 flex gap-2">
              {slides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setActiveSlide(index)}
                  className={`w-2.5 h-2.5 rounded-full transition-all ${index === activeSlide ? "bg-white w-6" : "bg-white/40 hover:bg-white/60"}`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Right Column - Content */}
        <div className="lg:w-[58%] px-6 lg:pl-12 lg:pr-8 xl:pr-16 py-8 lg:py-12 flex flex-col justify-center">
          <h1 className="text-4xl lg:text-5xl xl:text-[56px] font-body font-black text-foreground leading-[1.1] mb-4 tracking-tight">
            Ask locals. Travel with<br className="hidden lg:block" /> confidence.
          </h1>
          <p className="text-lg lg:text-xl text-muted-foreground mb-8 max-w-xl leading-relaxed">
            Find real people who live there and get honest advice before your trip.
          </p>
          <div className="mb-10 max-w-2xl">
            <SearchBar onSearch={handleHeroSearch}/>
          </div>

          {/* Top Consultants */}
          <div>
            <div className="flex items-center justify-between mb-5 pr-4">
              <h2 className="text-lg font-semibold text-foreground font-sans">
                Top locals travellers trust
              </h2>
              
              <div className="flex items-center gap-4">
                {/* 🟢 3. The New Navigation Buttons */}
                <div className="hidden sm:flex items-center gap-2">
                  <button 
                    onClick={() => scroll("left")}
                    className="w-8 h-8 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
                    aria-label="Scroll left"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button 
                    onClick={() => scroll("right")}
                    className="w-8 h-8 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
                    aria-label="Scroll right"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>

                <Link to="/consultants" className="text-primary text-sm font-semibold hover:underline flex items-center gap-1 shrink-0">
                  See more <ArrowRight size={16} />
                </Link>
              </div>
            </div>

            {isLoading ? (
              <div className="flex gap-6 overflow-hidden pb-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="w-[324px] h-[433px] bg-muted/30 animate-pulse rounded-[20px] shrink-0" />
                ))}
              </div>
            ) : (
              // 🟢 4. Attach the ref to the scrollable container
              <div 
                ref={scrollContainerRef}
                className="flex gap-6 overflow-x-auto pb-8 pt-2 snap-x px-2 -mx-2 scroll-smooth" 
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {displayedConsultants.map(consultant => (
                  <div key={consultant.id} className="shrink-0 snap-start">
                    <ConsultantCardCompact consultant={consultant} />
                  </div>
                ))}

                <div className="shrink-0 snap-start flex items-center justify-center w-[200px] h-[433px]">
                  <Link to="/consultants" className="flex flex-col items-center justify-center gap-4 text-muted-foreground hover:text-primary transition-colors group">
                    <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center group-hover:bg-primary/10 group-hover:scale-110 transition-all duration-300">
                      <ArrowRight className="w-8 h-8" />
                    </div>
                    <span className="font-semibold">Explore all locals</span>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;