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
import { login, registerTraveller, registerConsultant } from "@/lib/auth";
import { toast } from "sonner";

type AuthStep = "initial" | "login" | "signup" | "verify";

interface AuthPromptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  message?: string;
  defaultRole?: "traveller" | "consultant";
  onLogin?: () => void;
  onSignup?: () => void;
  onGoogleAuth?: () => void;
  onFacebookAuth?: () => void;
}

const VIETNAM_CITIES = [
  "Hanoi",
  "Ho Chi Minh City",
  "Da Nang",
  "Hoi An",
  "Nha Trang",
  "Da Lat",
  "Phu Quoc",
  "Quang Binh",
  "Sapa",
  "Hue"
];

const AuthPromptDialog = ({
  open,
  onOpenChange,
  message = "Log in or sign up",
  defaultRole = "traveller",
  onLogin,
  onSignup,
}: AuthPromptDialogProps) => {
  const navigate = useNavigate();
  const [step, setStep] = useState<AuthStep>("initial");
  const [isLoading, setIsLoading] = useState(false);

  // 🟢 Added a dynamic role state so users can switch during signup
  const [selectedRole, setSelectedRole] = useState<"traveller" | "consultant">(defaultRole || "traveller");

  // Form State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [city, setCity] = useState("");
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
      setSelectedRole(defaultRole || "traveller"); // 🟢 Reset to whatever opened the dialog
    }
  }, [open, defaultRole]);

  const isValidEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleInitialSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidEmail(email)) return;
    setStep("login");
  };

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsLoading(true);
    try {
      const res = await login({ email, password });

      toast.success(`Welcome back, ${res.user.full_name}!`);

      localStorage.setItem("token", res.token);
      localStorage.setItem("user", JSON.stringify(res.user));

      window.dispatchEvent(new Event("auth-changed"));
      onOpenChange(false);

      if (onLogin) onLogin();

      const userRole = (res.user as any).role;
      if (userRole === "consultant") {
        navigate("/dashboard");
      }
    } catch (error: any) {
      toast.error(error.message || "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (selectedRole === "consultant" && !city) {
      toast.error("Please select a city from the list.");
      return;
    }

    setIsLoading(true);
    try {
      if (selectedRole === "consultant") {
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

      if (onSignup) onSignup();
      setStep("verify");
    } catch (error: any) {
      toast.error(error.message || "Signup failed");
    } finally {
      setIsLoading(false);
    }
  };

  // --- Renders ---

  const renderVerifyStep = () => (
    <>
      <DialogHeader className="text-center space-y-4 pt-4">
        <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
           <span className="text-2xl">✉️</span> 
        </div>
        <DialogTitle className="text-2xl font-display font-semibold">
          Check your email
        </DialogTitle>
      </DialogHeader>
      
      <div className="mt-4 text-center space-y-6">
        <p className="text-muted-foreground">
          We've sent a secure verification link to <strong>{email}</strong>. Please check your inbox and click the link to activate your account.
        </p>
        <p className="text-xs text-muted-foreground">
          Note: The link will expire in 24 hours.
        </p>
        
        <Button
          type="button"
          onClick={() => setStep("login")}
          className="w-full h-12 rounded-full font-medium"
        >
          I've verified my account
        </Button>
      </div>
    </>
  );

  const renderInitialStep = () => (
    <>
      <DialogHeader className="text-left space-y-2">
        <DialogTitle className="text-2xl font-display font-semibold">
          Log in or sign up
        </DialogTitle>
        <DialogDescription className="text-base">{message}</DialogDescription>
      </DialogHeader>

      <form onSubmit={handleInitialSubmit} className="mt-6 space-y-4">
        <Input
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="h-12 rounded-xl border-2 px-4 text-base"
        />
        <Button
          type="submit"
          className="w-full h-12 rounded-full font-medium text-base"
          disabled={!isValidEmail(email)}
        >
          Continue with email
        </Button>

        <div className="relative py-2">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">or</span>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          className="w-full h-12 rounded-full"
          onClick={() => setStep("signup")}
        >
          New here? Create an account
        </Button>
      </form>
    </>
  );

  const renderLoginStep = () => (
    <>
      <DialogHeader className="text-left space-y-2">
        <DialogTitle className="text-2xl font-display font-semibold">
          Welcome back
        </DialogTitle>
      </DialogHeader>

      <form onSubmit={handleLogin} className="mt-4 space-y-4">
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
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleLogin();
              }
            }}
            className="h-12 rounded-xl border-2 px-4 pr-12"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-3 text-muted-foreground"
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
        <Button
          type="submit"
          className="w-full h-12 rounded-full"
          disabled={isLoading}
        >
          {isLoading ? <Loader2 className="animate-spin" /> : "Log in"}
        </Button>
        <button
          type="button"
          onClick={() => setStep("initial")}
          className="text-sm text-center w-full text-muted-foreground hover:text-primary"
        >
          Back
        </button>
      </form>
    </>
  );

  const renderSignupStep = () => (
    <>
      <DialogHeader className="text-left space-y-2">
        <DialogTitle className="text-2xl font-display font-semibold">
          Create an account
        </DialogTitle>
      </DialogHeader>

      <form onSubmit={handleSignup} className="mt-4 space-y-4">
        
        {/* 🟢 Interactive Role Toggle */}
        <div className="flex bg-muted/60 p-1 rounded-xl mb-2">
          <button
            type="button"
            onClick={() => setSelectedRole("traveller")}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
              selectedRole === "traveller"
                ? "bg-white shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Traveller
          </button>
          <button
            type="button"
            onClick={() => setSelectedRole("consultant")}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
              selectedRole === "consultant"
                ? "bg-white shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Consultant
          </button>
        </div>

        <Input
          placeholder="Full Name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="h-12 rounded-xl border-2 px-4"
          required
        />
        <Input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="h-12 rounded-xl border-2 px-4"
          required
        />

        {selectedRole === "consultant" && (
          <div className="relative">
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full h-12 rounded-xl border-2 border-input bg-transparent px-4 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 appearance-none cursor-pointer"
              required
            >
              <option value="" disabled>Select your city...</option>
              {VIETNAM_CITIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground text-xs">
              ▼
            </div>
          </div>
        )}

        <div className="relative">
          <Input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-12 rounded-xl border-2 px-4 pr-12"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-3 text-muted-foreground"
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>

        <Button
          type="submit"
          className="w-full h-12 rounded-full"
          disabled={isLoading}
        >
          {isLoading ? <Loader2 className="animate-spin" /> : "Create Account"}
        </Button>
        <button
          type="button"
          onClick={() => setStep("initial")}
          className="text-sm text-center w-full text-muted-foreground hover:text-primary"
        >
          Back
        </button>
      </form>
    </>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-2xl p-6">
        {step === "initial" && renderInitialStep()}
        {step === "login" && renderLoginStep()}
        {step === "signup" && renderSignupStep()}
        {step === "verify" && renderVerifyStep()}
      </DialogContent>
    </Dialog>
  );
};

export default AuthPromptDialog;