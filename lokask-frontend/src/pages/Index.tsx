import HeroSection from "@/components/HeroSection";
import DestinationGrid from "@/components/DestinationGrid";
import LocalsCarousel from "@/components/LocalsCarousel";
import IdeasGrid from "@/components/IdeasGrid";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";

// logical import
import { useQuery } from "@tanstack/react-query";
import { getConsultants } from "@/lib/api";

import { thailandConsultants, parisConsultants } from "@/data/mockData";
import { Loader2 } from "lucide-react";

const Index = () => {
  // data section
  const { data: topLocals = [], isLoading } = useQuery({
    queryKey: ["consultants", "top"],
    queryFn: () => getConsultants(),
  });

  return (
    // Remove min-h-screen (Layout handles it) and use w-full
    <div className="w-full flex flex-col gap-10">

      <HeroSection />

      <DestinationGrid />

      <LocalsCarousel
        title="Top locals travellers trust"
        consultants={topLocals}
      />

      <LocalsCarousel
        title="Wonderful locals in Thailand"
        consultants={thailandConsultants}
        mostAskedLocalId="th-3"
      />

      <LocalsCarousel
        title="Most asked local in Paris"
        consultants={parisConsultants}
        showMostAskedBadge={true}
      />

      <IdeasGrid />

      <CTASection />
    </div>
  );
};

export default Index;