import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/components/ui/carousel";
import ConsultantCard from "@/components/ConsultantCard";
import { consultants } from "@/data/mockData";

const ConsultantsCarousel = () => {
  return (
    <section className="py-16 lg:py-24">
      <div className="container px-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl lg:text-4xl font-bold text-foreground">
            Wonderful locals in Thailand
          </h2>
          <Link
            to="/explore-locals"
            className="hidden md:flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary transition-colors"
          >
            See more
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Carousel */}
        <div className="relative">
          <Carousel
            opts={{
              align: "start",
              loop: true,
            }}
            className="w-full"
          >
            <CarouselContent className="-ml-4">
              {consultants.map((consultant) => (
                <CarouselItem
                  key={consultant.id}
                  className="pl-4 basis-1/2 md:basis-1/3 lg:basis-1/4"
                >
                  <ConsultantCard consultant={consultant} />
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="hidden md:flex -left-12" />
            <CarouselNext className="hidden md:flex -right-12" />
          </Carousel>
        </div>

        {/* Mobile See More */}
        <Link
          to="/explore-locals"
          className="flex md:hidden items-center justify-center gap-2 mt-8 text-sm font-medium text-foreground hover:text-primary transition-colors"
        >
          See more
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </section>
  );
};

export default ConsultantsCarousel;
