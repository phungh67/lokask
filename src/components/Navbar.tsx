import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm shadow-soft">
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <span className="text-2xl font-bold font-display">
              <span className="text-foreground">Lok</span>
              <span className="text-primary">ask</span>
            </span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-8">
            <Link 
              to="/how-it-works" 
              className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors"
            >
              How it works
            </Link>
            <Link 
              to="/explore-locals" 
              className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors"
            >
              Explore locals
            </Link>
            <div className="flex items-center gap-3 ml-4">
              <Link 
                to="/login" 
                className="btn-outline-pill"
                aria-label="Log in to your account"
              >
                Log in
              </Link>
              <Link 
                to="/signup" 
                className="btn-outline-pill"
                aria-label="Create a new account"
              >
                Sign up
              </Link>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
            onClick={() => setIsOpen(!isOpen)}
            aria-label={isOpen ? "Close menu" : "Open menu"}
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden py-4 border-t border-border animate-fade-in">
            <div className="flex flex-col gap-4">
              <Link 
                to="/how-it-works" 
                className="text-sm font-medium text-foreground/80 hover:text-foreground py-2"
                onClick={() => setIsOpen(false)}
              >
                How it works
              </Link>
              <Link 
                to="/explore-locals" 
                className="text-sm font-medium text-foreground/80 hover:text-foreground py-2"
                onClick={() => setIsOpen(false)}
              >
                Explore locals
              </Link>
              <div className="flex gap-3 pt-2">
                <Link 
                  to="/login" 
                  className="btn-outline-pill flex-1 text-center"
                  onClick={() => setIsOpen(false)}
                >
                  Log in
                </Link>
                <Link 
                  to="/signup" 
                  className="btn-outline-pill flex-1 text-center"
                  onClick={() => setIsOpen(false)}
                >
                  Sign up
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
