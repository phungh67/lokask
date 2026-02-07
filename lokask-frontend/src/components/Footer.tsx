import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="py-12 border-t border-border">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Logo & Tagline */}
          <div className="text-center md:text-left">
            <Link to="/" className="inline-block mb-2">
              <span className="text-xl font-bold font-display">
                <span className="text-foreground">Lok</span>
                <span className="text-primary">ask</span>
              </span>
            </Link>
            <p className="text-sm text-muted-foreground">
              Ask locals first.
            </p>
          </div>

          {/* Links */}
          <nav className="flex items-center gap-6">
            <Link 
              to="/privacy" 
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Privacy
            </Link>
            <Link 
              to="/terms" 
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Terms
            </Link>
            <Link 
              to="/contact" 
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Contact
            </Link>
          </nav>
        </div>

        <div className="mt-8 pt-6 border-t border-border text-center">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Lokask. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
