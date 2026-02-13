import { useState, useEffect } from "react";
import ConsultantCardCompact from "@/components/ConsultantCardCompact";
import { useQuery } from "@tanstack/react-query";
import { getConsultants, getNiches } from "@/lib/api";
import { Consultant } from "@/types/consultant";
import { Loader2, ChevronLeft, ChevronRight } from "lucide-react";

const ExploreLocals = () => {
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 12;

  // 1. Fetch paginated data
  // We rename the data object to 'response' to access total_count and data array
  const {
    data: response,
    isLoading: loadingConsultants,
    error: errorConsultants,
    isFetching
  } = useQuery({
    queryKey: ["consultants", "all", page],
    queryFn: () => getConsultants({ page, limit: ITEMS_PER_PAGE }),
    placeholderData: (previousData) => previousData,
  });

  // 2. Dynamic Pagination Constants
  const totalCount = response?.total_count || 0;
  const TOTAL_PAGES = Math.ceil(totalCount / ITEMS_PER_PAGE) || 1;
  const consultants = response?.data || [];

  // 3. Fetch niches for filtering
  const { data: niches = [], isLoading: loadingNiches } = useQuery({
    queryKey: ["niches"],
    queryFn: () => getNiches(),
  });

  // 4. Unified Filtering
  // Filter the 'consultants' array derived from response.data
  const filteredConsultants = consultants.filter((c: Consultant) =>
    !selectedFilter || (c.tags && c.tags.some(tag => tag.toLowerCase() === selectedFilter.toLowerCase()))
  );

  const isLoading = loadingConsultants || loadingNiches;
  const error = errorConsultants;

  // 5. Sliding Window Pagination Logic
  const renderPageNumbers = () => {
    const pages = [];
    const maxVisible = 4;

    let startPage = Math.max(1, page);
    if (startPage + maxVisible > TOTAL_PAGES) {
      startPage = Math.max(1, TOTAL_PAGES - (maxVisible - 1));
    }

    const visiblePages = Array.from(
      { length: Math.min(maxVisible, TOTAL_PAGES - startPage + 1) },
      (_, i) => startPage + i
    );

    const buttons = visiblePages.map((pageNum) => (
      <button
        key={pageNum}
        onClick={() => setPage(pageNum)}
        className={`w-8 h-8 rounded-lg text-sm font-medium transition-all ${
          page === pageNum
            ? "bg-[#C56A49] text-white"
            : "text-muted-foreground hover:bg-muted"
        }`}
      >
        {pageNum}
      </button>
    ));

    if (visiblePages[visiblePages.length - 1] < TOTAL_PAGES) {
      if (visiblePages[visiblePages.length - 1] < TOTAL_PAGES - 1) {
        buttons.push(<span key="dots" className="text-muted-foreground px-1 text-xs">...</span>);
      }
      buttons.push(
        <button
          key={TOTAL_PAGES}
          onClick={() => setPage(TOTAL_PAGES)}
          className={`w-8 h-8 rounded-lg text-sm font-medium transition-all ${
            page === TOTAL_PAGES ? "bg-[#C56A49] text-white" : "text-muted-foreground hover:bg-muted"
          }`}
        >
          {TOTAL_PAGES}
        </button>
      );
    }

    return buttons;
  };

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

      {/* Niche Filters */}
      <div className="flex flex-wrap gap-3 mb-10">
        <button
          onClick={() => { setSelectedFilter(null); setPage(1); }}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${!selectedFilter
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-muted-foreground hover:bg-muted/80"
          }`}
        >
          All
        </button>
        {niches.map((n) => (
          <button
            key={n.id}
            onClick={() => { setSelectedFilter(n.display_name); setPage(1); }}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${selectedFilter === n.display_name
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {n.display_name}
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {error && (
        <div className="text-center py-16 text-red-500">
          Failed to load locals. Please try again later.
        </div>
      )}

      {!isLoading && !error && (
        <>
          <div className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6 transition-opacity duration-200 ${isFetching ? 'opacity-50' : 'opacity-100'}`}>
            {filteredConsultants.map((consultant) => (
              <ConsultantCardCompact key={consultant.id} consultant={consultant} />
            ))}
          </div>

          {/* Pagination Controls */}
          <div className="mt-12 mb-8 flex items-center justify-between border-t pt-8">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="flex items-center justify-center rounded-full text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 active:scale-95"
                style={{
                  width: '32px',
                  height: '32px',
                  background: '#C56A49',
                  border: '1px solid #E5E0DC',
                  borderRadius: '9999px'
                }}
              >
                <ChevronLeft size={18} strokeWidth={2.5} />
              </button>

              <div className="flex items-center gap-1 mx-2">
                {renderPageNumbers()}
              </div>

              <button
                onClick={() => setPage(p => Math.min(TOTAL_PAGES, p + 1))}
                disabled={page === TOTAL_PAGES}
                className="flex items-center justify-center rounded-full text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 active:scale-95"
                style={{
                  width: '32px',
                  height: '32px',
                  background: '#C56A49',
                  border: '1px solid #E5E0DC',
                  borderRadius: '9999px'
                }}
              >
                <ChevronRight size={18} strokeWidth={2.5} />
              </button>
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Items per page:</span>
              <select className="bg-transparent font-medium text-foreground outline-none cursor-pointer">
                <option value="12">12</option>
                <option value="24">24</option>
              </select>
            </div>
          </div>
        </>
      )}

      {!isLoading && !error && filteredConsultants.length === 0 && (
        <div className="text-center py-16">
          <p className="text-muted-foreground">No locals found for this filter.</p>
        </div>
      )}
    </div>
  );
};

export default ExploreLocals;