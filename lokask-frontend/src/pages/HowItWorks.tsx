import { Link } from "react-router-dom";
import { Search, MessageCircle, Sparkles } from "lucide-react";

const steps = [
  {
    icon: Search,
    title: "Find a local",
    description: "Search for locals by destination and expertise. Browse profiles to find someone who matches your travel style.",
  },
  {
    icon: MessageCircle,
    title: "Ask your questions",
    description: "Reach out and ask anything about your destination. Get honest, personal recommendations from someone who actually lives there.",
  },
  {
    icon: Sparkles,
    title: "Travel with confidence",
    description: "With local insights, you'll discover hidden gems, avoid tourist traps, and experience your destination like a local.",
  },
];

const HowItWorks = () => {
  return (
    <div className="w-full">
      {/* 🟢 Fix: Removed Navbar */}
      
      <div className="py-12 lg:py-20">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h1 className="text-4xl lg:text-5xl font-display font-bold text-foreground mb-4">
            How Lokask works
          </h1>
          <p className="text-lg text-muted-foreground">
            Get real travel advice from real people who live there. No tours, no bookings — just honest local knowledge.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto mb-16">
          {steps.map((step, index) => (
            <div key={index} className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
                <step.icon size={28} className="text-primary" />
              </div>
              <h2 className="text-xl font-display font-semibold text-foreground mb-3">
                {index + 1}. {step.title}
              </h2>
              <p className="text-muted-foreground">
                {step.description}
              </p>
            </div>
          ))}
        </div>

        <div className="text-center">
          <Link
            to="/explore-locals"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity"
          >
            Start exploring locals
          </Link>
        </div>
      </div>
      
      {/* 🟢 Fix: Removed Footer */}
    </div>
  );
};

export default HowItWorks;