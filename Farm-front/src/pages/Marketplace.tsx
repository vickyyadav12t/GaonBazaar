import { useCallback, useEffect, useMemo, useState } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, X, Grid3x3, List, TrendingUp, Package, Sparkles } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import ProductCard from '@/components/product/ProductCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cropCategories } from '@/data/mockData';
import { useAppSelector } from '@/hooks/useRedux';
import { CropCategory, Product } from '@/types';
import { StaggerContainer, AnimateOnScroll } from '@/components/animations';
import { apiService } from '@/services/api';
import { resolveFarmerAvatarUrl } from '@/lib/farmerAvatarUrl';
import { sanitizeImageUrlList } from '@/lib/productImageUrl';
import { farmerRatingFromApi } from '@/lib/farmerRatingFromApi';
import { useCopilot } from '@/context/CopilotContext';
import { enHi, scriptFontClass, toNewsApiLang } from '@/lib/i18n';

const PAGE_SIZE = 30;

function marketplaceQueryParams(opts: {
  skip: number;
  includeTotal: boolean;
  search: string;
  category: CropCategory | 'all';
  minPrice: string;
  maxPrice: string;
  organicOnly: boolean;
  negotiableOnly: boolean;
  sortBy: 'newest' | 'price_low' | 'price_high' | 'rating';
  /** Filter to one farmer's public listings (Mongo ObjectId). */
  farmerShopId?: string;
}) {
  const sort =
    opts.sortBy === 'price_low'
      ? 'price_asc'
      : opts.sortBy === 'price_high'
        ? 'price_desc'
        : opts.sortBy === 'rating'
          ? 'popular'
          : 'newest';

  const params: Record<string, string | number> = {
    limit: PAGE_SIZE,
    skip: opts.skip,
    sort,
  };
  if (opts.includeTotal) params.includeTotal = 'true';
  const q = opts.search.trim();
  if (q) params.search = q;
  if (opts.category !== 'all') params.category = opts.category;
  const minN = opts.minPrice !== '' ? Number(opts.minPrice) : NaN;
  const maxN = opts.maxPrice !== '' ? Number(opts.maxPrice) : NaN;
  if (Number.isFinite(minN)) params.minPrice = minN;
  if (Number.isFinite(maxN)) params.maxPrice = maxN;
  if (opts.organicOnly) params.organic = 'true';
  if (opts.negotiableOnly) params.negotiable = 'true';
  const fid = (opts.farmerShopId || '').trim();
  if (fid && /^[a-f0-9]{24}$/i.test(fid)) {
    params.farmer = fid;
  }
  return params;
}

function mapBackendProduct(p: any): Product {
  return {
    id: p._id || p.id,
    farmerId: p.farmer?._id || p.farmer || '',
    farmerName: p.farmer?.name || 'Farmer',
    farmerAvatar: resolveFarmerAvatarUrl(p.farmer?.avatar),
    farmerRating: farmerRatingFromApi(p),
    farmerLocation: p.farmer?.location
      ? `${p.farmer.location.district}, ${p.farmer.location.state}`
      : '',
    name: p.name,
    nameHindi: p.nameHindi,
    category: p.category,
    description: p.description || '',
    images: sanitizeImageUrlList(p.images),
    price: p.price,
    unit: p.unit,
    minOrderQuantity: p.minOrderQuantity || 1,
    availableQuantity: p.availableQuantity,
    harvestDate: p.harvestDate || new Date().toISOString(),
    isOrganic: !!p.isOrganic,
    isNegotiable: !!p.isNegotiable,
    status: (p.status as Product['status']) || 'active',
    createdAt: p.createdAt || new Date().toISOString(),
    views: p.views || 0,
    inquiries: 0,
  };
}

const MARKETPLACE_CATEGORY_IDS = new Set(cropCategories.map((c) => c.id));

