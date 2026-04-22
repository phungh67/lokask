import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  Star,
  Check,
  MessageCircle,
  Shield,
  Clock,
} from "lucide-react";

// Mock data
const consultant = {
  name: "Camille",
  location: "Paris",
  rating: 4.9,
  reviews: 5,
  niche: "Art & Museums",
  responseTime: "Usually within 1 hour",
  avatarUrl: "https://placehold.co/80x80",
};

const packages = [
  {
    id: "quick",
    title: "Quick Question",
    desc: "Perfect for travelers needing quick advice or recommendations",
    price: 25,
    duration: "24 hours",
    features: [
      "24-hour chat access",
      "3 questions included",
      "Local recommendations",
      "Maps & directions",
    ],
    response: "Within 1 hour",
    popular: false,
  },
  {
    id: "full",
    title: "Full Day Support",
    desc: "Ideal for exploring with real-time guidance throughout your day",
    price: 65,
    duration: "36 hours",
    features: [
      "36-hour chat access",
      "Unlimited questions",
      "Real-time recommendations",
      "Restaurant reservations help",
      "Maps & custom itinerary",
      "Photo sharing",
    ],
    response: "Within 30 minutes",
    popular: true,
  },
  {
    id: "trip",
    title: "Trip Planning",
    desc: "Complete trip planning with detailed itinerary and ongoing support",
    price: 150,
    duration: "7 days",
    features: [
      "7-day chat access",
      "Unlimited questions",
      "Custom detailed itinerary",
      "Restaurant & activity bookings",
      "Daily check-ins",
      "Maps & directions",
      "Priority support",
    ],
    response: "Within 2 hours",
    popular: false,
  },
];

