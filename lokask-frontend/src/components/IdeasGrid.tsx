import { Link } from "react-router-dom";
import { ArrowRight, Loader2 } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { useQuery } from "@tanstack/react-query";
import { getFeaturedBlogs } from "@/lib/consultants";
import { getBucketImageUrl } from "@/lib/utils";

const BUCKET_URL =
  "https://deun1-general-purpose-bucket.s3.eu-north-1.amazonaws.com/";

const IdeasGrid = () => {
  const { data: blogs = [], isLoading } = useQuery({
    queryKey: ["blogs", "featured"],
    queryFn: () => getFeaturedBlogs(8),
  });

  const getImageUrl = (path: string) => {
    if (!path) return "https://placehold.co/600x800";
    if (path.startsWith("http")) return path;

    const cleanBucketUrl = BUCKET_URL.endsWith("/")
      ? BUCKET_URL
      : `${BUCKET_URL}/`;
    const cleanPath = path.startsWith("/") ? path.slice(1) : path;

    return `${cleanBucketUrl}${cleanPath}`;
  };

  return (
    <section className="py-10 lg:py-14 bg-secondary/30">
      <div className="container mx-auto px-6">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl lg:text-4xl font-bold text-foreground font-sans">
            Ideas locals often recommend
          </h2>
          <Link
            to="/blog"
            className="inline-flex items-center gap-1.5 text-primary font-medium text-sm hover:underline whitespace-nowrap"
          >
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
            <Carousel
              opts={{
                align: "start",
                loop: true,
              }}
              className="w-full"
            >
              <CarouselContent className="-ml-4">
                {blogs.map((blog, index) => (
                  <CarouselItem
                    key={blog.id}
                    className="pl-4 basis-1/2 md:basis-1/3 lg:basis-1/4"
                  >
                    <Link
                      to={`/blog/${blog.id}`}
                      className="group block animate-fade-in"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <article className="relative aspect-[3/4] rounded-2xl overflow-hidden">
                        <img
                          src={getBucketImageUrl(blog.coverImageUrl)}
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
