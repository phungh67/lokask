import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

const CTASection = () => {
  return (
    <section className="py-16 lg:py-24">
      <div className="container mx-auto px-6">
        <div className="bg-card rounded-3xl p-8 lg:p-16 shadow-medium text-center max-w-4xl mx-auto">
          <h2 className="text-3xl lg:text-4xl font-display font-bold text-foreground mb-4">
            Live there? Help travellers travel better.
          </h2>
          
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            You don't need to be a tour guide. If you live there and know the place, 
            you can help travellers and earn from your knowledge.
          </p>

          <Link
            to="/become-local"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity group"
          >
            Become a local on Lokask
            <ArrowRight size={20} className="transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
