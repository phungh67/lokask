import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { login, registerTraveller, registerConsultant } from "@/lib/api";
import { toast } from "sonner";

type AuthStep = "initial" | "login" | "signup";

interface AuthPromptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  message?: string;
  defaultRole?: "traveller" | "consultant"; // 🟢 Added to know which signup to perform
}

const AuthPromptDialog = ({
  open,
  onOpenChange,
  message = "Log in or sign up",
  defaultRole = "traveller",
}: AuthPromptDialogProps) => {
  const navigate = useNavigate();
  const [step, setStep] = useState<AuthStep>("initial");
  const [isLoading, setIsLoading] = useState(false);

  // Form State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [city, setCity] = useState(""); // 🟢 For Consultant Signup
  const [showPassword, setShowPassword] = useState(false);

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (open) {
      setStep("initial");
      setEmail("");
      setPassword("");
      setFullName("");
      setCity("");
      setIsLoading(false);
    }
  }, [open]);

  const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  // 1. Initial Step: Check Email (Simplified for now to just go to Login/Signup selection)
  // For this flow, we will just let them choose or default based on previous interaction
  // But to stick to your UI, let's assume "Continue with Email" checks if they exist.
  // For now, we'll mimic the logic: If they typed an email, we ask for password (Login)
  // or details (Signup).
  const handleContinueWithEmail = async () => {
    if (!isValidEmail(email)) return;
    // In a real app, you'd check API if email exists. 
    // For now, we'll default to the step matching their intent if possible, 
    // or just 'login' as a default if unsure. 
    // Let's force them to choose for clarity in this demo:
    setStep("login"); 
  };

  // 2. Handle Login
  const handleLogin = async () => {
    setIsLoading(true);
    try {
      const res = await login({ email, password });
      toast.success(`Welcome back, ${res.user.full_name}!`);
      localStorage.setItem("token", res.token); // Save token
      localStorage.setItem("user", JSON.stringify(res.user));
      onOpenChange(false);
      navigate("/"); // Refresh or redirect
    } catch (error: any) {
      toast.error(error.message || "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  // 3. Handle Signup
  const handleSignup = async () => {
    setIsLoading(true);
    try {
      if (defaultRole === "consultant") {
        await registerConsultant({
          fullName,
          email,
          password,
          city,
        });
        toast.success("Consultant account created! Please log in.");
      } else {
        await registerTraveller({
          fullName,
          email,
          password,
        });
        toast.success("Traveller account created! Please log in.");
      }
      // After signup, usually we log them in or ask them to login. 
      // Let's switch to login step for safety
      setStep("login");
    } catch (error: any) {
      toast.error(error.message || "Signup failed");
    } finally {
      setIsLoading(false);
    }
  };

  // Render Helpers
  const renderInitialStep = () => (
    <>
      <DialogHeader className="text-left space-y-2">
        <DialogTitle className="text-2xl font-display font-semibold">Log in or sign up</DialogTitle>
        <DialogDescription className="text-base">{message}</DialogDescription>
      </DialogHeader>
      <div className="mt-6 space-y-4">
        <Input
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="h-12 rounded-xl border-2 px-4 text-base"
        />
        <Button 
          className="w-full h-12 rounded-full font-medium text-base"
          disabled={!isValidEmail(email)}
          onClick={() => setStep("login")} // Default to login flow
        >
          Continue with email
        </Button>
        
        <div className="relative py-2">
           <div className="absolute inset-0 flex items-center"><span className="w-full border-t"/></div>
           <div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-2 text-muted-foreground">or</span></div>
        </div>

        <Button variant="outline" className="w-full h-12 rounded-full" onClick={() => setStep("signup")}>
           New here? Create an account
        </Button>
      </div>
    </>
  );

  const renderLoginStep = () => (
    <>
      <DialogHeader className="text-left space-y-2">
        <DialogTitle className="text-2xl font-display font-semibold">Welcome back</DialogTitle>
      </DialogHeader>
      <div className="mt-4 space-y-4">
        <Input 
          value={email} 
          disabled 
          className="bg-muted text-muted-foreground h-12 rounded-xl px-4"
        />
        <div className="relative">
          <Input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-12 rounded-xl border-2 px-4 pr-12"
          />
          <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-3 text-muted-foreground">
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
        <Button className="w-full h-12 rounded-full" onClick={handleLogin} disabled={isLoading}>
          {isLoading ? <Loader2 className="animate-spin" /> : "Log in"}
        </Button>
        <button onClick={() => setStep("initial")} className="text-sm text-center w-full text-muted-foreground hover:text-primary">
          Back
        </button>
      </div>
    </>
  );

  const renderSignupStep = () => (
    <>
      <DialogHeader className="text-left space-y-2">
        <DialogTitle className="text-2xl font-display font-semibold">
          Join as {defaultRole === "consultant" ? "Consultant" : "Traveller"}
        </DialogTitle>
      </DialogHeader>
      <div className="mt-4 space-y-4">
        <Input 
          placeholder="Full Name" 
          value={fullName} 
          onChange={(e) => setFullName(e.target.value)} 
          className="h-12 rounded-xl border-2 px-4"
        />
        <Input 
          placeholder="Email" 
          value={email} 
          onChange={(e) => setEmail(e.target.value)} 
          className="h-12 rounded-xl border-2 px-4"
        />
        
        {/* 🟢 City Input - Only for Consultants */}
        {defaultRole === "consultant" && (
           <Input 
             placeholder="City (e.g., Tokyo)" 
             value={city} 
             onChange={(e) => setCity(e.target.value)} 
             className="h-12 rounded-xl border-2 px-4"
           />
        )}

        <div className="relative">
          <Input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-12 rounded-xl border-2 px-4 pr-12"
          />
           <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-3 text-muted-foreground">
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>

        <Button className="w-full h-12 rounded-full" onClick={handleSignup} disabled={isLoading}>
          {isLoading ? <Loader2 className="animate-spin" /> : "Create Account"}
        </Button>
        <button onClick={() => setStep("initial")} className="text-sm text-center w-full text-muted-foreground hover:text-primary">
          Back
        </button>
      </div>
    </>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-2xl p-6">
        {step === "initial" && renderInitialStep()}
        {step === "login" && renderLoginStep()}
        {step === "signup" && renderSignupStep()}
      </DialogContent>
    </Dialog>
  );
};

export default AuthPromptDialog;