import { Link } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  Users,
  Shield,
  MessageCircle,
  TrendingUp,
  Star,
  CheckCircle,
  Leaf,
  Truck,
  Sparkles,
  Award,
  Zap,
  Heart,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Layout from '@/components/layout/Layout';
import { useAppSelector } from '@/hooks/useRedux';
import ProductCard from '@/components/product/ProductCard';
import { AnimateOnScroll, StaggerContainer } from '@/components/animations';
import { apiService } from '@/services/api';
import { resolveFarmerAvatarUrl } from '@/lib/farmerAvatarUrl';
import { farmerRatingFromApi } from '@/lib/farmerRatingFromApi';
import { sanitizeImageUrlList } from '@/lib/productImageUrl';
import type { Product } from '@/types';
import {
  formatLandingInteger,
  getLandingStatsMode,
  type PublicLandingStats,
} from '@/lib/landingStats';

const Landing = () => {
  const { currentLanguage } = useAppSelector((state) => state.language);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const statsMode = getLandingStatsMode();
  const [liveStats, setLiveStats] = useState<PublicLandingStats | null>(null);
  const [liveStatsLoading, setLiveStatsLoading] = useState(() => statsMode === 'live');

  useEffect(() => {
    if (statsMode !== 'live') return;
    let cancelled = false;
    setLiveStatsLoading(true);
    (async () => {
      try {
        const { data } = await apiService.public.getLandingStats();
        if (!cancelled && data) setLiveStats(data);
      } catch {
        if (!cancelled) setLiveStats(null);
      } finally {
        if (!cancelled) setLiveStatsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [statsMode]);

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

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await apiService.products.getAll({ limit: 3, skip: 0, sort: 'newest' });
        const backend: any[] = res.data?.products || [];
        const mapped = backend.map(mapBackendProduct);
        if (!cancelled) setFeaturedProducts(mapped);
      } catch {
        if (!cancelled) setFeaturedProducts([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const content = {
    en: {
      hero: {
        trustBadgeSoft: 'Building a direct farm-to-buyer network',
        title: 'GaonBazaar',
        subtitle: 'No middlemen, only fair deals',
        description:
          'Connect directly with buyers. Eliminate middlemen. Get fair prices for your hard work.',
        cta1: 'Join as Farmer',
        cta2: 'Join as Buyer',
        quickFarmers: 'Farmers',
        quickBuyers: 'Buyers',
        quickTx: 'Delivered orders',
        quickListings: 'Active listings',
        marketingHeroStrip: ['Direct from farms', 'Fair negotiation', 'Secure payments'],
      },
      features: {
        title: 'Why Choose Us?',
        items: [
          { icon: Users, title: 'No Middlemen', desc: 'Sell directly to buyers and keep more profit' },
          { icon: MessageCircle, title: 'Live Negotiation', desc: 'Chat and negotiate prices in real-time' },
          { icon: Shield, title: 'Secure Payments', desc: 'Safe transactions with multiple payment options' },
          { icon: TrendingUp, title: 'Fair Prices', desc: 'Get market rates without commission cuts' },
        ],
      },
      stats: {
        farmers: 'Farmers registered',
        buyers: 'Buyers',
        transactions: 'Delivered orders',
        listings: 'Active listings',
        marketingCards: [
          {
            emoji: '👨‍🌾',
            title: 'Sell direct',
            sub: 'List produce and reach buyers yourself',
          },
          { emoji: '🛒', title: 'Meet buyers', sub: 'Connect with people who need your crop' },
          { emoji: '🤝', title: 'Fair negotiation', sub: 'Chat to agree on a price that works' },
          { emoji: '💰', title: 'Keep your margin', sub: 'More of each sale stays with you' },
        ],
      },
      howItWorks: {
        title: 'How It Works',
        steps: [
          { icon: Leaf, title: 'List Your Produce', desc: 'Add photos, set prices, and describe your crops' },
          { icon: MessageCircle, title: 'Connect & Negotiate', desc: 'Chat with interested buyers and agree on prices' },
          { icon: Truck, title: 'Deliver & Get Paid', desc: 'Complete the sale and receive secure payment' },
        ],
      },
      testimonials: {
        title: 'How direct trade helps',
        attribution: 'Farmer',
        role: 'Community voice',
      },
      cta: {
        title: 'Ready to Grow Your Business?',
        desc: 'List your produce or source directly—free to get started.',
        button: 'Get Started Free',
        browse: 'Browse Marketplace',
        zapLine: 'Fair prices, secure payments, real conversations',
        trustSecure: 'Secure Payments',
        trustVerified: 'Verified Farmers',
        trustSupport: '24/7 Support',
      },
    },
    hi: {
      hero: {
        trustBadgeSoft: 'किसान से खरीदार तक सीधा जाल बन रहा है',
        title: 'GaonBazaar',
        subtitle: 'बिना बिचौलिये, केवल उचित सौदे',
        description: 'खरीदारों से सीधे जुड़ें। बिचौलियों को हटाएं। अपनी मेहनत का उचित दाम पाएं।',
        cta1: 'किसान बनें',
        cta2: 'खरीदार बनें',
        quickFarmers: 'किसान',
        quickBuyers: 'खरीदार',
        quickTx: 'डिलीवर ऑर्डर',
        quickListings: 'सक्रिय सूचियाँ',
        marketingHeroStrip: ['सीधे खेत से', 'उचित बातचीत', 'सुरक्षित भुगतान'],
      },
      features: {
        title: 'हमें क्यों चुनें?',
        items: [
          { icon: Users, title: 'कोई बिचौलिया नहीं', desc: 'सीधे खरीदारों को बेचें और अधिक मुनाफा कमाएं' },
          { icon: MessageCircle, title: 'लाइव बातचीत', desc: 'रियल-टाइम में चैट करें और कीमत तय करें' },
          { icon: Shield, title: 'सुरक्षित भुगतान', desc: 'कई भुगतान विकल्पों के साथ सुरक्षित लेनदेन' },
          { icon: TrendingUp, title: 'उचित मूल्य', desc: 'बिना कमीशन के बाजार दर प्राप्त करें' },
        ],
      },
      stats: {
        farmers: 'पंजीकृत किसान',
        buyers: 'खरीदार',
        transactions: 'डिलीवर ऑर्डर',
        listings: 'सक्रिय सूचियाँ',
        marketingCards: [
          {
            emoji: '👨‍🌾',
            title: 'सीधे बेचें',
            sub: 'उपज सूचीबद्ध करें और खरीदारों तक पहुँचें',
          },
          { emoji: '🛒', title: 'खरीदार', sub: 'जिन्हें आपकी फसल चाहिए उनसे जुड़ें' },
          { emoji: '🤝', title: 'उचित बातचीत', sub: 'चैट से मूल्य पर सहमति' },
          { emoji: '💰', title: 'मुनाफा आपका', sub: 'हर बिक्री का ज़्यादा हिस्सा आपके पास' },
        ],
      },
      howItWorks: {
        title: 'यह कैसे काम करता है',
        steps: [
          { icon: Leaf, title: 'अपनी उपज सूचीबद्ध करें', desc: 'फोटो जोड़ें, कीमत तय करें, और अपनी फसल का वर्णन करें' },
          { icon: MessageCircle, title: 'जुड़ें और बातचीत करें', desc: 'इच्छुक खरीदारों से चैट करें और कीमत पर सहमत हों' },
          { icon: Truck, title: 'डिलीवर करें और भुगतान पाएं', desc: 'बिक्री पूरी करें और सुरक्षित भुगतान प्राप्त करें' },
        ],
      },
      testimonials: {
        title: 'सीधी बिक्री कैसे मदद करती है',
        attribution: 'किसान',
        role: 'सामुदायिक आवाज़',
      },
      cta: {
        title: 'अपना व्यापार बढ़ाने के लिए तैयार?',
        desc: 'उपज सूचीबद्ध करें या सीधे खरीदें—शुरुआत मुफ्त।',
        button: 'मुफ्त शुरू करें',
        browse: 'बाज़ार देखें',
        zapLine: 'उचित दाम, सुरक्षित भुगतान, सच्ची बातचीत',
        trustSecure: 'सुरक्षित भुगतान',
        trustVerified: 'सत्यापित किसान',
        trustSupport: '२४/७ सहायता',
      },
    },
  };

  const t = content[currentLanguage];

  const trustBadgeText =
    statsMode === 'live' && liveStats
      ? currentLanguage === 'en'
        ? `${formatLandingInteger(liveStats.farmerCount)} farmers · ${formatLandingInteger(liveStats.buyerCount)} buyers on GaonBazaar`
        : `GaonBazaar पर ${formatLandingInteger(liveStats.farmerCount)} किसान · ${formatLandingInteger(liveStats.buyerCount)} खरीदार`
      : t.hero.trustBadgeSoft;

  const heroStrip =
    statsMode === 'live' && liveStats
      ? [
          {
            value: formatLandingInteger(liveStats.farmerCount),
            label: t.hero.quickFarmers,
          },
          {
            value: formatLandingInteger(liveStats.buyerCount),
            label: t.hero.quickBuyers,
          },
          {
            value: formatLandingInteger(liveStats.deliveredDeals),
            label: t.hero.quickTx,
          },
        ]
      : t.hero.marketingHeroStrip.map((line) => ({ value: '', label: line, marketing: true as const }));

  const statCards = useMemo(() => {
    const tr = content[currentLanguage];
    if (statsMode === 'live' && liveStats) {
      return [
        {
          kind: 'live' as const,
          value: formatLandingInteger(liveStats.farmerCount),
          label: tr.stats.farmers,
          emoji: '👨‍🌾',
          color: 'from-primary/10 to-primary/5',
          iconColor: 'text-primary',
        },
        {
          kind: 'live' as const,
          value: formatLandingInteger(liveStats.buyerCount),
          label: tr.stats.buyers,
          emoji: '🛒',
          color: 'from-secondary/10 to-secondary/5',
          iconColor: 'text-secondary',
        },
        {
          kind: 'live' as const,
          value: formatLandingInteger(liveStats.deliveredDeals),
          label: tr.stats.transactions,
          emoji: '🤝',
          color: 'from-accent/10 to-accent/5',
          iconColor: 'text-accent',
        },
        {
          kind: 'live' as const,
          value: formatLandingInteger(liveStats.activeListings),
          label: tr.stats.listings,
          emoji: '📋',
          color: 'from-success/10 to-success/5',
          iconColor: 'text-success',
        },
      ];
    }
    return tr.stats.marketingCards.map((c, index) => {
      const colors = [
        { color: 'from-primary/10 to-primary/5', iconColor: 'text-primary' },
        { color: 'from-secondary/10 to-secondary/5', iconColor: 'text-secondary' },
        { color: 'from-accent/10 to-accent/5', iconColor: 'text-accent' },
        { color: 'from-success/10 to-success/5', iconColor: 'text-success' },
      ];
      const pal = colors[index % colors.length];
      return {
        kind: 'marketing' as const,
        headline: c.title,
        sub: c.sub,
        emoji: c.emoji,
        ...pal,
      };
    });
  }, [statsMode, liveStats, currentLanguage]);

  const testimonials = useMemo(() => {
    const base = `${import.meta.env.BASE_URL}assets/testimonials`;
    return [
      {
        region: currentLanguage === 'en' ? 'North India' : 'उत्तर भारत',
        image: `${base}/testimonial-north.png`,
        quote:
          currentLanguage === 'en'
            ? 'Selling directly helped me keep more of what I earn. Chat made pricing clearer for both sides.'
            : 'सीधे बेचने से मेहनत का ज़्यादा हिस्सा मेरे पास रहा। चैट से कीमत दोनों के लिए साफ़ हुई।',
        rating: 5,
      },
      {
        region: currentLanguage === 'en' ? 'Western India' : 'पश्चिम भारत',
        image: `${base}/testimonial-west.png`,
        quote:
          currentLanguage === 'en'
            ? 'Negotiating in the app was easier than repeated phone calls with multiple traders.'
            : 'ऐप में बातचीत कई व्यापारियों को बार-बार फोन करने से आसान रही।',
        rating: 5,
      },
      {
        region: currentLanguage === 'en' ? 'Southern India' : 'दक्षिण भारत',
        image: `${base}/testimonial-south.png`,
        quote:
          currentLanguage === 'en'
            ? 'Having buyers and payment steps in one place reduced confusion at harvest time.'
            : 'खरीदार और भुगतान एक जगह होने से फसल के समय भ्रम कम हुआ।',
        rating: 5,
      },
    ];
  }, [currentLanguage]);

  return (
    <Layout showMobileNav={false}>
      {/* Hero — green gradient (original theme) */}
      <section className="relative flex min-h-[90vh] min-w-0 items-center overflow-x-hidden bg-gradient-to-br from-primary via-primary/90 to-primary-dark text-primary-foreground">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.08%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-40" />

        <div
          className="absolute left-10 top-20 h-20 w-20 animate-pulse-slow rounded-full bg-secondary/20 blur-xl"
          style={{ animationDelay: '0s' }}
        />
        <div
          className="absolute right-20 top-40 h-32 w-32 animate-pulse-slow rounded-full bg-accent/20 blur-2xl"
          style={{ animationDelay: '1s' }}
        />
        <div
          className="absolute bottom-20 left-1/4 h-24 w-24 animate-pulse-slow rounded-full bg-secondary-light/20 blur-xl"
          style={{ animationDelay: '2s' }}
        />

        <div className="container relative z-10 mx-auto min-w-0 px-3 py-16 sm:px-4 sm:py-20 md:py-32">
          <div className="mx-auto max-w-4xl min-w-0 text-center">
            <AnimateOnScroll animation="fade-in" delay={0}>
              <div className="mb-6 inline-flex max-w-full items-center gap-2 rounded-full border border-white/20 bg-white/15 px-3 py-2 shadow-lg backdrop-blur-md transition-all duration-300 hover:bg-white/20 sm:mb-8 sm:px-5 sm:py-2.5">
                <Sparkles className="h-4 w-4 shrink-0 text-secondary-light" />
                <span className="text-left text-xs font-semibold leading-snug sm:text-sm">{trustBadgeText}</span>
                <Award className="h-4 w-4 shrink-0 text-secondary-light" />
              </div>
            </AnimateOnScroll>

            <AnimateOnScroll animation="slide-up" delay={0.1}>
              <h1
                className={`mb-6 text-4xl font-extrabold leading-tight sm:text-5xl md:text-7xl lg:text-8xl ${currentLanguage === 'hi' ? 'font-hindi' : ''}`}
              >
                <span className="block">{t.hero.title}</span>
                <span className="mt-2 block text-secondary-light drop-shadow-lg">{t.hero.subtitle}</span>
              </h1>
            </AnimateOnScroll>

            <AnimateOnScroll animation="slide-up" delay={0.2}>
              <p
                className={`mx-auto mb-8 max-w-3xl text-base font-medium leading-relaxed opacity-95 sm:mb-10 sm:text-xl md:text-2xl ${currentLanguage === 'hi' ? 'font-hindi' : ''}`}
              >
                {t.hero.description}
              </p>
            </AnimateOnScroll>

            <AnimateOnScroll animation="slide-up" delay={0.3}>
              <div className="mb-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link to="/register?role=farmer" className="group">
                  <Button className="btn-hero w-full px-10 py-7 text-lg shadow-2xl transition-all duration-300 hover:shadow-secondary/50 group-hover:scale-105 sm:w-auto">
                    <span className="mr-2 text-2xl">🧑‍🌾</span>
                    {t.hero.cta1}
                    <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
                <Link to="/register?role=buyer" className="group">
                  <Button
                    variant="outline"
                    className="w-full border-2 border-white/30 bg-white/10 px-10 py-7 text-lg shadow-xl backdrop-blur-md transition-all duration-300 hover:border-white/50 hover:bg-white/20 sm:w-auto group-hover:scale-105"
                  >
                    <span className="mr-2 text-2xl">🛒</span>
                    {t.hero.cta2}
                    <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
              </div>
            </AnimateOnScroll>

            <AnimateOnScroll animation="fade-in" delay={0.4}>
              <div className="mx-auto grid max-w-2xl grid-cols-1 gap-4 border-t border-white/20 pt-6 sm:grid-cols-3 sm:gap-6 sm:pt-8">
                {heroStrip.map((item, i) => (
                  <div key={i} className="text-center">
                    {'marketing' in item && item.marketing ? (
                      <div
                        className={`text-base font-bold leading-snug text-secondary-light md:text-lg ${currentLanguage === 'hi' ? 'font-hindi' : ''}`}
                      >
                        {item.label}
                      </div>
                    ) : (
                      <>
                        <div className="text-3xl font-bold text-secondary-light">{item.value}</div>
                        <div
                          className={`mt-1 text-sm opacity-80 ${currentLanguage === 'hi' ? 'font-hindi' : ''}`}
                        >
                          {item.label}
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </AnimateOnScroll>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-auto w-full">
            <path
              d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z"
              fill="hsl(var(--background))"
            />
          </svg>
        </div>
      </section>

      {/* Stats */}
      <section className="-mt-1 bg-gradient-to-b from-background to-muted/30 py-16">
        <div className="container mx-auto min-w-0 px-3 sm:px-4">
          <StaggerContainer
            staggerDelay={0.1}
            animation="slide-up"
            stretchGridItems
            className="mx-auto grid max-w-6xl grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 md:grid-cols-4 md:items-stretch"
          >
            {statCards.map((stat, index) => (
              <div
                key={index}
                className={`group flex h-full flex-col rounded-3xl border border-border/50 bg-gradient-to-br ${stat.color} p-5 text-center shadow-lg backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:shadow-xl sm:p-8`}
              >
                <div
                  className={`mb-4 shrink-0 animate-float-slow text-4xl transition-transform duration-300 group-hover:scale-110 ${stat.iconColor}`}
                >
                  {stat.emoji}
                </div>
                <div className="flex min-h-0 flex-1 flex-col justify-start">
                  {stat.kind === 'live' ? (
                    <>
                      <div className="mb-2 text-3xl font-extrabold text-foreground md:text-4xl">{stat.value}</div>
                      <div
                        className={`text-balance text-sm font-medium leading-snug text-muted-foreground ${currentLanguage === 'hi' ? 'font-hindi' : ''}`}
                      >
                        {stat.label}
                      </div>
                    </>
                  ) : (
                    <>
                      <div
                        className={`mb-2 text-xl font-extrabold leading-tight text-foreground md:text-2xl ${currentLanguage === 'hi' ? 'font-hindi' : ''}`}
                      >
                        {stat.headline}
                      </div>
                      <div
                        className={`text-balance text-sm font-medium leading-snug text-muted-foreground ${currentLanguage === 'hi' ? 'font-hindi' : ''}`}
                      >
                        {stat.sub}
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))}
          </StaggerContainer>
          {statsMode === 'live' && !liveStatsLoading && !liveStats && (
            <p
              className={`mx-auto mt-8 max-w-2xl text-center text-sm text-muted-foreground ${currentLanguage === 'hi' ? 'font-hindi' : ''}`}
            >
              {currentLanguage === 'en'
                ? 'Live stats could not be loaded; showing theme cards instead.'
                : 'लाइव आँकड़े लोड नहीं हो सके; थीम कार्ड दिखाए जा रहे हैं।'}
            </p>
          )}
        </div>
      </section>

      {/* Features */}
      <AnimateOnScroll animation="fade-in">
        <section className="relative overflow-hidden bg-background py-20">
          <div className="absolute right-0 top-0 h-96 w-96 -translate-y-1/2 translate-x-1/2 rounded-full bg-primary/5 blur-3xl" />
          <div className="absolute bottom-0 left-0 h-96 w-96 -translate-x-1/2 translate-y-1/2 rounded-full bg-secondary/5 blur-3xl" />

          <div className="container relative z-10 mx-auto min-w-0 px-3 sm:px-4">
            <div className="mb-16 text-center">
              <h2 className={`mb-4 text-4xl font-extrabold md:text-5xl ${currentLanguage === 'hi' ? 'font-hindi' : ''}`}>
                {t.features.title}
              </h2>
              <p className={`mx-auto max-w-2xl text-lg text-muted-foreground ${currentLanguage === 'hi' ? 'font-hindi' : ''}`}>
                {currentLanguage === 'en'
                  ? 'Everything you need to grow your agricultural business'
                  : 'अपने कृषि व्यवसाय को बढ़ाने के लिए आपको जो कुछ चाहिए'}
              </p>
            </div>
            <StaggerContainer
              staggerDelay={0.1}
              animation="slide-up"
              className="mx-auto grid max-w-7xl grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4"
            >
              {t.features.items.map((feature, index) => {
                const colors = [
                  { bg: 'bg-primary/10', icon: 'text-primary', border: 'border-primary/20' },
                  { bg: 'bg-secondary/10', icon: 'text-secondary', border: 'border-secondary/20' },
                  { bg: 'bg-accent/10', icon: 'text-accent', border: 'border-accent/20' },
                  { bg: 'bg-success/10', icon: 'text-success', border: 'border-success/20' },
                ];
                const color = colors[index % colors.length];
                return (
                  <div
                    key={index}
                    className={`card-elevated group relative overflow-hidden border-2 p-8 text-center transition-all duration-300 hover:-translate-y-2 hover:scale-105 hover:shadow-2xl ${color.border}`}
                  >
                    <div className={`absolute inset-0 ${color.bg} opacity-0 transition-opacity duration-300 group-hover:opacity-100`} />
                    <div
                      className={`relative z-10 mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl border-2 ${color.bg} ${color.border} transition-all duration-300 group-hover:rotate-6 group-hover:scale-110`}
                    >
                      <feature.icon className={`h-10 w-10 ${color.icon}`} />
                    </div>
                    <h3 className={`relative z-10 mb-3 text-xl font-bold ${currentLanguage === 'hi' ? 'font-hindi' : ''}`}>
                      {feature.title}
                    </h3>
                    <p className={`relative z-10 text-sm leading-relaxed text-muted-foreground ${currentLanguage === 'hi' ? 'font-hindi' : ''}`}>
                      {feature.desc}
                    </p>
                  </div>
                );
              })}
            </StaggerContainer>
          </div>
        </section>
      </AnimateOnScroll>

      {/* How It Works */}
      <AnimateOnScroll animation="fade-in">
        <section className="relative bg-gradient-to-b from-muted/30 to-background py-20">
          <div className="container mx-auto min-w-0 px-3 sm:px-4">
            <div className="mb-16 text-center">
              <h2 className={`mb-4 text-4xl font-extrabold md:text-5xl ${currentLanguage === 'hi' ? 'font-hindi' : ''}`}>
                {t.howItWorks.title}
              </h2>
              <p className={`mx-auto max-w-2xl text-lg text-muted-foreground ${currentLanguage === 'hi' ? 'font-hindi' : ''}`}>
                {currentLanguage === 'en' ? 'Get started in just three simple steps' : 'बस तीन सरल चरणों में शुरू करें'}
              </p>
            </div>
            <StaggerContainer
              staggerDelay={0.15}
              animation="scale-in"
              className="relative mx-auto grid max-w-6xl grid-cols-1 gap-12 md:grid-cols-3"
            >
              <div className="absolute left-0 right-0 top-20 hidden h-1 bg-gradient-to-r from-primary via-secondary to-accent opacity-20 md:block" />
              {t.howItWorks.steps.map((step, index) => (
                <div key={index} className="group relative text-center">
                  <div className="absolute -top-4 left-1/2 z-20 -translate-x-1/2">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-secondary to-accent text-lg font-bold text-white shadow-lg transition-all duration-300 group-hover:rotate-12 group-hover:scale-125">
                      {index + 1}
                    </div>
                  </div>
                  <div className="relative z-10 mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-primary to-primary-light shadow-2xl transition-all duration-300 group-hover:rotate-6 group-hover:scale-110">
                    <step.icon className="h-12 w-12 text-primary-foreground" />
                  </div>
                  <div className="card-elevated p-8 pt-12 transition-all duration-300 hover:scale-105 hover:shadow-2xl">
                    <h3 className={`mb-3 text-xl font-bold ${currentLanguage === 'hi' ? 'font-hindi' : ''}`}>{step.title}</h3>
                    <p className={`leading-relaxed text-muted-foreground ${currentLanguage === 'hi' ? 'font-hindi' : ''}`}>
                      {step.desc}
                    </p>
                  </div>
                </div>
              ))}
            </StaggerContainer>
          </div>
        </section>
      </AnimateOnScroll>

      {/* Featured Products */}
      <AnimateOnScroll animation="fade-in">
        <section className="relative overflow-hidden bg-background py-20">
          <div className="absolute left-0 top-1/2 h-96 w-96 -translate-y-1/2 rounded-full bg-primary/5 blur-3xl" />
          <div className="absolute right-0 top-1/2 h-96 w-96 -translate-y-1/2 rounded-full bg-secondary/5 blur-3xl" />

          <div className="container relative z-10 mx-auto min-w-0 px-3 sm:px-4">
            <div className="mb-12 flex flex-col items-center justify-between md:flex-row">
              <div>
                <h2 className="mb-2 text-4xl font-extrabold md:text-5xl">
                  {currentLanguage === 'en' ? 'Fresh From Farms' : 'खेतों से ताज़ा'}
                </h2>
                <p className="text-lg text-muted-foreground">
                  {currentLanguage === 'en'
                    ? 'Handpicked quality produce from verified farmers'
                    : 'सत्यापित किसानों से चुनी गई गुणवत्तापूर्ण उपज'}
                </p>
              </div>
              <Link to="/marketplace" className="group mt-4 md:mt-0">
                <Button
                  variant="outline"
                  className="border-2 px-8 py-6 text-lg transition-all duration-300 hover:bg-primary hover:text-primary-foreground group-hover:scale-105"
                >
                  {currentLanguage === 'en' ? 'View All Products' : 'सभी उत्पाद देखें'}
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
            </div>
            <StaggerContainer staggerDelay={0.1} animation="slide-up" className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              {featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </StaggerContainer>
          </div>
        </section>
      </AnimateOnScroll>

      {/* Testimonials */}
      <AnimateOnScroll animation="fade-in">
        <section className="relative overflow-hidden bg-gradient-to-b from-background via-muted/20 to-background py-20">
          <div className="absolute left-1/4 top-0 h-72 w-72 rounded-full bg-primary/5 blur-3xl" />
          <div className="absolute bottom-0 right-1/4 h-72 w-72 rounded-full bg-secondary/5 blur-3xl" />

          <div className="container relative z-10 mx-auto min-w-0 px-3 sm:px-4">
            <div className="mb-16 text-center">
              <h2 className={`text-4xl font-extrabold md:text-5xl ${currentLanguage === 'hi' ? 'font-hindi' : ''}`}>
                {t.testimonials.title}
              </h2>
            </div>
            <StaggerContainer staggerDelay={0.1} animation="slide-up" className="mx-auto grid max-w-7xl grid-cols-1 gap-8 md:grid-cols-3">
              {testimonials.map((testimonial, index) => (
                <div
                  key={index}
                  className="card-elevated group relative overflow-hidden p-8 transition-all duration-300 hover:-translate-y-2 hover:scale-105 hover:shadow-2xl"
                >
                  <div className="absolute right-4 top-4 text-primary/10 transition-colors group-hover:text-primary/20">
                    <svg className="h-16 w-16" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.996 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.984zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                    </svg>
                  </div>
                  <div className="relative z-10 mb-6 flex items-center gap-1">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 fill-secondary text-secondary" />
                    ))}
                  </div>
                  <p className={`relative z-10 mb-6 text-lg leading-relaxed text-foreground ${currentLanguage === 'hi' ? 'font-hindi' : ''}`}>
                    &ldquo;{testimonial.quote}&rdquo;
                  </p>
                  <div className="relative z-10 flex items-center gap-4 border-t border-border pt-6">
                    <div className="relative shrink-0">
                      <img
                        src={testimonial.image}
                        alt=""
                        width={56}
                        height={56}
                        loading="lazy"
                        decoding="async"
                        className="h-14 w-14 rounded-full object-cover ring-2 ring-primary/20 transition-all group-hover:ring-primary/40"
                      />
                    </div>
                    <div className="min-w-0 flex-1 text-left">
                      <h4 className="text-lg font-bold text-foreground">{t.testimonials.attribution}</h4>
                      <p className="mt-1 text-sm text-muted-foreground">
                        <span className="font-medium text-foreground/80">{t.testimonials.role}</span>
                        <span className="mx-1.5 text-border">·</span>
                        <span className={currentLanguage === 'hi' ? 'font-hindi' : ''}>{testimonial.region}</span>
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </StaggerContainer>
          </div>
        </section>
      </AnimateOnScroll>

      {/* CTA */}
      <AnimateOnScroll animation="zoom-in">
        <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary/95 to-primary-dark py-24 text-primary-foreground">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.1%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-30" />
          <div className="absolute left-0 top-0 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-secondary/20 blur-3xl" />
          <div className="absolute bottom-0 right-0 h-96 w-96 translate-x-1/2 translate-y-1/2 rounded-full bg-accent/20 blur-3xl" />

          <div className="container relative z-10 mx-auto min-w-0 px-3 sm:px-4 text-center">
            <div className="mx-auto max-w-3xl">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/15 px-4 py-2 backdrop-blur-md">
                <Zap className="h-4 w-4 text-secondary-light" />
                <span className="text-sm font-semibold">{t.cta.zapLine}</span>
              </div>
              <h2 className={`mb-6 text-4xl font-extrabold leading-tight md:text-6xl ${currentLanguage === 'hi' ? 'font-hindi' : ''}`}>
                {t.cta.title}
              </h2>
              <p className={`mb-10 text-xl leading-relaxed opacity-95 md:text-2xl ${currentLanguage === 'hi' ? 'font-hindi' : ''}`}>
                {t.cta.desc}
              </p>
              <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link to="/register" className="group">
                  <Button className="btn-hero px-12 py-8 text-xl shadow-2xl transition-all duration-300 hover:shadow-secondary/50 group-hover:scale-110">
                    {t.cta.button}
                    <ArrowRight className="ml-3 h-6 w-6 transition-transform group-hover:translate-x-2" />
                  </Button>
                </Link>
                <Link to="/marketplace" className="group">
                  <Button
                    variant="outline"
                    className="border-2 border-white/30 bg-white/10 px-12 py-8 text-xl backdrop-blur-md transition-all duration-300 hover:border-white/50 hover:bg-white/20 group-hover:scale-110"
                  >
                    {t.cta.browse}
                    <ArrowRight className="ml-3 h-6 w-6 transition-transform group-hover:translate-x-2" />
                  </Button>
                </Link>
              </div>
              <div className="mt-12 flex flex-wrap items-center justify-center gap-8 text-sm opacity-80">
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-secondary-light" />
                  <span>{t.cta.trustSecure}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-secondary-light" />
                  <span>{t.cta.trustVerified}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Heart className="h-5 w-5 text-secondary-light" />
                  <span>{t.cta.trustSupport}</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </AnimateOnScroll>
    </Layout>
  );
};

export default Landing;
