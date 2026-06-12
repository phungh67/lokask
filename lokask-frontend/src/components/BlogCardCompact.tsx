import { Clock, Users } from "lucide-react";
import { Blog } from "@/types/blog";
import { Link } from "react-router-dom";

interface BlogCardCompactProps {
  blog: Blog;
}

const BlogCardCompact = ({ blog }: BlogCardCompactProps) => {
  const formattedDate = new Date(blog.createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <Link 
      to={`/blog/${blog.id}`} 
      className="group flex flex-col bg-white rounded-[24px] overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300 border border-gray-100 h-full"
    >
      {/* Image Area */}
      <div className="relative aspect-[4/3] w-full overflow-hidden">
        <img
          src={blog.coverImageUrl}
          alt={blog.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute top-3 right-3 z-10 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-full flex items-center gap-1 text-xs font-medium text-gray-700">
          <Clock className="w-3 h-3" />
          {blog.readTime || "3 min read"}
        </div>
      </div>

      {/* Content Area */}
      <div className="p-6 flex flex-col flex-1">
        <div className="mb-3">
          <span className="inline-block px-2.5 py-1 bg-gray-100 text-gray-600 text-[11px] uppercase tracking-wider font-semibold rounded-full">
            {blog.category || "General"}
          </span>
        </div>
        
        <h4 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 leading-tight">
          {blog.title}
        </h4>
        
        <p className="text-sm text-gray-500 mb-6 line-clamp-2">
          {blog.summary}
        </p>

        <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-100 text-xs text-gray-400">
          <span>{formattedDate}</span>
          <div className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5" />
            <span>{blog.viewsCount?.toLocaleString() || "0"}</span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default BlogCardCompact;