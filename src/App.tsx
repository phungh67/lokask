import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ChatProvider } from "@/context/ChatContext";
import ChatWidget from "@/components/chat/ChatWidget";
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
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ChatProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/explore-locals" element={<ExploreLocals />} />
            <Route path="/how-it-works" element={<HowItWorks />} />
            <Route path="/destinations/:slug" element={<DestinationPage />} />
            <Route path="/consultant/:id" element={<ConsultantPage />} />
            <Route path="/become-local" element={<BecomeLocal />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/signup/traveller" element={<SignupTraveller />} />
            <Route path="/signup/consultant" element={<SignupConsultant />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
        <ChatWidget />
      </TooltipProvider>
    </ChatProvider>
  </QueryClientProvider>
);

export default App;
