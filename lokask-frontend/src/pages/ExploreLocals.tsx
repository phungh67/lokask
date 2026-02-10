import { useState } from "react";
import ConsultantCardCompact from "@/components/ConsultantCardCompact";
import { useQuery } from "@tanstack/react-query";
import { getConsultants, Niche, getNiches } from "@/lib/api";
import { Consultant } from "@/types/consultant";
import { Loader2 } from "lucide-react";

const ExploreLocals = () => {
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);

  // fetch real data
  const { data: consultants = [], isLoading: loadingConsultants, error: errorConsultants } = useQuery({
    queryKey: ["consultants", "all"],
    queryFn: () => getConsultants(),
  });

  // fetch real niches
  const { data: niches = [], isLoading: loadingNiches } = useQuery({
    queryKey: ["niches"],
    queryFn: () => getNiches(),
  });

  const filteredConsultants = selectedFilter
    ? consultants.filter((c: Consultant) =>
      c.tags && c.tags.some(tag => tag.toLowerCase() === selectedFilter.toLowerCase())
    )
    : consultants;

  const isLoading = loadingConsultants || loadingNiches;
  const error = errorConsultants;

  return (
    <div className="w-full">
      {/* 🟢 Fix: Removed Navbar (Layout handles it) */}
      
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

      {/* Consultants Grid - 🟢 Fix: Added 2xl:grid-cols-6 */}
      {!isLoading && !error && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6">
          {filteredConsultants.map((consultant) => (
            <ConsultantCardCompact key={consultant.id} consultant={consultant} />
          ))}
        </div>
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