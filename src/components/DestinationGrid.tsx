import { Link } from "react-router-dom";
import { destinations } from "@/data/mockData";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

const DestinationGrid = () => {
  return (
    <section className="py-16 lg:py-24">
      <div className="container mx-auto px-6">
        <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-8 font-sans">
          Popular places travellers ask about
        </h2>

        <div className="relative px-12">
          <Carousel
            opts={{
              align: "start",
              loop: true,
            }}
            className="w-full"
          >
            <CarouselContent className="-ml-4">
              {destinations.map((destination, index) => (
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