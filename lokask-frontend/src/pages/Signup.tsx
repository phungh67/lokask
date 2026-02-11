import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { User, Briefcase, ArrowRight } from "lucide-react";

const Signup = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="py-16 lg:py-24">
        <div className="container mx-auto px-6">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-12">
              <h1 className="text-4xl font-display font-bold text-foreground mb-4">
                Join Lokask
              </h1>
              <p className="text-lg text-muted-foreground">
                Choose how you want to use the platform
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Traveller Card */}
              <Link 
                to="/signup/traveller" 
                className="group relative overflow-hidden rounded-3xl bg-white border border-border p-8 hover:border-primary/50 hover:shadow-strong transition-all duration-300 flex flex-col items-center text-center"
              >
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-white transition-colors">
                  <User size={32} className="text-primary group-hover:text-white transition-colors" />
                </div>
                <h3 className="text-xl font-bold font-display mb-3 text-foreground">I'm a Traveller</h3>
                <p className="text-muted-foreground mb-8 leading-relaxed text-sm">
                  I want to discover local gems, plan trips, and get advice from real locals.
                </p>
                <div className="mt-auto flex items-center text-primary font-semibold group-hover:gap-2 transition-all">
                  Join as Traveller <ArrowRight size={18} className="ml-1" />
                </div>
              </Link>

              {/* Consultant Card */}
              <Link 
                to="/signup/consultant" 
                className="group relative overflow-hidden rounded-3xl bg-white border border-border p-8 hover:border-primary/50 hover:shadow-strong transition-all duration-300 flex flex-col items-center text-center"
              >
                <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mb-6 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <Briefcase size={32} className="text-blue-600 group-hover:text-white transition-colors" />
                </div>
                <h3 className="text-xl font-bold font-display mb-3 text-foreground">I'm a Consultant</h3>
                <p className="text-muted-foreground mb-8 leading-relaxed text-sm">
                  I live here and want to share my knowledge, help travelers, and earn money.
                </p>
                <div className="mt-auto flex items-center text-blue-600 font-semibold group-hover:gap-2 transition-all">
                  Join as Consultant <ArrowRight size={18} className="ml-1" />
                </div>
              </Link>
            </div>

            <div className="mt-12 text-center">
              <p className="text-muted-foreground">
                Already have an account?{" "}
                <Link to="/login" className="text-primary hover:underline font-medium">
                  Log in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Signup;