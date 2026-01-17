import { useParams, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ConsultantCardCompact from "@/components/ConsultantCardCompact";
import { destinations, consultants } from "@/data/mockData";

const DestinationPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const destination = destinations.find((d) => d.slug === slug);

  // Filter consultants by destination (or show all for demo)
  const destinationConsultants = consultants.filter(
    (c) => c.city.toLowerCase() === destination?.name.toLowerCase()
  );

  // Fallback to showing some consultants if none match
  const displayConsultants = destinationConsultants.length > 0 
    ? destinationConsultants 
    : consultants.slice(0, 4);

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

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {displayConsultants.map((consultant) => (
              <ConsultantCardCompact key={consultant.id} consultant={consultant} />
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default DestinationPage;
