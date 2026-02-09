import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import DestinationGrid from "@/components/DestinationGrid";
import LocalsCarousel from "@/components/LocalsCarousel";
import IdeasGrid from "@/components/IdeasGrid";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";
import { thailandConsultants, parisConsultants, topLocals } from "@/data/mockData";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <HeroSection />
        <DestinationGrid />
        <LocalsCarousel
          title="Top locals travellers trust"
          consultants={topLocals}
        />
        <LocalsCarousel title="Wonderful locals in Thailand" consultants={thailandConsultants} mostAskedLocalId="th-3" />
        <LocalsCarousel title="Most asked local in Paris" consultants={parisConsultants} showMostAskedBadge={true} />
        <IdeasGrid />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
