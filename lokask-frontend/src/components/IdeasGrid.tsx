import { Link } from "react-router-dom";
import { ArrowRight, Loader2 } from "lucide-react";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { useQuery } from "@tanstack/react-query";
import { Blog } from "@/types/blog"; 

const IdeasGrid = () => {
  const { data: blogs = [], isLoading } = useQuery({
    queryKey: ["blogs", "featured"],
    queryFn: async () => [
      {
        id: "135d4476-b280-4074-893a-dfddd45a0674",
        category: "Hanoi",
        title: "Hanoi’s Alleyway Coffee Culture: A Secret World",
        summary: "A quick look into how local students navigate the hidden, narrow alleyways of Vietnam's capital to find the absolute best egg coffee on a budget.",
        coverImageUrl: "/blog/135d4476-b280-4074-893a-dfddd45a0674/cover.jpg",
        authorId: "e1ce3de0-c923-4cd3-973f-532eb6c11004", 
        content: "", 
        createdAt: "2026-06-12T22:17:34.899Z"
      },
      {
        id: "a560ec08-9ebf-4b8d-93d1-ad8c3a555504",
        category: "Hanoi",
        title: "The Art of the Hanoi Sidewalk: Bun Cha on Plastic Stools",
        summary: "A realistic look at Hanoi's legendary street food scene, where world-class culinary art is served on low plastic stools right next to rushing traffic.",
        coverImageUrl: "/blog/a560ec08-9ebf-4b8d-93d1-ad8c3a555504/cover.jpg",
        authorId: "e1ce3de0-c923-4cd3-973f-532eb6c11004", 
        content: "", 
        createdAt: "2026-06-13T17:02:11.105Z"
      },
      {
        id: "610e7a40-a223-4a14-8de6-1f5d89f3fa6b",
        category: "Hanoi",
        title: "Nhà Tập Thể: The Fading Soul of Hanoi's Soviet Apartments",
        summary: "An exploration of Hanoi's old-school collective housing blocks, examining how a style of architecture from a bygone era still holds the city's tightest communities.",
        coverImageUrl: "/blog/610e7a40-a223-4a14-8de6-1f5d89f3fa6b/cover.jpg",
        authorId: "e1ce3de0-c923-4cd3-973f-532eb6c11004", 
        content: "", 
        createdAt: "2026-06-13T17:03:20.750Z"
      }
    ] as Blog[],
  });

  return (
    <section className="py-10 lg:py-14 bg-secondary/30">
      <div className="container mx-auto px-6">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl lg:text-4xl font-bold text-foreground font-sans">
            Ideas locals often recommend
          </h2>
          <Link to="/blog" className="inline-flex items-center gap-1.5 text-primary font-medium text-sm hover:underline whitespace-nowrap">
            See more
            <ArrowRight size={16} />
          </Link>
        </div>

        <div className="relative px-12">
          {isLoading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="animate-spin text-primary w-8 h-8" />
            </div>
          ) : (
            <Carousel opts={{
              align: "start",
              loop: true
            }} className="w-full">
              <CarouselContent className="-ml-4">
                {blogs.map((blog, index) => (
                  <CarouselItem key={blog.id} className="pl-4 basis-1/2 md:basis-1/3 lg:basis-1/4">
                    <Link 
                      to={`/blog/${blog.id}`} 
                      className="group block animate-fade-in" 
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <article className="relative aspect-[3/4] rounded-2xl overflow-hidden">
                        <img 
                          src={blog.coverImageUrl || "https://placehold.co/600x800"} 
                          alt={blog.title} 
                          className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                        <div className="absolute bottom-0 left-0 right-0 p-4">
                          
                          {blog.category && (
                            <span className="bg-primary/90 text-primary-foreground text-xs font-medium px-2 py-1 rounded-full inline-block mb-2">
                              {blog.category}
                            </span>
                          )}
                          
                          <h3 className="text-base font-semibold text-white mb-1 font-sans">
                            {blog.title}
                          </h3>
                          <p className="text-white/80 text-xs line-clamp-2">
                            {blog.summary}
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
          )}
        </div>
      </div>
    </section>
  );
};

export default IdeasGrid;