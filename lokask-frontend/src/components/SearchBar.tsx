import { useState } from "react";
import { Search, ChevronDown, Calendar } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

// 🟢 Define filter options locally to replace mockData imports
const WHO_FILTER_OPTIONS = [
  "Foodie & Local Cuisines",
  "History & Architecture",
  "Nature & Outdoors",
  "Nightlife & Entertainment",
  "Shopping & Fashion",
  "Photography & Arts",
];

const SearchBar = () => {
  const [where, setWhere] = useState("");
  const [when, setWhen] = useState("");
  const [who, setWho] = useState("");
  const [isWhoOpen, setIsWhoOpen] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  return (
    <div className="w-full">
      {/* Desktop Search Bar */}
      <div className="hidden md:flex items-stretch bg-card rounded-full shadow-medium border border-border/50 transition-shadow hover:shadow-strong relative z-10">
        {/* Where */}
        <div 
          className={cn(
            "search-segment flex-1 border-r border-border/50 cursor-text transition-all rounded-l-full px-6 py-2",
            focusedField === 'where' ? 'bg-primary/5 ring-2 ring-primary/20 ring-inset' : ''
          )}
        >
          <label className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground block" htmlFor="search-where">Where</label>
          <input
            id="search-where"
            type="text"
            placeholder="Destination / City"
            value={where}
            onChange={(e) => setWhere(e.target.value)}
            onFocus={() => setFocusedField('where')}
            onBlur={() => setFocusedField(null)}
            className="text-sm font-medium bg-transparent outline-none w-full placeholder:text-foreground/40"
            aria-label="Enter destination or city"
          />
        </div>

        {/* When */}
        <div 
          className={cn(
            "search-segment flex-1 border-r border-border/50 cursor-text transition-all px-6 py-2",
            focusedField === 'when' ? 'bg-primary/5 ring-2 ring-primary/20 ring-inset' : ''
          )}
        >
          <label className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground flex items-center gap-1" htmlFor="search-when">
            When
            <Calendar size={12} className="text-muted-foreground" />
          </label>
          <input
            id="search-when"
            type="text"
            placeholder="Travel Dates / Period"
            value={when}
            onChange={(e) => setWhen(e.target.value)}
            onFocus={() => setFocusedField('when')}
            onBlur={() => setFocusedField(null)}
            className="text-sm font-medium bg-transparent outline-none w-full placeholder:text-foreground/40"
            aria-label="Enter travel dates"
          />
        </div>

        {/* Who */}
        <div 
          className={cn(
            "search-segment flex-1 cursor-pointer relative transition-all rounded-r-full px-6 py-2",
            focusedField === 'who' ? 'bg-primary/5 ring-2 ring-primary/20 ring-inset' : ''
          )}
          onClick={() => setIsWhoOpen(!isWhoOpen)}
          onBlur={() => {
            setFocusedField(null);
            setTimeout(() => setIsWhoOpen(false), 150);
          }}
          tabIndex={0}
          onFocus={() => setFocusedField('who')}
        >
          <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground flex items-center gap-1">
            Who
            <ChevronDown size={12} className={cn("text-muted-foreground transition-transform", isWhoOpen ? 'rotate-180' : '')} />
          </span>
          <span className="text-sm font-medium truncate block">
            {who || "Type of local consultant"}
          </span>

          {/* Dropdown */}
          {isWhoOpen && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-card rounded-xl shadow-strong border border-border/50 py-2 z-50 animate-fade-in">
              {WHO_FILTER_OPTIONS.map((option) => (
                <button
                  key={option}
                  className="w-full text-left px-4 py-2.5 text-sm hover:bg-muted transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    setWho(option);
                    setIsWhoOpen(false);
                  }}
                >
                  {option}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Search Button */}
        <button
          className="flex items-center justify-center w-12 h-12 my-1 mr-1 rounded-full bg-primary text-primary-foreground hover:opacity-90 transition-opacity shrink-0"
          aria-label="Search for local consultants"
        >
          <Search size={20} />
        </button>
      </div>

      {/* Mobile Search Bar */}
      <div className="md:hidden flex flex-col gap-3 bg-card rounded-2xl shadow-medium border border-border/50 p-4">
        <div className="space-y-1">
          <label className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground" htmlFor="mobile-where">Where</label>
          <input
            id="mobile-where"
            type="text"
            placeholder="Destination / City"
            value={where}
            onChange={(e) => setWhere(e.target.value)}
            className="w-full px-4 py-3 bg-muted/50 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground" htmlFor="mobile-when">When</label>
          <input
            id="mobile-when"
            type="text"
            placeholder="Travel Dates / Period"
            value={when}
            onChange={(e) => setWhen(e.target.value)}
            className="w-full px-4 py-3 bg-muted/50 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div className="space-y-1 relative">
          <label className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Who</label>
          <button
            className="w-full px-4 py-3 bg-muted/50 rounded-xl text-sm text-left flex items-center justify-between"
            onClick={() => setIsWhoOpen(!isWhoOpen)}
          >
            <span className={who ? 'text-foreground' : 'text-foreground/40'}>
              {who || "Type of local consultant"}
            </span>
            <ChevronDown size={16} className={cn("text-muted-foreground transition-transform", isWhoOpen ? 'rotate-180' : '')} />
          </button>

          {isWhoOpen && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-card rounded-xl shadow-strong border border-border/50 py-2 z-50">
              {WHO_FILTER_OPTIONS.map((option) => (
                <button
                  key={option}
                  className="w-full text-left px-4 py-2.5 text-sm hover:bg-muted transition-colors"
                  onClick={() => {
                    setWho(option);
                    setIsWhoOpen(false);
                  }}
                >
                  {option}
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          className="w-full py-3 rounded-full bg-primary text-primary-foreground font-medium flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
          aria-label="Search for local consultants"
        >
          <Search size={18} />
          Search
        </button>
      </div>
    </div>
  );
};

export default SearchBar;