const ChoosePackagePage = () => {
  const navigate = useNavigate();
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);

  const handleContinue = () => {
    if (!selectedPackage) return;
    console.log("Proceeding to checkout with package:", selectedPackage);
    // navigate('/checkout', { state: { packageId: selectedPackage } });
  };

  return (
    <div className="min-h-screen bg-[#F5F3F0] flex flex-col font-['Inter',sans-serif]">
      {/* 1. Standard Header */}
      <header className="bg-white/95 backdrop-blur-sm shadow-[0_4px_20px_rgba(0,0,0,0.06)] sticky top-0 z-50">
        <div className="max-w-[1400px] mx-auto px-11 h-16 flex items-center justify-between">
          <Link
            to="/"
            className="text-[36px] font-bold leading-[40px] text-[#2E2E2E] font-['Helvetica',sans-serif]"
          >
            Lok<span className="text-[#C56A49]">ask</span>
          </Link>
        </div>
      </header>

      {/* 2. Main Content Container */}
      <main className="flex-grow max-w-[1200px] mx-auto w-full px-6 py-12 flex flex-col gap-12">
        {/* Back Link */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-[#4A5565] hover:text-black w-fit transition-colors"
        >
          <ChevronLeft size={20} />
          <span className="text-[16px] font-normal leading-[24px]">
            Back to profile
          </span>
        </button>

        {/* 3. Consultant Info Banner */}
        <div className="bg-white border border-[#E5E7EB] rounded-[14px] p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          {/* Left Side: Avatar & Details */}
          <div className="flex items-center gap-6">
            {/* Avatar (80x80) */}
            <div className="w-20 h-20 rounded-full overflow-hidden shrink-0">
              <img
                src={consultant.avatarUrl}
                alt={consultant.name}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Info */}
            <div className="flex flex-col">
              <h1 className="text-[24px] font-bold text-[#101828] leading-[32px] tracking-[0.07px]">
                {consultant.name}
              </h1>
              <p className="text-[#4A5565] text-[16px] font-normal leading-[24px]">
                📍 {consultant.location}
              </p>

              <div className="flex items-center gap-4 mt-2">
                {/* Rating */}
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 bg-[#FDC700] rounded-[2px] flex items-center justify-center">
                    <Star
                      size={10}
                      className="fill-white text-white"
                      strokeWidth={3}
                    />
                  </div>
                  <span className="text-[16px] font-semibold text-[#101828] leading-[24px] ml-1">
                    {consultant.rating}
                  </span>
                  <span className="text-[14px] font-normal text-[#6A7282] leading-[20px] ml-0.5">
                    ({consultant.reviews} reviews)
                  </span>
                </div>

                {/* Niche Badge */}
                <div className="bg-[#FCE8E0] px-2 py-0.5 rounded-lg flex items-center justify-center">
                  <span className="text-[#C77752] text-[12px] font-medium leading-[16px]">
                    {consultant.niche}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side: Status & Response Time */}
          <div className="flex flex-col items-end gap-1.5 mt-4 md:mt-0">
            <div className="flex items-center gap-2 text-[#4A5565]">
              <Clock size={16} />
              <span className="text-[14px] font-normal leading-[20px] text-right">
                {consultant.responseTime}
              </span>
            </div>
            <div className="bg-[#DCFCE7] px-2.5 py-0.5 rounded-lg flex items-center gap-1.5">
              <div className="w-2 h-2 bg-[#00A63E] rounded-full" />
              <span className="text-[#008236] text-[12px] font-medium leading-[16px] text-right">
                Online
              </span>
            </div>
          </div>
        </div>

        {/* 4. Package Selection Area */}
        <div className="flex flex-col items-center text-center mt-4">
          <h2 className="text-[36px] font-bold text-[#101828] leading-[40px] tracking-[0.37px] mb-3">
            Choose Your Package
          </h2>
          <p className="text-[#4A5565] text-[18px] font-normal leading-[28px] max-w-2xl">
            Select the package that best fits your needs. All packages include
            direct chat with {consultant.name}.
          </p>
        </div>

        {/* 5. Packages Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
          {packages.map((pkg) => {
            const isSelected = selectedPackage === pkg.id;
            return (
              <div
                key={pkg.id}
                onClick={() => setSelectedPackage(pkg.id)}
                className={`relative bg-white rounded-[14px] flex flex-col cursor-pointer transition-all duration-200
                  ${isSelected ? "border-[2px] border-[#C77752] shadow-md scale-[1.01]" : "border-[2px] border-[#E5E7EB] hover:border-[#C77752]/50"}`}
              >
                {/* Popular Badge */}
                {pkg.popular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#C77752] text-white text-[12px] font-medium leading-[16px] px-4 py-1.5 rounded-lg z-10">
                    Most Popular
                  </div>
                )}

                <div className="p-6 flex flex-col h-full">
                  {/* Image Placeholder */}
                  <div className="w-full h-[172px] bg-gray-200 rounded-[10px] mb-6 overflow-hidden">
                    <img
                      src={`https://placehold.co/306x172`}
                      alt={pkg.title}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <h3 className="text-[24px] font-bold text-[#101828] leading-[32px] tracking-[0.07px] mb-1">
                    {pkg.title}
                  </h3>
                  <p className="text-[#4A5565] text-[14px] font-normal leading-[20px] mb-6 min-h-[40px]">
                    {pkg.desc}
                  </p>

                  <div className="border-b border-[#E5E7EB] pb-6 mb-6 flex items-end gap-2">
                    <span className="text-[#C77752] text-[36px] font-bold leading-[40px] tracking-[0.37px]">
                      ${pkg.price}
                    </span>
                    <span className="text-[#6A7282] text-[16px] font-normal leading-[24px] pb-1">
                      / {pkg.duration}
                    </span>
                  </div>

                  <ul className="flex flex-col gap-3 flex-grow mb-6">
                    {pkg.features.map((feature, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-3 text-[#364153] text-[14px] font-normal leading-[20px]"
                      >
                        <Check
                          size={16}
                          className="text-[#C77752] shrink-0 mt-0.5"
                        />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="bg-[#F5F3F0] rounded-[10px] p-3 flex items-center gap-2 text-[#4A5565] text-[14px] font-normal leading-[20px] mt-auto">
                    <Clock size={16} className="text-[#C77752]" />
                    <span>Response: {pkg.response}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* 6. Checkout Action */}
        <div className="flex justify-center mt-6">
          <button
            onClick={handleContinue}
            disabled={!selectedPackage}
            className={`px-12 py-3 rounded-full text-[18px] font-medium leading-[28px] transition-all duration-200
              ${
                selectedPackage
                  ? "bg-[#C77752] text-white hover:bg-[#b06745] shadow-lg cursor-pointer"
                  : "bg-[#D1D5DC] text-[#6A7282] opacity-50 cursor-not-allowed"
              }`}
          >
            Continue to Checkout
          </button>
        </div>

        {/* 7. Bottom Value Props */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12 max-w-4xl mx-auto w-full">
          <div className="flex flex-col items-center text-center gap-3">
            <div className="w-12 h-12 bg-[#FCE8E0] rounded-full flex items-center justify-center">
              <MessageCircle size={24} className="text-[#C77752]" />
            </div>
            <h4 className="text-[#101828] text-[16px] font-semibold leading-[24px]">
              Instant Chat Access
            </h4>
            <p className="text-[#4A5565] text-[14px] font-normal leading-[20px]">
              Start chatting immediately after payment
            </p>
          </div>
          <div className="flex flex-col items-center text-center gap-3">
            <div className="w-12 h-12 bg-[#FCE8E0] rounded-full flex items-center justify-center">
              <Shield size={24} className="text-[#C77752]" />
            </div>
            <h4 className="text-[#101828] text-[16px] font-semibold leading-[24px]">
              Local Expert
            </h4>
            <p className="text-[#4A5565] text-[14px] font-normal leading-[20px]">
              Verified locals with deep knowledge
            </p>
          </div>
          <div className="flex flex-col items-center text-center gap-3">
            <div className="w-12 h-12 bg-[#FCE8E0] rounded-full flex items-center justify-center">
              <Clock size={24} className="text-[#C77752]" />
            </div>
            <h4 className="text-[#101828] text-[16px] font-semibold leading-[24px]">
              Flexible Duration
            </h4>
            <p className="text-[#4A5565] text-[14px] font-normal leading-[20px]">
              Choose the timeframe that works for you
            </p>
          </div>
        </div>
      </main>

      {/* 8. Footer Match (From specific code snippet) */}
      <footer className="w-full bg-white border-t border-[#DED9D3] py-12 mt-12">
        <div className="max-w-[1400px] mx-auto px-6 flex flex-col gap-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex flex-col gap-2">
              <div className="text-[20px] font-bold leading-[28px] font-['Helvetica',sans-serif]">
                <span className="text-[#2E2E2E]">Lok</span>
                <span className="text-[#C56A49]">ask</span>
              </div>
              <p className="text-[#737373] text-[14px] font-normal leading-[20px] font-['Helvetica',sans-serif]">
                Ask locals first.
              </p>
            </div>
            <div className="flex items-center gap-6 text-[#737373] text-[14px] font-normal leading-[20px] font-['Helvetica',sans-serif]">
              <Link to="/privacy" className="hover:text-black">
                Privacy
              </Link>
              <Link to="/terms" className="hover:text-black">
                Terms
              </Link>
              <Link to="/contact" className="hover:text-black">
                Contact
              </Link>
            </div>
          </div>
          <div className="border-t border-[#DED9D3] pt-6 text-center">
            <p className="text-[#737373] text-[12px] font-normal leading-[16px] font-['Helvetica',sans-serif]">
              © 2026 Lokask. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ChoosePackagePage;
