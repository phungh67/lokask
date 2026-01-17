import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import DestinationGrid from "@/components/DestinationGrid";
import ConsultantsCarousel from "@/components/ConsultantsCarousel";
import IdeasGrid from "@/components/IdeasGrid";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <HeroSection />
        <DestinationGrid />
        <ConsultantsCarousel />
        <IdeasGrid />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
