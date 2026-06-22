import { useState, useEffect } from "react";
import { Search, ChevronDown, Calendar, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { getNiches, Niche } from "@/lib/consultants";

const LOCATIONS = [
  { city: "Hanoi", country: "Vietnam", supported: true },
  { city: "Ho Chi Minh City", country: "Vietnam", supported: true },
  { city: "Da Nang", country: "Vietnam", supported: true },
  { city: "Hoi An", country: "Vietnam", supported: true },
  { city: "Nha Trang", country: "Vietnam", supported: true },
  { city: "Da Lat", country: "Vietnam", supported: true },
  { city: "Phu Quoc", country: "Vietnam", supported: true },
  { city: "Quang Binh", country: "Vietnam", supported: true },
  { city: "Sapa", country: "Vietnam", supported: true },
  { city: "Hue", country: "Vietnam", supported: true },
  // International / Upcoming locations
  { city: "Bangkok", country: "Thailand", supported: false },
  { city: "Bali", country: "Indonesia", supported: false },
  { city: "Tokyo", country: "Japan", supported: false },
  { city: "Paris", country: "France", supported: false },
  { city: "Rome", country: "Italy", supported: false },
];

const FALLBACK_NICHES = [
  "Foodie & Local Cuisines",
  "History & Architecture",
  "Nature & Outdoors",
  "Nightlife & Entertainment",
  "Shopping & Fashion",
  "Photography & Arts",
];

interface SearchBarProps {
  onSearch: (filters: { where: string; who: string; when?: string }) => void;
}

const SearchBar = ({ onSearch }: SearchBarProps) => {
  const [where, setWhere] = useState("");
  const [when, setWhen] = useState("");
  const [who, setWho] = useState("");
  
  const [isWhereOpen, setIsWhereOpen] = useState(false);
  const [isWhoOpen, setIsWhoOpen] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const [niches, setNiches] = useState<string[]>([]);

  useEffect(() => {
    const fetchNiches = async () => {
      try {
        const data = await getNiches();
        setNiches(data.map((n: Niche) => n.display_name));
      } catch (error) {
        console.error("Failed to load niches from API, using fallback", error);
        setNiches(FALLBACK_NICHES);
      }
    };
    fetchNiches();
  }, []);

  const handleSearchClick = () => {
    onSearch({ where, who, when });
  };

  const selectedCountry = LOCATIONS.find(loc => loc.city === where)?.country || "Vietnam";

  return (
    <div className="w-full">
      {/* Desktop Search Bar */}
      <div className="hidden md:flex items-stretch bg-card rounded-full shadow-medium border border-border/50 transition-shadow hover:shadow-strong relative z-10">
        
        {/* WHERE */}
        <div 
          className={cn(
            "search-segment flex-1 border-r border-border/50 cursor-pointer transition-all rounded-l-full px-6 py-2 relative",
            focusedField === 'where' ? 'bg-primary/5 ring-2 ring-primary/20 ring-inset' : ''
          )}
          onClick={() => setIsWhereOpen(!isWhereOpen)}
          onBlur={() => {
            setFocusedField(null);
            setTimeout(() => setIsWhereOpen(false), 150);
          }}
          tabIndex={0}
          onFocus={() => setFocusedField('where')}
        >
          <label className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground flex items-center gap-1">
            Where
            <MapPin size={12} className="text-[#C77752]" />
          </label>
          <span className="text-sm font-medium truncate block mt-0.5">
            {where ? (
              <span>
                {where} <span className="text-muted-foreground font-normal">- {selectedCountry}</span>
              </span>
            ) : (
              <span className="text-foreground/40">Select a city...</span>
            )}
          </span>

          {/* City Dropdown */}
          {isWhereOpen && (
            <div className="absolute top-full left-0 w-[280px] mt-2 bg-card rounded-xl shadow-strong border border-border/50 py-2 z-50 animate-fade-in max-h-[300px] overflow-y-auto">
              {LOCATIONS.map(({ city, country, supported }) => (
                <button
                  key={city}
                  disabled={!supported}
                  className={cn(
                    "w-full text-left px-4 py-2.5 text-sm flex items-center justify-between transition-colors",
                    supported ? "hover:bg-muted cursor-pointer" : "opacity-40 cursor-not-allowed"
                  )}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (supported) {
                      setWhere(city);
                      setIsWhereOpen(false);
                    }
                  }}
                >
                  <div className="flex items-center gap-1">
                    <span className="font-medium">{city}</span>
                    <span className="text-muted-foreground text-xs">- {country}</span>
                  </div>
                  {!supported && (
                    <span className="text-[10px] font-medium bg-muted px-2 py-0.5 rounded text-muted-foreground">
                      Coming soon
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* WHEN */}
        <div 
          className={cn(
            "search-segment flex-1 border-r border-border/50 cursor-pointer transition-all px-6 py-2",
            focusedField === 'when' ? 'bg-primary/5 ring-2 ring-primary/20 ring-inset' : ''
          )}
        >
          <label className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground flex items-center gap-1" htmlFor="search-when">
            When
            <Calendar size={12} className="text-muted-foreground" />
          </label>
          <input
            id="search-when"
            type="date"
            value={when}
            onChange={(e) => setWhen(e.target.value)}
            onFocus={() => setFocusedField('when')}
            onBlur={() => setFocusedField(null)}
            className="text-sm font-medium bg-transparent outline-none w-full mt-0.5 text-foreground cursor-pointer [color-scheme:light]"
          />
        </div>

        {/* WHO */}
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
          <span className="text-sm font-medium truncate block mt-0.5">
            {who || <span className="text-foreground/40">Type of local consultant</span>}
          </span>

          {/* Niche Dropdown */}
          {isWhoOpen && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-card rounded-xl shadow-strong border border-border/50 py-2 z-50 animate-fade-in max-h-[300px] overflow-y-auto">
              {niches.map((option) => (
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
        <button onClick={handleSearchClick}
          className="flex items-center justify-center w-12 h-12 my-1 mr-1 rounded-full bg-primary text-primary-foreground hover:opacity-90 transition-opacity shrink-0"
          aria-label="Search for local consultants"
        >
          <Search size={20} />
        </button>
      </div>

      {/* 📱 MOBILE SEARCH BAR */}
      <div className="md:hidden flex flex-col gap-3 bg-card rounded-2xl shadow-medium border border-border/50 p-4">
        
        {/* Mobile Where */}
        <div className="space-y-1 relative">
          <label className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground flex items-center gap-1">
            Where <MapPin size={10} className="text-[#C77752]"/>
          </label>
          <button
            className="w-full px-4 py-3 bg-muted/50 rounded-xl text-sm text-left flex items-center justify-between"
            onClick={() => setIsWhereOpen(!isWhereOpen)}
          >
            <span className={where ? 'text-foreground font-medium' : 'text-foreground/40'}>
              {where ? (
                <span>{where} <span className="text-muted-foreground font-normal">- {selectedCountry}</span></span>
              ) : "Select a city..."}
            </span>
            <ChevronDown size={16} className={cn("text-muted-foreground transition-transform", isWhereOpen ? 'rotate-180' : '')} />
          </button>

          {isWhereOpen && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-card rounded-xl shadow-strong border border-border/50 py-2 z-50 max-h-[250px] overflow-y-auto">
              {LOCATIONS.map(({ city, country, supported }) => (
                <button
                  key={city}
                  disabled={!supported}
                  className={cn(
                    "w-full text-left px-4 py-2.5 text-sm flex items-center justify-between transition-colors",
                    supported ? "hover:bg-muted cursor-pointer" : "opacity-40 cursor-not-allowed"
                  )}
                  onClick={() => {
                    if (supported) {
                      setWhere(city);
                      setIsWhereOpen(false);
                    }
                  }}
                >
                  <div className="flex items-center gap-1">
                    <span className="font-medium">{city}</span>
                    <span className="text-muted-foreground text-xs">- {country}</span>
                  </div>
                  {!supported && (
                    <span className="text-[10px] font-medium bg-muted px-2 py-0.5 rounded text-muted-foreground">
                      Coming soon
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Mobile When */}
        <div className="space-y-1">
          <label className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground flex items-center gap-1" htmlFor="mobile-when">
            When <Calendar size={10} />
          </label>
          <input
            id="mobile-when"
            type="date"
            value={when}
            onChange={(e) => setWhen(e.target.value)}
            className="w-full px-4 py-3 bg-muted/50 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-primary/20 [color-scheme:light]"
          />
        </div>

        {/* Mobile Who */}
        <div className="space-y-1 relative">
          <label className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Who</label>
          <button
            className="w-full px-4 py-3 bg-muted/50 rounded-xl text-sm text-left flex items-center justify-between"
            onClick={() => setIsWhoOpen(!isWhoOpen)}
          >
            <span className={who ? 'text-foreground font-medium' : 'text-foreground/40'}>
              {who || "Type of local consultant"}
            </span>
            <ChevronDown size={16} className={cn("text-muted-foreground transition-transform", isWhoOpen ? 'rotate-180' : '')} />
          </button>

          {isWhoOpen && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-card rounded-xl shadow-strong border border-border/50 py-2 z-50 max-h-[200px] overflow-y-auto">
              {niches.map((option) => (
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

        <button onClick={handleSearchClick}
          className="w-full py-3 rounded-full bg-primary text-primary-foreground font-medium flex items-center justify-center gap-2 hover:opacity-90 transition-opacity mt-2"
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