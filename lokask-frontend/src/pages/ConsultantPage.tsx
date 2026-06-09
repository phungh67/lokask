import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Star,
  MessageCircle,
  Clock,
  Globe,
  Heart,
  MapPin,
  Trophy,
  Award,
  Calendar,
  CheckCircle,
  Images,
  Users,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import LocalsCarousel from "@/components/LocalsCarousel";
import { getConsultantById, getConsultants } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { useChat } from "@/context/ChatContext";
import AuthPromptDialog from "@/components/auth/AuthPromptDialog";
import { useAuthPrompt } from "@/hooks/useAuthPrompt";
import ReviewCard from "@/components/ReviewCard";

const ConsultantPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { openChat } = useChat();
  const { showPrompt, setShowPrompt, promptMessage, requireAuth } =
    useAuthPrompt();

  const [isWishlisted, setIsWishlisted] = useState(false);

  // 1. Fetch Consultant details by ID
  const { data: consultant, isLoading: isProfileLoading } = useQuery({
    queryKey: ["consultant", id],
    queryFn: () => getConsultantById(id!),
    enabled: !!id,
  });

  // 2. Fetch related consultants
  const { data: relatedResponse } = useQuery({
    queryKey: ["consultants", "related", consultant?.city],
    queryFn: () => getConsultants({ city: consultant?.city }),
    enabled: !!consultant?.city,
  });

  const relatedConsultants = Array.isArray(relatedResponse)
    ? relatedResponse
    : relatedResponse?.data || [];

  // 3. Loading & Error States
  if (isProfileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#C56A49] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!consultant) {
    return (
      <div className="container mx-auto px-6 py-20 text-center">
        <h1 className="text-2xl font-bold text-zinc-800 mb-4">
          Consultant not found
        </h1>
        <Link to="/" className="text-[#C56A49] hover:underline">
          ← Back to home
        </Link>
      </div>
    );
  }

  // 4. Gallery Logic
  const fetchedImages = consultant.galleryImages || [];
  const fallbackImg = consultant.coverUrl || "https://placehold.co/600x400";

  // Always create an array of exactly 3 slots for the UI Grid.
  // If an image exists at that index, use it. Otherwise, fill the gap with the fallback.
  const galleryDisplay = [
    fetchedImages[0] || fallbackImg,
    fetchedImages[1] || fallbackImg,
    fetchedImages[2] || fallbackImg,
  ];

  // Calculate if we need the "+X" overlay
  const remainingImagesCount = Math.max(0, fetchedImages.length - 3);

  return (
    <div className="min-h-screen bg-[#fafafa] font-sans pb-20">
      <div className="max-w-[1400px] mx-auto px-6 py-8">
        {/* Top Navigation */}
        <div className="mb-8">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-zinc-500 hover:text-zinc-800 transition-colors"
          >
            <ArrowLeft size={18} />
            <span className="text-base">Back</span>
          </Link>
        </div>

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 relative">
          {/* LEFT COLUMN: Profile Card */}
          <div className="lg:col-span-4 relative">
            <div className="bg-white rounded-[40px] shadow-[0_4px_20px_rgba(0,0,0,0.08)] border border-zinc-200 p-8 flex flex-col items-center sticky top-24">
              <h1 className="text-[28px] font-bold text-zinc-900 mb-1">
                {consultant.displayName || consultant.name}
              </h1>
              <div className="flex items-center text-zinc-500 text-sm mb-6">
                <MapPin size={14} className="mr-1" />
                {consultant.city}
              </div>

              <div className="w-full aspect-square bg-zinc-100 rounded-2xl overflow-hidden mb-6">
                <img
                  src={consultant.avatarUrl || "https://placehold.co/280x280"}
                  alt={consultant.name}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="flex items-center gap-2 border border-zinc-200 rounded-xl px-4 py-3 w-full mb-6">
                <Globe size={18} className="text-[#C56A49]" />
                <span className="text-sm font-medium text-zinc-800">
                  {consultant.languages?.join(", ") || "English, French"}
                </span>
              </div>

              <p className="text-zinc-600 text-[15px] leading-relaxed text-center mb-8 px-2">
                {consultant.bio ||
                  "I've spent years exploring every museum, gallery, and street art corner of my city. I'll help you discover art that speaks to your soul."}
              </p>

              <button
                onClick={() => {
                  const isAuthenticated = !!localStorage.getItem("token");
                  if (isAuthenticated) {
                    navigate("/dashboard", {
                      state: { intent: "startChat", targetId: consultant.id },
                    });
                  } else {
                    requireAuth(
                      () =>
                        navigate("/dashboard", {
                          state: {
                            intent: "startChat",
                            targetId: consultant.id,
                          },
                        }),
                      { actionType: "ask", consultantName: consultant.name },
                    );
                  }
                }}
                className="w-full bg-[#C56A49] hover:bg-[#A3553A] transition-colors text-white rounded-full py-4 text-base font-medium"
              >
                Ask me
              </button>
            </div>
          </div>

          {/* RIGHT COLUMN: Details & Gallery */}
          <div className="lg:col-span-8 flex flex-col pt-4">
            {/* Header Stats Row */}
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 mb-8">
              {/* Local Favorite Badge */}
              <div className="flex items-center gap-4">
                <span className="text-3xl">🏆</span>
                <div className="flex flex-col">
                  <span className="text-[#EF4343] font-bold text-lg leading-tight">
                    Local
                  </span>
                  <span className="text-[#E11D48] font-bold text-lg leading-tight">
                    Favorite
                  </span>
                </div>
                <div className="h-10 w-px bg-zinc-300 mx-2" />
                <p className="text-sm font-bold text-zinc-500 max-w-[220px] leading-snug">
                  One of the most loved locals on LokaAsk, according to
                  travelers
                </p>
              </div>

              {/* Rating & Reviews */}
              <div className="flex items-center gap-6">
                <div className="flex flex-col items-center">
                  <span className="text-2xl font-bold text-zinc-900">
                    {consultant.rating || "4.9"}
                  </span>
                  <div className="flex text-[#FBBF24]">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={14}
                        fill={i < 4 ? "currentColor" : "none"}
                        className={i === 4 ? "text-zinc-300" : ""}
                      />
                    ))}
                  </div>
                </div>
                <div className="h-10 w-px bg-zinc-300" />
                <div className="flex flex-col items-center">
                  <span className="text-2xl font-bold text-zinc-900">
                    {consultant.helpedCount || "5"}
                  </span>
                  <span className="text-sm text-zinc-500">Reviews</span>
                </div>
              </div>
            </div>

            {/* Quote & Wishlist Row */}
            <div className="flex items-center justify-between mb-6">
              <p className="text-zinc-500 italic text-[15px]">
                "{consultant.quote || "I show you art beyond the queues."}"
              </p>
              <button
                onClick={() =>
                  requireAuth(() => setIsWishlisted(!isWishlisted), {
                    actionType: "wishlist",
                    consultantName: consultant.name,
                  })
                }
                className="flex items-center gap-2 text-zinc-900 font-bold text-sm hover:opacity-70 transition-opacity"
              >
                <Heart
                  size={16}
                  className={
                    isWishlisted ? "fill-red-500 text-red-500" : "text-zinc-900"
                  }
                />
                <span className="underline">Add to wishlist</span>
              </button>
            </div>

            {/* Gallery Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 h-[300px] md:h-[400px] rounded-2xl overflow-hidden mb-12">
              <div className="md:col-span-2 relative h-full">
                <img
                  src={galleryDisplay[0]}
                  className="w-full h-full object-cover"
                  alt="Main gallery"
                />
              </div>
              <div className="hidden md:grid grid-rows-2 gap-3 h-full">
                <img
                  src={galleryDisplay[1]}
                  className="w-full h-full object-cover"
                  alt="Gallery 2"
                />
                <div className="relative w-full h-full">
                  <img
                    src={galleryDisplay[2]}
                    className="w-full h-full object-cover"
                    alt="Gallery 3"
                  />

                  {/* Only show the "+X" pill if there are actually more than 3 images */}
                  {remainingImagesCount > 0 && (
                    <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-md flex items-center gap-2">
                      <Images size={14} className="text-zinc-800" />
                      <span className="text-sm font-medium text-zinc-800">
                        {remainingImagesCount}+
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Features & Badges Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-8 mb-10">
              <div className="flex gap-4">
                <Calendar className="w-6 h-6 text-zinc-500 shrink-0" />
                <div>
                  <h4 className="font-bold text-zinc-900 mb-1">
                    3+ years on LokaAsk
                  </h4>
                  <p className="text-sm text-zinc-500">
                    Member since 2022. Experienced local guide.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <Clock className="w-6 h-6 text-zinc-500 shrink-0" />
                <div>
                  <h4 className="font-bold text-zinc-900 mb-1">
                    Quick Responder
                  </h4>
                  <p className="text-sm text-zinc-500">Usually within 1 hour</p>
                </div>
              </div>

              <div className="flex gap-4">
                <Award className="w-6 h-6 text-[#C56A49] shrink-0" />
                <div>
                  <h4 className="font-bold text-zinc-900 mb-1">
                    Certified Local Expert
                  </h4>
                  <p className="text-sm text-zinc-500">
                    Verified expertise in local history & culture
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <Trophy className="w-6 h-6 text-[#F59E0B] shrink-0" />
                <div>
                  <h4 className="font-bold text-zinc-900 mb-1">
                    Top Rated Local
                  </h4>
                  <p className="text-sm text-zinc-500">
                    Highly ranked based on ratings and reliability.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <CheckCircle className="w-6 h-6 text-green-500 shrink-0" />
                <div>
                  <h4 className="font-bold text-zinc-900 mb-1">
                    Identity verified
                  </h4>
                  <p className="text-sm text-zinc-500">
                    Personal info confirmed. You're in safe hands.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <MessageCircle className="w-6 h-6 text-zinc-500 shrink-0" />
                <div>
                  <h4 className="font-bold text-zinc-900 mb-1">Most Asked</h4>
                  <p className="text-sm text-zinc-500">
                    Helped {consultant.helpedCount || "160"}+ travelers with
                    local insights.
                  </p>
                </div>
              </div>
            </div>

            {/* Tags & Trust Footer */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-t border-zinc-200 pt-8 mt-4 gap-6">
              <div className="flex flex-wrap gap-2">
                {(consultant.tags?.length
                  ? consultant.tags
                  : ["Art", "Museums"]
                ).map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 bg-[#EBE6E0] text-zinc-700 text-xs font-medium rounded-full"
                  >
                    #{tag}
                  </span>
                ))}
              </div>

              <div className="flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-[#C56A49]" />
                <span className="text-sm text-zinc-500">Highly Trusted</span>
                <span className="text-sm text-zinc-500 border-l border-zinc-300 pl-3">
                  {consultant.helpedCount || "160"}+ travelers helped
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* AI Summary Section */}
        <div className="mt-12 max-w-[1271px] mx-auto text-left flex flex-col items-start w-full">
          <h2 className="text-4xl md:text-[45px] font-black text-[#2E2E2E] leading-tight mb-4 tracking-tight w-full">
            Seamless Travel Experiences with{" "}
            <span className="text-[#1E3A5F]">
              {consultant.displayName || consultant.name}
            </span>
          </h2>

          <div className="flex items-center gap-2 mb-6">
            <Users className="w-[14px] h-[14px] text-[#1E3A5F]" />
            <span className="text-[#65A30D] text-sm font-medium">
              AI-generated summary based on traveler reviews
            </span>
          </div>

          <p className="text-[#737373] text-[18px] leading-[29px] mb-8 max-w-[1206px]">
            Travellers consistently describe{" "}
            {consultant.displayName || consultant.name} as friendly, patient,
            and easy to talk to. Many reviews highlight her deep local
            knowledge, especially when it comes to food spots and lesser-known
            neighborhoods. Guests often mention that her recommendations feel
            practical and realistic, helping them avoid tourist traps while
            still feeling confident exploring the city on their own.
          </p>

          <button className="bg-[#E07A5F] hover:bg-[#C8664D] text-white px-5 py-2 rounded-xl text-sm font-medium transition-colors">
            Read more
          </button>
        </div>
      </div>

      {/* Reviews Grid Section */}
      {consultant.reviews && consultant.reviews.length > 0 && (
        <div className="mt-20 pt-16 border-t border-zinc-200 max-w-[1271px] mx-auto w-full">
          {/* Title */}
          <h2 className="text-[#101828] text-[24px] font-bold leading-[32px] tracking-[0.07px] mb-8">
            Highlighted reviews from travelers
          </h2>

          {/* Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {consultant.reviews.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))}
          </div>

          {/* "See more" */}
          {consultant.helpedCount > 5 && (
            <div className="mt-8 flex justify-start">
              <button className="text-[#C77752] text-[14px] font-medium leading-[20px] hover:opacity-80 transition-opacity px-4 py-2 -ml-4">
                See more reviews ({consultant.helpedCount})
              </button>
            </div>
          )}
        </div>
      )}

      {/* CTA Section (Centered per Figma) */}
      <section className="w-full bg-white border-t border-zinc-200 pt-20 pb-8 mt-16">
        <div className="w-full px-6 flex flex-col items-center justify-start gap-4 max-w-[1400px] mx-auto">
          <div className="flex flex-col items-center w-full">
            <h2 className="text-center text-[#2E2E2E] text-[24px] font-semibold leading-[32px]">
              Ready to explore {consultant.city} with{" "}
              {consultant.displayName || consultant.name}?
            </h2>
          </div>

          <div className="max-w-[448px] pb-4 flex flex-col items-center">
            <p className="text-center text-[#737373] text-[16px] leading-[24px]">
              Send a message to start planning your authentic local experience.
            </p>
          </div>

          <button
            onClick={() => {
              const isAuthenticated = !!localStorage.getItem("token");
              if (isAuthenticated) {
                navigate("/dashboard", {
                  state: { intent: "startChat", targetId: consultant.id },
                });
              } else {
                requireAuth(
                  () =>
                    navigate("/dashboard", {
                      state: { intent: "startChat", targetId: consultant.id },
                    }),
                  { actionType: "ask", consultantName: consultant.name },
                );
              }
            }}
            className="h-[44px] px-8 bg-[#C56A49] hover:bg-[#A3553A] transition-colors rounded-full flex items-center justify-center gap-2 text-white text-[14px]"
          >
            <MessageCircle size={16} />
            <span>Ask {consultant.displayName || consultant.name}</span>
          </button>
        </div>
      </section>

      {/* Related Locals Section */}
      {relatedConsultants.length > 0 && (
        <section className="pb-20 pt-8 bg-white">
          <div className="max-w-[1400px] mx-auto px-6">
            <LocalsCarousel
              title={`Other locals in ${consultant.city}`}
              consultants={relatedConsultants.filter((c: any) => c.id !== id)}
            />
          </div>
        </section>
      )}

      <AuthPromptDialog
        open={showPrompt}
        onOpenChange={setShowPrompt}
        message={promptMessage}
        onLogin={() => navigate("/login")}
        onSignup={() => navigate("/signup")}
      />
    </div>
  );
};

export default ConsultantPage;
