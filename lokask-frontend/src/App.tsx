import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ChatProvider } from "@/context/ChatContext";
import ChatWidget from "./components/chat/ChatWidget";
import Navbar from "./components/Navbar";
import Index from "./pages/Index";
import ExploreLocals from "./pages/ExploreLocals";
import HowItWorks from "./pages/HowItWorks";
import DestinationPage from "./pages/DestinationPage";
import ConsultantPage from "./pages/ConsultantPage";
import BecomeLocal from "./pages/BecomeLocal";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import CallPage from "./pages/CallPage";
import SignupTraveller from "./pages/SignupTraveller";
import SignupConsultant from "./pages/SignupConsultant";
import ConsultantDashboard from "./pages/dashboard/ConsultantDashboard";
import BlogPage from "./pages/BlogPage";
import NotFound from "./pages/NotFound";
import Layout from "./components/Layout";
import ChoosePackagePage from "./pages/ChoosePackagePage";
import ResetPassword from "./pages/ResetPassword";
import { NotificationProvider } from "./context/NotificationContext";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ChatProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <NotificationProvider>
            <Navbar />
            <Routes>
              {/* public Pages */}
              <Route element={<Layout />}>
                <Route path="/" element={<Index />} />
                <Route path="/explore-locals" element={<ExploreLocals />} />
                <Route path="/how-it-works" element={<HowItWorks />} />
                <Route
                  path="/destinations/:slug"
                  element={<DestinationPage />}
                />
                {/* consultant */}
                <Route path="/consultant/:id" element={<ConsultantPage />} />
                <Route path="/become-local" element={<BecomeLocal />} />
                <Route path="/consultants" element={<ExploreLocals />} />
              </Route>

              <Route
                path="/consultant/:id/packages"
                element={<ChoosePackagePage />}
              />

              {/* auth & dashboard */}
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/signup/traveller" element={<SignupTraveller />} />
              <Route path="/signup/consultant" element={<SignupConsultant />} />
              <Route path="/dashboard" element={<ConsultantDashboard />} />
              <Route path="/reset-password" element={<ResetPassword />} />

              {/* Calling */}
              <Route path="/call/:roomId" element={<CallPage />} />

              <Route path="/blog/:id" element={<BlogPage />} />

              <Route path="*" element={<NotFound />} />
            </Routes>

            <ChatWidget />
          </NotificationProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ChatProvider>
  </QueryClientProvider>
);

export default App;
