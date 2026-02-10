import HeroSection from "@/components/HeroSection";
import DestinationGrid from "@/components/DestinationGrid";
import LocalsCarousel from "@/components/LocalsCarousel";
import IdeasGrid from "@/components/IdeasGrid";
import CTASection from "@/components/CTASection";
import { thailandConsultants, parisConsultants, topLocals } from "@/data/mockData";

const Index = () => {
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