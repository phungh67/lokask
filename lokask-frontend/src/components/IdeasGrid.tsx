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
        id: "1",
        category: "Thailand",
        title: "Bangkok Street Food Tour",
        summary: "Discover the best hidden street food stalls in Bangkok with a local expert.",
        coverImageUrl: "https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=800&auto=format&fit=crop",
        authorId: "a1", content: "", createdAt: ""
      },
      {
        id: "2",
        category: "Paris",
        title: "Hidden Arcades of Paris",
        summary: "Explore the beautiful 19th-century covered passages away from the crowds.",
        coverImageUrl: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&auto=format&fit=crop",
        authorId: "a2", content: "", createdAt: ""
      },
      {
        id: "3",
        category: "Rome",
        title: "Testaccio Market Visit",
        summary: "Experience the authentic Roman food scene in the heart of Testaccio.",
        coverImageUrl: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop",
        authorId: "a3", content: "", createdAt: ""
      },
      {
        id: "4",
        category: "Tokyo",
        title: "Traditional Tea Ceremony",
        summary: "Learn the art of Matcha in a historic tea house in Kyoto or Tokyo.",
        coverImageUrl: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800&auto=format&fit=crop",
        authorId: "a4", content: "", createdAt: ""
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
          {/* Updated link to the global blog route */}
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
                {/* mapping from the dynamic blogs array */}
                {blogs.map((blog, index) => (
                  <CarouselItem key={blog.id} className="pl-4 basis-1/2 md:basis-1/3 lg:basis-1/4">
                    {/* Navigates to individual blog page using blog.id */}
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
                          
                          {/* render the blog category if it exists */}
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