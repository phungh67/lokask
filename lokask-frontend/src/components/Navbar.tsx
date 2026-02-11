import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Menu, X, Search, Heart, Globe, User, Briefcase } from "lucide-react";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import AuthPromptDialog from "@/components/auth/AuthPromptDialog"; // 🟢 Import the Dialog

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  
  // 🟢 Dialog State
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [authRole, setAuthRole] = useState<"traveller" | "consultant">("traveller");
  const [authMessage, setAuthMessage] = useState("");

  const handleOpenAuth = (role: "traveller" | "consultant", message: string) => {
    setAuthRole(role);
    setAuthMessage(message);
    setShowAuthDialog(true);
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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
                <input type="text" placeholder="Find your local travel buddy" className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
                <button className="ml-2 px-4 py-1.5 bg-primary text-primary-foreground text-sm font-medium rounded-full hover:opacity-90 transition-opacity">Search</button>
              </div>
            </div>
          )}

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-6 shrink-0">
            <Link to="/wishlist" className="flex flex-col items-center text-foreground/80 hover:text-foreground transition-colors">
              <Heart className="w-5 h-5" /><span className="text-xs mt-0.5">Wishlist</span>
            </Link>
            <button className="flex flex-col items-center text-foreground/80 hover:text-foreground transition-colors">
              <Globe className="w-5 h-5" /><span className="text-xs mt-0.5">EN</span>
            </button>

            <div className="flex items-center gap-3 ml-4">
              {/* 🟢 Log In Button triggers Dialog */}
              <button 
                onClick={() => handleOpenAuth("traveller", "Welcome back! Please log in.")}
                className="btn-outline-pill"
              >
                Log in
              </button>

              {/* 🟢 Sign Up Hover Card */}
              <HoverCard openDelay={100} closeDelay={200}>
                <HoverCardTrigger asChild>
                  <button className="btn-outline-pill">Sign up</button>
                </HoverCardTrigger>
                <HoverCardContent align="end" className="w-64 p-4 bg-background rounded-xl shadow-lg border border-border">
                  <h3 className="font-bold text-lg mb-3 text-foreground">Sign up</h3>
                  <div className="space-y-1">
                    <button 
                      onClick={() => handleOpenAuth("traveller", "Join as a Traveller")}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors text-foreground w-full text-left"
                    >
                      <User className="w-5 h-5 text-primary" /><span>Sign up as Traveller</span>
                    </button>
                    <button 
                      onClick={() => handleOpenAuth("consultant", "Join as a Consultant")}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors text-foreground w-full text-left"
                    >
                      <Briefcase className="w-5 h-5 text-primary" /><span>Sign up as Consultant</span>
                    </button>
                  </div>
                </HoverCardContent>
              </HoverCard>
            </div>
          </div>
          
           {/* Mobile Menu Button */}
           <button className="md:hidden p-2" onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
        
        {/* 🟢 Auth Dialog Component */}
        <AuthPromptDialog
        
          open={showAuthDialog}
          onOpenChange={setShowAuthDialog}
          defaultRole={authRole} // Pass the role we clicked
          message={authMessage}
        />
      </div>
    </nav>
  );
};

export default Navbar;