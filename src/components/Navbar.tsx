import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Menu, X, Search, Heart, Globe } from "lucide-react";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

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
              <Link to="/login" className="btn-outline-pill" aria-label="Log in to your account">
                Log in
              </Link>
              <Link to="/signup" className="btn-outline-pill" aria-label="Create a new account">
                Sign up
              </Link>
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
                <Link to="/login" className="btn-outline-pill flex-1 text-center" onClick={() => setIsOpen(false)}>
                  Log in
                </Link>
                <Link to="/signup" className="btn-outline-pill flex-1 text-center" onClick={() => setIsOpen(false)}>
                  Sign up
                </Link>
              </div>
            </div>
          </div>}
      </div>
    </nav>;
};
export default Navbar;