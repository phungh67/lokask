import { useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ConsultantCardCompact from "@/components/ConsultantCardCompact";
import { consultants, whoFilterOptions } from "@/data/mockData";

const ExploreLocals = () => {
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);

  const filteredConsultants = selectedFilter
    ? consultants.filter((c) => c.tag.toLowerCase().includes(selectedFilter.toLowerCase()))
    : consultants;

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
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                !selectedFilter
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              All
            </button>
            {whoFilterOptions.map((option) => (
              <button
                key={option}
                onClick={() => setSelectedFilter(option)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedFilter === option
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {option}
              </button>
            ))}
          </div>

          {/* Consultants Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {filteredConsultants.map((consultant) => (
              <ConsultantCardCompact key={consultant.id} consultant={consultant} />
            ))}
          </div>

          {filteredConsultants.length === 0 && (
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
