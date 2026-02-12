import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ChatProvider } from "@/context/ChatContext";
import ChatWidget from "./components/chat/ChatWidget";
import Index from "./pages/Index";
import ExploreLocals from "./pages/ExploreLocals";
import HowItWorks from "./pages/HowItWorks";
import DestinationPage from "./pages/DestinationPage";
import ConsultantPage from "./pages/ConsultantPage";
import BecomeLocal from "./pages/BecomeLocal";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import SignupTraveller from "./pages/SignupTraveller";
import SignupConsultant from "./pages/SignupConsultant";
import ConsultantDashboard from "./pages/dashboard/ConsultantDashboard";
import NotFound from "./pages/NotFound";
import Layout from "./components/Layout"; // 🟢 Ensure this is imported

const queryClient = new QueryClient();

// src/App.tsx

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ChatProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public Pages */}
            <Route element={<Layout />}>
              <Route path="/" element={<Index />} />
              <Route path="/explore-locals" element={<ExploreLocals />} />
              <Route path="/how-it-works" element={<HowItWorks />} />
              <Route path="/destinations/:slug" element={<DestinationPage />} />
              <Route path="/consultants/:id" element={<ConsultantPage />} />
              <Route path="/become-local" element={<BecomeLocal />} />
            </Route>

            {/* Auth & Dashboard */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/signup/traveller" element={<SignupTraveller />} />
            <Route path="/signup/consultant" element={<SignupConsultant />} />
            <Route path="/dashboard" element={<ConsultantDashboard />} />

            <Route path="*" element={<NotFound />} />
          </Routes>
          {/* 🟢 Move ChatWidget inside BrowserRouter for better compatibility */}
          <ChatWidget />
        </BrowserRouter>
      </TooltipProvider>
    </ChatProvider>
  </QueryClientProvider>
);

export default App;