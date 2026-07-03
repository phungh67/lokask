// SearchBar.tsx
import { useState, useMemo, useRef, useEffect } from "react";
import { Search, MapPin, Briefcase, ChevronDown, Globe } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getCities, getNiches, CityOption } from "@/lib/consultants";

export default function SearchBar() {
  const navigate = useNavigate();
  
  // New States for Country and City ID
  const [selectedCountry, setSelectedCountry] = useState("");
  const [selectedCityId, setSelectedCityId] = useState<number | null>(null);
  const [selectedNiche, setSelectedNiche] = useState("");
  
  const [isCountryOpen, setIsCountryOpen] = useState(false);
  const [isCityOpen, setIsCityOpen] = useState(false);
  const [isNicheOpen, setIsNicheOpen] = useState(false);

  const countryRef = useRef<HTMLDivElement>(null);
  const cityRef = useRef<HTMLDivElement>(null);
  const nicheRef = useRef<HTMLDivElement>(null);

  // Fetch updated cities objects
  const { data: cities } = useQuery<CityOption[]>({
    queryKey: ["cities"],
    queryFn: getCities,
  });

  const { data: niches } = useQuery<string[]>({
    queryKey: ["niches"],
    queryFn: getNiches,
  });

  const availableCountries = useMemo(() => {
    if (!cities) return [];
    const unique = new Set(cities.map(c => c.country_code));
    return Array.from(unique).sort();
  }, [cities]);

  const availableCities = useMemo(() => {
    if (!cities) return [];
    if (!selectedCountry) return cities; // Show all if no country selected
    return cities.filter(c => c.country_code === selectedCountry);
  }, [cities, selectedCountry]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (countryRef.current && !countryRef.current.contains(event.target as Node)) setIsCountryOpen(false);
      if (cityRef.current && !cityRef.current.contains(event.target as Node)) setIsCityOpen(false);
      if (nicheRef.current && !nicheRef.current.contains(event.target as Node)) setIsNicheOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (selectedCountry) params.set("country", selectedCountry);
    if (selectedCityId) params.set("city_id", selectedCityId.toString());
    if (selectedNiche) params.set("niche", selectedNiche);
    
    navigate(`/explore?${params.toString()}`);
  };

  // Helper to find city name by ID for display
  const getSelectedCityName = () => {
    const city = cities?.find(c => c.id === selectedCityId);
    return city ? city.name : "";
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-2 max-w-5xl mx-auto border border-gray-100">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
        
        {/* COUNTRY SELECTOR */}
        <div className="relative" ref={countryRef}>
          <button
            onClick={() => setIsCountryOpen(!isCountryOpen)}
            className="w-full flex items-center justify-between p-4 hover:bg-gray-50 rounded-xl transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-2 rounded-lg text-primary">
                <Globe className="w-5 h-5" />
              </div>
              <div className="text-left">
                <div className="text-sm font-semibold text-gray-900">Country</div>
                <div className="text-sm text-gray-500">
                  {selectedCountry || "Anywhere"}
                </div>
              </div>
            </div>
            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isCountryOpen ? "rotate-180" : ""}`} />
          </button>

          {isCountryOpen && availableCountries.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50 max-h-60 overflow-y-auto">
              <button
                onClick={() => {
                  setSelectedCountry("");
                  setSelectedCityId(null); // Reset city when country changes
                  setIsCountryOpen(false);
                }}
                className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm"
              >
                Anywhere
              </button>
              {availableCountries.map((country) => (
                <button
                  key={country}
                  onClick={() => {
                    setSelectedCountry(country);
                    setSelectedCityId(null); // Reset city when country changes
                    setIsCountryOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm"
                >
                  {country}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* CITY SELECTOR */}
        <div className="relative" ref={cityRef}>
          <button
            onClick={() => setIsCityOpen(!isCityOpen)}
            className="w-full flex items-center justify-between p-4 hover:bg-gray-50 rounded-xl transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-2 rounded-lg text-primary">
                <MapPin className="w-5 h-5" />
              </div>
              <div className="text-left">
                <div className="text-sm font-semibold text-gray-900">City</div>
                <div className="text-sm text-gray-500">
                  {getSelectedCityName() || "All Cities"}
                </div>
              </div>
            </div>
            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isCityOpen ? "rotate-180" : ""}`} />
          </button>

          {isCityOpen && availableCities.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50 max-h-60 overflow-y-auto">
              <button
                onClick={() => {
                  setSelectedCityId(null);
                  setIsCityOpen(false);
                }}
                className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm"
              >
                All Cities
              </button>
              {availableCities.map((city) => (
                <button
                  key={city.id}
                  onClick={() => {
                    setSelectedCityId(city.id);
                    // Optionally auto-select country if they picked a city first
                    if (!selectedCountry) setSelectedCountry(city.country_code);
                    setIsCityOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm"
                >
                  {city.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* NICHE SELECTOR */}
        <div className="relative" ref={nicheRef}>
          {/* ... Keep your existing Niche selector logic exactly the same ... */}
          <button
            onClick={() => setIsNicheOpen(!isNicheOpen)}
            className="w-full flex items-center justify-between p-4 hover:bg-gray-50 rounded-xl transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-2 rounded-lg text-primary">
                <Briefcase className="w-5 h-5" />
              </div>
              <div className="text-left">
                <div className="text-sm font-semibold text-gray-900">What</div>
                <div className="text-sm text-gray-500">
                  {selectedNiche || "Any specialty"}
                </div>
              </div>
            </div>
            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isNicheOpen ? "rotate-180" : ""}`} />
          </button>

          {isNicheOpen && niches && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50 max-h-60 overflow-y-auto">
              <button
                onClick={() => {
                  setSelectedNiche("");
                  setIsNicheOpen(false);
                }}
                className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm"
              >
                Any specialty
              </button>
              {niches.map((niche) => (
                <button
                  key={niche}
                  onClick={() => {
                    setSelectedNiche(niche);
                    setIsNicheOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm"
                >
                  {niche}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* SEARCH BUTTON */}
        <button
          onClick={handleSearch}
          className="bg-primary hover:bg-primary-dark text-white rounded-xl flex items-center justify-center gap-2 p-4 transition-all hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
        >
          <Search className="w-5 h-5" />
          <span className="font-semibold">Search Locals</span>
        </button>
      </div>
    </div>
  );
}