import HeroSection from "@/components/HeroSection";
import DestinationGrid from "@/components/DestinationGrid";
import LocalsCarousel from "@/components/LocalsCarousel";
import IdeasGrid from "@/components/IdeasGrid";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";

// logical import
import { useQuery } from "@tanstack/react-query";
import { getConsultants } from "@/lib/api";

import { Loader2 } from "lucide-react";

const Index = () => {
  // data section
  const { data: topLocals = [], isLoading } = useQuery({
    queryKey: ["consultants", "top"],
    queryFn: () => getConsultants(),
  });

  const { data: thailandConsultants = [], isLoading: loadingThai } = useQuery({
    queryKey: ["consultants", "thailand"], // Unique key
    queryFn: () => getConsultants({ country: "TH" }), // Pass filter
  });

  const { data: parisConsultants = [], isLoading: LoadingParis } = useQuery({
    queryKey: ["consultants", "paris"], // Unique key
    queryFn: () => getConsultants({ country: "FR" }), // Pass filter
  });

  return (
    // Remove min-h-screen (Layout handles it) and use w-full
    <div className="w-full flex flex-col gap-10">

      <HeroSection />

      <DestinationGrid />

      {loadingThai ? (
        <div className="h-64 flex items-center justify-center">
          <span className="text-muted-foreground">Loading Thailand locals...</span>
        </div>
      ) : (
        <LocalsCarousel
          title="Wonderful locals in Thailand"
          consultants={thailandConsultants}
          showMostAskedBadge={true}
        />
      )}

      {LoadingParis ? (
        <div className="h-64 flex items-center justify-center">
          <span className="text-muted-foreground">Loading Paris locals...</span>
        </div>
      ) : (
        <LocalsCarousel
          title="Wonderful locals in Paris"
          consultants={parisConsultants}
          showMostAskedBadge={true}
        />
      )}

      <IdeasGrid />

      <CTASection />
    </div>
  );
};

export default Index;