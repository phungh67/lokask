import { useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import ConsultantCardCompact from "@/components/ConsultantCardCompact";
import { useQuery } from "@tanstack/react-query";
import { getConsultants } from "@/lib/consultants";
import { ExploreSidebar, FilterState } from "@/components/ExploreSidebar";
import BlogQuickViewDialog from "@/components/BlogQuickViewDialog";
import { Loader2, SlidersHorizontal, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { cn } from "@/lib/utils";

const ExploreLocals = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentCountry = searchParams.get("country") || undefined;
  const currentNiche = searchParams.get("niche") || undefined;
  const cityIdStr = searchParams.get("city_id");
  const currentCityId = cityIdStr ? parseInt(cityIdStr, 10) : undefined;

  const currentPageStr = searchParams.get("page");
  const currentPage = currentPageStr ? parseInt(currentPageStr, 10) : 1;
  const itemsPerPage = 12;

  const [showFilters, setShowFilters] = useState(true);
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 12;

  const [selectedBlog, setSelectedBlog] = useState<any | null>(null);

  const [sidebarFilters, setSidebarFilters] = useState<FilterState>({
    location: searchParams.get("city") || "",
    niches: searchParams.get("niche") ? [searchParams.get("niche")!] : [],
    priceRange: [0, 100],
    minRating: null,
    languages: [],
  });

  const {
    data: response,
    isLoading,
    isFetching,
    error,
  } = useQuery({
    queryKey: [
      "consultants",
      currentCountry,
      currentCityId,
      page,
      sidebarFilters,
    ],
    queryFn: () =>
      getConsultants({
        page: page,
        limit: ITEMS_PER_PAGE,
        country: currentCountry,
        city_id: currentCityId,
        niche: sidebarFilters.niches,
        languages: sidebarFilters.languages,
        maxPrice: sidebarFilters.priceRange[1],
        minRating: sidebarFilters.minRating || undefined,
      }),
  });

  const consultants = response?.data || [];
  const totalCount = response?.total_count || 0;
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE) || 1;

  const handleClearFilters = () => {
    setSidebarFilters({
      location: "",
      niches: [],
      priceRange: [0, 100],
      minRating: null,
      languages: [],
    });
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-[#F5F3F0] font-body">
      <div className="max-w-[1440px] mx-auto pt-[121px] px-6 pb-12">
        <div className="flex gap-8 items-start relative">
          {showFilters && (
            <div className="hidden lg:block">
              <div className="w-[320px] sticky top-[121px] self-start animate-in fade-in slide-in-from-left duration-300">
                <ExploreSidebar
                  initialFilters={sidebarFilters}
                  onApply={(newFilters) => {
                    const params = new URLSearchParams(searchParams);

                    if (newFilters.cityId) {
                      params.set("city_id", newFilters.cityId.toString());
                      params.delete("country");
                    }
                    setSearchParams(params);
                    setSidebarFilters(newFilters);
                    setPage(1);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  onClear={handleClearFilters}
                />
              </div>
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start mb-8">
              <div className="flex-1">
                <h1 className="text-[36px] font-bold text-[#101828] leading-[40px] mb-3 font-display tracking-tight">
                  Explore locals
                </h1>
                <p className="text-[18px] text-[#4A5565] leading-[28px]">
                  Find real people who live in your destination and can give you
                  honest, local advice.
                </p>
              </div>

              {/* 🟢 Explore Articles Button */}
              <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3">
                <Link to="/articles">
                  <Button className="h-9 bg-[#C56A49] hover:bg-[#A3553A] text-white transition-colors">
                    Explore Articles
                  </Button>
                </Link>

                <Button
                  variant="outline"
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2 h-9 bg-white border-[#D1D5DC] text-[#364153]"
                >
                  {showFilters ? (
                    <EyeOff size={16} />
                  ) : (
                    <SlidersHorizontal size={16} />
                  )}
                  {showFilters ? "Hide Filters" : "Show Filters"}
                </Button>
              </div>
            </div>

            <div className="mb-6 text-sm text-[#4A5565]">
              Showing{" "}
              <span className="font-semibold text-[#101828]">
                {consultants.length}
              </span>{" "}
              of{" "}
              <span className="font-semibold text-[#101828]">{totalCount}</span>{" "}
              consultants
            </div>

            {/* 🟢 BUG FIX: Replaced fragments with a stable container and key-tracked divs */}
            <div className="relative min-h-[400px]">
              {isLoading && (
                <div
                  key="loading"
                  className="absolute inset-0 flex justify-center items-start pt-20 bg-[#F5F3F0]/50 z-10"
                >
                  <Loader2 className="animate-spin text-[#C56A49] w-8 h-8" />
                </div>
              )}

              {error && !isLoading && (
                <div
                  key="error"
                  className="text-center py-20 text-red-500 font-medium"
                >
                  Failed to load data.
                </div>
              )}

              {!isLoading && !error && (
                <div
                  key="content"
                  className="w-full animate-in fade-in duration-300"
                >
                  <div
                    className={`grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 transition-opacity ${isFetching ? "opacity-50" : "opacity-100"}`}
                  >
                    {consultants.map((c: any) => (
                      <ConsultantCardCompact key={c.id} consultant={c} />
                    ))}
                  </div>

                  <div className="mt-12 flex justify-center border-t border-[#DED9D3] pt-8">
                    <Pagination>
                      <PaginationContent className="gap-2">
                        <PaginationItem>
                          <PaginationPrevious
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            className={cn(
                              "h-10 px-4 rounded-lg border border-[#D1D5DC] text-[#475467] font-medium transition-colors hover:bg-gray-50",
                              page === 1
                                ? "pointer-events-none opacity-50"
                                : "cursor-pointer",
                            )}
                          />
                        </PaginationItem>

                        {(() => {
                          const pages = [];
                          const start = Math.max(1, page - 2);
                          for (let i = start; i <= page; i++) {
                            pages.push(i);
                          }

                          return (
                            <>
                              {pages.map((p) => (
                                <PaginationItem key={p}>
                                  <PaginationLink
                                    isActive={page === p}
                                    onClick={() => setPage(p)}
                                    className={cn(
                                      "w-10 h-10 rounded-lg flex items-center justify-center font-medium transition-colors cursor-pointer",
                                      page === p
                                        ? "bg-[#F9FAFB] border border-[#D1D5DC] text-[#1D2939]"
                                        : "text-[#475467] hover:bg-gray-50",
                                    )}
                                  >
                                    {p}
                                  </PaginationLink>
                                </PaginationItem>
                              ))}

                              {page < totalPages - 1 && (
                                <PaginationItem>
                                  <PaginationEllipsis className="text-[#475467]" />
                                </PaginationItem>
                              )}

                              {page < totalPages && (
                                <PaginationItem>
                                  <PaginationLink
                                    isActive={false}
                                    onClick={() => setPage(totalPages)}
                                    className="w-10 h-10 rounded-lg flex items-center justify-center font-medium text-[#475467] hover:bg-gray-50 transition-colors cursor-pointer"
                                  >
                                    {totalPages}
                                  </PaginationLink>
                                </PaginationItem>
                              )}
                            </>
                          );
                        })()}

                        <PaginationItem>
                          <PaginationNext
                            onClick={() =>
                              setPage((p) => Math.min(totalPages, p + 1))
                            }
                            className={cn(
                              "h-10 px-4 rounded-lg border border-[#D1D5DC] text-[#475467] font-medium transition-colors hover:bg-gray-50",
                              page === totalPages
                                ? "pointer-events-none opacity-50"
                                : "cursor-pointer",
                            )}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <BlogQuickViewDialog
        blog={selectedBlog}
        open={!!selectedBlog}
        onOpenChange={(isOpen) => {
          if (!isOpen) setSelectedBlog(null);
        }}
      />
    </div>
  );
};

export default ExploreLocals;
