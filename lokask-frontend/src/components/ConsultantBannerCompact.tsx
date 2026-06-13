import { Link } from "react-router-dom";
import { ThumbsUp, Bookmark, Share2 } from "lucide-react";

interface ConsultantBannerCompactProps {
  consultantId: string;
  authorName: string;
  authorAvatar: string;
  category?: string;
  date: string;
  readTime?: string;
  views?: number;
}

const ConsultantBannerCompact = ({
  consultantId,
  authorName,
  authorAvatar,
  category = "General",
  date,
  readTime = "5 min read",
  views = 0,
}: ConsultantBannerCompactProps) => {
  const formattedDate = new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between py-6 border-b border-zinc-100 gap-4">
      {/* Left: Author & Meta */}
      <div className="flex items-center gap-4">
        <Link to={`/consultant/${consultantId}`} className="shrink-0">
          <img
            src={authorAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(authorName)}&background=FCE8E0&color=C77752`}
            alt={authorName}
            className="w-12 h-12 rounded-full object-cover border border-zinc-100 transition-transform hover:scale-105"
          />
        </Link>
        <div className="flex flex-col justify-center">
          <div className="flex items-center gap-2 mb-1">
            <Link 
              to={`/consultant/${consultantId}`}
              className="font-bold text-zinc-900 hover:text-[#C77752] transition-colors"
            >
              {authorName}
            </Link>
            <span className="text-zinc-300">•</span>
            <span className="text-sm font-medium text-zinc-500">{category}</span>
          </div>
          <div className="flex items-center text-sm text-zinc-500 gap-2">
            <span>{formattedDate}</span>
            <span>•</span>
            <span>{readTime}</span>
            <span>•</span>
            <span className="flex items-center gap-1.5">
               {views.toLocaleString()} views
            </span>
          </div>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        <button className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-full transition-colors">
          <ThumbsUp className="w-4 h-4" />
          <span className="hidden sm:inline">342</span>
        </button>
        <button className="p-2 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-full transition-colors">
          <Bookmark className="w-4 h-4" />
        </button>
        <button className="p-2 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-full transition-colors">
          <Share2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default ConsultantBannerCompact;