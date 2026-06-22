import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { getBucketImageUrl } from "@/lib/utils";

const DESTINATIONS = [
  {
    name: "Hanoi",
    slug: "hanoi",
    imageUrl: "index/hanoi.jpg",
  },
  {
    name: "Ho Chi Minh City",
    slug: "ho-chi-minh-city",
    imageUrl: "index/ho-chi-minh-city.jpg",
  },
  {
    name: "Hoi An",
    slug: "hoi-an",
    imageUrl: "index/hoi-an.jpg",
  },
  {
    name: "Da Nang",
    slug: "da-nang",
    imageUrl: "index/da-nang.jpg",
  },
  {
    name: "Quang Binh",
    slug: "quang-binh",
    imageUrl: "index/quang-binh.jpg",
  },
  {
    name: "Sapa",
    slug: "sapa",
    imageUrl: "index/sapa.jpg",
  },
];

const DestinationGrid = () => {
  return (
    <section className="py-16 lg:py-24 w-full overflow-hidden">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex justify-between items-center mb-6 md:mb-8">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground font-sans">
            Popular places travellers ask about
          </h2>
          <Link
            to="/explore-locals"
            className="hidden md:inline-flex items-center gap-1.5 text-primary font-medium text-sm hover:underline whitespace-nowrap"
          >
            See more
            <ArrowRight size={16} />
          </Link>
        </div>

        <div className="relative px-0 md:px-12">
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
                  className="pl-4 basis-[60%] sm:basis-1/2 md:basis-1/3 lg:basis-1/6"
                >
                  <Link
                    to={`/explore-locals?city=${encodeURIComponent(destination.name)}`}
                    className="group relative overflow-hidden rounded-2xl aspect-[4/5] block animate-fade-in"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <img
                      src={getBucketImageUrl(destination.imageUrl)}
                      alt={destination.name}
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
                    <div className="absolute bottom-3 left-3 pr-3">
                      <span className="bg-gray-900/90 text-white text-sm font-semibold px-3 py-1.5 rounded-lg inline-block break-words">
                        {destination.name}
                      </span>
                    </div>
                  </Link>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="hidden md:flex left-0" />
            <CarouselNext className="hidden md:flex right-0" />
          </Carousel>
        </div>

        <div className="mt-8 flex justify-center md:hidden">
          <Link to="/explore-locals" className="inline-flex items-center gap-1.5 text-primary font-medium text-sm hover:underline">
            See more places
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default DestinationGrid;