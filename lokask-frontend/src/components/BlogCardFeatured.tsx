import { Clock, Users } from "lucide-react";
import { Blog } from "@/types/blog";
import { Link } from "react-router-dom";

interface BlogCardFeaturedProps {
  blog: Blog;
}

const BlogCardFeatured = ({ blog }: BlogCardFeaturedProps) => {
  // Format date safely
  const formattedDate = new Date(blog.createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <Link 
      to={`/blog/${blog.id}`} 
      className="group flex flex-col md:flex-row bg-white rounded-[32px] overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300 border border-gray-100"
    >
      {/* Image Half */}
      <div className="relative w-full md:w-1/2 h-[300px] md:h-auto overflow-hidden">
        <div className="absolute top-4 left-4 z-10">
          <span className="px-3 py-1 bg-black/40 backdrop-blur-md text-white text-xs font-medium rounded-full">
            Featured
          </span>
        </div>
        <img
          src={blog.coverImageUrl}
          alt={blog.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute bottom-4 right-4 z-10 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full flex items-center gap-1.5 text-xs font-medium text-gray-700">
          <Clock className="w-3.5 h-3.5" />
          {blog.readTime || "5 min read"}
        </div>
      </div>

      {/* Content Half */}
      <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center">
        <div className="mb-4">
          <span className="inline-block px-3 py-1 bg-[#FCE8E0] text-[#C77752] text-xs font-medium rounded-full">
            {blog.category || "General"}
          </span>
        </div>
        
        <h3 className="text-2xl md:text-3xl font-display font-bold text-[#C77752] mb-4 line-clamp-2">
          {blog.title}
        </h3>
        
        <p className="text-gray-600 mb-8 line-clamp-3 text-lg">
          {blog.summary}
        </p>

        <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-100">
          <div className="flex items-center gap-3">
            <img 
              src={blog.authorAvatar || `https://ui-avatars.com/api/?name=${blog.authorName}`} 
              alt={blog.authorName} 
              className="w-8 h-8 rounded-full object-cover"
            />
            <div className="flex items-center text-sm text-gray-500 gap-2">
              <span className="font-medium text-gray-900">{blog.authorName}</span>
              <span>•</span>
              <span>{formattedDate}</span>
            </div>
          </div>
          
          <div className="flex items-center text-sm text-gray-500 gap-1.5">
            <Users className="w-4 h-4" />
            <span>{blog.viewsCount?.toLocaleString() || "0"} views</span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default BlogCardFeatured;