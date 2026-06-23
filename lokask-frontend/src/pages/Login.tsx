import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { login } from "@/lib/api";
import { AuthStorage } from "@/lib/storage";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
const Login = () => {

  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (searchParams.get("verified") === "true") {
      toast.success("Account verified successfully! You can now log in.");
      
      // Clean the URL so the toast doesn't fire again if the user refreshes the page
      setSearchParams({});
    }
  }, [searchParams, setSearchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await login({ email, password });

      // Save session
      AuthStorage.setToken(res.token)
      AuthStorage.setUser(res.user)

      toast.success("Welcome back!");

      // Force reload to sync Navbar state immediately
      window.location.href = res.user.role === "consultant" ? "/dashboard" : "/";
    } catch (error: any) {
      toast.error(error.message || "Login failed");
    }
  };
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="py-16 lg:py-24">
        <div className="container mx-auto px-6">
          <div className="max-w-md mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-foreground mb-2 font-display">
                Welcome back
              </h1>
              <p className="text-muted-foreground">
                Log in to continue your journey
              </p>
            </div>

            <div className="card-soft p-8 bg-card border border-border rounded-2xl shadow-sm">
              <form className="space-y-6" onSubmit={handleSubmit}>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                    Email address
                  </label>
                  <input
                    type="email"
                    id="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
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
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-border focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    placeholder="••••••••"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-4 rounded-full bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity flex justify-center items-center"
                >
                  {isLoading ? <Loader2 className="animate-spin h-5 w-5" /> : "Log in"}
                </button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-sm text-muted-foreground">
                  Don't have an account?{" "}
                  <Link to="/signup" className="text-primary hover:underline font-medium">
                    Sign up
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
export default Login;