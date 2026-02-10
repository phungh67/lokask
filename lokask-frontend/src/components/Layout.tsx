import { Outlet } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const Layout = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-grow w-full max-w-[2400px] mx-auto px-4 sm:px-6 lg:px-8 2xl:px-12 py-12">
        <Outlet /> {/* This renders ExploreLocals, Home, etc. */}
      </main>

      <Footer />
    </div>
  );
};

export default Layout;