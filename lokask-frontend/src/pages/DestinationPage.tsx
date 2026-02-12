import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ConsultantCardCompact from "@/components/ConsultantCardCompact";
// 🟢 Logical imports
import { useQuery } from "@tanstack/react-query";
import { getConsultants } from "@/lib/api"; //
import { Consultant } from "@/types/consultant"; //

// Note: If you don't have a destinations API yet, you can keep a local 
// constant for basic metadata, but the consultants must come from the DB.
const DESTINATION_METADATA: Record<string, { name: string; imageUrl: string }> = {
  thailand: {
    name: "Thailand",
    imageUrl: "https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=800&auto=format&fit=crop",
  },
  paris: {
    name: "Paris",
    imageUrl: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&auto=format&fit=crop",
  },
};

const DestinationPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const destination = slug ? DESTINATION_METADATA[slug.toLowerCase()] : null;

  // 🟢 1. Fetch real consultants based on destination name
  const { data: displayConsultants = [], isLoading } = useQuery({
    queryKey: ["consultants", slug],
    queryFn: () => getConsultants({ city: destination?.name }), //
    enabled: !!destination, // Only run if destination is valid
  });

  if (!destination) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="py-16">
          <div className="container mx-auto px-6 text-center">
            <h1 className="text-4xl font-display font-bold text-foreground mb-4">
              Destination not found
            </h1>
            <Link to="/" className="text-primary hover:underline">
              Go back home
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Image */}
      <div className="relative h-[300px] lg:h-[400px]">
        <img
          src={destination.imageUrl}
          alt={destination.name}
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 lg:p-12">
          <div className="container mx-auto">
            <Link 
              to="/" 
              className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-4 transition-colors"
            >
              <ArrowLeft size={20} />
              Back to home
            </Link>
            <h1 className="text-4xl lg:text-6xl font-display font-bold text-white">
              {destination.name}
            </h1>
          </div>
        </div>
      </div>

      <main className="py-12 lg:py-16">
        <div className="container mx-auto px-6">
          <h2 className="text-2xl lg:text-3xl font-display font-bold text-foreground mb-6">
            Locals in {destination.name}
          </h2>
          <p className="text-muted-foreground mb-10 max-w-2xl">
            Connect with locals who live in {destination.name} and get insider tips for your trip.
          </p>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">Finding local experts...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {displayConsultants.length > 0 ? (
                displayConsultants.map((consultant: Consultant) => (
                  <ConsultantCardCompact key={consultant.id} consultant={consultant} />
                ))
              ) : (
                <div className="col-span-full py-20 text-center border-2 border-dashed border-border rounded-xl">
                  <p className="text-muted-foreground">No locals found for this destination yet.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default DestinationPage;