import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, X, Search, Heart, Globe, User, Briefcase, LayoutDashboard, LogOut } from "lucide-react";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import AuthPromptDialog from "@/components/auth/AuthPromptDialog";
import { getMe } from "@/lib/api";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const navigate = useNavigate();

  // Auth State
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Dialog State
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [authRole, setAuthRole] = useState<"traveller" | "consultant">("traveller");
  const [authMessage, setAuthMessage] = useState("");

  const handleOpenAuth = (role: "traveller" | "consultant", message: string) => {
    setAuthRole(role);
    setAuthMessage(message);
    setShowAuthDialog(true);
  };

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const userData = await getMe();
        setUser(userData);
      } catch (err) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100);
    };

    checkAuth();
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/v1/auth/logout", { method: "POST" });
    } catch (e) {
      console.error("Logout request failed");
    } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      setUser(null);

      window.location.href = "/";
    }
  };

  return (
    <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm shadow-soft w-full border-b border-border/40">
      <div className="w-full max-w-[2400px] mx-auto px-4 sm:px-6 lg:px-8 2xl:px-12">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center shrink-0">
            <span className="text-2xl font-black font-body tracking-tight">
              <span className="text-foreground font-extrabold text-4xl">Lok</span>
              <span className="text-primary text-4xl">ask</span>
            </span>
          </Link>

          {/* Search Bar */}
          {isScrolled && (
            <div className="hidden md:flex items-center flex-1 max-w-md mx-8 animate-fade-in">
              <div className="flex items-center w-full bg-white/90 rounded-full border border-border/50 px-4 py-2">
                <Search className="w-4 h-4 text-muted-foreground mr-2" />
                <input
                  type="text"
                  placeholder="Find your local buddy"
                  className="flex-1 bg-transparent text-sm outline-none"
                />
              </div>
            </div>
          )}

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-6 shrink-0">
            <Link to="/wishlist" className="flex flex-col items-center text-foreground/80 hover:text-foreground">
              <Heart className="w-5 h-5" />
              <span className="text-xs mt-0.5">Wishlist</span>
            </Link>

            <div className="flex items-center gap-3 ml-4">
              {loading ? (
                <div className="w-24 h-8 bg-muted animate-pulse rounded-full" />
              ) : user ? (
                /* Authenticated View: Reusing btn-outline-pill styles */
                <div className="flex items-center gap-3">
                  <div className="btn-outline-pill border-none bg-primary/10 cursor-default px-4 py-2">
                    <span className="text-sm font-bold text-foreground">
                      Hello, {user.full_name?.split(' ')[0] || 'User'}
                    </span>
                  </div>

                  {user.role === "consultant" && (
                    <Link to="/dashboard" className="btn-outline-pill hover:bg-muted">
                      <div className="flex items-center gap-2">
                        <LayoutDashboard size={14} />
                        <span>Dashboard</span>
                      </div>
                    </Link>
                  )}

                  <button
                    onClick={handleLogout}
                    className="btn-outline-pill bg-foreground text-background hover:bg-foreground/90 transition-all px-5"
                  >
                    Logout
                  </button>

                  {user.avatar_url && (
                    <img
                      src={user.avatar_url}
                      alt="Profile"
                      className="w-9 h-9 rounded-full border-2 border-primary/20 object-cover ml-1"
                    />
                  )}
                </div>
              ) : (
                /* Guest View */
                <>
                  <button
                    onClick={() => handleOpenAuth("traveller", "Welcome back! Please log in.")}
                    className="btn-outline-pill"
                  >
                    Log in
                  </button>

                  <HoverCard openDelay={100} closeDelay={200}>
                    <HoverCardTrigger asChild>
                      <button className="btn-outline-pill">Sign up</button>
                    </HoverCardTrigger>
                    <HoverCardContent align="end" className="w-64 p-4">
                      <h3 className="font-bold text-lg mb-3 font-display">Sign up</h3>
                      <div className="space-y-1">
                        <button onClick={() => handleOpenAuth("traveller", "Join as a Traveller")} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted w-full text-left">
                          <User className="w-5 h-5 text-primary" />
                          <span className="font-medium">As Traveller</span>
                        </button>
                        <button onClick={() => handleOpenAuth("consultant", "Join as a Consultant")} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted w-full text-left">
                          <Briefcase className="w-5 h-5 text-primary" />
                          <span className="font-medium">As Consultant</span>
                        </button>
                      </div>
                    </HoverCardContent>
                  </HoverCard>
                </>
              )}
            </div>
          </div>

          {/* Mobile Toggle */}
          <button className="md:hidden p-2" onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        <AuthPromptDialog
          open={showAuthDialog}
          onOpenChange={setShowAuthDialog}
          defaultRole={authRole}
          message={authMessage}
        />
      </div>
    </nav>
  );
};

export default Navbar;