const Marketplace = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { currentLanguage } = useAppSelector((state) => state.language);
  const { setCopilotContext } = useCopilot();
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const selectedCategory = useMemo((): CropCategory | 'all' => {
    const c = searchParams.get('category');
    if (c && MARKETPLACE_CATEGORY_IDS.has(c)) return c as CropCategory;
    return 'all';
  }, [searchParams]);

  const farmerShopId = useMemo(() => {
    const f = searchParams.get('farmer');
    if (!f || !/^[a-f0-9]{24}$/i.test(f.trim())) return '';
    return f.trim();
  }, [searchParams]);

  const setMarketplaceCategory = useCallback(
    (cat: CropCategory | 'all') => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (cat === 'all') next.delete('category');
          else next.set('category', cat);
          return next;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );
  const [sortBy, setSortBy] = useState<'newest' | 'price_low' | 'price_high' | 'rating'>('newest');
  const [showFilters, setShowFilters] = useState(false);
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [organicOnly, setOrganicOnly] = useState(false);
  const [negotiableOnly, setNegotiableOnly] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchQuery.trim()), 400);
    return () => clearTimeout(t);
  }, [searchQuery]);

  useEffect(() => {
    setCopilotContext({ page: 'marketplace' });
    return () => setCopilotContext(null);
  }, [setCopilotContext]);

  const filterArgs = useMemo(
    () => ({
      search: debouncedSearch,
      category: selectedCategory,
      minPrice: priceRange.min,
      maxPrice: priceRange.max,
      organicOnly,
      negotiableOnly,
      sortBy,
      farmerShopId: farmerShopId || undefined,
    }),
    [
      debouncedSearch,
      selectedCategory,
      priceRange.min,
      priceRange.max,
      organicOnly,
      negotiableOnly,
      sortBy,
      farmerShopId,
    ]
  );

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isPending,
    isFetchingNextPage,
    isFetching,
    isError,
    refetch,
  } = useInfiniteQuery({
    queryKey: ['marketplace-products', filterArgs],
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      const skip = pageParam as number;
      const includeTotal = skip === 0;
      const response = await apiService.products.getAll(
        marketplaceQueryParams({
          skip,
          includeTotal,
          ...filterArgs,
        })
      );
      const backendProducts = response.data?.products || [];
      return {
        products: backendProducts.map(mapBackendProduct),
        total: response.data?.total,
        rawCount: backendProducts.length,
      };
    },
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.rawCount < PAGE_SIZE) return undefined;
      return allPages.reduce((sum, p) => sum + p.rawCount, 0);
    },
    staleTime: 60_000,
    gcTime: 5 * 60_000,
    retry: 1,
  });

  const products = useMemo(() => data?.pages.flatMap((p) => p.products) ?? [], [data]);
  const totalMatchCount = useMemo(
    () => (typeof data?.pages[0]?.total === 'number' ? data.pages[0].total : null),
    [data]
  );
  const isLoading = isPending;
  const isLoadingMore = isFetchingNextPage;
  const hasMore = !!hasNextPage;
  const loadMoreProducts = useCallback(() => {
    if (!hasNextPage || isFetchingNextPage) return;
    void fetchNextPage();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const content = {
    en: {
      title: 'Marketplace',
      subtitle: 'Discover fresh produce directly from farmers',
      search: 'Search crops, farmers, locations...',
      all: 'All Categories',
      filters: 'Filters',
      sortBy: 'Sort by',
      newest: 'Newest First',
      priceLow: 'Price: Low to High',
      priceHigh: 'Price: High to Low',
      rating: 'Top Rated',
      priceRange: 'Price Range',
      minPrice: 'Min Price',
      maxPrice: 'Max Price',
      organicOnly: 'Organic Only',
      negotiableOnly: 'Negotiable only',
      clearFilters: 'Clear All',
      applyFilters: 'Apply Filters',
      results: 'products found',
      noResults: 'No products found',
      tryDifferent: 'Try adjusting your filters or search query',
      featured: 'Featured Products',
      trending: 'Trending Now',
      totalProducts: 'Total Products',
      activeFarmers: 'Active Farmers',
      loadMore: 'Load more',
      loadingMore: 'Loading more...',
      farmerShopBanner:
        'Filtered to one farmer’s shop. Clear below to see listings from all sellers.',
      clearShopFilter: 'Show all farmers',
    },
    hi: {
      title: 'बाज़ार',
      subtitle: 'किसानों से सीधे ताज़ा उत्पाद खोजें',
      search: 'फसल, किसान, स्थान खोजें...',
      all: 'सभी श्रेणियां',
      filters: 'फ़िल्टर',
      sortBy: 'क्रमबद्ध करें',
      newest: 'नवीनतम पहले',
      priceLow: 'मूल्य: कम से अधिक',
      priceHigh: 'मूल्य: अधिक से कम',
      rating: 'शीर्ष रेटेड',
      priceRange: 'मूल्य सीमा',
      minPrice: 'न्यूनतम मूल्य',
      maxPrice: 'अधिकतम मूल्य',
      organicOnly: 'केवल जैविक',
      negotiableOnly: 'केवल बातचीत योग्य',
      clearFilters: 'सभी साफ करें',
      applyFilters: 'फ़िल्टर लागू करें',
      results: 'उत्पाद मिले',
      noResults: 'कोई उत्पाद नहीं मिला',
      tryDifferent: 'अपने फ़िल्टर या खोज को समायोजित करने का प्रयास करें',
      featured: 'विशेष उत्पाद',
      trending: 'ट्रेंडिंग अब',
      totalProducts: 'कुल उत्पाद',
      activeFarmers: 'सक्रिय किसान',
      loadMore: 'और लोड करें',
      loadingMore: 'और लोड हो रहा है...',
      farmerShopBanner:
        'एक किसान की दुकान पर फ़िल्टर लगा है। सभी विक्रेताओं की लिस्टिंग देखने के लिए नीचे साफ़ करें।',
      clearShopFilter: 'सभी किसान दिखाएं',
    },
  };

  const t = content[toNewsApiLang(currentLanguage)];

  const displayTotal = totalMatchCount ?? products.length;
  const uniqueFarmers = new Set(products.map((p) => p.farmerId)).size;
  const filtersActive =
    selectedCategory !== 'all' ||
    !!priceRange.min ||
    !!priceRange.max ||
    organicOnly ||
    negotiableOnly ||
    sortBy !== 'newest' ||
    !!debouncedSearch ||
    !!farmerShopId;

  const clearFarmerShop = useCallback(() => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete('farmer');
        return next;
      },
      { replace: true }
    );
  }, [setSearchParams]);

  return (
    <Layout>
      <div className="min-h-screen min-w-0 overflow-x-hidden bg-[#fbf7eb] text-[#213525]">
        <div className="absolute inset-0 opacity-50 [background-image:linear-gradient(rgba(49,95,59,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(49,95,59,0.06)_1px,transparent_1px)] [background-size:42px_42px]" />
        <div className="container relative z-10 mx-auto min-w-0 px-3 py-6 sm:px-4 sm:py-8">
          {/* Header Section */}
          <AnimateOnScroll animation="fade-in">
            <div className="mb-8">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                <div>
                  <h1
                    className={`mb-2 text-3xl font-extrabold text-foreground sm:text-4xl md:text-5xl ${scriptFontClass(currentLanguage)}`}
                  >
                    {t.title}
                  </h1>
                  <p className={`text-lg text-muted-foreground ${scriptFontClass(currentLanguage)}`}>
                    {t.subtitle}
                  </p>
                </div>
                {/* Stats */}
                <div className="flex w-full min-w-0 flex-wrap gap-3 sm:w-auto sm:flex-nowrap sm:gap-4">
                  <div className="min-w-0 flex-1 rounded-lg border border-[#d7c7a8] bg-[#fffaf0] p-3 shadow-sm sm:flex-none sm:p-4">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <Package className="w-4 h-4" />
                      <span className="text-xs">{t.totalProducts}</span>
                    </div>
                    <p className="text-2xl font-bold text-foreground">
                      {isLoading ? '…' : displayTotal}
                    </p>
                  </div>
                  <div className="min-w-0 flex-1 rounded-lg border border-[#d7c7a8] bg-[#fffaf0] p-3 shadow-sm sm:flex-none sm:p-4">
                    <div className="mb-1 flex items-center gap-2 text-muted-foreground">
                      <TrendingUp className="w-4 h-4" />
                      <span className="text-xs">{t.activeFarmers}</span>
                    </div>
                    <p className="text-2xl font-bold text-foreground">
                      {uniqueFarmers}
                      {hasMore ? '+' : ''}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            {farmerShopId ? (
              <div className="mb-6 flex flex-col gap-3 rounded-lg border border-[#315f3b]/30 bg-[#315f3b]/10 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <p className={`text-sm text-foreground/90 ${scriptFontClass(currentLanguage)}`}>
                  {t.farmerShopBanner}
                </p>
                <Button type="button" variant="outline" size="sm" className="shrink-0 rounded-md border-[#315f3b] text-[#315f3b] hover:bg-[#315f3b] hover:text-[#fff8e8]" onClick={clearFarmerShop}>
                  {t.clearShopFilter}
                </Button>
              </div>
            ) : null}
          </AnimateOnScroll>

          {/* Search & Filter Bar */}
          <AnimateOnScroll animation="slide-up" delay={0.1}>
            <div className="mb-6 flex min-w-0 flex-col gap-4 md:flex-row">
              <div className="relative min-w-0 flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground z-10" />
                <Input
                  type="text"
                  placeholder={t.search}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="rounded-md border-2 border-[#d7c7a8] bg-[#fffdf7] py-5 pl-12 text-base transition-colors focus:border-[#315f3b] sm:py-6 sm:text-lg"
                />
              </div>
              <div className="flex min-w-0 w-full gap-2 md:w-auto md:shrink-0">
                <Button
                  variant="outline"
                  onClick={() => setShowFilters(!showFilters)}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-md border-2 border-[#315f3b] px-4 py-5 sm:flex-none sm:px-6 sm:py-6 ${showFilters ? 'bg-[#315f3b] text-[#fff8e8]' : 'text-[#315f3b] hover:bg-[#315f3b] hover:text-[#fff8e8]'}`}
                >
                  <SlidersHorizontal className="w-5 h-5" />
                  {t.filters}
                  {(filtersActive || !!searchQuery) && (
                    <span className="h-2 w-2 rounded-full bg-[#d89b2b]" />
                  )}
                </Button>
                <div className="flex overflow-hidden rounded-md border border-[#d7c7a8] bg-[#fffaf0]">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-3 transition-colors ${viewMode === 'grid' ? 'bg-[#315f3b] text-[#fff8e8]' : 'bg-[#fffaf0] hover:bg-[#f1e5cc]'}`}
                  >
                    <Grid3x3 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-3 transition-colors ${viewMode === 'list' ? 'bg-[#315f3b] text-[#fff8e8]' : 'bg-[#fffaf0] hover:bg-[#f1e5cc]'}`}
                  >
                    <List className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </AnimateOnScroll>

          {/* Category Pills */}
          <AnimateOnScroll animation="slide-up" delay={0.2}>
            <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide mb-6">
              <button
                onClick={() => setMarketplaceCategory('all')}
                className={`flex items-center gap-2 whitespace-nowrap rounded-md px-6 py-3 font-medium transition-all duration-300 hover:-translate-y-0.5 ${
                  selectedCategory === 'all'
                    ? 'bg-[#315f3b] text-[#fff8e8] shadow-sm'
                    : 'border border-[#d7c7a8] bg-[#fffaf0] text-foreground hover:border-[#315f3b]/50 hover:bg-[#f1e5cc]'
                }`}
              >
                <Sparkles className="w-4 h-4" />
                {t.all}
              </button>
              {cropCategories.map((category, index) => (
                <button
                  key={category.id}
                  onClick={() => setMarketplaceCategory(category.id as CropCategory)}
                  className={`flex items-center gap-2 whitespace-nowrap rounded-md px-6 py-3 font-medium transition-all duration-300 hover:-translate-y-0.5 ${
                    selectedCategory === category.id
                      ? 'bg-[#315f3b] text-[#fff8e8] shadow-sm'
                      : 'border border-[#d7c7a8] bg-[#fffaf0] text-foreground hover:border-[#315f3b]/50 hover:bg-[#f1e5cc]'
                  }`}
                >
                  <span className="text-xl">{category.icon}</span>
                  <span className={scriptFontClass(currentLanguage)}>
                    {enHi(currentLanguage, category.name, category.nameHindi)}
                  </span>
                </button>
              ))}
            </div>
          </AnimateOnScroll>

          {/* Filters Panel */}
          {showFilters && (
            <AnimateOnScroll animation="slide-up">
              <div className="mb-6 rounded-lg border-2 border-[#d7c7a8] bg-[#fffaf0] p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h3 className={`text-xl font-bold flex items-center gap-2 ${scriptFontClass(currentLanguage)}`}>
                    <SlidersHorizontal className="w-5 h-5 text-[#315f3b]" />
                    {t.filters}
                  </h3>
                  <button 
                    onClick={() => setShowFilters(false)}
                    className="rounded-md p-2 transition-colors hover:bg-[#f1e5cc]"
                  >
                    <X className="w-5 h-5 text-muted-foreground" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                  {/* Sort */}
                  <div>
                    <label className={`text-sm font-semibold mb-2 block text-foreground ${scriptFontClass(currentLanguage)}`}>
                      {t.sortBy}
                    </label>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                      className="w-full rounded-md border-2 border-[#d7c7a8] bg-[#fffdf7] px-4 py-3 transition-all focus:border-[#315f3b] focus:outline-none focus:ring-2 focus:ring-[#315f3b]/30"
                    >
                      <option value="newest">{t.newest}</option>
                      <option value="price_low">{t.priceLow}</option>
                      <option value="price_high">{t.priceHigh}</option>
                      <option value="rating">{t.rating}</option>
                    </select>
                  </div>

                  {/* Price Range */}
                  <div>
                    <label className={`text-sm font-semibold mb-2 block text-foreground ${scriptFontClass(currentLanguage)}`}>
                      {t.priceRange}
                    </label>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        placeholder={t.minPrice}
                        value={priceRange.min}
                        onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
                        className="rounded-md border-2 border-[#d7c7a8] bg-[#fffdf7] focus:border-[#315f3b]"
                      />
                      <Input
                        type="number"
                        placeholder={t.maxPrice}
                        value={priceRange.max}
                        onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
                        className="rounded-md border-2 border-[#d7c7a8] bg-[#fffdf7] focus:border-[#315f3b]"
                      />
                    </div>
                  </div>

                  {/* Organic Toggle */}
                  <div className="flex items-end">
                    <label className="flex w-full cursor-pointer items-center gap-3 rounded-md border-2 border-[#d7c7a8] p-4 transition-colors hover:border-[#315f3b]/50 hover:bg-[#f1e5cc]/60">
                      <input
                        type="checkbox"
                        checked={organicOnly}
                        onChange={(e) => setOrganicOnly(e.target.checked)}
                        className="h-5 w-5 rounded border-2 border-[#315f3b] text-[#315f3b] focus:ring-[#315f3b]"
                      />
                      <span className={`text-sm font-semibold flex items-center gap-2 ${scriptFontClass(currentLanguage)}`}>
                        <span className="text-xl">🌿</span>
                        {t.organicOnly}
                      </span>
                    </label>
                  </div>

                  {/* Negotiable */}
                  <div className="flex items-end">
                    <label className="flex w-full cursor-pointer items-center gap-3 rounded-md border-2 border-[#d7c7a8] p-4 transition-colors hover:border-[#315f3b]/50 hover:bg-[#f1e5cc]/60">
                      <input
                        type="checkbox"
                        checked={negotiableOnly}
                        onChange={(e) => setNegotiableOnly(e.target.checked)}
                        className="h-5 w-5 rounded border-2 border-[#315f3b] text-[#315f3b] focus:ring-[#315f3b]"
                      />
                      <span className={`text-sm font-semibold ${scriptFontClass(currentLanguage)}`}>
                        {t.negotiableOnly}
                      </span>
                    </label>
                  </div>

                  {/* Clear Filters */}
                  <div className="flex items-end">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setMarketplaceCategory('all');
                        setSortBy('newest');
                        setPriceRange({ min: '', max: '' });
                        setOrganicOnly(false);
                        setNegotiableOnly(false);
                        setSearchQuery('');
                      }}
                      className="w-full rounded-md border-2 border-[#8a4f2a] py-3 text-[#8a4f2a] hover:border-[#8a4f2a] hover:bg-[#8a4f2a] hover:text-[#fff8e8]"
                    >
                      {t.clearFilters}
                    </Button>
                  </div>
                </div>
              </div>
            </AnimateOnScroll>
          )}

          {/* Results Count & View Toggle */}
            <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <p className={`text-lg font-semibold text-foreground ${scriptFontClass(currentLanguage)}`}>
                <span className="text-[#315f3b]">
                  {isLoading ? '…' : displayTotal}
                </span>{' '}
                {t.results}
                {!isLoading && hasMore && products.length < displayTotal && (
                  <span className="text-sm font-normal text-muted-foreground ml-2">
                    ({products.length} {enHi(currentLanguage, 'loaded', 'लोड')})
                  </span>
                )}
              </p>
              {products.length > 0 && (
                <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground">
                  <span>•</span>
                  <span>
                    {selectedCategory !== 'all' 
                      ? `${cropCategories.find(c => c.id === selectedCategory)?.name || selectedCategory}`
                      : 'All Categories'}
                  </span>
                  {(priceRange.min || priceRange.max) && (
                    <>
                      <span>•</span>
                      <span>
                        {priceRange.min && `Min: ₹${parseFloat(priceRange.min).toLocaleString()}`}
                        {priceRange.min && priceRange.max && ' - '}
                        {priceRange.max && `Max: ₹${parseFloat(priceRange.max).toLocaleString()}`}
                      </span>
                    </>
                  )}
                  {organicOnly && (
                    <>
                      <span>•</span>
                      <span>🌿 {enHi(currentLanguage, 'Organic', 'जैविक')}</span>
                    </>
                  )}
                  {negotiableOnly && (
                    <>
                      <span>•</span>
                      <span>{t.negotiableOnly}</span>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Products Grid/List */}
          {isLoading ? (
            <div className="text-center py-20">
              <p className={`text-muted-foreground ${scriptFontClass(currentLanguage)}`}>
                {enHi(currentLanguage, 'Loading products...', 'उत्पाद लोड हो रहे हैं...')}
              </p>
            </div>
          ) : isError ? (
            <div className="text-center py-16 space-y-4">
              <p className="text-muted-foreground">
                {enHi(
                  currentLanguage,
                  'Could not load products. Check your connection and try again.',
                  'उत्पाद लोड नहीं हो सके। कनेक्शन जाँचकर दोबारा कोशिश करें।',
                )}
              </p>
              <Button variant="outline" className="rounded-md border-2 border-[#315f3b] text-[#315f3b] hover:bg-[#315f3b] hover:text-[#fff8e8]" onClick={() => void refetch()}>
                {enHi(currentLanguage, 'Retry', 'फिर कोशिश करें')}
              </Button>
            </div>
          ) : products.length > 0 ? (
            <StaggerContainer
              staggerDelay={0.05}
              animation="slide-up"
              className={`${viewMode === 'grid'
                ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
                : 'flex flex-col gap-4'} ${isFetching && !isFetchingNextPage ? 'opacity-80 transition-opacity' : ''}`}
            >
              {products.map((product, idx) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  imagePriority={viewMode === 'grid' && idx < 6 ? 'high' : 'low'}
                />
              ))}
            </StaggerContainer>
          ) : (
            <AnimateOnScroll animation="zoom-in">
              <div className="text-center py-20 animate-fade-in">
                <div className="mb-6 inline-flex h-24 w-24 items-center justify-center rounded-md border border-[#d7c7a8] bg-[#f1e5cc]">
                  <Search className="w-12 h-12 text-muted-foreground" />
                </div>
                <h3 className={`text-2xl font-bold text-foreground mb-3 ${scriptFontClass(currentLanguage)}`}>
                  {t.noResults}
                </h3>
                <p className={`text-muted-foreground mb-6 max-w-md mx-auto ${scriptFontClass(currentLanguage)}`}>
                  {t.tryDifferent}
                </p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setMarketplaceCategory('all');
                    setSortBy('newest');
                    setPriceRange({ min: '', max: '' });
                    setOrganicOnly(false);
                    setNegotiableOnly(false);
                    setSearchQuery('');
                    setShowFilters(false);
                  }}
                  className="gap-2 rounded-md border-2 border-[#315f3b] text-[#315f3b] hover:bg-[#315f3b] hover:text-[#fff8e8]"
                >
                  <X className="w-4 h-4" />
                  {t.clearFilters}
                </Button>
              </div>
            </AnimateOnScroll>
          )}

          {!isLoading && hasMore && products.length > 0 && (
            <div className="flex justify-center mt-10 pb-4">
              <Button
                variant="outline"
                size="lg"
                className="min-w-[200px] rounded-md border-2 border-[#315f3b] text-[#315f3b] hover:bg-[#315f3b] hover:text-[#fff8e8]"
                onClick={loadMoreProducts}
                disabled={isLoadingMore}
              >
                {isLoadingMore ? t.loadingMore : t.loadMore}
              </Button>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Marketplace;
