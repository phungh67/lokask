import { useState } from "react";
import { Play } from "lucide-react";
import SearchBar from "./SearchBar";
import ConsultantCardCompact from "./ConsultantCardCompact";
import { consultants } from "@/data/mockData";

const slides = [
  {
    video: "https://videos.pexels.com/video-files/3015488/3015488-uhd_2560_1440_24fps.mp4",
    location: "Siwa Oasis, Egypt",
    description: "Discover the hidden oasis where ancient traditions meet endless golden dunes.",
  },
  {
    video: "https://videos.pexels.com/video-files/1721294/1721294-uhd_2560_1440_25fps.mp4",
    location: "Amalfi Coast, Italy",
    description: "Where cliffside villages cascade down to the sparkling Mediterranean.",
  },
  {
    video: "https://videos.pexels.com/video-files/2169880/2169880-uhd_2560_1440_30fps.mp4",
    location: "Kyoto, Japan",
    description: "Ancient temples whisper stories among bamboo groves and cherry blossoms.",
  },
  {
    video: "https://videos.pexels.com/video-files/857195/857195-hd_1920_1080_25fps.mp4",
    location: "Santorini, Greece",
    description: "Whitewashed villages perched above the deep blue Aegean Sea.",
  },
];

const HeroSection = () => {
  const [activeSlide, setActiveSlide] = useState(0);
  const topConsultants = consultants.slice(0, 4);

  return (
    <section className="relative">
      <div className="container mx-auto px-6 py-8 lg:py-12">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-0">
          {/* Left Column - Video Panel (40%) */}
          <div className="lg:w-2/5 relative">
            <div className="chamfer-tr rounded-3xl overflow-hidden relative h-[400px] lg:h-[600px]">
              {/* Video */}
              <video
                key={slides[activeSlide].video}
                autoPlay
                muted
                loop
                playsInline
                className="absolute inset-0 w-full h-full object-cover"
              >
                <source src={slides[activeSlide].video} type="video/mp4" />
              </video>

              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

              {/* Play button */}
              <button
                className="absolute left-6 bottom-40 lg:bottom-48 w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors"
                aria-label="Play video"
              >
                <Play size={24} className="text-white ml-1" fill="white" />
              </button>

              {/* Location info */}
              <div className="absolute bottom-6 left-6 right-6">
                <h3 className="text-white text-xl lg:text-2xl font-display font-semibold mb-2">
                  {slides[activeSlide].location}
                </h3>
                <p className="text-white/80 text-sm lg:text-base leading-relaxed max-w-xs">
                  {slides[activeSlide].description}
                </p>

                {/* Read more link */}
                <button className="mt-4 text-white text-sm font-medium flex items-center gap-1 hover:gap-2 transition-all">
                  READ MORE
                  <span className="text-lg">›</span>
                </button>
              </div>

              {/* Slide dots */}
              <div className="absolute bottom-6 right-6 flex gap-2">
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

          {/* Right Column - Content (60%) */}
          <div className="lg:w-3/5 lg:pl-12 flex flex-col justify-center">
            {/* Headline */}
            <h1 className="text-4xl lg:text-5xl xl:text-6xl font-display font-bold text-foreground leading-tight mb-4">
              Ask locals. Travel with confidence.
            </h1>

            {/* Subheadline */}
            <p className="text-lg lg:text-xl text-muted-foreground mb-8 max-w-xl">
              Find real people who live there and get honest advice before your trip.
            </p>

            {/* Search Bar */}
            <div className="mb-10">
              <SearchBar />
            </div>

            {/* Top Consultants */}
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-4">
                Top locals travellers trust
              </h2>
              <div className="flex gap-5 overflow-x-auto pb-4 -mx-2 px-2 scrollbar-hide">
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
      </div>
    </section>
  );
};

export default HeroSection;
