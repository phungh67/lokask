import { useState } from "react";
import { Play } from "lucide-react";
import SearchBar from "./SearchBar";
import ConsultantCardCompact from "./ConsultantCardCompact";
import { consultants } from "@/data/mockData";
import heroDesertPoster from "@/assets/hero-desert-poster.jpg";

const slides = [
  {
    video: "https://videos.pexels.com/video-files/3015488/3015488-uhd_2560_1440_24fps.mp4",
    poster: heroDesertPoster,
    location: "Siwa Oasis, Egypt",
    description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse varius.",
  },
  {
    video: "https://videos.pexels.com/video-files/1721294/1721294-uhd_2560_1440_25fps.mp4",
    poster: heroDesertPoster,
    location: "Amalfi Coast, Italy",
    description: "Where cliffside villages cascade down to the sparkling Mediterranean.",
  },
  {
    video: "https://videos.pexels.com/video-files/2169880/2169880-uhd_2560_1440_30fps.mp4",
    poster: heroDesertPoster,
    location: "Kyoto, Japan",
    description: "Ancient temples whisper stories among bamboo groves and cherry blossoms.",
  },
  {
    video: "https://videos.pexels.com/video-files/857195/857195-hd_1920_1080_25fps.mp4",
    poster: heroDesertPoster,
    location: "Santorini, Greece",
    description: "Whitewashed villages perched above the deep blue Aegean Sea.",
  },
];

const HeroSection = () => {
  const [activeSlide, setActiveSlide] = useState(0);
  const topConsultants = consultants.slice(0, 4);

  return (
    <section className="relative min-h-[calc(100vh-64px)]">
      <div className="flex flex-col lg:flex-row min-h-[calc(100vh-64px)]">
        {/* Left Column - Video Panel (40%) - Starts from left edge */}
        <div className="lg:w-[42%] relative">
          <div className="rounded-tr-[64px] lg:rounded-tr-[96px] overflow-hidden relative h-[450px] lg:h-full lg:min-h-[calc(100vh-64px)]">
            {/* Video */}
            <video
              key={slides[activeSlide].video}
              autoPlay
              muted
              loop
              playsInline
              poster={slides[activeSlide].poster}
              className="absolute inset-0 w-full h-full object-cover"
            >
              <source src={slides[activeSlide].video} type="video/mp4" />
            </video>

            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

            {/* Play button */}
            <button
              className="absolute left-6 lg:left-8 bottom-48 lg:bottom-56 w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors"
              aria-label="Play video"
            >
              <Play size={24} className="text-white ml-1" fill="white" />
            </button>

            {/* Location info */}
            <div className="absolute bottom-6 lg:bottom-8 left-6 lg:left-8 right-6 lg:right-16">
              <h3 className="text-white text-2xl lg:text-3xl font-display font-semibold mb-2">
                {slides[activeSlide].location}
              </h3>
              <p className="text-white/80 text-sm lg:text-base leading-relaxed max-w-sm">
                {slides[activeSlide].description}
              </p>

              {/* Read more link */}
              <button className="mt-4 text-white text-xs font-semibold tracking-wider flex items-center gap-1 hover:gap-2 transition-all uppercase">
                Read more
                <span className="text-lg">›</span>
              </button>
            </div>

            {/* Slide dots */}
            <div className="absolute bottom-8 left-1/2 lg:left-auto lg:right-8 -translate-x-1/2 lg:translate-x-0 flex gap-2">
              {slides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setActiveSlide(index)}
                  className={`w-2.5 h-2.5 rounded-full transition-all ${
                    index === activeSlide
                      ? "bg-white w-6"
                      : "bg-white/40 hover:bg-white/60"
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Right Column - Content (58%) */}
        <div className="lg:w-[58%] px-6 lg:pl-12 lg:pr-8 xl:pr-16 py-8 lg:py-12 flex flex-col justify-center">
          {/* Headline */}
          <h1 className="text-4xl lg:text-5xl xl:text-[56px] font-body font-black text-foreground leading-[1.1] mb-4 tracking-tight">
            Ask locals. Travel with<br className="hidden lg:block" /> confidence.
          </h1>

          {/* Subheadline */}
          <p className="text-lg lg:text-xl text-muted-foreground mb-8 max-w-xl leading-relaxed">
            Find real people who live there and get honest advice before your trip.
          </p>

          {/* Search Bar */}
          <div className="mb-10 max-w-2xl">
            <SearchBar />
          </div>

          {/* Top Consultants */}
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-5">
              Top locals travellers trust
            </h2>
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
              {topConsultants.map((consultant) => (
                <ConsultantCardCompact
                  key={consultant.id}
                  consultant={consultant}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
