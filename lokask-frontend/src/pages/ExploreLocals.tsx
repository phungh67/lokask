import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import ConsultantCardCompact from "@/components/ConsultantCardCompact";
import { useQuery } from "@tanstack/react-query";
import { getConsultants } from "@/lib/api";
import { Consultant } from "@/types/consultant";
import { Loader2, SlidersHorizontal, EyeOff, Search, Sliders, MapPin, DollarSign, Globe } from "lucide-react";
import { StarIcon } from "@/components/ui/star";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { FilterIcon } from "@/components/ui/filter-icon";

// --- Sub-components for Sidebar ---

const CustomCheckbox = ({ active, onClick }: { active: boolean; onClick: () => void }) => (
  <div
    onClick={onClick}
    className="w-4 h-4 relative cursor-pointer shadow-sm rounded-[4px] border transition-colors flex items-center justify-center"
    style={{
      background: active ? '#C56A49' : '#F3F3F5',
      borderColor: active ? 'transparent' : 'rgba(0, 0, 0, 0.10)'
    }}
  >
    {active && <span className="text-[10px] text-white font-bold">✓</span>}
  </div>
);

// --- Sidebar Component ---

const ExploreSidebar = ({ onApply, onClear, initialFilters }: any) => {
  const [localFilters, setLocalFilters] = useState(initialFilters);

  const labelClassName = "text-[#101828] text-[18px] font-semibold leading-[28px] tracking-[-0.439px]";

  const niches = ["Food & neighborhoods", "History & art", "Hidden gems & nightlife", "Family travel & parks", "Nature & outdoors", "Budget travel"];
  const languages = ["English", "Spanish", "French", "German", "Italian", "Portuguese"];
  const ratings = [4.5, 4, 3.5, 3];

  return (
    <div className="w-[320px] bg-white rounded-[14px] border border-[#E5E7EB] p-6 flex flex-col gap-12 sticky top-[121px] font-body">
      {/* Header Section */}
      <div className="flex justify-between items-center w-full">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* 🟢 Replaced Sliders with FilterIcon */}
          <div style={{ width: '20px', height: '20px', position: 'relative', overflow: 'hidden' }}>
            <FilterIcon size={20} />
          </div>
          <div className="font-semibold text-[#101828]" style={{ fontSize: '18px', lineHeight: '28px' }}>
            Filters
          </div>
        </div>
        <button
          onClick={onClear}
          className="text-[#C77752] text-sm font-medium hover:underline font-display"
        >
          Clear all
        </button>
      </div>

      {/* Location Section */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <MapPin size={16} className="text-[#C77752]" />
          <span className={labelClassName}>Location</span>
        </div>
        <div className="relative h-9">
          <input
            value={localFilters.location}
            onChange={(e) => setLocalFilters({ ...localFilters, location: e.target.value })}
            placeholder="Search city or country..."
            className="w-full h-full pl-9 pr-3 bg-[#F3F3F5] rounded-lg border border-[#D1D5DC] text-sm text-[#717182] outline-none"
          />
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#99A1AF]" />
        </div>
      </div>

      {/* Expertise Section */}
      <div className="flex flex-col gap-3">
        <h3 className={labelClassName}>Expertise</h3>
        <div className="flex flex-col gap-2">
          {niches.map(n => (
            <div key={n} className="flex items-center gap-2 cursor-pointer group" onClick={() => setLocalFilters((prev: any) => ({ ...prev, niches: prev.niches.includes(n) ? prev.niches.filter((i: string) => i !== n) : [...prev.niches, n] }))}>
              <CustomCheckbox active={localFilters.niches.includes(n)} onClick={() => { }} />
              <span className="text-[#4A5565] text-[18px] font-normal leading-[28px]">{n}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Price Section */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <DollarSign size={16} className="text-[#C77752]" />
          <span className={labelClassName}>Price per hour</span>
        </div>
        <div className="mt-4 px-1">
          <div className="w-[270px] h-4 relative flex items-center">
            <Slider
              max={100}
              step={1}
              value={localFilters.priceRange}
              onValueChange={(val) => setLocalFilters({ ...localFilters, priceRange: val })}
              className="relative flex items-center select-none touch-none w-full h-full"
            />
            <style>{`
              .relative [data-orientation="horizontal"] {
                height: 16px !important;
                background-color: #F3F3F5 !important;
                border-radius: 33554400px !important;
              }
              .relative [class*="SliderRange"] {
                background-color: #030213 !important; /* Filled track */
                height: 100% !important;
                border-radius: 33554400px !important;
              }
              [role="slider"] {
                background: #FFF !important; /* White pointer */
                border: 1px solid #030213 !important;
                border-radius: 33554400px !important;
                box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.10) !important;
                width: 16px !important;
                height: 16px !important;
                top: 0px !important;
              }
            `}</style>
          </div>
          <div className="flex justify-between mt-2 text-[#4A5565] text-sm font-medium">
            <span>$0</span><span>$100</span>
          </div>
        </div>
      </div>

      {/* Minimum Rating Section */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <StarIcon size={16} />
          <span className={labelClassName}>Minimum Rating</span>
        </div>
        <div className="flex flex-col gap-2">
          {ratings.map(r => (
            <div key={r} className="flex items-center gap-2 cursor-pointer" onClick={() => setLocalFilters({ ...localFilters, minRating: r })}>
              <CustomCheckbox active={localFilters.minRating === r} onClick={() => { }} />
              <div className="flex items-center gap-1.5">
                <span className="text-[#4A5565] text-[18px] font-normal leading-[28px]">{r.toFixed(1)}</span>
                <StarIcon size={16} fill="#FDC700" color="transparent" /> {/* 🟢 Reusable yellow star */}
                <span className="text-[#4A5565] text-[18px] font-normal leading-[28px]">& up</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Languages Section */}
      <div className="flex flex-col gap-3 flex-1">
        <div className="flex items-center gap-2">
          <Globe size={16} className="text-[#C77752]" />
          <span className={labelClassName}>Languages</span>
        </div>
        <div className="max-h-40 overflow-y-auto flex flex-col gap-2 pr-1 scrollbar-hide">
          {languages.map(l => (
            <div key={l} className="flex items-center gap-2 cursor-pointer" onClick={() => setLocalFilters((prev: any) => ({ ...prev, languages: prev.languages.includes(l) ? prev.languages.filter((item: string) => item !== l) : [...prev.languages, l] }))}>
              <CustomCheckbox active={localFilters.languages.includes(l)} onClick={() => { }} />
              <span className="text-[#4A5565] text-[18px] font-normal leading-[28px]">{l}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Apply Button */}
      <Button
        onClick={() => onApply(localFilters)}
        className="w-full h-[44px] bg-[#C56A49] rounded-[10px] text-white font-bold hover:bg-[#C56A49]/90 font-display"
      >
        Apply filter
      </Button>
    </div>
  );
};

// --- Main Page Component ---

const ExploreLocals = () => {
  const [searchParams] = useSearchParams();
  const [showFilters, setShowFilters] = useState(true);
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 12;

  const [sidebarFilters, setSidebarFilters] = useState({
    location: searchParams.get("city") || "",
    niches: searchParams.get("niche") ? [searchParams.get("niche")!] : [] as string[],
    priceRange: [0, 100],
    minRating: null,
    languages: []
  });

  const { data: response, isLoading, isFetching, error } = useQuery({
    queryKey: ["consultants", "explore", sidebarFilters, page],
    queryFn: () => getConsultants({
      page,
      limit: ITEMS_PER_PAGE,
      city: sidebarFilters.location,
    }),
  });

  const consultants = response?.data || [];
  const totalCount = response?.total_count || 0;
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE) || 1;

  return (
    <div className="min-h-screen bg-[#F5F3F0] font-body">
      <div className="max-w-[1440px] mx-auto pt-[121px] px-6 pb-12">
        <div className="flex gap-8 items-start">
          {showFilters && (
            <div className="hidden lg:block animate-in fade-in slide-in-from-left duration-300">
              <ExploreSidebar
                initialFilters={sidebarFilters}
                onApply={(newFilters: any) => { setSidebarFilters(newFilters); setPage(1); }}
                onClear={() => setSidebarFilters({ location: "", niches: [], priceRange: [0, 100], minRating: null, languages: [] })}
              />
            </div>
          )}

          <div className="flex-1">
            <div className="flex justify-between items-start mb-8">
              <div className="flex-1">
                <h1 className="text-[36px] font-bold text-[#101828] leading-[40px] mb-3 font-display tracking-tight">Explore locals</h1>
                <p className="text-[18px] text-[#4A5565] leading-[28px]">Find real people who live in your destination and can give you honest, local advice.</p>
              </div>
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 h-9 bg-white"
              >
                {showFilters ? <EyeOff size={16} /> : <SlidersHorizontal size={16} />}
                {showFilters ? "Hide Filters" : "Show Filters"}
              </Button>
            </div>

            <div className="mb-6 text-sm text-[#4A5565]">
              Showing <span className="font-semibold text-[#101828]">{consultants.length}</span> of <span className="font-semibold text-[#101828]">{totalCount}</span> consultants
            </div>

            {isLoading ? (
              <div className="flex justify-center py-20"><Loader2 className="animate-spin text-[#C56A49]" /></div>
            ) : error ? (
              <div className="text-center py-20 text-red-500 font-medium">Failed to load data.</div>
            ) : (
              <>
                <div className={`grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 transition-opacity ${isFetching ? 'opacity-50' : 'opacity-100'}`}>
                  {consultants.map(c => <ConsultantCardCompact key={c.id} consultant={c} />)}
                </div>

                {/* Pagination */}
                <div className="mt-12 flex justify-center border-t border-[#DED9D3] pt-8">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() => setPage(p => Math.max(1, p - 1))}
                          className={page === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                        />
                      </PaginationItem>

                      {[...Array(totalPages)].map((_, i) => (
                        <PaginationItem key={i}>
                          <PaginationLink
                            isActive={page === i + 1}
                            onClick={() => setPage(i + 1)}
                            className="cursor-pointer"
                          >
                            {i + 1}
                          </PaginationLink>
                        </PaginationItem>
                      ))}

                      <PaginationItem>
                        <PaginationNext
                          onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                          className={page === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExploreLocals;