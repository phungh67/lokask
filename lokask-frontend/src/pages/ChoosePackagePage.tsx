import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ChevronDown, 
  ChevronUp, 
  ChevronLeft, 
  Star, 
  MapPin, 
  Check, 
  Globe, 
  Clock,
  MessageCircle,
  Shield
} from 'lucide-react';

// --- Data Models ---
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
    id: 'quick',
    title: 'Quick',
    price: '$16',
    duration: '24h access',
    subtitle: 'For quick questions before your trip',
    replyTime: 'First reply within 8h',
    theme: 'bg-white shadow-[0_8px_24px_rgba(0,0,0,0.08)] ring-2 ring-transparent', 
    badgeTheme: 'bg-[#C56A49]/10 text-[#C56A49]',
    gradient: 'from-[#F3F0EC] to-[#E7E0DA]',
    buttonText: 'text-[#2E2E2E]',
    responseBadge: 'Within 1 hour',
    features: [
      '24-hour chat access',
      'Quick questions & tips',
      'Local recommendations',
      'Maps & directions',
      'Restaurant suggestions'
    ]
  },
  {
    id: 'standard',
    title: 'Standard',
    price: '$40',
    duration: '3-day access',
    isPopular: true,
    subtitle: 'Get clear answers across your travel questions',
    replyTime: 'First reply within 6h',
    theme: 'bg-white shadow-[0_8px_24px_rgba(0,0,0,0.08)] ring-2 ring-[#C56A49]', 
    badgeTheme: 'bg-[#C56A49]/10 text-[#C56A49]',
    gradient: 'from-[#C56A49] to-[#A75335]',
    buttonText: 'text-white',
    responseBadge: 'Within 30 minutes',
    features: [
      '72-hour chat access',
      'Unlimited questions',
      'Real-time recommendations',
      'Daily itinerary suggestions',
      'Restaurant & activity tips',
      'Photo sharing'
    ]
  },
  {
    id: 'extended',
    title: 'Extended',
    price: '$89',
    duration: '7-day access',
    subtitle: 'More time to plan and adjust your trip',
    replyTime: 'Flexible replies over a week',
    theme: 'bg-white shadow-[0_8px_24px_rgba(0,0,0,0.08)] ring-2 ring-transparent', 
    badgeTheme: 'bg-[#C56A49]/10 text-[#C56A49]',
    gradient: 'from-[#2E2E2E] to-[#474747]',
    buttonText: 'text-white',
    responseBadge: 'Within 30 minutes',
    features: [
      'Full week chat access',
      'Unlimited questions',
      'Daily personalized tips',
      'Custom recommendations',
      'Booking assistance',
      'Maps & directions',
      'Priority support',
      'Best value'
    ]
  }
];

const tripPlanFeatures = [
  'Detailed custom itinerary',
  'Day-by-day schedule',
  'Pre-trip consultation',
  'Restaurant reservations help',
  'Activity bookings support',
  'Neighborhood guides',
  'Insider tips document'
];

