import { useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ConsultantCardCompact from "@/components/ConsultantCardCompact";
import { useQuery } from "@tanstack/react-query";
import { getConsultants, Niche, getNiches } from "@/lib/api";
import { Consultant } from "@/types/consultant";
import { consultants, whoFilterOptions } from "@/data/mockData";

// for loading content
import { Loader2 } from "lucide-react";

const ExploreLocals = () => {
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);

  // fetch real data from consultant data type
  const { data: consultants = [], isLoading: loadingConsultants, error: errorConsultants } = useQuery({
    queryKey: ["consultants", "all"],
    queryFn: () => getConsultants(),
  });

  // fetch real niches (tags) from database
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
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="py-12">
        <div className="container mx-auto px-6">
          <h1 className="text-4xl lg:text-5xl font-display font-bold text-foreground mb-4">
            Explore locals
          </h1>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl">
            Find real people who live in your destination and can give you honest, local advice.
          </p>

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

            {/* dynamic Filter Buttons */}
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
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {filteredConsultants.map((consultant) => (
              <ConsultantCardCompact key={consultant.id} consultant={consultant} />
            ))}
          </div>

          {/* Empty State */}
          {!isLoading && !error && filteredConsultants.length === 0 && (
            <div className="text-center py-16">
              <p className="text-muted-foreground">No locals found for this filter.</p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ExploreLocals;