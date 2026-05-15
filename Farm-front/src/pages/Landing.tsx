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
import { getLandingContent } from '@/i18n/locales/landingIndex';
import { scriptFontClass } from '@/lib/i18n';

const FEATURE_ICONS = [Users, MessageCircle, Shield, TrendingUp] as const;
const STEP_ICONS = [Leaf, MessageCircle, Truck] as const;

const Landing = () => {
  const { currentLanguage } = useAppSelector((state) => state.language);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const statsMode = getLandingStatsMode();
  const [liveStats, setLiveStats] = useState<PublicLandingStats | null>(null);
  const [liveStatsLoading, setLiveStatsLoading] = useState(() => statsMode === 'live');

  useEffect(() => {
    document.body.classList.add('landing-market-theme');
    return () => document.body.classList.remove('landing-market-theme');
  }, []);

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

  const t = getLandingContent(currentLanguage);

  const trustBadgeText =
    statsMode === 'live' && liveStats
      ? t.trustLive(formatLandingInteger(liveStats.farmerCount), formatLandingInteger(liveStats.buyerCount))
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
    const tr = getLandingContent(currentLanguage);
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
    const loc = getLandingContent(currentLanguage).testimonials;
    return [
      {
        region: loc.regionNorth,
        image: `${base}/testimonial-north.png`,
        quote: loc.quoteNorth,
        rating: 5,
      },
      {
        region: loc.regionWest,
        image: `${base}/testimonial-west.png`,
        quote: loc.quoteWest,
        rating: 5,
      },
      {
        region: loc.regionSouth,
        image: `${base}/testimonial-south.png`,
        quote: loc.quoteSouth,
        rating: 5,
      },
    ];
  }, [currentLanguage]);

  return (
    <Layout showMobileNav={false}>
      {/* Hero */}
      <section className="relative flex min-h-[90vh] min-w-0 items-center overflow-x-hidden bg-[#f7f0dc] text-[#213525]">
        <div className="absolute inset-0 opacity-70 [background-image:linear-gradient(rgba(49,95,59,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(49,95,59,0.08)_1px,transparent_1px)] [background-size:42px_42px]" />
        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-[#315f3b]/15 to-transparent" />

        <div
          className="absolute left-6 top-24 h-28 w-28 rounded-full border border-[#d89b2b]/25 bg-[#d89b2b]/10"
          style={{ animationDelay: '0s' }}
        />
        <div
          className="absolute right-12 top-44 h-40 w-40 rounded-full border border-[#315f3b]/20 bg-[#315f3b]/10"
          style={{ animationDelay: '1s' }}
        />
        <div
          className="absolute bottom-20 left-1/4 h-24 w-24 rotate-6 border border-[#8a4f2a]/20 bg-[#8a4f2a]/10"
          style={{ animationDelay: '2s' }}
        />

        <div className="container relative z-10 mx-auto min-w-0 px-3 py-16 sm:px-4 sm:py-20 md:py-32">
          <div className="mx-auto max-w-4xl min-w-0 text-center">
            <AnimateOnScroll animation="fade-in" delay={0}>
              <div className="mb-6 inline-flex max-w-full items-center gap-2 rounded-md border border-[#315f3b]/20 bg-[#fffaf0]/90 px-3 py-2 shadow-sm transition-all duration-300 hover:border-[#315f3b]/35 sm:mb-8 sm:px-5 sm:py-2.5">
                <Sparkles className="h-4 w-4 shrink-0 text-[#d89b2b]" />
                <span className="text-left text-xs font-semibold leading-snug sm:text-sm">{trustBadgeText}</span>
                <Award className="h-4 w-4 shrink-0 text-[#315f3b]" />
              </div>
            </AnimateOnScroll>

            <AnimateOnScroll animation="slide-up" delay={0.1}>
              <h1
                className={`mb-6 text-4xl font-extrabold leading-tight sm:text-5xl md:text-7xl lg:text-8xl ${scriptFontClass(currentLanguage)}`}
              >
                <span className="block text-[#243a28]">{t.hero.title}</span>
                <span className="mt-2 block text-[#8a4f2a]">{t.hero.subtitle}</span>
              </h1>
            </AnimateOnScroll>

            <AnimateOnScroll animation="slide-up" delay={0.2}>
              <p
                className={`mx-auto mb-8 max-w-3xl text-base font-medium leading-relaxed text-[#4d5a47] sm:mb-10 sm:text-xl md:text-2xl ${scriptFontClass(currentLanguage)}`}
              >
                {t.hero.description}
              </p>
            </AnimateOnScroll>

            <AnimateOnScroll animation="slide-up" delay={0.3}>
              <div className="mb-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link to="/register?role=farmer" className="group">
                  <Button className="w-full rounded-md bg-[#d89b2b] px-10 py-7 text-lg font-bold text-[#24170c] shadow-md transition-all duration-300 hover:bg-[#c8871f] group-hover:scale-[1.02] sm:w-auto">
                    <span className="mr-2 text-2xl">🧑‍🌾</span>
                    {t.hero.cta1}
                    <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
                <Link to="/register?role=buyer" className="group">
                  <Button
                    variant="outline"
                    className="w-full rounded-md border-2 border-[#315f3b] bg-[#fffaf0] px-10 py-7 text-lg font-bold text-[#315f3b] shadow-sm transition-all duration-300 hover:bg-[#315f3b] hover:text-[#fff8e8] sm:w-auto group-hover:scale-[1.02]"
                  >
                    <span className="mr-2 text-2xl">🛒</span>
                    {t.hero.cta2}
                    <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
              </div>
            </AnimateOnScroll>

            <AnimateOnScroll animation="fade-in" delay={0.4}>
              <div className="mx-auto grid max-w-2xl grid-cols-1 gap-4 border-t border-[#315f3b]/20 pt-6 sm:grid-cols-3 sm:gap-6 sm:pt-8">
                {heroStrip.map((item, i) => (
                  <div key={i} className="text-center">
                    {'marketing' in item && item.marketing ? (
                      <div
                        className={`text-base font-bold leading-snug text-[#315f3b] md:text-lg ${scriptFontClass(currentLanguage)}`}
                      >
                        {item.label}
                      </div>
                    ) : (
                      <>
                        <div className="text-3xl font-bold text-[#315f3b]">{item.value}</div>
                        <div
                          className={`mt-1 text-sm text-[#5f6657] ${scriptFontClass(currentLanguage)}`}
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
              fill="#fbf7eb"
            />
          </svg>
        </div>
      </section>

      {/* Stats */}
      <section className="-mt-1 bg-[#fbf7eb] py-16">
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
                className="group flex h-full flex-col rounded-lg border border-[#d7c7a8] bg-[#fffaf0] p-5 text-center shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#315f3b]/35 hover:shadow-md sm:p-8"
              >
                <div
                  className="mb-4 shrink-0 text-4xl transition-transform duration-300 group-hover:scale-110"
                >
                  {stat.emoji}
                </div>
                <div className="flex min-h-0 flex-1 flex-col justify-start">
                  {stat.kind === 'live' ? (
                    <>
                      <div className="mb-2 text-3xl font-extrabold text-foreground md:text-4xl">{stat.value}</div>
                      <div
                        className={`text-balance text-sm font-medium leading-snug text-muted-foreground ${scriptFontClass(currentLanguage)}`}
                      >
                        {stat.label}
                      </div>
                    </>
                  ) : (
                    <>
                      <div
                        className={`mb-2 text-xl font-extrabold leading-tight text-foreground md:text-2xl ${scriptFontClass(currentLanguage)}`}
                      >
                        {stat.headline}
                      </div>
                      <div
                        className={`text-balance text-sm font-medium leading-snug text-muted-foreground ${scriptFontClass(currentLanguage)}`}
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
              className={`mx-auto mt-8 max-w-2xl text-center text-sm text-muted-foreground ${scriptFontClass(currentLanguage)}`}
            >
              {t.statsLoadError}
            </p>
          )}
        </div>
      </section>

      {/* Features */}
      <AnimateOnScroll animation="fade-in">
        <section className="relative overflow-hidden bg-[#fbf7eb] py-20">
          <div className="absolute inset-x-0 top-0 h-px bg-[#d7c7a8]" />

          <div className="container relative z-10 mx-auto min-w-0 px-3 sm:px-4">
            <div className="mb-16 text-center">
              <h2 className={`mb-4 text-4xl font-extrabold md:text-5xl ${scriptFontClass(currentLanguage)}`}>
                {t.features.title}
              </h2>
              <p className={`mx-auto max-w-2xl text-lg text-muted-foreground ${scriptFontClass(currentLanguage)}`}>
                {t.features.subtitle}
              </p>
            </div>
            <StaggerContainer
              staggerDelay={0.1}
              animation="slide-up"
              className="mx-auto grid max-w-7xl grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4"
            >
              {t.features.items.map((feature, index) => {
                const Icon = FEATURE_ICONS[index];
                const colors = [
                  { bg: 'bg-[#315f3b]/10', icon: 'text-[#315f3b]', border: 'border-[#315f3b]/25' },
                  { bg: 'bg-[#d89b2b]/15', icon: 'text-[#9a651c]', border: 'border-[#d89b2b]/35' },
                  { bg: 'bg-[#8a4f2a]/10', icon: 'text-[#8a4f2a]', border: 'border-[#8a4f2a]/25' },
                  { bg: 'bg-[#5f7d3a]/10', icon: 'text-[#5f7d3a]', border: 'border-[#5f7d3a]/25' },
                ];
                const color = colors[index % colors.length];
                return (
                  <div
                    key={index}
                    className={`group relative overflow-hidden rounded-lg border-2 bg-[#fffaf0] p-8 text-center shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md ${color.border}`}
                  >
                    <div className={`absolute inset-0 ${color.bg} opacity-0 transition-opacity duration-300 group-hover:opacity-100`} />
                    <div
                      className={`relative z-10 mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-lg border-2 ${color.bg} ${color.border} transition-all duration-300 group-hover:scale-105`}
                    >
                      <Icon className={`h-10 w-10 ${color.icon}`} />
                    </div>
                    <h3 className={`relative z-10 mb-3 text-xl font-bold ${scriptFontClass(currentLanguage)}`}>
                      {feature.title}
                    </h3>
                    <p className={`relative z-10 text-sm leading-relaxed text-muted-foreground ${scriptFontClass(currentLanguage)}`}>
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
        <section className="relative border-y border-[#d7c7a8] bg-[#f1e5cc] py-20">
          <div className="container mx-auto min-w-0 px-3 sm:px-4">
            <div className="mb-16 text-center">
              <h2 className={`mb-4 text-4xl font-extrabold md:text-5xl ${scriptFontClass(currentLanguage)}`}>
                {t.howItWorks.title}
              </h2>
              <p className={`mx-auto max-w-2xl text-lg text-muted-foreground ${scriptFontClass(currentLanguage)}`}>
                {t.howItWorks.subtitle}
              </p>
            </div>
            <StaggerContainer
              staggerDelay={0.15}
              animation="scale-in"
              className="relative mx-auto grid max-w-6xl grid-cols-1 gap-12 md:grid-cols-3"
            >
              <div className="absolute left-0 right-0 top-20 hidden h-px bg-[#315f3b]/25 md:block" />
              {t.howItWorks.steps.map((step, index) => {
                const StepIcon = STEP_ICONS[index];
                return (
                <div key={index} className="group relative text-center">
                  <div className="absolute -top-4 left-1/2 z-20 -translate-x-1/2">
                    <div className="flex h-12 w-12 items-center justify-center rounded-md bg-[#d89b2b] text-lg font-bold text-[#24170c] shadow-sm transition-all duration-300 group-hover:scale-110">
                      {index + 1}
                    </div>
                  </div>
                  <div className="relative z-10 mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-lg border border-[#315f3b]/20 bg-[#315f3b] shadow-md transition-all duration-300 group-hover:scale-105">
                    <StepIcon className="h-12 w-12 text-[#fff8e8]" />
                  </div>
                  <div className="rounded-lg border border-[#d7c7a8] bg-[#fffaf0] p-8 pt-12 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
                    <h3 className={`mb-3 text-xl font-bold ${scriptFontClass(currentLanguage)}`}>{step.title}</h3>
                    <p className={`leading-relaxed text-muted-foreground ${scriptFontClass(currentLanguage)}`}>
                      {step.desc}
                    </p>
                  </div>
                </div>
              );
              })}
            </StaggerContainer>
          </div>
        </section>
      </AnimateOnScroll>

      {/* Featured Products */}
      <AnimateOnScroll animation="fade-in">
        <section className="relative overflow-hidden bg-[#fbf7eb] py-20">
          <div className="absolute inset-x-0 top-0 h-px bg-[#d7c7a8]" />

          <div className="container relative z-10 mx-auto min-w-0 px-3 sm:px-4">
            <div className="mb-12 flex flex-col items-center justify-between md:flex-row">
              <div>
                <h2 className="mb-2 text-4xl font-extrabold md:text-5xl">
                  {t.featured.title}
                </h2>
                <p className="text-lg text-muted-foreground">
                  {t.featured.desc}
                </p>
              </div>
              <Link to="/marketplace" className="group mt-4 md:mt-0">
                <Button
                  variant="outline"
                  className="rounded-md border-2 border-[#315f3b] px-8 py-6 text-lg text-[#315f3b] transition-all duration-300 hover:bg-[#315f3b] hover:text-[#fff8e8] group-hover:scale-[1.02]"
                >
                  {t.featured.cta}
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
        <section className="relative overflow-hidden border-y border-[#d7c7a8] bg-[#f1e5cc] py-20">

          <div className="container relative z-10 mx-auto min-w-0 px-3 sm:px-4">
            <div className="mb-16 text-center">
              <h2 className={`text-4xl font-extrabold md:text-5xl ${scriptFontClass(currentLanguage)}`}>
                {t.testimonials.title}
              </h2>
            </div>
            <StaggerContainer staggerDelay={0.1} animation="slide-up" className="mx-auto grid max-w-7xl grid-cols-1 gap-8 md:grid-cols-3">
              {testimonials.map((testimonial, index) => (
                <div
                  key={index}
                  className="group relative overflow-hidden rounded-lg border border-[#d7c7a8] bg-[#fffaf0] p-8 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
                >
                  <div className="absolute right-4 top-4 text-[#315f3b]/10 transition-colors group-hover:text-[#315f3b]/20">
                    <svg className="h-16 w-16" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.996 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.984zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                    </svg>
                  </div>
                  <div className="relative z-10 mb-6 flex items-center gap-1">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 fill-secondary text-secondary" />
                    ))}
                  </div>
                  <p className={`relative z-10 mb-6 text-lg leading-relaxed text-foreground ${scriptFontClass(currentLanguage)}`}>
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
                        className="h-14 w-14 rounded-md object-cover ring-2 ring-[#315f3b]/20 transition-all group-hover:ring-[#315f3b]/40"
                      />
                    </div>
                    <div className="min-w-0 flex-1 text-left">
                      <h4 className="text-lg font-bold text-foreground">{t.testimonials.attribution}</h4>
                      <p className="mt-1 text-sm text-muted-foreground">
                        <span className="font-medium text-foreground/80">{t.testimonials.role}</span>
                        <span className="mx-1.5 text-border">·</span>
                        <span className={scriptFontClass(currentLanguage)}>{testimonial.region}</span>
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
        <section className="relative overflow-hidden bg-[#315f3b] py-24 text-[#fff8e8]">
          <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(255,248,232,0.16)_1px,transparent_1px),linear-gradient(90deg,rgba(255,248,232,0.16)_1px,transparent_1px)] [background-size:42px_42px]" />

          <div className="container relative z-10 mx-auto min-w-0 px-3 sm:px-4 text-center">
            <div className="mx-auto max-w-3xl">
              <div className="mb-6 inline-flex items-center gap-2 rounded-md border border-[#fff8e8]/25 bg-[#fff8e8]/10 px-4 py-2">
                <Zap className="h-4 w-4 text-[#d89b2b]" />
                <span className="text-sm font-semibold">{t.cta.zapLine}</span>
              </div>
              <h2 className={`mb-6 text-4xl font-extrabold leading-tight md:text-6xl ${scriptFontClass(currentLanguage)}`}>
                {t.cta.title}
              </h2>
              <p className={`mb-10 text-xl leading-relaxed opacity-95 md:text-2xl ${scriptFontClass(currentLanguage)}`}>
                {t.cta.desc}
              </p>
              <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link to="/register" className="group">
                  <Button className="rounded-md bg-[#d89b2b] px-12 py-8 text-xl font-bold text-[#24170c] shadow-md transition-all duration-300 hover:bg-[#c8871f] group-hover:scale-[1.03]">
                    {t.cta.button}
                    <ArrowRight className="ml-3 h-6 w-6 transition-transform group-hover:translate-x-2" />
                  </Button>
                </Link>
                <Link to="/marketplace" className="group">
                  <Button
                    variant="outline"
                    className="rounded-md border-2 border-[#fff8e8]/40 bg-transparent px-12 py-8 text-xl text-[#fff8e8] transition-all duration-300 hover:border-[#fff8e8] hover:bg-[#fff8e8]/10 group-hover:scale-[1.03]"
                  >
                    {t.cta.browse}
                    <ArrowRight className="ml-3 h-6 w-6 transition-transform group-hover:translate-x-2" />
                  </Button>
                </Link>
              </div>
              <div className="mt-12 flex flex-wrap items-center justify-center gap-8 text-sm opacity-80">
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-[#d89b2b]" />
                  <span>{t.cta.trustSecure}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-[#d89b2b]" />
                  <span>{t.cta.trustVerified}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Heart className="h-5 w-5 text-[#d89b2b]" />
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
