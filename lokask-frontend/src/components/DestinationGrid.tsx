import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

// 🟢 Define hardcoded destinations locally to replace mockData imports
const DESTINATIONS = [
  {
    name: "Thailand",
    slug: "thailand",
    imageUrl: "https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=800&auto=format&fit=crop",
  },
  {
    name: "Paris",
    slug: "paris",
    imageUrl: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&auto=format&fit=crop",
  },
  {
    name: "Rome",
    slug: "rome",
    imageUrl: "https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800&auto=format&fit=crop",
  },
  {
    name: "Tokyo",
    slug: "tokyo",
    imageUrl: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800&auto=format&fit=crop",
  },
  {
    name: "Bali",
    slug: "bali",
    imageUrl: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800&auto=format&fit=crop",
  },
  {
    name: "London",
    slug: "london",
    imageUrl: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800&auto=format&fit=crop",
  },
];

const DestinationGrid = () => {
  return (
    <section className="py-16 lg:py-24">
      <div className="container mx-auto px-6">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl lg:text-4xl font-bold text-foreground font-sans">
            Popular places travellers ask about
          </h2>
          <Link 
            to="/explore-locals" 
            className="inline-flex items-center gap-1.5 text-primary font-medium text-sm hover:underline whitespace-nowrap"
          >
            See more
            <ArrowRight size={16} />
          </Link>
        </div>

        <div className="relative px-12">
          <Carousel
            opts={{
              align: "start",
              loop: true,
            }}
            className="w-full"
          >
            <CarouselContent className="-ml-4">
              {DESTINATIONS.map((destination, index) => (
                <CarouselItem
                  key={destination.slug}
                  className="pl-4 basis-1/2 md:basis-1/3 lg:basis-1/6"
                >
                  <Link
                    to={`/destinations/${destination.slug}`}
                    className="group relative overflow-hidden rounded-2xl aspect-[4/5] block animate-fade-in"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <img
                      src={destination.imageUrl}
                      alt={destination.name}
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
                    <div className="absolute bottom-3 left-3">
                      <span className="bg-gray-900/90 text-white text-sm font-semibold px-3 py-1.5 rounded-lg inline-block">
                        {destination.name}
                      </span>
                    </div>
                  </Link>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="left-0" />
            <CarouselNext className="right-0" />
          </Carousel>
        </div>
      </div>
    </section>
  );
};

export default DestinationGrid;