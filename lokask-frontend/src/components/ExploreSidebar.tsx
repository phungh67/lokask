// src/components/ExploreSidebar.tsx
import { useState } from "react";
import { FilterIcon } from "@/components/ui/filter-icon";
import { MapPin, Search, DollarSign, Globe } from "lucide-react";
import { StarIcon } from "@/components/ui/star";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";

export interface FilterState {
  location: string;
  niches: string[];
  priceRange: number[];
  minRating: number | null;
  languages: string[];
}

interface SidebarProps {
  initialFilters: FilterState;
  onApply: (filters: FilterState) => void;
  onClear: () => void;
}

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

export const ExploreSidebar = ({ initialFilters, onApply, onClear }: SidebarProps) => {
  const [localFilters, setLocalFilters] = useState<FilterState>(initialFilters);

  const labelClassName = "text-[#101828] text-[18px] font-semibold leading-[28px] tracking-[-0.439px]";
  
  // static value first
  const niches = ["Food & neighborhoods", "History & art", "Hidden gems & nightlife", "Family travel & parks", "Nature & outdoors", "Budget travel"];
  const languages = ["English", "Spanish", "French", "German", "Italian", "Portuguese"];
  const ratings = [4.5, 4.0, 3.5, 3.0];

  return (
    <div className="w-[320px] bg-white rounded-[14px] border border-[#E5E7EB] p-6 flex flex-col gap-12 font-body sticky top-[121px]">
      
      {/* Header Section */}
      <div className="flex justify-between items-center w-full">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '20px', height: '20px', position: 'relative', overflow: 'hidden' }}>
            <FilterIcon size={20} />
          </div>
          <div className="font-semibold text-[#101828]" style={{ fontSize: '18px', lineHeight: '28px' }}>
            Filters
          </div>
        </div>
        <button
          onClick={() => {
            const emptyFilters = { location: "", niches: [], priceRange: [0, 100], minRating: null, languages: [] };
            setLocalFilters(emptyFilters);
            onClear();
          }}
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
            <div key={n} className="flex items-center gap-2 cursor-pointer group" 
                 onClick={() => setLocalFilters(prev => ({ 
                   ...prev, 
                   niches: prev.niches.includes(n) ? prev.niches.filter(i => i !== n) : [...prev.niches, n] 
                 }))}>
              <CustomCheckbox active={localFilters.niches.includes(n)} onClick={() => {}} />
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
                background-color: #030213 !important; 
                height: 100% !important;
                border-radius: 33554400px !important;
              }
              [role="slider"] {
                background: #FFF !important; 
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
            <div key={r} className="flex items-center gap-2 cursor-pointer" 
                 onClick={() => setLocalFilters(prev => ({ 
                   ...prev, 
                   minRating: prev.minRating === r ? null : r 
                 }))}>
              <CustomCheckbox active={localFilters.minRating === r} onClick={() => {}} />
              <div className="flex items-center gap-1.5">
                <span className="text-[#4A5565] text-[18px] font-normal leading-[28px]">{r.toFixed(1)}</span>
                <StarIcon size={16} fill="#FDC700" color="transparent" />
                <span className="text-[#4A5565] text-[18px] font-normal leading-[28px]">& up</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Languages Section */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Globe size={16} className="text-[#C77752]" />
          <span className={labelClassName}>Languages</span>
        </div>
        <div className="flex flex-col gap-2 pr-1">
          {languages.map(l => (
            <div key={l} className="flex items-center gap-2 cursor-pointer group"
                 onClick={() => setLocalFilters(prev => ({
                   ...prev,
                   languages: prev.languages.includes(l) ? prev.languages.filter(item => item !== l) : [...prev.languages, l]
                 }))}>
              <CustomCheckbox active={localFilters.languages.includes(l)} onClick={() => {}} />
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