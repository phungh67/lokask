import { useState, useMemo, useRef, useEffect } from "react";
import { Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getCities, getNiches, CityOption } from "@/lib/consultants";

interface SearchBarProps {
  onSearch: (filters: { where: string; who: string }) => void;
}

export default function SearchBar({ onSearch }: SearchBarProps) {
  const navigate = useNavigate();

  const [selectedCountry, setSelectedCountry] = useState<string>("");
  const [selectedCityId, setSelectedCityId] = useState<number | null>(null);
  const [selectedWhen, setSelectedWhen] = useState<string>("");
  const [selectedWho, setSelectedWho] = useState<string>("");

  const [activeDropdown, setActiveDropdown] = useState<
    "country" | "city" | "when" | "who" | null
  >(null);
  const barRef = useRef<HTMLDivElement>(null);

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
    return Array.from(new Set(cities.map((c) => c.country))).sort();
  }, [cities]);

  const availableCities = useMemo(() => {
    if (!cities) return [];
    if (selectedCountry)
      return cities.filter((c) => c.country === selectedCountry);
    return cities;
  }, [cities, selectedCountry]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (barRef.current && !barRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 6. Navigation / Search Trigger
  const handleSearch = (e: React.MouseEvent) => {
    e.stopPropagation();

    const params = new URLSearchParams();

    if (selectedCountry) params.set("country", selectedCountry);
    if (selectedCityId) params.set("city_id", selectedCityId.toString());
    if (selectedWho) params.set("niche", selectedWho);

    setActiveDropdown(null);
    navigate(`/consultants?${params.toString()}`);
  };

  const getCityName = () => {
    const city = cities?.find((c) => c.id === selectedCityId);
    return city ? city.name : "Add city";
  };

  return (
    <div className="relative w-full" ref={barRef}>
      <div className="flex items-center bg-white rounded-full shadow-md border border-gray-200 h-16 hover:shadow-lg transition-shadow">
        <div
          onClick={() =>
            setActiveDropdown(activeDropdown === "country" ? null : "country")
          }
          className={`flex-[1.2] flex flex-col justify-center px-6 h-full rounded-full cursor-pointer transition-colors ${activeDropdown === "country" ? "bg-white shadow-lg" : "hover:bg-gray-100"}`}
        >
          <span className="text-xs font-extrabold text-gray-800">Country</span>
          <span
            className={`text-sm truncate ${selectedCountry ? "text-gray-900 font-medium" : "text-gray-500"}`}
          >
            {selectedCountry || "Anywhere"}
          </span>
        </div>

        <div className="h-8 w-[1px] bg-gray-200" />

        <div
          onClick={() =>
            setActiveDropdown(activeDropdown === "city" ? null : "city")
          }
          className={`flex-[1.2] flex flex-col justify-center px-6 h-full rounded-full cursor-pointer transition-colors ${activeDropdown === "city" ? "bg-white shadow-lg" : "hover:bg-gray-100"}`}
        >
          <span className="text-xs font-extrabold text-gray-800">City</span>
          <span
            className={`text-sm truncate ${selectedCityId ? "text-gray-900 font-medium" : "text-gray-500"}`}
          >
            {getCityName()}
          </span>
        </div>

        <div className="h-8 w-[1px] bg-gray-200" />

        <div
          onClick={() =>
            setActiveDropdown(activeDropdown === "when" ? null : "when")
          }
          className={`flex-1 flex flex-col justify-center px-6 h-full rounded-full cursor-pointer transition-colors ${activeDropdown === "when" ? "bg-white shadow-lg" : "hover:bg-gray-100"}`}
        >
          <span className="text-xs font-extrabold text-gray-800">When</span>
          <span
            className={`text-sm truncate ${selectedWhen ? "text-gray-900 font-medium" : "text-gray-500"}`}
          >
            {selectedWhen || "Any week"}
          </span>
        </div>

        <div className="h-8 w-[1px] bg-gray-200" />

        <div
          onClick={() =>
            setActiveDropdown(activeDropdown === "who" ? null : "who")
          }
          className={`flex-[1.5] flex items-center justify-between pl-6 pr-2 h-full rounded-full cursor-pointer transition-colors ${activeDropdown === "who" ? "bg-white shadow-lg" : "hover:bg-gray-100"}`}
        >
          <div className="flex flex-col justify-center overflow-hidden mr-2">
            <span className="text-xs font-extrabold text-gray-800">Who</span>
            <span
              className={`text-sm truncate ${selectedWho ? "text-gray-900 font-medium" : "text-gray-500"}`}
            >
              {selectedWho || "Any specialty"}
            </span>
          </div>
          <button
            onClick={handleSearch}
            className="h-12 w-12 bg-primary rounded-full flex items-center justify-center text-white hover:bg-primary/90 hover:scale-105 active:scale-95 transition-all shrink-0"
          >
            <Search className="w-5 h-5 stroke-[2.5px]" />
          </button>
        </div>
      </div>

      {/* Country Dropdown */}
      {activeDropdown === "country" && (
        <div className="absolute top-20 left-0 w-[300px] bg-white rounded-3xl shadow-[0_8px_28px_rgba(0,0,0,0.1)] border border-gray-100 p-4 z-50">
          <div className="text-xs font-bold text-gray-500 mb-2 px-2 uppercase tracking-wider">
            Select Region
          </div>
          <button
            onClick={() => {
              setSelectedCountry("");
              setSelectedCityId(null);
              setActiveDropdown("city");
            }}
            className="w-full text-left px-4 py-3 hover:bg-gray-50 rounded-xl text-sm font-medium transition-colors"
          >
            Anywhere
          </button>
          {availableCountries.map((country) => (
            <button
              key={country}
              onClick={() => {
                setSelectedCountry(country);
                setSelectedCityId(null);
                setActiveDropdown("city");
              }}
              className="w-full text-left px-4 py-3 hover:bg-gray-50 rounded-xl text-sm font-medium transition-colors"
            >
              {country}
            </button>
          ))}
        </div>
      )}

      {activeDropdown === "city" && (
        <div className="absolute top-20 left-[20%] w-[300px] bg-white rounded-3xl shadow-[0_8px_28px_rgba(0,0,0,0.1)] border border-gray-100 p-4 z-50 max-h-[400px] overflow-y-auto">
          <div className="text-xs font-bold text-gray-500 mb-2 px-2 uppercase tracking-wider">
            Select City
          </div>
          <button
            onClick={() => {
              setSelectedCityId(null);
              setActiveDropdown("who");
            }}
            className="w-full text-left px-4 py-3 hover:bg-gray-50 rounded-xl text-sm font-medium transition-colors"
          >
            All Cities
          </button>
          {availableCities.map((city) => (
            <button
              key={city.id}
              onClick={() => {
                setSelectedCityId(city.id);
                if (!selectedCountry) setSelectedCountry(city.country);
                setActiveDropdown("who");
              }}
              className="w-full text-left px-4 py-3 hover:bg-gray-50 rounded-xl text-sm font-medium transition-colors"
            >
              {city.name}{" "}
              <span className="text-gray-400 text-xs ml-1">
                ({city.country})
              </span>
            </button>
          ))}
        </div>
      )}

      {activeDropdown === "who" && (
        <div className="absolute top-20 right-0 w-[300px] bg-white rounded-3xl shadow-[0_8px_28px_rgba(0,0,0,0.1)] border border-gray-100 p-4 z-50 max-h-[400px] overflow-y-auto">
          <div className="text-xs font-bold text-gray-500 mb-2 px-2 uppercase tracking-wider">
            Specialty
          </div>
          <button
            onClick={() => {
              setSelectedWho("");
              setActiveDropdown(null);
            }}
            className="w-full text-left px-4 py-3 hover:bg-gray-50 rounded-xl text-sm font-medium transition-colors"
          >
            Anyone
          </button>
          {niches?.map((niche) => (
            <button
              key={niche}
              onClick={() => {
                setSelectedWho(niche);
                setActiveDropdown(null);
              }}
              className="w-full text-left px-4 py-3 hover:bg-gray-50 rounded-xl text-sm font-medium transition-colors"
            >
              {niche}
            </button>
          ))}
        </div>
      )}

      {activeDropdown === "when" && (
        <div className="absolute top-20 left-[50%] w-[300px] bg-white rounded-3xl shadow-[0_8px_28px_rgba(0,0,0,0.1)] border border-gray-100 p-6 z-50 text-center">
          <p className="text-sm text-gray-500">
            Date picker integration coming soon!
          </p>
        </div>
      )}
    </div>
  );
}
