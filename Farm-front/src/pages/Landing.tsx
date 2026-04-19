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
  ShoppingBag,
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
          iconColor: 'text-primary',
        },
        {
          kind: 'live' as const,
          value: formatLandingInteger(liveStats.buyerCount),
          label: tr.stats.buyers,
          emoji: '🛒',
          iconColor: 'text-secondary',
        },
        {
          kind: 'live' as const,
          value: formatLandingInteger(liveStats.deliveredDeals),
          label: tr.stats.transactions,
          emoji: '🤝',
          iconColor: 'text-gold',
        },
        {
          kind: 'live' as const,
          value: formatLandingInteger(liveStats.activeListings),
          label: tr.stats.listings,
          emoji: '📋',
          iconColor: 'text-success',
        },
      ];
    }
    return tr.stats.marketingCards.map((c, index) => {
      const colors = [
        { iconColor: 'text-primary' },
        { iconColor: 'text-secondary' },
        { iconColor: 'text-gold' },
        { iconColor: 'text-success' },
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
      {/* Hero — Theme Vision: warm canvas, forest + gold accents */}
      <section className="relative flex min-h-[88vh] min-w-0 items-center overflow-x-hidden bg-background">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.35]"
          style={{
            background:
              'radial-gradient(ellipse 80% 50% at 50% -20%, hsl(var(--primary) / 0.08), transparent 55%), radial-gradient(ellipse 60% 40% at 100% 50%, hsl(var(--gold) / 0.06), transparent 45%)',
          }}
          aria-hidden
        />

        <div className="container relative z-10 mx-auto min-w-0 px-3 py-16 sm:px-4 sm:py-24 md:py-32">
          <div className="mx-auto max-w-3xl min-w-0 text-center">
            <AnimateOnScroll animation="fade-in" delay={0}>
              <div className="mb-6 inline-flex max-w-full items-center gap-2 rounded-full border border-border bg-card px-3 py-2 shadow-sm sm:mb-8 sm:px-4 sm:py-2.5">
                <Sparkles className="h-4 w-4 shrink-0 text-gold" />
                <span className="text-left text-xs font-medium leading-snug text-muted-foreground sm:text-sm">
                  {trustBadgeText}
                </span>
                <Award className="h-4 w-4 shrink-0 text-gold" />
              </div>
            </AnimateOnScroll>

            <AnimateOnScroll animation="slide-up" delay={0.1}>
              <h1
                className={`font-heading mb-4 text-4xl font-semibold leading-[1.1] tracking-tight text-foreground sm:mb-6 sm:text-5xl md:text-6xl lg:text-7xl ${currentLanguage === 'hi' ? 'font-hindi' : ''}`}
              >
                <span className="block">{t.hero.title}</span>
                <span className="mt-3 block text-2xl font-medium text-primary sm:text-3xl md:text-4xl">
                  {t.hero.subtitle}
                </span>
              </h1>
            </AnimateOnScroll>

            <AnimateOnScroll animation="slide-up" delay={0.2}>
              <p
                className={`mx-auto mb-10 max-w-2xl text-base font-normal leading-relaxed text-muted-foreground sm:mb-12 sm:text-lg ${currentLanguage === 'hi' ? 'font-hindi' : ''}`}
              >
                {t.hero.description}
              </p>
            </AnimateOnScroll>

            <AnimateOnScroll animation="slide-up" delay={0.3}>
              <div className="mb-14 flex flex-col items-stretch justify-center gap-3 sm:mb-16 sm:flex-row sm:items-center sm:justify-center sm:gap-4">
                <Link to="/register?role=farmer" className="group sm:w-auto">
                  <Button className="btn-hero flex w-full items-center justify-center gap-2 px-8 py-6 text-base sm:w-auto sm:py-6">
                    <Leaf className="h-5 w-5 shrink-0" />
                    {t.hero.cta1}
                    <ArrowRight className="h-5 w-5 shrink-0 transition-transform duration-300 group-hover:translate-x-0.5" />
                  </Button>
                </Link>
                <Link to="/register?role=buyer" className="group sm:w-auto">
                  <Button
                    variant="outline"
                    className="flex w-full items-center justify-center gap-2 border-primary/20 bg-card px-8 py-6 text-base transition-all duration-300 ease-out hover:border-primary/40 sm:w-auto sm:py-6"
                  >
                    <ShoppingBag className="h-5 w-5 shrink-0" />
                    {t.hero.cta2}
                    <ArrowRight className="h-5 w-5 shrink-0 transition-transform duration-300 group-hover:translate-x-0.5" />
                  </Button>
                </Link>
              </div>
            </AnimateOnScroll>

            <AnimateOnScroll animation="fade-in" delay={0.4}>
              <div className="mx-auto grid max-w-2xl grid-cols-1 gap-6 border-t border-border pt-8 sm:grid-cols-3 sm:gap-8 sm:pt-10">
                {heroStrip.map((item, i) => (
                  <div key={i} className="text-center">
                    {'marketing' in item && item.marketing ? (
                      <div
                        className={`text-sm font-medium leading-snug text-foreground md:text-base ${currentLanguage === 'hi' ? 'font-hindi' : ''}`}
                      >
                        {item.label}
                      </div>
                    ) : (
                      <>
                        <div className="font-heading text-3xl font-semibold tabular-nums text-primary">{item.value}</div>
                        <div className={`mt-1 text-xs text-muted-foreground sm:text-sm ${currentLanguage === 'hi' ? 'font-hindi' : ''}`}>
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
      </section>

      {/* Stats */}
      <section className="border-t border-border bg-muted/25 py-16">
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
                className="group flex h-full flex-col rounded-xl border border-border bg-card p-5 text-center shadow-card transition-all duration-300 ease-out hover:scale-[1.02] hover:shadow-md sm:p-8"
              >
                <div
                  className={`mb-4 shrink-0 animate-float-slow text-4xl transition-transform duration-300 ease-out group-hover:scale-105 ${stat.iconColor}`}
                >
                  {stat.emoji}
                </div>
                <div className="flex min-h-0 flex-1 flex-col justify-start">
                  {stat.kind === 'live' ? (
                    <>
                      <div className="font-heading mb-2 text-3xl font-semibold tabular-nums text-foreground md:text-4xl">
                        {stat.value}
                      </div>
                      <div
                        className={`text-balance text-sm font-medium leading-snug text-muted-foreground ${currentLanguage === 'hi' ? 'font-hindi' : ''}`}
                      >
                        {stat.label}
                      </div>
                    </>
                  ) : (
                    <>
                      <div
                        className={`font-heading mb-2 text-xl font-semibold leading-tight text-foreground md:text-2xl ${currentLanguage === 'hi' ? 'font-hindi' : ''}`}
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
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.4]"
            style={{
              background:
                'radial-gradient(ellipse 55% 40% at 100% 0%, hsl(var(--primary) / 0.04), transparent 50%), radial-gradient(ellipse 50% 35% at 0% 100%, hsl(var(--gold) / 0.03), transparent 45%)',
            }}
            aria-hidden
          />

          <div className="container relative z-10 mx-auto min-w-0 px-3 sm:px-4">
            <div className="mb-16 text-center">
              <h2
                className={`font-heading mb-4 text-4xl font-semibold tracking-tight md:text-5xl ${currentLanguage === 'hi' ? 'font-hindi' : ''}`}
              >
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
                  { bg: 'bg-primary/8', icon: 'text-primary' },
                  { bg: 'bg-secondary/8', icon: 'text-secondary' },
                  { bg: 'bg-gold/10', icon: 'text-gold' },
                  { bg: 'bg-success/8', icon: 'text-success' },
                ];
                const color = colors[index % colors.length];
                return (
                  <div
                    key={index}
                    className="group relative overflow-hidden rounded-xl border border-border bg-card p-8 text-center shadow-card transition-all duration-300 ease-out hover:scale-[1.02] hover:shadow-md"
                  >
                    <div
                      className={`relative z-10 mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-xl border border-border ${color.bg} transition-all duration-300 ease-out group-hover:shadow-sm`}
                    >
                      <feature.icon className={`h-8 w-8 ${color.icon}`} />
                    </div>
                    <h3
                      className={`font-heading relative z-10 mb-3 text-lg font-semibold md:text-xl ${currentLanguage === 'hi' ? 'font-hindi' : ''}`}
                    >
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
        <section className="relative border-y border-border bg-muted/20 py-20">
          <div className="container mx-auto min-w-0 px-3 sm:px-4">
            <div className="mb-16 text-center">
              <h2
                className={`font-heading mb-4 text-4xl font-semibold tracking-tight md:text-5xl ${currentLanguage === 'hi' ? 'font-hindi' : ''}`}
              >
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
              <div className="absolute left-[16%] right-[16%] top-[4.5rem] hidden h-px bg-border md:block" aria-hidden />
              {t.howItWorks.steps.map((step, index) => (
                <div key={index} className="group relative text-center">
                  <div className="absolute -top-4 left-1/2 z-20 -translate-x-1/2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-background bg-secondary text-sm font-semibold text-secondary-foreground shadow-sm transition-all duration-300 ease-out group-hover:scale-[1.06] group-hover:shadow-md">
                      {index + 1}
                    </div>
                  </div>
                  <div className="relative z-10 mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-xl border border-primary/15 bg-primary text-primary-foreground shadow-card transition-all duration-300 ease-out group-hover:scale-[1.02] group-hover:shadow-md">
                    <step.icon className="h-10 w-10" />
                  </div>
                  <div className="rounded-xl border border-border bg-card p-8 pt-12 shadow-card transition-all duration-300 ease-out group-hover:shadow-md">
                    <h3 className={`font-heading mb-3 text-lg font-semibold md:text-xl ${currentLanguage === 'hi' ? 'font-hindi' : ''}`}>
                      {step.title}
                    </h3>
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
          <div className="container relative z-10 mx-auto min-w-0 px-3 sm:px-4">
            <div className="mb-12 flex flex-col items-center justify-between md:flex-row">
              <div>
                <h2 className="font-heading mb-2 text-4xl font-semibold tracking-tight md:text-5xl">
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
                  className="border-primary/20 bg-card px-8 py-6 text-base transition-all duration-300 ease-out hover:border-primary/40 hover:bg-muted/50 group-hover:scale-[1.02]"
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
        <section className="relative overflow-hidden border-t border-border bg-muted/15 py-20">
          <div className="container relative z-10 mx-auto min-w-0 px-3 sm:px-4">
            <div className="mb-16 text-center">
              <h2
                className={`font-heading text-4xl font-semibold tracking-tight md:text-5xl ${currentLanguage === 'hi' ? 'font-hindi' : ''}`}
              >
                {t.testimonials.title}
              </h2>
            </div>
            <StaggerContainer staggerDelay={0.1} animation="slide-up" className="mx-auto grid max-w-7xl grid-cols-1 gap-8 md:grid-cols-3">
              {testimonials.map((testimonial, index) => (
                <div
                  key={index}
                  className="group relative overflow-hidden rounded-xl border border-border bg-card p-8 shadow-card transition-all duration-300 ease-out hover:scale-[1.02] hover:shadow-md"
                >
                  <div className="absolute right-4 top-4 text-primary/10 transition-colors group-hover:text-primary/20">
                    <svg className="h-16 w-16" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.996 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.984zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                    </svg>
                  </div>
                  <div className="relative z-10 mb-6 flex items-center gap-1">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 fill-gold text-gold" />
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

      {/* CTA — earth panel + gold accents (premium, not loud gradients) */}
      <AnimateOnScroll animation="zoom-in">
        <section className="relative overflow-hidden bg-secondary py-24 text-secondary-foreground">
          <div
            className="pointer-events-none absolute inset-0 opacity-30"
            style={{
              background:
                'radial-gradient(ellipse 70% 50% at 80% 0%, hsl(var(--gold) / 0.12), transparent 55%), radial-gradient(ellipse 50% 40% at 0% 100%, hsl(var(--primary) / 0.15), transparent 50%)',
            }}
            aria-hidden
          />

          <div className="container relative z-10 mx-auto min-w-0 px-3 text-center sm:px-4">
            <div className="mx-auto max-w-3xl rounded-2xl border border-white/10 bg-white/[0.04] px-6 py-12 shadow-lg backdrop-blur-[2px] sm:px-10 sm:py-14">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-gold/35 bg-gold/10 px-4 py-2">
                <Zap className="h-4 w-4 text-gold" />
                <span className="text-sm font-medium text-secondary-foreground/95">{t.cta.zapLine}</span>
              </div>
              <h2
                className={`font-heading mb-6 text-4xl font-semibold leading-tight tracking-tight md:text-5xl lg:text-6xl ${currentLanguage === 'hi' ? 'font-hindi' : ''}`}
              >
                {t.cta.title}
              </h2>
              <p
                className={`mb-10 text-lg leading-relaxed text-secondary-foreground/85 md:text-xl ${currentLanguage === 'hi' ? 'font-hindi' : ''}`}
              >
                {t.cta.desc}
              </p>
              <div className="flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center sm:gap-4">
                <Link to="/register" className="group sm:w-auto">
                  <Button className="btn-hero flex w-full items-center justify-center gap-2 px-10 py-7 text-base sm:w-auto md:text-lg">
                    {t.cta.button}
                    <ArrowRight className="h-5 w-5 shrink-0 transition-transform duration-300 group-hover:translate-x-0.5 md:h-6 md:w-6" />
                  </Button>
                </Link>
                <Link to="/marketplace" className="group sm:w-auto">
                  <Button
                    variant="outline"
                    className="flex w-full items-center justify-center gap-2 border-white/25 bg-transparent px-10 py-7 text-base text-secondary-foreground transition-all duration-300 ease-out hover:border-white/45 hover:bg-white/10 sm:w-auto md:text-lg"
                  >
                    {t.cta.browse}
                    <ArrowRight className="h-5 w-5 shrink-0 transition-transform duration-300 group-hover:translate-x-0.5 md:h-6 md:w-6" />
                  </Button>
                </Link>
              </div>
              <div className="mt-12 flex flex-wrap items-center justify-center gap-x-10 gap-y-4 text-sm text-secondary-foreground/75">
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 shrink-0 text-gold" />
                  <span>{t.cta.trustSecure}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 shrink-0 text-gold" />
                  <span>{t.cta.trustVerified}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Heart className="h-5 w-5 shrink-0 text-gold" />
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
