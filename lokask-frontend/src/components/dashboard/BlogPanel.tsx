import { useState, useRef, useEffect } from "react";
import { Plus, Image as ImageIcon, ArrowLeft, Loader2, Calendar as CalendarIcon, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Consultant } from "@/types/consultant";
import { Blog } from "@/types/blog";
import { createBlog, getConsultantBlogs } from "@/lib/consultants"; 

interface BlogPanelProps {
  consultant: Consultant;
}

const BlogPanel = ({ consultant }: BlogPanelProps) => {
  const { toast } = useToast();
  const [view, setView] = useState<"list" | "create">("list");
  
  // Creation States
  const [isPublishing, setIsPublishing] = useState(false);
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [content, setContent] = useState("");
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Listing States
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [isLoadingBlogs, setIsLoadingBlogs] = useState(true);

  // Fetch blogs when the component mounts or when we switch back to the list view
  const fetchBlogs = async () => {
    setIsLoadingBlogs(true);
    try {
      // Use the safe userId that we established earlier
      const authorId = consultant.userId || (consultant as any).user_id;
      if (!authorId) return;

      const data = await getConsultantBlogs(authorId);
      setBlogs(data || []);
    } catch (error) {
      console.error("Failed to fetch blogs:", error);
      toast({
        title: "Error loading articles",
        description: "We couldn't load your articles right now.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingBlogs(false);
    }
  };

  useEffect(() => {
    if (view === "list") {
      fetchBlogs();
    }
  }, [view, consultant]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverFile(file);
      setCoverPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async () => {
    if (!title || !content) {
      toast({
        title: "Missing fields",
        description: "Please provide a title and content for your article.",
        variant: "destructive",
      });
      return;
    }

    setIsPublishing(true);
    try {
      await createBlog({
        title,
        summary,
        content,
        city: consultant.city,
        country: consultant.country,
        coverImage: coverFile || undefined,
      });

      toast({
        title: "Article published!",
        description: "Your new travel article is now live.",
      });

      // Reset form and go back to list
      setTitle("");
      setSummary("");
      setContent("");
      setCoverFile(null);
      setCoverPreview(null);
      setView("list"); // This will trigger the useEffect to refetch the fresh list!
      
    } catch (error: any) {
      toast({
        title: "Failed to publish",
        description: error.message || "An error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsPublishing(false);
    }
  };

  if (view === "create") {
    return (
      <div className="flex-1 bg-secondary/20 overflow-y-auto">
        <div className="max-w-3xl mx-auto p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => setView("list")} className="rounded-full">
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold">Write an Article</h1>
                <p className="text-muted-foreground mt-1">Share your local expertise</p>
              </div>
            </div>
            <Button onClick={handleSubmit} disabled={isPublishing} className="rounded-full px-8">
              {isPublishing ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : null}
              Publish Article
            </Button>
          </div>

          {/* Form Sections */}
          <div className="space-y-6">
            <div className="bg-card rounded-2xl p-6 border border-border">
              <div className="space-y-6">
                
                {/* Cover Image */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Cover Image</label>
                  <div
                    className="relative w-full aspect-[21/9] rounded-xl overflow-hidden bg-muted cursor-pointer group flex items-center justify-center border-2 border-dashed border-border hover:border-primary/50 transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {coverPreview ? (
                      <img src={coverPreview} alt="Cover Preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex flex-col items-center text-muted-foreground">
                        <ImageIcon className="h-10 w-10 mb-2" />
                        <span className="text-sm">Click to upload cover image</span>
                      </div>
                    )}
                  </div>
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                </div>

                {/* Text Fields */}
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Title</label>
                    <input
                      type="text"
                      placeholder="e.g., Hidden Art Museums Only Locals Know About"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:ring-2 focus:ring-primary/20 outline-none transition-all text-lg font-medium"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Short Summary</label>
                    <textarea
                      placeholder="A brief overview for the article card..."
                      value={summary}
                      onChange={(e) => setSummary(e.target.value)}
                      rows={2}
                      className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Content</label>
                    <textarea
                      placeholder="Write your insights here..."
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      rows={12}
                      className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none font-serif text-base"
                    />
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // LIST VIEW
  return (
    <div className="flex-1 bg-secondary/20 overflow-y-auto">
      <div className="max-w-4xl mx-auto p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">Your Articles</h1>
            <p className="text-muted-foreground mt-1">Manage your local guides and insights</p>
          </div>
          <Button onClick={() => setView("create")} className="gap-2 rounded-full px-6 bg-[#C77752] hover:bg-[#A86444] text-white">
            <Plus className="h-4 w-4" />
            Write Article
          </Button>
        </div>

        {isLoadingBlogs ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : blogs.length === 0 ? (
          <div className="bg-card rounded-2xl p-12 border border-border text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-[#FCE8E0] rounded-full flex items-center justify-center mb-4">
              <ImageIcon className="h-8 w-8 text-[#C77752]" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No articles yet</h3>
            <p className="text-muted-foreground max-w-md mb-6">
              Start sharing your local knowledge with travelers. Articles help you build trust and showcase your expertise.
            </p>
            <Button onClick={() => setView("create")} variant="outline" className="rounded-full border-[#C77752] text-[#C77752] hover:bg-[#FCE8E0]">
              Write your first article
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {blogs.map((blog) => (
              <div key={blog.id} className="bg-white rounded-2xl border border-zinc-200 overflow-hidden flex flex-col hover:shadow-md transition-shadow group">
                <div className="relative aspect-[16/9] bg-zinc-100 overflow-hidden">
                  {blog.coverImageUrl ? (
                    <img src={blog.coverImageUrl} alt={blog.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-zinc-400">
                      <ImageIcon className="w-8 h-8 opacity-50" />
                    </div>
                  )}
                </div>
                <div className="p-5 flex flex-col flex-1">
                  <h4 className="font-bold text-zinc-900 line-clamp-2 mb-2 leading-tight">
                    {blog.title}
                  </h4>
                  <p className="text-sm text-zinc-500 line-clamp-2 mb-4 flex-1">
                    {blog.summary}
                  </p>
                  <div className="flex items-center justify-between text-xs text-zinc-400 pt-4 border-t border-zinc-100">
                    <div className="flex items-center gap-1.5">
                      <CalendarIcon className="w-3.5 h-3.5" />
                      <span>{new Date(blog.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Eye className="w-3.5 h-3.5" />
                      <span>{blog.viewsCount || 0}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BlogPanel;