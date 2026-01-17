import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { ideas } from "@/data/mockData";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

const IdeasGrid = () => {
  return (
    <section className="py-16 lg:py-24 bg-secondary/30">
      <div className="container mx-auto px-6">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl lg:text-4xl font-display font-bold text-foreground">
            Ideas locals often recommend
          </h2>
          <Link 
            to="/ideas" 
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
              {ideas.map((idea, index) => (
                <CarouselItem
                  key={idea.id}
                  className="pl-4 basis-1/2 md:basis-1/3 lg:basis-1/4"
                >
                  <Link
                    to={`/explore-locals?destination=${idea.destination.toLowerCase()}`}
                    className="group block animate-fade-in"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <article className="relative aspect-[3/4] rounded-2xl overflow-hidden">
                      <img
                        src={idea.imageUrl}
                        alt={idea.title}
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-4">
                        <span className="bg-primary/90 text-primary-foreground text-xs font-medium px-2 py-1 rounded-full inline-block mb-2">
                          {idea.destination}
                        </span>
                        <h3 className="text-base font-display font-semibold text-white mb-1">
                          {idea.title}
                        </h3>
                        <p className="text-white/80 text-xs line-clamp-2">
                          {idea.desc}
                        </p>
                      </div>
                    </article>
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

export default IdeasGrid;
