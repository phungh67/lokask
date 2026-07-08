import { Outlet } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { NotificationProvider } from "@/context/NotificationContext";

const Layout = () => {
  return (
    <NotificationProvider>
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <main className="flex-grow w-full max-w-[2400px] mx-auto px-4 sm:px-6 lg:px-8 2xl:px-12 py-12">
          <Outlet />
        </main>
        <Footer />
      </div>
    </NotificationProvider>
  );
};

export default Layout;