import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Maximize2, Clock, Tag } from "lucide-react";
import { Blog } from "@/types/blog";
interface BlogQuickViewDialogProps {
  blog: Blog | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const BlogQuickViewDialog = ({ blog, open, onOpenChange }: BlogQuickViewDialogProps) => {
  const navigate = useNavigate();

  if (!blog) return null;

  const handleExpand = () => {
    onOpenChange(false); // Close the modal
    navigate(`/articles/${blog.id}`); // Navigate to full page
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* max-w-3xl gives it a nice wide article feel without taking the whole screen */}
      <DialogContent className="max-w-3xl rounded-2xl p-0 overflow-hidden max-h-[85vh] flex flex-col">
        
        {/* Cover Image Header */}
        <div className="relative w-full h-48 sm:h-64 shrink-0 bg-muted">
          <img 
            src={blog.coverImageUrl || "https://placehold.co/800x400"} 
            alt={blog.title} 
            className="w-full h-full object-cover"
          />
          {/* Overlay gradient for text readability if needed */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          
          {/* Expand Button inside the image area */}
          <Button
            onClick={handleExpand}
            variant="secondary"
            size="sm"
            className="absolute top-4 right-4 gap-2 rounded-full bg-white/90 hover:bg-white text-zinc-900 shadow-md border-none"
          >
            <Maximize2 size={14} />
            <span className="text-xs font-bold">Read Full Page</span>
          </Button>
        </div>

        {/* Content Area (Scrollable) */}
        <div className="p-6 md:p-8 overflow-y-auto">
          <DialogHeader className="mb-6 text-left">
            <div className="flex items-center gap-3 text-sm text-muted-foreground mb-3">
              {blog.category && (
                <span className="flex items-center gap-1 bg-primary/10 text-primary px-2.5 py-0.5 rounded-full font-medium">
                  <Tag size={12} />
                  {blog.category}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Clock size={12} />
                {blog.readTime || "5 min read"}
              </span>
            </div>
            <DialogTitle className="text-2xl md:text-3xl font-display font-bold text-zinc-900 leading-tight">
              {blog.title}
            </DialogTitle>
            
            <div className="flex items-center gap-2 mt-4">
              {blog.authorAvatar && (
                <img 
                  src={blog.authorAvatar} 
                  alt={blog.authorName || "Author"} 
                  className="w-6 h-6 rounded-full object-cover border border-border" 
                />
              )}
              <p className="text-zinc-600 font-medium text-sm">
                By {blog.authorName || "Local Expert"}
              </p>
            </div>
          </DialogHeader>

          {/* Article Excerpt & Content */}
          <div className="prose prose-zinc max-w-none text-zinc-600 leading-relaxed">
            <p className="text-lg font-medium text-zinc-800 mb-6">
              {blog.summary}
            </p>
            
            <div 
              className="line-clamp-[12] relative overflow-hidden"
              dangerouslySetInnerHTML={{ __html: blog.content }} 
            />
          </div>
        </div>

        {/* Sticky Bottom Footer */}
        <div className="border-t border-border p-4 bg-gray-50 flex justify-between items-center shrink-0">
          <p className="text-sm text-muted-foreground">
            Want to learn more local secrets?
          </p>
          <Button 
            onClick={handleExpand}
            className="bg-[#C56A49] hover:bg-[#A3553A] text-white rounded-full px-6"
          >
            Read Full Article
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BlogQuickViewDialog;