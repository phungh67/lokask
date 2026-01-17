import { Link } from "react-router-dom";
import { destinations } from "@/data/mockData";
const DestinationGrid = () => {
  return <section className="py-16 lg:py-24">
      <div className="container mx-auto px-6">
        <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-8 font-sans">
          Popular places travellers ask about
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {destinations.map((destination, index) => <Link key={destination.slug} to={`/destinations/${destination.slug}`} className="group relative overflow-hidden rounded-2xl aspect-[4/5] animate-fade-in" style={{
          animationDelay: `${index * 100}ms`
        }}>
              <img src={destination.imageUrl} alt={destination.name} className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <h3 className="text-white text-lg font-semibold font-display">
                  {destination.name}
                </h3>
              </div>
            </Link>)}
        </div>
      </div>
    </section>;
};
export default DestinationGrid;