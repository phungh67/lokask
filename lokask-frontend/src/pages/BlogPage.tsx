import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Loader2, MessageCircle } from "lucide-react";
import { getBlogById, getConsultantByUserId, getConsultants } from "@/lib/consultants";
import ConsultantBannerCompact from "@/components/ConsultantBannerCompact";
import ConsultantBannerFull from "@/components/ConsultantBanner";
import AuthPromptDialog from "@/components/auth/AuthPromptDialog";
import { useAuthPrompt } from "@/hooks/useAuthPrompt";
import LocalsCarousel from "@/components/LocalsCarousel";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const BlogPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showPrompt, setShowPrompt, promptMessage, requireAuth } = useAuthPrompt();

  // blog
  const { data: blog, isLoading: isBlogLoading, error: blogError } = useQuery({
    queryKey: ["blog", id],
    queryFn: () => getBlogById(id!),
    enabled: !!id,
  });

  // author's data
  const { data: consultant, isLoading: isConsultantLoading } = useQuery({
    queryKey: ["consultant-by-user", blog?.authorId],
    queryFn: () => getConsultantByUserId(blog!.authorId),
    enabled: !!blog?.authorId, 
  });

  // same consultants from that city
  const { data: relatedResponse } = useQuery({
    queryKey: ["consultants", "related", consultant?.city],
    queryFn: () => getConsultants({ city: consultant?.city }),
    enabled: !!consultant?.city,
  });

  const relatedConsultants = Array.isArray(relatedResponse)
    ? relatedResponse
    : relatedResponse?.data || [];

  if (isBlogLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-[#F9F8F6]">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-10 h-10 animate-spin text-[#C77752]" />
        </div>
        <Footer />
      </div>
    );
  }

  if (blogError || !blog) {
    return (
      <div className="min-h-screen flex flex-col bg-[#F9F8F6]">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center">
          <h1 className="text-2xl font-bold text-zinc-900 mb-4">Article not found</h1>
          <button onClick={() => navigate(-1)} className="text-[#C77752] hover:underline">
            ← Go back
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9F8F6] font-sans flex flex-col">
      <Navbar />

      <main className="flex-1">
        {/* Container for Article Content (Constrained Width) */}
        <div className="max-w-[800px] mx-auto px-6 pt-8 pb-12">
          
          {/* Top Navigation */}
          <div className="mb-8">
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-2 text-zinc-500 hover:text-zinc-800 transition-colors"
            >
              <ArrowLeft size={18} />
              <span className="text-base">Back</span>
            </button>
          </div>

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
              consultantId={consultant?.id || ""} 
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

        {consultant && (
          <div className="w-full bg-white border-t border-zinc-200">
            
            {/* Direct Ask CTA */}
            <section className="w-full pt-20 pb-12">
              <div className="w-full px-6 flex flex-col items-center justify-start gap-4 max-w-[1400px] mx-auto">
                <div className="flex flex-col items-center w-full">
                  <h2 className="text-center text-[#2E2E2E] text-[24px] font-semibold leading-[32px]">
                    Ready to explore {consultant.city} with{" "}
                    {consultant.displayName || consultant.name}?
                  </h2>
                </div>

                <div className="max-w-[448px] pb-4 flex flex-col items-center">
                  <p className="text-center text-[#737373] text-[16px] leading-[24px]">
                    Send a message to start planning your authentic local experience.
                  </p>
                </div>

                <button
                  onClick={() => {
                    const isAuthenticated = !!localStorage.getItem("token");
                    if (isAuthenticated) {
                      navigate("/dashboard", {
                        state: { intent: "startChat", targetId: consultant.id },
                      });
                    } else {
                      requireAuth(
                        () =>
                          navigate("/dashboard", {
                            state: { intent: "startChat", targetId: consultant.id },
                          }),
                        { actionType: "ask", consultantName: consultant.name },
                      );
                    }
                  }}
                  className="h-[44px] px-8 bg-[#C56A49] hover:bg-[#A3553A] transition-colors rounded-full flex items-center justify-center gap-2 text-white text-[14px]"
                >
                  <MessageCircle size={16} />
                  <span>Ask {consultant.displayName || consultant.name}</span>
                </button>
              </div>
            </section>

            {relatedConsultants.length > 0 && (
              <section className="pb-20 pt-4">
                <div className="max-w-[1400px] mx-auto px-6">
                  <LocalsCarousel
                    title={`Other locals in ${consultant.city}`}
                    consultants={relatedConsultants.filter((c: any) => c.id !== consultant.id)}
                  />
                </div>
              </section>
            )}
            
          </div>
        )}
      </main>

      <AuthPromptDialog
        open={showPrompt}
        onOpenChange={setShowPrompt}
        message={promptMessage}
        onLogin={() => navigate("/login")}
        onSignup={() => navigate("/signup")}
      />

      <Footer />
    </div>
  );
};

export default BlogPage;