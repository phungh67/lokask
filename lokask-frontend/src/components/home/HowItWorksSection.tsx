import { Link } from "react-router-dom";
import { Search, Globe, MapPin } from "lucide-react";

const steps = [
  {
    icon: Search,
    title: "Find a local",
    description: "Search by destination, specialty, or expertise. Browse our list and find someone who knows exactly what you need.",
  },
  {
    icon: Globe,
    title: "Ask your questions",
    description: "Send a message with your travel dates, interests, and questions. Our locals answer quickly with honest recommendations.",
  },
  {
    icon: MapPin,
    title: "Travel with confidence",
    description: "Skip tourist traps, avoid food maps, and experience places the way locals do—with confidence in every step of your trip.",
  },
];

const HowItWorksSection = () => {
  return (
    <section className="w-full py-16 lg:py-24 bg-white">
      <div className="container mx-auto px-6">
        
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-display font-bold text-foreground mb-4">
            How Lokask works
          </h2>
          <p className="text-lg text-muted-foreground">
            Get real local advice from real locals. No bots. No Alexa. Just honest local.
          </p>
        </div>

        {/* 3-Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 max-w-5xl mx-auto mb-14">
          {steps.map((step, index) => (
            <div key={index} className="text-center flex flex-col items-center">
              {/* Circular Icon Background */}
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                <step.icon size={32} className="text-primary" strokeWidth={1.5} />
              </div>
              <h3 className="text-xl font-display font-semibold text-foreground mb-3">
                {index + 1}. {step.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed text-sm lg:text-base">
                {step.description}
              </p>
            </div>
          ))}
        </div>

        {/* Redirect Button */}
        <div className="text-center">
          <Link
            to="/how-it-works"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full border-2 border-primary text-primary font-semibold hover:bg-primary hover:text-primary-foreground transition-all duration-300 active:scale-[0.98]"
          >
            Read more details
          </Link>
        </div>

      </div>
    </section>
  );
};

export default HowItWorksSection;