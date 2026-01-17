import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from "@/components/ui/carousel";
import ConsultantCard from "@/components/ConsultantCard";
import { Consultant } from "@/data/mockData";

interface LocalsCarouselProps {
  title: string;
  consultants: Consultant[];
  seeMoreLink?: string;
}

const LocalsCarousel = ({ title, consultants, seeMoreLink = "/explore-locals" }: LocalsCarouselProps) => {
  return (
    <section className="py-10 lg:py-14">
      <div className="container px-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl lg:text-4xl font-bold text-foreground font-sans">
            {title}
          </h2>
          <Link 
            to={seeMoreLink} 
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
              loop: true
            }}
            className="w-full"
          >
            <CarouselContent className="-ml-4">
              {consultants.map((consultant) => (
                <CarouselItem key={consultant.id} className="pl-4 basis-[270px] shrink-0">
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
          to={seeMoreLink} 
          className="flex md:hidden items-center justify-center gap-2 mt-8 text-sm font-medium text-foreground hover:text-primary transition-colors"
        >
          See more
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </section>
  );
};

export default LocalsCarousel;
