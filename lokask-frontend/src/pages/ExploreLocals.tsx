import { useState, useEffect } from "react";
import ConsultantCardCompact from "@/components/ConsultantCardCompact";
import { useQuery } from "@tanstack/react-query";
import { getConsultants, Niche, getNiches } from "@/lib/api";
import { Consultant } from "@/types/consultant";
import { Loader2, ChevronLeft, ChevronRight } from "lucide-react";

const ExploreLocals = () => {
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);
  
  // 1. Pagination State
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 12;

  // fetch real data
  const { 
    data: consultants = [], 
    isLoading: loadingConsultants, 
    error: errorConsultants, 
    isFetching 
  } = useQuery<Consultant[]>({
    queryKey: ["consultants", "all", page], 
    queryFn: () => getConsultants({ page }),
    // 🟢 FIX 1: Use 'placeholderData' instead of 'keepPreviousData' (React Query v5 syntax)
    placeholderData: (previousData) => previousData, 
  });

  // fetch real niches
  const { data: niches = [], isLoading: loadingNiches } = useQuery({
    queryKey: ["niches"],
    queryFn: () => getNiches(),
  });

  // Client-side niche filtering
  // 🟢 FIX 2: Added explicit type check to ensure consultants is an array before filtering
  const filteredConsultants = (Array.isArray(consultants) ? consultants : [])
    .filter((c: Consultant) =>
      !selectedFilter || (c.tags && c.tags.some(tag => tag.toLowerCase() === selectedFilter.toLowerCase()))
    );

  const isLoading = loadingConsultants || loadingNiches;
  const error = errorConsultants;

  // 3. Scroll to top when page changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [page]);

  return (
    <div className="w-full">
      
      <div className="mb-10">
        <h1 className="text-4xl lg:text-5xl font-display font-bold text-foreground mb-4">
          Explore locals
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl">
          Find real people who live in your destination and can give you honest, local advice.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-10">
        <button
          onClick={() => setSelectedFilter(null)}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${!selectedFilter
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
        >
          All
        </button>

        {niches.map((n: Niche) => (
          <button
            key={n.id}
            onClick={() => setSelectedFilter(n.display_name)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${selectedFilter === n.display_name
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
          >
            {n.display_name}
          </button>
        ))}
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="text-center py-16 text-red-500">
          Failed to load locals. Please try again later.
        </div>
      )}

      {/* Consultants Grid */}
      {!isLoading && !error && (
        <>
          <div className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6 transition-opacity duration-200 ${isFetching ? 'opacity-50' : 'opacity-100'}`}>
            {filteredConsultants.map((consultant) => (
              <ConsultantCardCompact key={consultant.id} consultant={consultant} />
            ))}
          </div>

          {/* 4. Pagination Controls */}
          <div className="flex items-center justify-center gap-6 mt-12 mb-8">
            {/* Previous Button */}
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="flex items-center justify-center rounded-full text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 active:scale-95"
              style={{
                width: '32px',
                height: '32px',
                background: '#C56A49', // var(--color-orange-53)
                border: '1px solid #E5E0DC', // var(--color-orange-88)
                borderRadius: '9999px'
              }}
              aria-label="Previous page"
            >
              <ChevronLeft size={18} strokeWidth={2.5} />
            </button>

            <span className="text-sm font-medium text-muted-foreground">
              Page {page}
            </span>

            {/* Next Button */}
            <button
              onClick={() => setPage(p => p + 1)}
              // Disable if we got fewer results than limit (means end of list)
              disabled={consultants.length < ITEMS_PER_PAGE}
              className="flex items-center justify-center rounded-full text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 active:scale-95"
              style={{
                width: '32px',
                height: '32px',
                background: '#C56A49',
                border: '1px solid #E5E0DC',
                borderRadius: '9999px'
              }}
              aria-label="Next page"
            >
              <ChevronRight size={18} strokeWidth={2.5} />
            </button>
          </div>
        </>
      )}

      {/* Empty State */}
      {!isLoading && !error && filteredConsultants.length === 0 && (
        <div className="text-center py-16">
          <p className="text-muted-foreground">No locals found for this filter.</p>
        </div>
      )}
      
    </div>
  );
};

export default ExploreLocals;