export default function ChoosePackagePage() {
  const navigate = useNavigate();
  const [expandedPackage, setExpandedPackage] = useState<string | null>('standard'); 
  const [isTripPlanExpanded, setIsTripPlanExpanded] = useState(false);

  const togglePackage = (id: string) => {
    setExpandedPackage(expandedPackage === id ? null : id);
  };

  const handleContinue = () => {
    if (!expandedPackage) return;
    console.log("Proceeding to checkout with package:", expandedPackage);
  };

  return (
    <div className="relative w-full min-h-screen bg-[#F5F3F0] font-sans pb-28">
      
      {/* --- Header / Navigation --- */}
      <header className="sticky top-0 w-full z-50 bg-[#F3F0EC]/95 backdrop-blur-md shadow-[0_4px_20px_rgba(0,0,0,0.06)]">
        {/* 🟢 UNIFIED CONTAINER: max-w-[1200px] mx-auto w-full */}
        <div className="max-w-[1200px] mx-auto w-full px-6 md:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="text-[36px] font-bold leading-[40px] text-[#2E2E2E] font-['Helvetica',sans-serif]">
            Lok<span className="text-[#C56A49]">ask</span>
          </Link>
          <div className="flex items-center gap-6">
            <button className="hidden sm:flex flex-col items-center text-gray-700 hover:text-black">
               <Star size={20} />
               <span className="text-xs mt-1">Wishlist</span>
            </button>
            <button className="hidden sm:flex flex-col items-center text-gray-700 hover:text-black">
               <Globe size={20} />
               <span className="text-xs mt-1">EN</span>
            </button>
            <div className="flex items-center gap-3 ml-0 sm:ml-4">
              <button className="px-5 py-2 rounded-full border border-gray-300 text-sm font-medium hover:bg-gray-50">Log in</button>
              <button className="px-5 py-2 rounded-full border border-gray-300 text-sm font-medium hover:bg-gray-50 hidden md:block">Sign up</button>
            </div>
          </div>
        </div>
      </header>

      {/* --- Main Content --- */}
      {/* 🟢 UNIFIED CONTAINER: max-w-[1200px] mx-auto w-full */}
      <main className="max-w-[1200px] mx-auto w-full pt-12 px-6 md:px-8 flex flex-col gap-8 items-center">
        
        <div className="w-full flex flex-col gap-8">
          {/* Back Button */}
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-[#4A5565] hover:text-black transition-colors w-fit"
          >
            <ChevronLeft size={20} />
            <span className="text-[16px] font-normal leading-[24px]">Back to profile</span>
          </button>

          {/* Consultant Summary Card */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-sm w-full">
            <div className="flex items-center gap-6">
              <img src={consultant.avatarUrl} alt={consultant.name} className="w-20 h-20 rounded-full object-cover shrink-0" />
              <div className="flex-1">
                <h1 className="text-[24px] font-bold text-gray-900">{consultant.name}</h1>
                <p className="text-[#4A5565] text-[16px] flex items-center gap-1 mt-1"><MapPin size={16}/> {consultant.location}</p>
                <div className="flex items-center gap-4 mt-3">
                  <div className="flex items-center gap-1">
                    <div className="w-4 h-4 bg-[#FDC700] rounded-[2px] flex items-center justify-center">
                      <Star size={10} className="text-white fill-white" strokeWidth={3} />
                    </div>
                    <span className="font-semibold text-gray-900 text-[16px] ml-1">{consultant.rating}</span>
                    <span className="text-gray-500 text-[14px]">({consultant.reviews} reviews)</span>
                  </div>
                  <span className="px-3 py-1 bg-[#FCE8E0] text-[#C77752] text-xs font-medium rounded-lg">{consultant.niche}</span>
                </div>
              </div>
            </div>
            <div className="text-left md:text-right flex flex-col items-start md:items-end gap-1.5 mt-4 md:mt-0">
              <div className="flex items-center gap-2 text-[#4A5565]">
                <Clock size={16} />
                <span className="text-[14px]">{consultant.responseTime}</span>
              </div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-green-100 text-[#008236] text-[12px] font-medium rounded-lg">
                <span className="w-2 h-2 rounded-full bg-[#00A63E]"></span> Online
              </span>
            </div>
          </div>

          {/* Section Header */}
          <div className="flex justify-between items-end mt-4">
            <div>
              <h2 className="text-[30px] md:text-[36px] font-bold text-[#2E2E2E] leading-[36px] md:leading-[40px] font-['Helvetica',sans-serif]">Choose your experience</h2>
              <p className="text-[#737373] text-[14px] md:text-[16px] mt-2 font-['Helvetica',sans-serif]">Pick the option that fits your travel style</p>
            </div>
          </div>

          {/* --- Interactive Packages Section --- */}
          <div className="flex flex-col gap-6 w-full">
            
            {/* The Packages Accordion */}
            {/* 🟢 GRID SCALES FLEXIBLY: Automatically divides the 1200px space perfectly into thirds */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start w-full">
              {packages.map((pkg) => {
                const isExpanded = expandedPackage === pkg.id;
                
                return (
                  <div 
                    key={pkg.id} 
                    className={`flex flex-col rounded-[16px] overflow-hidden transition-all duration-300 cursor-pointer w-full ${pkg.theme} hover:-translate-y-1`}
                    onClick={() => togglePackage(pkg.id)}
                  >
                    {/* Top Content */}
                    <div className="p-6 pb-4">
                      <div className="flex items-center gap-2 mb-4 flex-wrap">
                        <span className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap ${pkg.badgeTheme}`}>
                          {pkg.duration}
                        </span>
                        {pkg.isPopular && (
                          <span className="px-3 py-1.5 bg-[#2E2E2E] text-[#F3F0EC] text-xs font-medium rounded-full whitespace-nowrap">
                            Most popular
                          </span>
                        )}
                      </div>
                      <div className="text-[36px] font-bold text-[#2E2E2E] leading-[40px] mb-2">{pkg.price}</div>
                      <h3 className="text-[20px] font-bold text-[#2E2E2E] leading-[28px] mb-2">{pkg.title}</h3>
                      <p className="text-[14px] text-[#737373] leading-[22.75px] mb-4 min-h-[44px]">{pkg.subtitle}</p>
                      <p className="text-[12px] text-[#737373] font-medium flex items-center gap-1.5">
                         <Clock size={14} className="text-[#737373] shrink-0" />
                         {pkg.replyTime}
                      </p>
                    </div>

                    {/* The Fold-Out Section */}
                    <div className={`grid transition-all duration-300 ease-in-out ${isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                      <div className="overflow-hidden">
                        <div className="px-6 pb-6 pt-4 border-t border-[#DED9D3] space-y-3">
                          {pkg.features.map((feature, idx) => (
                            <div key={idx} className="flex items-start gap-2.5">
                              <div className="w-3.5 h-3.5 mt-0.5 rounded-sm bg-transparent border-2 border-[#C56A49] flex items-center justify-center shrink-0">
                                <div className="w-1.5 h-1.5 bg-[#C56A49] rounded-[1px]" />
                              </div>
                              <span className="text-[14px] text-[#2E2E2E] leading-[20px]">{feature}</span>
                            </div>
                          ))}
                          
                          <div className="mt-5 bg-[#EBE6E0] rounded-xl px-3 py-2 flex items-center gap-2">
                             <Clock size={14} className="text-[#737373] shrink-0" />
                             <span className="text-[12px] font-medium text-[#737373]">Response: {pkg.responseBadge}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Action Bar */}
                    <div className={`p-5 flex justify-between items-center bg-gradient-to-br ${pkg.gradient}`}>
                      <span className={`font-medium text-[14px] ${pkg.buttonText}`}>
                        {isExpanded ? 'Start planning' : 'Start chat'}
                      </span>
                      <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center transition-transform duration-300 shrink-0">
                        {isExpanded ? <ChevronUp className={pkg.buttonText} /> : <ChevronDown className={pkg.buttonText} />}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* The Trip Plan Add-On Accordion */}
            <div className="bg-white rounded-[16px] shadow-[0_4px_20px_rgba(0,0,0,0.06)] overflow-hidden w-full">
              <div 
                className="p-5 flex justify-between items-center cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => setIsTripPlanExpanded(!isTripPlanExpanded)}
              >
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-[#C56A49] flex items-center justify-center shrink-0">
                    <span className="text-white font-bold text-lg">+</span>
                  </div>
                  <div className="flex flex-col justify-center">
                    <h3 className="text-[14px] font-bold text-[#2E2E2E] leading-[20px]">Add a Trip Plan (+$39)</h3>
                    <p className="text-[12px] text-[#737373] mt-0.5">Add comprehensive trip planning to any companion package</p>
                  </div>
                </div>
                <div className="w-8 h-8 rounded-full border border-[#DED9D3] flex items-center justify-center text-gray-500 shrink-0 ml-4">
                  {isTripPlanExpanded ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
                </div>
              </div>

              {/* Fold-Out Features for Add-on */}
              <div className={`grid transition-all duration-300 ease-in-out ${isTripPlanExpanded ? 'grid-rows-[1fr] border-t border-[#DED9D3]' : 'grid-rows-[0fr]'}`}>
                <div className="overflow-hidden">
                  <div className="p-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-8">
                    {tripPlanFeatures.map((feature, idx) => (
                      <div key={idx} className="flex items-center gap-3">
                        <div className="w-3.5 h-3.5 rounded-sm border-2 border-[#C56A49] flex items-center justify-center shrink-0">
                           <div className="w-1.5 h-1.5 bg-[#C56A49] rounded-[1px]" />
                        </div>
                        <span className="text-[14px] text-[#2E2E2E] leading-[20px]">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Disclaimer Box */}
            <div className="bg-[#EBE6E0]/50 p-6 rounded-[16px] mt-4 w-full">
              <p className="text-[14px] text-[#737373] leading-[22.75px]">
                <span className="font-bold text-[#2E2E2E]">How does it work?</span> You're not paying for unlimited chat. You're paying for access to a local's knowledge within a time window. They reply thoughtfully to help you plan better — think of it as having a knowledgeable friend in the city.
              </p>
            </div>

            {/* --- BOTTOM VALUE PROPS --- */}
            {/* 🟢 Automatically spaces itself nicely inside the 1200px wrapper */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8 w-full border-t border-[#DED9D3] pt-12 pb-4">
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

          </div>
        </div>
      </main>

      {/* --- FOOTER MATCH --- */}
      <footer className="w-full bg-white border-t border-[#DED9D3] py-12 relative z-10">
        {/* 🟢 UNIFIED CONTAINER: max-w-[1200px] mx-auto w-full */}
        <div className="max-w-[1200px] mx-auto w-full px-6 md:px-8 flex flex-col gap-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 md:gap-4">
            <div className="flex flex-col gap-2">
              <div className="text-[20px] font-bold leading-[28px] font-['Helvetica',sans-serif]">
                <span className="text-[#2E2E2E]">Lok</span>
                <span className="text-[#C56A49]">ask</span>
              </div>
              <p className="text-[#737373] text-[14px] font-normal leading-[20px] font-['Helvetica',sans-serif]">
                Ask locals first.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-6 text-[#737373] text-[14px] font-normal leading-[20px] font-['Helvetica',sans-serif]">
              <Link to="/privacy" className="hover:text-black transition-colors">
                Privacy
              </Link>
              <Link to="/terms" className="hover:text-black transition-colors">
                Terms
              </Link>
              <Link to="/contact" className="hover:text-black transition-colors">
                Contact
              </Link>
            </div>
          </div>
          <div className="border-t border-[#DED9D3] pt-6 text-left md:text-center">
            <p className="text-[#737373] text-[12px] font-normal leading-[16px] font-['Helvetica',sans-serif]">
              © 2026 Lokask. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      {/* --- Sticky Bottom Checkout Bar --- */}
      <div className="fixed bottom-0 w-full bg-white border-t border-gray-200 p-4 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-40 flex justify-center">
        <button 
          onClick={handleContinue}
          disabled={!expandedPackage}
          className={`w-full max-w-[274px] py-3 transition-colors rounded-full font-medium text-lg shadow-lg ${
            expandedPackage 
              ? "bg-[#C77752] hover:bg-[#b06745] text-white" 
              : "bg-[#D1D5DC] text-[#6A7282] cursor-not-allowed"
          }`}
        >
          Continue to Checkout
        </button>
      </div>

    </div>
  );
}