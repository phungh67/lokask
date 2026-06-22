import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

const DESTINATIONS = [
  {
    name: "Hanoi",
    slug: "hanoi",
    imageUrl: "https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=800&auto=format&fit=crop",
  },
  {
    name: "Ho Chi Minh City",
    slug: "ho-chi-minh-city",
    imageUrl: "https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=800&auto=format&fit=crop",
  },
  {
    name: "Hoi An",
    slug: "hoi-an",
    imageUrl: "https://images.unsplash.com/photo-1555921015-c26206080356?w=800&auto=format&fit=crop",
  },
  {
    name: "Da Nang",
    slug: "da-nang",
    imageUrl: "https://images.unsplash.com/photo-1559508551-44bff1de756b?w=800&auto=format&fit=crop",
  },
  {
    name: "Quang Binh",
    slug: "quang-binh",
    imageUrl: "https://images.unsplash.com/photo-1528127269322-539801943592?w=800&auto=format&fit=crop",
  },
  {
    name: "Sapa",
    slug: "sapa",
    imageUrl: "https://images.unsplash.com/photo-1542012836-e82eb0b4b2c1?w=800&auto=format&fit=crop",
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
                    to={`/explore-locals?city=${encodeURIComponent(destination.name)}`}
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