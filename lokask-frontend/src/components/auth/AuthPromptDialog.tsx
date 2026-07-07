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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  login,
  registerTraveller,
  registerConsultant,
  forgotPassword,
  resetPassword,
  googleLogin,
} from "@/lib/auth";
import { useGoogleLogin } from "@react-oauth/google";
import { getCities, CityOption } from "@/lib/consultants";
import { AuthStorage } from "@/lib/storage";
import { toast } from "sonner";

type AuthStep = "initial" | "login" | "signup" | "verify" | "forgot-password";

interface AuthPromptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  message?: string;
  defaultRole?: "traveller" | "consultant";
  defaultStep?: "initial" | "login" | "signup";
  onLogin?: () => void;
  onSignup?: () => void;
  onGoogleAuth?: () => void;
  onFacebookAuth?: () => void;
}

const AuthPromptDialog = ({
  open,
  onOpenChange,
  message = "Log in or sign up",
  defaultRole = "traveller",
  defaultStep = "initial",
  onLogin,
  onSignup,
}: AuthPromptDialogProps) => {
  const navigate = useNavigate();
  const [step, setStep] = useState<AuthStep>("initial");
  const [isLoading, setIsLoading] = useState(false);

  const [selectedRole, setSelectedRole] = useState<"traveller" | "consultant">(
    defaultRole || "traveller",
  );

  // Form State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [cityId, setCityId] = useState<number | "">("");
  const [showPassword, setShowPassword] = useState(false);

  const [availableCities, setAvailableCities] = useState<CityOption[]>([]);

  // Fetch cities on mount
  useEffect(() => {
    const fetchCities = async () => {
      try {
        const data = await getCities();
        setAvailableCities(data);
      } catch (error) {
        console.error("Failed to load cities", error);
      }
    };
    fetchCities();
  }, []);

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (open) {
      setStep(defaultStep);
      setEmail("");
      setPassword("");
      setFullName("");
      setCityId(""); // Reset city ID
      setIsLoading(false);
      setSelectedRole(defaultRole || "traveller");
    }
  }, [open, defaultRole, defaultStep]);

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

      AuthStorage.setToken(res.token);
      AuthStorage.setUser(res.user);

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

  const handleGoogleSuccess = async (tokenResponse: any) => {
    setIsLoading(true);
    try {
      const isSignup = step === "signup";
      const targetRole = isSignup ? selectedRole : undefined;
      const targetCity =
        isSignup && selectedRole === "consultant"
          ? (cityId as number)
          : undefined;

      const res = await googleLogin(
        tokenResponse.access_token,
        targetRole,
        targetCity,
      );

      toast.success(`Welcome, ${res.user.full_name}!`);

      AuthStorage.setToken(res.token);
      AuthStorage.setUser(res.user);

      window.dispatchEvent(new Event("auth-changed"));
      onOpenChange(false);

      if (onLogin) onLogin();

      if (res.user.role === "consultant") {
        navigate("/dashboard");
      }
    } catch (error: any) {
      toast.error(error.message || "Google authentication failed");
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGoogle = useGoogleLogin({
    onSuccess: handleGoogleSuccess,
    onError: () => toast.error("Google Login Failed"),
  });

  const handleSignup = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (selectedRole === "consultant" && !cityId) {
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
          city_id: cityId as number,
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
          We've sent a secure verification link to <strong>{email}</strong>.
          Please check your inbox and click the link to activate your account.
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
        <Button
          type="button"
          variant="outline"
          className="w-full h-12 rounded-full font-medium text-base relative border-2 hover:bg-gray-50 flex items-center justify-center gap-3"
          onClick={() => loginWithGoogle()}
          disabled={isLoading}
        >
          <img
            src="https://www.svgrepo.com/show/475656/google-color.svg"
            alt="Google"
            className="w-5 h-5"
          />
          Continue with Google
        </Button>

        <div className="relative py-4">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border/60" />
          </div>
          <div className="relative flex justify-center text-xs uppercase font-medium">
            <span className="bg-background px-4 text-muted-foreground">or</span>
          </div>
        </div>

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
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground pl-1">
            Email address
          </label>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            className="h-12 rounded-xl border-2 px-4 text-base"
            required
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between items-center pl-1 pr-1">
            <label className="text-xs font-semibold text-muted-foreground">
              Password
            </label>
            <button
              type="button"
              onClick={() => setStep("forgot-password")}
              className="text-xs font-medium text-primary hover:underline"
            >
              Forgot password?
            </button>
          </div>

          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleLogin();
                }
              }}
              className="h-12 rounded-xl border-2 px-4 pr-12 text-base"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-3 text-muted-foreground hover:text-foreground transition-colors"
            >
              {showPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        <Button
          type="submit"
          className="w-full h-12 rounded-full font-semibold text-base mt-2"
          disabled={isLoading || !password || !email}
        >
          {isLoading ? <Loader2 className="animate-spin w-5 h-5" /> : "Log in"}
        </Button>
        <button
          type="button"
          onClick={() => setStep("initial")}
          className="text-sm text-center w-full text-muted-foreground hover:text-primary mt-2 font-medium transition-colors"
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

        <Button
          type="button"
          variant="outline"
          className="w-full h-12 rounded-full font-medium text-base relative border-2 hover:bg-gray-50 flex items-center justify-center gap-3 mt-4"
          onClick={() => {
            // Safeguard: Ensure city is picked first
            if (selectedRole === "consultant" && !cityId) {
              toast.error(
                "Please select a city from the list before continuing with Google.",
              );
              return;
            }
            loginWithGoogle();
          }}
          disabled={isLoading}
        >
          <img
            src="https://www.svgrepo.com/show/475656/google-color.svg"
            alt="Google"
            className="w-5 h-5"
          />
          Sign up with Google
        </Button>

        <div className="relative py-4">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border/60" />
          </div>
          <div className="relative flex justify-center text-xs uppercase font-medium">
            <span className="bg-background px-4 text-muted-foreground">
              or sign up with email
            </span>
          </div>
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
            <Select
              value={cityId ? cityId.toString() : ""}
              onValueChange={(value) => setCityId(parseInt(value, 10))}
              required
            >
              <SelectTrigger className="h-12 rounded-xl border-2 px-4 w-full">
                <SelectValue placeholder="Which city do you want to consult?" />
              </SelectTrigger>
              <SelectContent>
                {(availableCities || [])
                  .filter((option) => option && option.id != null)
                  .map((option) => (
                    <SelectItem key={option.id} value={option.id.toString()}>
                      {option.name}, {option.country}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
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
            {showPassword ? (
              <EyeOff className="w-5 h-5" />
            ) : (
              <Eye className="w-5 h-5" />
            )}
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

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      // Import this function at the top from your auth.ts
      await forgotPassword(email);
      toast.success(
        "If an account exists, a reset link has been sent to your email.",
      );
      setStep("login");
    } catch (error: any) {
      toast.error(error.message || "Failed to process request");
    } finally {
      setIsLoading(false);
    }
  };

  const renderForgotPasswordStep = () => (
    <>
      <DialogHeader className="text-left space-y-2">
        <DialogTitle className="text-2xl font-display font-semibold">
          Reset password
        </DialogTitle>
        <DialogDescription className="text-base">
          Enter your email address and we'll send you a link to reset your
          password.
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleForgotPasswordSubmit} className="mt-4 space-y-4">
        <Input
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="h-12 rounded-xl border-2 px-4 text-base"
          required
        />
        <Button
          type="submit"
          className="w-full h-12 rounded-full font-semibold text-base"
          disabled={isLoading || !isValidEmail(email)}
        >
          {isLoading ? (
            <Loader2 className="animate-spin w-5 h-5" />
          ) : (
            "Send reset link"
          )}
        </Button>
        <button
          type="button"
          onClick={() => setStep("login")}
          className="text-sm text-center w-full text-muted-foreground hover:text-primary font-medium transition-colors"
        >
          Back to login
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
        {step === "forgot-password" && renderForgotPasswordStep()}
      </DialogContent>
    </Dialog>
  );
};

export default AuthPromptDialog;
