import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Briefcase, Loader2 } from "lucide-react";
import { registerConsultant } from "@/lib/api";
import { toast } from "sonner";

// 🟢 Pre-defined list of supported cities
const VIETNAM_CITIES = [
  "Hanoi",
  "Ho Chi Minh City",
  "Da Nang",
  "Hoi An",
  "Nha Trang",
  "Da Lat",
  "Phu Quoc",
  "Quang Binh",
  "Sapa",
  "Hue"
];

const SignupConsultant = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    city: "", 
    password: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 🟢 Ensure user selects a city instead of leaving the placeholder
    if (!formData.city) {
      toast.error("Please select your city.");
      return;
    }

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
                
                {/* 🟢 Replaced standard input with styled dropdown */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Your location (City)
                  </label>
                  <div className="relative">
                    <select
                      required
                      className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-border focus:ring-2 focus:ring-primary/20 outline-none transition-all appearance-none cursor-pointer"
                      value={formData.city}
                      onChange={(e) => setFormData({...formData, city: e.target.value})}
                    >
                      <option value="" disabled>Select a city...</option>
                      {VIETNAM_CITIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground text-xs">
                      ▼
                    </div>
                  </div>
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