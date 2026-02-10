import { Check, ArrowRight } from "lucide-react";

const benefits = [
  "Share your local knowledge and favorite spots",
  "Set your own availability and response times",
  "Earn money from your expertise",
  "Meet interesting people from around the world",
  "No tour guide license required",
];

const BecomeLocal = () => {
  return (
    <div className="w-full">
      {/* 🟢 Fix: Removed Navbar */}
      
      <div className="py-8 lg:py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl lg:text-5xl font-display font-bold text-foreground mb-4">
              Become a local on Lokask
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              You don't need to be a tour guide. If you live there and know the place, 
              you can help travellers and earn from your knowledge.
            </p>
          </div>

          <div className="card-soft p-8 lg:p-12 mb-12">
            <h2 className="text-2xl font-display font-semibold text-foreground mb-6">
              What you'll get
            </h2>
            <ul className="space-y-4">
              {benefits.map((benefit, index) => (
                <li key={index} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check size={14} className="text-primary" />
                  </div>
                  <span className="text-foreground">{benefit}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="card-soft p-8 lg:p-12">
            <h2 className="text-2xl font-display font-semibold text-foreground mb-6">
              Apply to become a local
            </h2>
            <form className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-foreground mb-2">
                    Your name
                  </label>
                  <input
                    type="text"
                    id="name"
                    className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-border focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    placeholder="Enter your name"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                    Email address
                  </label>
                  <input
                    type="email"
                    id="email"
                    className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-border focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    placeholder="you@example.com"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="city" className="block text-sm font-medium text-foreground mb-2">
                  City where you live
                </label>
                <input
                  type="text"
                  id="city"
                  className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-border focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  placeholder="e.g., Rome, Paris, Tokyo"
                />
              </div>
              <div>
                <label htmlFor="expertise" className="block text-sm font-medium text-foreground mb-2">
                  What do you know best about your city?
                </label>
                <textarea
                  id="expertise"
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-border focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none"
                  placeholder="Tell us about your local expertise..."
                />
              </div>
              <button
                type="submit"
                className="w-full md:w-auto px-8 py-4 rounded-full bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
              >
                Submit application
                <ArrowRight size={20} />
              </button>
            </form>
          </div>
        </div>
      </div>
      
      {/* 🟢 Fix: Removed Footer */}
    </div>
  );
};

export default BecomeLocal;