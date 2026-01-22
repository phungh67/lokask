import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { User } from "lucide-react";

const SignupTraveller = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="py-16 lg:py-24">
        <div className="container mx-auto px-6">
          <div className="max-w-md mx-auto">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                <User className="w-8 h-8 text-primary" />
              </div>
              <h1 className="text-3xl font-display font-bold text-foreground mb-2">
                Join as Traveller
              </h1>
              <p className="text-muted-foreground">
                Create an account to connect with locals and plan your trips
              </p>
            </div>

            <div className="card-soft p-8">
              <form className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-foreground mb-2">
                    Full name
                  </label>
                  <input
                    type="text"
                    id="name"
                    className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-border focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    placeholder="Your name"
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
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-foreground mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    id="password"
                    className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-border focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    placeholder="Create a password"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-4 rounded-full bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity"
                >
                  Create traveller account
                </button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-sm text-muted-foreground">
                  Already have an account?{" "}
                  <Link to="/login" className="text-primary hover:underline font-medium">
                    Log in
                  </Link>
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Want to become a consultant?{" "}
                  <Link to="/signup/consultant" className="text-primary hover:underline font-medium">
                    Sign up as Consultant
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default SignupTraveller;
