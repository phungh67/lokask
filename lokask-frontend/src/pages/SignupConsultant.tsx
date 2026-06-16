import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Briefcase, Loader2 } from "lucide-react";
import { registerConsultant } from "@/lib/api"; // 🟢 Import API
import { toast } from "sonner";

const SignupConsultant = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  
  // 🟢 1. State for inputs
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    city: "", // Captures the city name
    password: ""
  });

  // 🟢 2. The function that sends the data
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      await registerConsultant(formData);
      toast.success("Consultant account created!");
      navigate("/login");
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Registration failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="py-16 lg:py-24">
        <div className="container mx-auto px-6">
          <div className="max-w-md mx-auto">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                <Briefcase className="w-8 h-8 text-primary" />
              </div>
              <h1 className="text-3xl font-display font-bold text-foreground mb-2">
                Join as Consultant
              </h1>
              <p className="text-muted-foreground">
                Share your local expertise and help travelers discover your city
              </p>
            </div>

            <div className="card-soft p-8">
              {/* 🟢 3. Connect the submit handler */}
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Full name
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-border focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    value={formData.fullName}
                    onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Email address
                  </label>
                  <input
                    type="email"
                    required
                    className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-border focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Your location (City)
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-border focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    placeholder="e.g., Tokyo"
                    value={formData.city}
                    onChange={(e) => setFormData({...formData, city: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-border focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                  />
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-4 rounded-full bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity flex justify-center items-center gap-2"
                >
                  {isLoading ? <Loader2 className="animate-spin" /> : "Create consultant account"}
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
                  Want to travel instead?{" "}
                  <Link to="/signup/traveller" className="text-primary hover:underline font-medium">
                    Sign up as Traveller
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

export default SignupConsultant;