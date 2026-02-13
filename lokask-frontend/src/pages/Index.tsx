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

  const { data: thailandRes, isLoading: loadingThai } = useQuery({
    queryKey: ["consultants", "thailand"],
    queryFn: () => getConsultants({ country: "TH" }),
  });

  const { data: parisRes, isLoading: loadingParis } = useQuery({
    queryKey: ["consultants", "paris"],
    queryFn: () => getConsultants({ country: "FR" }),
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
          consultants={thailandRes?.data || []}
          showMostAskedBadge={true}
        />
      )}

      {loadingParis ? (
        <div className="h-64 flex items-center justify-center">
          <span className="text-muted-foreground">Loading Paris locals...</span>
        </div>
      ) : (
        <LocalsCarousel
          title="Wonderful locals in Paris"
          consultants={parisRes?.data || []}
          showMostAskedBadge={true}
        />
      )}

      <IdeasGrid />

      <CTASection />
    </div>
  );
};

export default Index;