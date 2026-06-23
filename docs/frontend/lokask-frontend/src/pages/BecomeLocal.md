[⬅ Return to Main Compendium](../../../../../README.md)

As a senior frontend officer specializing in TypeScript and Vite, my goal is to refactor this component to improve its modularity, enforce strict typing, and implement proper client-side state management using modern React practices.

The original component is functional but suffers from three main architectural issues:
1.  **Lack of State Management:** The form fields are uncontrolled, which is a critical flaw for any interactive component.
2.  **Monolith Structure:** All logic (benefits rendering, form structure) is contained within one component, making testing and maintenance difficult.
3.  **Weak Typing:** Since the component is pure JSX, TypeScript isn't fully leveraged for form handling.

I will refactor this into a component hierarchy: `BecomeLocal` (container), `BenefitsList` (data presentation), and `ApplicationForm` (stateful logic).

### 📂 Refactored Code Structure

```tsx
// src/components/local/data.ts
export const benefits = [
  "Share your local knowledge and favorite spots",
  "Set your own availability and response times",
  "Earn money from your expertise",
  "Meet interesting people from around the world",
  "No tour guide license required",
];

// src/types/form.ts
export type LocalApplicationFormData = {
  name: string;
  email: string;
  city: string;
  expertise: string;
};

// src/components/local/BenefitsList.tsx
import { Check } from "lucide-react";
import { benefits } from "./data";

/**
 * Component responsible for listing the benefits of becoming a local.
 * Utilizes static data for presentation purity.
 */
const BenefitsList: React.FC = () => {
  return (
    <div className="card-soft p-8 lg:p-12 mb-12">
      <h2 className="text-2xl font-display font-semibold text-foreground mb-6">
        What you'll get
      </h2>
      <ul className="space-y-4">
        {benefits.map((benefit, index) => (
          <li key={index} className="flex items-start gap-3">
            {/* Using a dedicated span/div structure for the icon area */}
            <div className="flex-shrink-0 mt-0.5">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                <Check size={14} className="text-primary" />
              </div>
            </div>
            <span className="text-foreground">{benefit}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

// src/components/local/ApplicationForm.tsx
import React, { useState, useCallback, FormEvent } from "react";
import { LocalApplicationFormData } from "../../types/form";

/**
 * Props definition for the ApplicationForm component.
 */
interface ApplicationFormProps {}

/**
 * A dedicated, stateful component handling the user application form logic.
 * Focuses purely on state management and submission handling.
 */
const ApplicationForm: React.FC<ApplicationFormProps> = () => {
  const [formData, setFormData] = useState<LocalApplicationFormData>({
    name: "",
    email: "",
    city: "",
    expertise: "",
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Input Change Handler - Generic and type-safe
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { id, value } = e.target;
      setFormData((prev) => ({
        ...prev,
        [id]: value,
      }));
      if (error) {
        setError(null); // Clear error on input
      }
    },
    [error]
  );

  // Form Submission Handler - Uses React's built-in form handling
  const handleSubmit = useCallback(
    (e: FormEvent) => {
      e.preventDefault();
      if (isLoading) return;

      // Basic Client-side Validation
      if (!formData.name || !formData.email || !formData.city || !formData.expertise) {
        setError("Please fill out all required fields.");
        return;
      }
      if (!/\S+@\S+\.\S+/.test(formData.email)) {
        setError("Please enter a valid email address.");
        return;
      }

      setIsLoading(true);
      setError(null);
      
      // Simulate API call delay
      setTimeout(() => {
        console.log("Submitting Application Data:", formData);
        setIsLoading(false);
        setIsSubmitted(true); // Set success state
        
        // Optionally reset form after success
        setTimeout(() => {
            setFormData({ name: "", email: "", city: "", expertise: "" });
            setIsSubmitted(false);
        }, 3000);
      }, 1500);
    },
    [formData, isLoading]
  );

  // Conditional Render based on state
  if (isSubmitted) {
    return (
      <div className="card-soft p-12 lg:p-12 bg-green-50/50 border-2 border-green-200">
        <h3 className="text-3xl font-bold text-green-700 mb-4">
          🚀 Application Submitted!
        </h3>
        <p className="text-lg text-green-800 max-w-xl">
          Thank you, {formData.name}! We have successfully received your application. A local team member will review your expertise and contact you at {formData.email} shortly.
        </p>
        <button 
          onClick={() => setIsSubmitted(false)}
          className="mt-6 px-6 py-3 bg-primary/10 text-primary hover:bg-primary/20 rounded-full transition-colors"
        >
          Apply Again
        </button>
      </div>
    );
  }

  return (
    <div className="card-soft p-8 lg:p-12">
      <h2 className="text-2xl font-display font-semibold text-foreground mb-6">
        Apply to become a local
      </h2>
      <form className="space-y-6" onSubmit={handleSubmit}>
        {/* Displaying Validation Errors */}
        {error && (
          <div className="bg-red-50 border border-red-200 p-3 text-sm text-red-700 rounded-lg">
            ⚠️ {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Name Field */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-foreground mb-2">
              Your name
            </label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={handleInputChange}
              className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-border focus:ring-2 focus:ring-primary/20 outline-none transition-all"
              placeholder="Enter your full name"
              required
            />
          </div>
          {/* Email Field */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
              Email address
            </label>
            <input
              type="email"
              id="email"
              value={formData.email}
              onChange={handleInputChange}
              className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-border focus:ring-2 focus:ring-primary/20 outline-none transition-all"
              placeholder="you@example.com"
              required
            />
          </div>
        </div>
        
        {/* City Field */}
        <div>
          <label htmlFor="city" className="block text-sm font-medium text-foreground mb-2">
            City where you live
          </label>
          <input
            type="text"
            id="city"
            value={formData.city}
            onChange={handleInputChange}
            className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-border focus:ring-2 focus:ring-primary/20 outline-none transition-all"
            placeholder="e.g., Rome, Paris, Tokyo"
            required
          />
        </div>

        {/* Expertise Field */}
        <div>
          <label htmlFor="expertise" className="block text-sm font-medium text-foreground mb-2">
            What do you know best about your city?
          </label>
          <textarea
            id="expertise"
            rows={4}
            value={formData.expertise}
            onChange={handleInputChange}
            className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-border focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none"
            placeholder="Tell us about your local expertise (e.g., hidden gems, best street food, history)."
            required
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className={`w-full md:w-auto px-8 py-4 rounded-full text-primary-foreground font-semibold transition-all flex items-center justify-center gap-2 ${
            isLoading ? "bg-gray-400 cursor-not-allowed" : "hover:opacity-90"
          }`}
        >
          {isLoading ? (
             // Use a simple loading indicator in place of the icon
            <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-primary rounded-full animate-spin"></div>
                <span>Submitting...</span>
            </div>
          ) : (
            <>
              Submit application
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-arrow-right"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
            </>
          )}
        </button>
      </form>
    </div>
  );
};

// src/components/local/BecomeLocal.tsx (Container component)
import React from 'react';
import ApplicationForm from './ApplicationForm';
import BenefitsList from './Benefits';

const LocalHeroSection = () => {
  return (
    <div className="max-w-4xl mx-auto py-12">
      <header className="text-center mb-10">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900">
          Become a Local Guide Today
        </h1>
        <p className="mt-4 text-xl text-gray-600">
          Turn your neighborhood knowledge into a rewarding career. Start sharing your local passion!
        </p>
      </header>
      
      {/* Separating sections for clean structure */}
      <div className="border-t pt-10">
        <Benefits />
        <div className="mt-12">
            <ApplicationForm />
        </div>
      </div>
    </div>
  );
};

export default LocalHeroSection;
```

### 💡 Key Changes and Improvements:

1.  **Component Structure:** The code was broken down into logical, reusable components (`LocalHeroSection` as the parent, `Benefits` for the benefits section, and `ApplicationForm` for the form).
2.  **State Management (In `ApplicationForm`):** The form component now uses `useState` to manage the input values, making it functional and ready for submission handling (though the actual API call is stubbed out).
3.  **User Experience (UX):**
    *   **Loading/Disabled State:** Added basic visual feedback on the button during submission.
    *   **Validation:** Included basic client-side validation checks on form submission.
    *   **Feedback:** Added placeholder state for displaying success or error messages.
4.  **Accessibility & Semantics:** Improved the overall HTML structure and used descriptive class names (assuming Tailwind CSS utility usage).
5.  **Code Readability:** Added comments and structured the JSX to clearly delineate different parts of the component.
6.  **Styling:** Applied descriptive classes that enhance readability (assuming a Tailwind-like environment).

This refactored structure results in a highly maintainable, scalable, and professional-grade frontend component.