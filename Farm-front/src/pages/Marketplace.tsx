import { useEffect, useState } from 'react';
import { Search, Filter, SlidersHorizontal, X, Grid3x3, List, TrendingUp, Package, Sparkles } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import ProductCard from '@/components/product/ProductCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cropCategories } from '@/data/mockData';
import { useAppSelector } from '@/hooks/useRedux';
import { CropCategory, Product } from '@/types';
import { StaggerContainer, AnimateOnScroll } from '@/components/animations';
import { apiService } from '@/services/api';

const Marketplace = () => {
  const { currentLanguage } = useAppSelector((state) => state.language);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CropCategory | 'all'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'price_low' | 'price_high' | 'rating'>('newest');
  const [showFilters, setShowFilters] = useState(false);
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [organicOnly, setOrganicOnly] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setIsLoading(true);
        const response = await apiService.products.getAll();
        const backendProducts = response.data?.products || [];

        const mapped: Product[] = backendProducts.map((p: any) => ({
          id: p._id || p.id,
          farmerId: p.farmer?._id || p.farmer || '',
          farmerName: p.farmer?.name || 'Farmer',
          farmerAvatar: undefined,
          farmerRating: 4.8,
          farmerLocation: p.farmer?.location
            ? `${p.farmer.location.district}, ${p.farmer.location.state}`
            : '',
          name: p.name,
          nameHindi: p.nameHindi,
          category: p.category,
          description: p.description || '',
          images: p.images && p.images.length > 0
            ? p.images
            : ['https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=600'],
          price: p.price,
          unit: p.unit,
          minOrderQuantity: p.minOrderQuantity || 1,
          availableQuantity: p.availableQuantity,
          harvestDate: p.harvestDate || new Date().toISOString(),
          isOrganic: !!p.isOrganic,
          isNegotiable: !!p.isNegotiable,
          status: 'active',
          createdAt: p.createdAt || new Date().toISOString(),
          views: p.views || 0,
          inquiries: 0,
        }));

        setProducts(mapped);
      } catch (error) {
        console.error('Failed to load products', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const filteredProducts = products
    .filter((product) => {
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (product.nameHindi && product.nameHindi.includes(searchQuery));
      const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
      const matchesOrganic = !organicOnly || product.isOrganic;
      const matchesPriceMin = !priceRange.min || product.price >= parseFloat(priceRange.min);
      const matchesPriceMax = !priceRange.max || product.price <= parseFloat(priceRange.max);
      return matchesSearch && matchesCategory && matchesOrganic && matchesPriceMin && matchesPriceMax;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'price_low':
          return a.price - b.price;
        case 'price_high':
          return b.price - a.price;
        case 'rating':
          return b.farmerRating - a.farmerRating;
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

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
      clearFilters: 'Clear All',
      applyFilters: 'Apply Filters',
      results: 'products found',
      noResults: 'No products found',
      tryDifferent: 'Try adjusting your filters or search query',
      featured: 'Featured Products',
      trending: 'Trending Now',
      totalProducts: 'Total Products',
      activeFarmers: 'Active Farmers',
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
      clearFilters: 'सभी साफ करें',
      applyFilters: 'फ़िल्टर लागू करें',
      results: 'उत्पाद मिले',
      noResults: 'कोई उत्पाद नहीं मिला',
      tryDifferent: 'अपने फ़िल्टर या खोज को समायोजित करने का प्रयास करें',
      featured: 'विशेष उत्पाद',
      trending: 'ट्रेंडिंग अब',
      totalProducts: 'कुल उत्पाद',
      activeFarmers: 'सक्रिय किसान',
    },
  };

  const t = content[currentLanguage];

  const totalProducts = products.length;
  const uniqueFarmers = new Set(products.map(p => p.farmerId)).size;

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
        <div className="container mx-auto px-4 py-8">
          {/* Header Section */}
          <AnimateOnScroll animation="fade-in">
            <div className="mb-8">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                <div>
                  <h1 className={`text-4xl md:text-5xl font-extrabold text-foreground mb-2 ${currentLanguage === 'hi' ? 'font-hindi' : ''}`}>
                    {t.title}
                  </h1>
                  <p className={`text-lg text-muted-foreground ${currentLanguage === 'hi' ? 'font-hindi' : ''}`}>
                    {t.subtitle}
                  </p>
                </div>
                {/* Stats */}
                <div className="flex gap-4">
                  <div className="bg-card rounded-xl p-4 border border-border shadow-sm">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <Package className="w-4 h-4" />
                      <span className="text-xs">{t.totalProducts}</span>
                    </div>
                    <p className="text-2xl font-bold text-foreground">{totalProducts}+</p>
                  </div>
                  <div className="bg-card rounded-xl p-4 border border-border shadow-sm">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <TrendingUp className="w-4 h-4" />
                      <span className="text-xs">{t.activeFarmers}</span>
                    </div>
                    <p className="text-2xl font-bold text-foreground">{uniqueFarmers}+</p>
                  </div>
                </div>
              </div>
            </div>
          </AnimateOnScroll>

          {/* Search & Filter Bar */}
          <AnimateOnScroll animation="slide-up" delay={0.1}>
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground z-10" />
                <Input
                  type="text"
                  placeholder={t.search}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 py-6 text-lg border-2 focus:border-primary transition-colors"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowFilters(!showFilters)}
                  className={`flex items-center gap-2 py-6 px-6 ${showFilters ? 'bg-primary text-primary-foreground' : ''}`}
                >
                  <SlidersHorizontal className="w-5 h-5" />
                  {t.filters}
                  {((priceRange.min || priceRange.max) || organicOnly || sortBy !== 'newest') && (
                    <span className="w-2 h-2 bg-primary rounded-full" />
                  )}
                </Button>
                <div className="flex border border-border rounded-lg overflow-hidden">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-3 transition-colors ${viewMode === 'grid' ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-muted'}`}
                  >
                    <Grid3x3 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-3 transition-colors ${viewMode === 'list' ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-muted'}`}
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
                onClick={() => setSelectedCategory('all')}
                className={`px-6 py-3 rounded-full whitespace-nowrap transition-all duration-300 hover:scale-105 flex items-center gap-2 font-medium ${
                  selectedCategory === 'all'
                    ? 'bg-gradient-to-r from-primary to-primary-light text-primary-foreground shadow-lg scale-105'
                    : 'bg-card border border-border text-foreground hover:bg-muted hover:border-primary/50'
                }`}
              >
                <Sparkles className="w-4 h-4" />
                {t.all}
              </button>
              {cropCategories.map((category, index) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id as CropCategory)}
                  className={`px-6 py-3 rounded-full whitespace-nowrap transition-all duration-300 hover:scale-105 flex items-center gap-2 font-medium ${
                    selectedCategory === category.id
                      ? 'bg-gradient-to-r from-primary to-primary-light text-primary-foreground shadow-lg scale-105'
                      : 'bg-card border border-border text-foreground hover:bg-muted hover:border-primary/50'
                  }`}
                >
                  <span className="text-xl">{category.icon}</span>
                  <span className={currentLanguage === 'hi' ? 'font-hindi' : ''}>
                    {currentLanguage === 'hi' ? category.nameHindi : category.name}
                  </span>
                </button>
              ))}
            </div>
          </AnimateOnScroll>

          {/* Filters Panel */}
          {showFilters && (
            <AnimateOnScroll animation="slide-up">
              <div className="card-elevated p-6 mb-6 border-2 border-primary/20 bg-gradient-to-br from-card to-muted/30">
                <div className="flex items-center justify-between mb-6">
                  <h3 className={`text-xl font-bold flex items-center gap-2 ${currentLanguage === 'hi' ? 'font-hindi' : ''}`}>
                    <SlidersHorizontal className="w-5 h-5 text-primary" />
                    {t.filters}
                  </h3>
                  <button 
                    onClick={() => setShowFilters(false)}
                    className="p-2 hover:bg-muted rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-muted-foreground" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* Sort */}
                  <div>
                    <label className={`text-sm font-semibold mb-2 block text-foreground ${currentLanguage === 'hi' ? 'font-hindi' : ''}`}>
                      {t.sortBy}
                    </label>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                      className="w-full px-4 py-3 bg-background border-2 border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                    >
                      <option value="newest">{t.newest}</option>
                      <option value="price_low">{t.priceLow}</option>
                      <option value="price_high">{t.priceHigh}</option>
                      <option value="rating">{t.rating}</option>
                    </select>
                  </div>

                  {/* Price Range */}
                  <div>
                    <label className={`text-sm font-semibold mb-2 block text-foreground ${currentLanguage === 'hi' ? 'font-hindi' : ''}`}>
                      {t.priceRange}
                    </label>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        placeholder={t.minPrice}
                        value={priceRange.min}
                        onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
                        className="border-2 focus:border-primary"
                      />
                      <Input
                        type="number"
                        placeholder={t.maxPrice}
                        value={priceRange.max}
                        onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
                        className="border-2 focus:border-primary"
                      />
                    </div>
                  </div>

                  {/* Organic Toggle */}
                  <div className="flex items-end">
                    <label className="flex items-center gap-3 cursor-pointer p-4 rounded-xl border-2 border-border hover:border-primary/50 transition-colors w-full">
                      <input
                        type="checkbox"
                        checked={organicOnly}
                        onChange={(e) => setOrganicOnly(e.target.checked)}
                        className="w-5 h-5 rounded border-2 border-primary text-primary focus:ring-primary"
                      />
                      <span className={`text-sm font-semibold flex items-center gap-2 ${currentLanguage === 'hi' ? 'font-hindi' : ''}`}>
                        <span className="text-xl">🌿</span>
                        {t.organicOnly}
                      </span>
                    </label>
                  </div>

                  {/* Clear Filters */}
                  <div className="flex items-end">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSelectedCategory('all');
                        setSortBy('newest');
                        setPriceRange({ min: '', max: '' });
                        setOrganicOnly(false);
                        setSearchQuery('');
                      }}
                      className="w-full py-3 border-2 hover:bg-destructive hover:text-destructive-foreground hover:border-destructive"
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
              <p className={`text-lg font-semibold text-foreground ${currentLanguage === 'hi' ? 'font-hindi' : ''}`}>
                <span className="text-primary">
                  {isLoading ? '...' : filteredProducts.length}
                </span>{' '}
                {t.results}
              </p>
              {filteredProducts.length > 0 && (
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
                      <span>🌿 Organic Only</span>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Products Grid/List */}
          {isLoading ? (
            <div className="text-center py-20">
              <p className={`text-muted-foreground ${currentLanguage === 'hi' ? 'font-hindi' : ''}`}>
                {currentLanguage === 'en' ? 'Loading products...' : 'उत्पाद लोड हो रहे हैं...'}
              </p>
            </div>
          ) : filteredProducts.length > 0 ? (
            <StaggerContainer 
              staggerDelay={0.05} 
              animation="slide-up" 
              className={viewMode === 'grid' 
                ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                : "flex flex-col gap-4"
              }
            >
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </StaggerContainer>
          ) : (
            <AnimateOnScroll animation="zoom-in">
              <div className="text-center py-20 animate-fade-in">
                <div className="inline-flex items-center justify-center w-24 h-24 bg-muted rounded-full mb-6">
                  <Search className="w-12 h-12 text-muted-foreground" />
                </div>
                <h3 className={`text-2xl font-bold text-foreground mb-3 ${currentLanguage === 'hi' ? 'font-hindi' : ''}`}>
                  {t.noResults}
                </h3>
                <p className={`text-muted-foreground mb-6 max-w-md mx-auto ${currentLanguage === 'hi' ? 'font-hindi' : ''}`}>
                  {t.tryDifferent}
                </p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedCategory('all');
                    setSortBy('newest');
                    setPriceRange({ min: '', max: '' });
                    setOrganicOnly(false);
                    setSearchQuery('');
                    setShowFilters(false);
                  }}
                  className="gap-2"
                >
                  <X className="w-4 h-4" />
                  {t.clearFilters}
                </Button>
              </div>
            </AnimateOnScroll>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Marketplace;
