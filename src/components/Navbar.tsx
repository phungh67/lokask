import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Menu, X, Search, Heart, Globe, User, Briefcase } from "lucide-react";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import AuthPromptDialog from "@/components/auth/AuthPromptDialog";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [authMessage, setAuthMessage] = useState("");

  const handleOpenAuth = (message: string) => {
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

  return <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm shadow-soft">
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center shrink-0">
            <span className="text-2xl font-black font-body tracking-tight">
              <span className="text-foreground font-extrabold text-4xl">Lok</span>
              <span className="text-primary text-4xl">ask</span>
            </span>
          </Link>

          {/* Search Bar - appears on scroll */}
          {isScrolled && (
            <div className="hidden md:flex items-center flex-1 max-w-md mx-8 animate-fade-in">
              <div className="flex items-center w-full bg-white/90 rounded-full border border-border/50 px-4 py-2">
                <Search className="w-4 h-4 text-muted-foreground mr-2" />
                <input
                  type="text"
                  placeholder="Find your local travel buddy"
                  className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                />
                <button className="ml-2 px-4 py-1.5 bg-primary text-primary-foreground text-sm font-medium rounded-full hover:opacity-90 transition-opacity">
                  Search
                </button>
              </div>
            </div>
          )}

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-6 shrink-0">
            {/* Wishlist */}
            <Link to="/wishlist" className="flex flex-col items-center text-foreground/80 hover:text-foreground transition-colors">
              <Heart className="w-5 h-5" />
              <span className="text-xs mt-0.5">Wishlist</span>
            </Link>
            
            {/* Language Selector */}
            <button className="flex flex-col items-center text-foreground/80 hover:text-foreground transition-colors">
              <Globe className="w-5 h-5" />
              <span className="text-xs mt-0.5">EN</span>
            </button>
            
            <div className="flex items-center gap-3 ml-4">
              <button 
                onClick={() => handleOpenAuth("Sign in to unlock the best of Lokask")}
                className="btn-outline-pill" 
                aria-label="Log in to your account"
              >
                Log in
              </button>
              <HoverCard openDelay={100} closeDelay={200}>
                <HoverCardTrigger asChild>
                  <button className="btn-outline-pill" aria-label="Create a new account">
                    Sign up
                  </button>
                </HoverCardTrigger>
                <HoverCardContent 
                  align="end" 
                  className="w-64 p-4 bg-background rounded-xl shadow-lg border border-border"
                >
                  <h3 className="font-bold text-lg mb-3 text-foreground">Sign up</h3>
                  <div className="space-y-1">
                    <button 
                      onClick={() => handleOpenAuth("Sign up as a Traveller to unlock the best of Lokask")}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors text-foreground w-full text-left"
                    >
                      <User className="w-5 h-5 text-primary" />
                      <span>Sign up as Traveller</span>
                    </button>
                    <button 
                      onClick={() => handleOpenAuth("Sign up as a Consultant to share your local expertise")}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors text-foreground w-full text-left"
                    >
                      <Briefcase className="w-5 h-5 text-primary" />
                      <span>Sign up as Consultant</span>
                    </button>
                  </div>
                </HoverCardContent>
              </HoverCard>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button className="md:hidden p-2" onClick={() => setIsOpen(!isOpen)} aria-label={isOpen ? "Close menu" : "Open menu"}>
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isOpen && <div className="md:hidden py-4 border-t border-border animate-fade-in">
            <div className="flex flex-col gap-4">
              <Link to="/wishlist" className="flex items-center gap-3 text-sm font-medium text-foreground/80 hover:text-foreground py-2" onClick={() => setIsOpen(false)}>
                <Heart className="w-5 h-5" />
                Wishlist
              </Link>
              <button className="flex items-center gap-3 text-sm font-medium text-foreground/80 hover:text-foreground py-2">
                <Globe className="w-5 h-5" />
                Language (EN)
              </button>
              <div className="flex gap-3 pt-2">
                <button 
                  onClick={() => {
                    handleOpenAuth("Sign in to unlock the best of Lokask");
                    setIsOpen(false);
                  }}
                  className="btn-outline-pill flex-1 text-center"
                >
                  Log in
                </button>
                <button 
                  onClick={() => {
                    handleOpenAuth("Sign up as a Traveller to unlock the best of Lokask");
                    setIsOpen(false);
                  }}
                  className="btn-outline-pill flex-1 text-center"
                >
                  Traveller
                </button>
                <button 
                  onClick={() => {
                    handleOpenAuth("Sign up as a Consultant to share your local expertise");
                    setIsOpen(false);
                  }}
                  className="btn-outline-pill flex-1 text-center"
                >
                  Consultant
                </button>
              </div>
            </div>
          </div>}

        {/* Auth Dialog */}
        <AuthPromptDialog
          open={showAuthDialog}
          onOpenChange={setShowAuthDialog}
          message={authMessage}
          onLogin={() => console.log("Login success")}
          onSignup={() => console.log("Signup success")}
          onGoogleAuth={() => console.log("Google auth")}
          onFacebookAuth={() => console.log("Facebook auth")}
        />
      </div>
    </nav>;
};
export default Navbar;