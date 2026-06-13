import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Loader2 } from "lucide-react";
import { getBlogById, getConsultantByUserId } from "@/lib/consultants";
import ConsultantBannerCompact from "@/components/blog/ConsultantBannerCompact";
import ConsultantBannerFull from "@/components/blog/ConsultantBannerFull";

const BlogPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // 1. Fetch the specific blog article
  const { data: blog, isLoading: isBlogLoading, error: blogError } = useQuery({
    queryKey: ["blog", id],
    queryFn: () => getBlogById(id!),
    enabled: !!id,
  });

  // 2. Fetch the full consultant profile using the blog's authorId
  // This is required to populate the ConsultantBannerFull at the bottom
  const { data: consultant, isLoading: isConsultantLoading } = useQuery({
    queryKey: ["consultant-by-user", blog?.authorId],
    queryFn: () => getConsultantByUserId(blog!.authorId),
    enabled: !!blog?.authorId, // Only run once we have the blog data
  });

  if (isBlogLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F9F8F6]">
        <Loader2 className="w-10 h-10 animate-spin text-[#C77752]" />
      </div>
    );
  }

  if (blogError || !blog) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F9F8F6]">
        <h1 className="text-2xl font-bold text-zinc-900 mb-4">Article not found</h1>
        <button onClick={() => navigate(-1)} className="text-[#C77752] hover:underline">
          ← Go back
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9F8F6] font-sans pb-20">
      <div className="max-w-[800px] mx-auto px-6 pt-12">
        
        {/* Top Navigation */}
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-zinc-500 hover:text-zinc-900 transition-colors mb-8"
        >
          <ArrowLeft size={18} />
          <span className="text-sm font-medium">Back</span>
        </button>

        {/* Article Header */}
        <header className="mb-8">
          <span className="inline-block px-3 py-1 bg-[#FCE8E0] text-[#C77752] text-xs font-medium rounded-full mb-6">
            {blog.category || "Art & Culture"}
          </span>
          
          <h1 className="text-4xl md:text-5xl font-display font-bold text-zinc-900 leading-[1.1] mb-6 tracking-tight">
            {blog.title}
          </h1>
          
          <p className="text-lg md:text-xl text-zinc-500 leading-relaxed">
            {blog.summary}
          </p>
        </header>

        {/* Compact Consultant Banner (Top) */}
        <div className="mb-10">
          <ConsultantBannerCompact
            consultantId={consultant?.id || ""} // Uses the fetched profile ID if available
            authorName={blog.authorName}
            authorAvatar={blog.authorAvatar}
            category={blog.category}
            date={blog.createdAt}
            readTime={blog.readTime}
            views={blog.viewsCount}
          />
        </div>

        {/* Hero Image */}
        {blog.coverImageUrl && (
          <div className="w-full aspect-[16/9] md:aspect-[21/9] rounded-2xl overflow-hidden bg-zinc-200 mb-12">
            <img 
              src={blog.coverImageUrl} 
              alt={blog.title} 
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Main Content Body */}
        <article className="prose prose-lg prose-zinc max-w-none mb-16">
          {/* 
            For MVP: Using whitespace-pre-wrap to respect the line breaks from the textarea. 
            If you implement a rich text editor later, you can swap this for dangerouslySetInnerHTML.
          */}
          <div className="text-zinc-800 leading-relaxed font-serif whitespace-pre-wrap">
            {blog.content}
          </div>
        </article>

        {/* Full Consultant Banner (Bottom) */}
        <div className="border-t border-zinc-200 pt-12">
          <h3 className="text-2xl font-bold text-zinc-900 mb-6 font-display">
            More from {blog.authorName.split(" ")[0]}
          </h3>
          
          {isConsultantLoading ? (
            <div className="h-48 rounded-[32px] bg-zinc-100 animate-pulse flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
            </div>
          ) : consultant ? (
            <ConsultantBannerFull consultant={consultant} />
          ) : (
            <div className="p-6 bg-white rounded-2xl text-center text-zinc-500 border border-zinc-100">
              Could not load consultant profile.
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default BlogPage;