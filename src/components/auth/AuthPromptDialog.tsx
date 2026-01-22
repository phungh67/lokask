import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff } from "lucide-react";

type AuthStep = "initial" | "login" | "signup";

interface AuthPromptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  message: string;
  onLogin: () => void;
  onSignup: () => void;
  onGoogleAuth?: () => void;
  onAppleAuth?: () => void;
  onFacebookAuth?: () => void;
}

const AuthPromptDialog = ({
  open,
  onOpenChange,
  message,
  onLogin,
  onSignup,
  onGoogleAuth,
  onFacebookAuth,
}: AuthPromptDialogProps) => {
  const [step, setStep] = useState<AuthStep>("initial");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  // Mock function - will be replaced with actual Supabase check
  const checkEmailExists = async (email: string): Promise<boolean> => {
    // Placeholder: emails containing "existing" are treated as existing accounts
    // In production, this will call Supabase auth API
    return email.includes("existing");
  };

  const handleContinueWithEmail = async () => {
    if (!isValidEmail(email)) return;
    
    const exists = await checkEmailExists(email);
    setStep(exists ? "login" : "signup");
  };

  const handleChangeEmail = () => {
    setStep("initial");
    setPassword("");
    setFullName("");
  };

  const handleLogin = () => {
    // Will integrate with Supabase auth
    onLogin();
    handleClose();
  };

  const handleCreateAccount = () => {
    // Will integrate with Supabase auth
    onSignup();
    handleClose();
  };

  const handleClose = () => {
    onOpenChange(false);
    // Reset state after dialog closes
    setTimeout(() => {
      setStep("initial");
      setEmail("");
      setPassword("");
      setFullName("");
      setShowPassword(false);
    }, 200);
  };

  const renderInitialStep = () => (
    <>
      <DialogHeader className="text-left space-y-2">
        <DialogTitle className="text-2xl font-display font-semibold">
          Log in or sign up
        </DialogTitle>
        <DialogDescription className="text-muted-foreground text-base">
          {message}
        </DialogDescription>
      </DialogHeader>

      <div className="mt-5 space-y-4">
        {/* OAuth Buttons - Horizontal Layout */}
        <div className="flex gap-3">
          {onGoogleAuth && (
            <Button
              variant="outline"
              className="flex-1 h-12 rounded-full border-2 gap-2 font-medium hover:bg-transparent hover:text-foreground hover:border-foreground/30"
              onClick={() => {
                onGoogleAuth();
                handleClose();
              }}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              <span className="hidden sm:inline">Google</span>
            </Button>
          )}

          {onFacebookAuth && (
            <Button
              variant="outline"
              className="flex-1 h-12 rounded-full border-2 gap-2 font-medium hover:bg-transparent hover:text-foreground hover:border-foreground/30"
              onClick={() => {
                onFacebookAuth();
                handleClose();
              }}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#1877F2">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
              <span className="hidden sm:inline">Facebook</span>
            </Button>
          )}
        </div>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">or</span>
          </div>
        </div>

        {/* Email Input */}
        <div className="space-y-3">
          <Input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-12 rounded-xl border-2 px-4 text-base focus-visible:ring-primary"
            onKeyDown={(e) => {
              if (e.key === "Enter" && isValidEmail(email)) {
                handleContinueWithEmail();
              }
            }}
          />
          <Button
            className="w-full h-12 rounded-full font-medium text-base"
            disabled={!isValidEmail(email)}
            onClick={handleContinueWithEmail}
          >
            Continue with email
          </Button>
        </div>
      </div>

      {/* Terms Footer */}
      <p className="text-xs text-muted-foreground text-center mt-5 px-2">
        By proceeding, you agree to our{" "}
        <a href="/terms" className="underline hover:text-foreground">
          Terms of Use
        </a>{" "}
        and confirm you have read our{" "}
        <a href="/privacy" className="underline hover:text-foreground">
          Privacy Statement
        </a>
        .
      </p>
    </>
  );

  const renderLoginStep = () => (
    <>
      <DialogHeader className="text-left space-y-2">
        <DialogTitle className="text-2xl font-display font-semibold">
          Welcome back
        </DialogTitle>
      </DialogHeader>

      <div className="mt-4 space-y-4">
        {/* Email Display */}
        <div className="space-y-1">
          <p className="text-foreground font-medium">{email}</p>
          <button
            type="button"
            className="text-sm font-medium underline text-muted-foreground hover:text-foreground"
            onClick={handleChangeEmail}
          >
            Change
          </button>
        </div>

        {/* Password Input */}
        <div className="relative">
          <Input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-12 rounded-xl border-2 px-4 pr-12 text-base focus-visible:ring-primary"
            onKeyDown={(e) => {
              if (e.key === "Enter" && password.length >= 8) {
                handleLogin();
              }
            }}
          />
          <button
            type="button"
            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>

        {/* Forgot Password Link */}
        <div className="text-right">
          <a
            href="/forgot-password"
            className="text-sm font-medium underline text-muted-foreground hover:text-foreground"
          >
            Forgot password?
          </a>
        </div>

        {/* Login Button */}
        <Button
          className="w-full h-12 rounded-full font-medium text-base"
          disabled={password.length < 8}
          onClick={handleLogin}
        >
          Log in
        </Button>
      </div>
    </>
  );

  const renderSignupStep = () => (
    <>
      <DialogHeader className="text-left space-y-2">
        <DialogTitle className="text-2xl font-display font-semibold">
          Create an account
        </DialogTitle>
      </DialogHeader>

      <div className="mt-4 space-y-4">
        {/* Email Display */}
        <div className="space-y-1">
          <p className="text-foreground font-medium">{email}</p>
          <button
            type="button"
            className="text-sm font-medium underline text-muted-foreground hover:text-foreground"
            onClick={handleChangeEmail}
          >
            Change
          </button>
        </div>

        {/* Full Name Input */}
        <Input
          type="text"
          placeholder="Full name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="h-12 rounded-xl border-2 px-4 text-base focus-visible:ring-primary"
        />

        {/* Password Input */}
        <div className="relative">
          <Input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-12 rounded-xl border-2 px-4 pr-12 text-base focus-visible:ring-primary"
            onKeyDown={(e) => {
              if (e.key === "Enter" && password.length >= 8 && fullName.trim()) {
                handleCreateAccount();
              }
            }}
          />
          <button
            type="button"
            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>

        {/* Password Hint */}
        <p className="text-xs text-muted-foreground">
          Password must be at least 8 characters
        </p>

        {/* Create Account Button */}
        <Button
          className="w-full h-12 rounded-full font-medium text-base"
          disabled={password.length < 8 || !fullName.trim()}
          onClick={handleCreateAccount}
        >
          Create an account
        </Button>
      </div>

      {/* Terms Footer */}
      <p className="text-xs text-muted-foreground text-center mt-4 px-2">
        By proceeding, you agree to our{" "}
        <a href="/terms" className="underline hover:text-foreground">
          Terms of Use
        </a>{" "}
        and confirm you have read our{" "}
        <a href="/privacy" className="underline hover:text-foreground">
          Privacy Statement
        </a>
        .
      </p>
    </>
  );

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md rounded-2xl p-6">
        {step === "initial" && renderInitialStep()}
        {step === "login" && renderLoginStep()}
        {step === "signup" && renderSignupStep()}
      </DialogContent>
    </Dialog>
  );
};

export default AuthPromptDialog;
