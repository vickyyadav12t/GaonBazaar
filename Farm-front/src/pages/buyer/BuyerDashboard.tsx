import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Package,
  ShoppingCart,
  TrendingUp,
  MessageCircle,
  Search,
  Star,
  Clock,
  Sparkles,
  ArrowRight,
  Calendar,
  RefreshCw,
  Heart,
} from 'lucide-react';
import Layout from '@/components/layout/Layout';
import StatCard from '@/components/dashboard/StatCard';
import OrderCard from '@/components/orders/OrderCard';
import ProductCard from '@/components/product/ProductCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAppSelector } from '@/hooks/useRedux';
import { AnimateOnScroll, StaggerContainer } from '@/components/animations';
import { apiService } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { mapApiOrderToOrder } from '@/lib/mapOrderFromApi';
import { resolveFarmerAvatarUrl } from '@/lib/farmerAvatarUrl';
import { sanitizeImageUrlList } from '@/lib/productImageUrl';
import { farmerRatingFromApi } from '@/lib/farmerRatingFromApi';
import { CropCategory, Order, Product } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { useCopilot } from '@/context/CopilotContext';

function selectMarketplacePicks(
  pool: Product[],
  orders: Order[],
  wishlist: Product[]
): { picks: Product[]; personalized: boolean } {
  if (pool.length === 0) {
    return { picks: [], personalized: false };
  }

  const interestCategories = new Set<CropCategory>();
  for (const w of wishlist) {
    if (w.category) interestCategories.add(w.category);
  }
  for (const o of orders) {
    if (o.productCategory) interestCategories.add(o.productCategory);
  }
  const wishlistIds = new Set(wishlist.map((p) => p.id));

  const score = (p: Product) => {
    let s = 0;
    if (p.category && interestCategories.has(p.category)) s += 3;
    if (wishlistIds.has(p.id)) s += 1;
    return s;
  };

  const sorted = [...pool].sort((a, b) => {
    const d = score(b) - score(a);
    if (d !== 0) return d;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const picks = sorted.slice(0, 4);
  const personalized = picks.some((p) => score(p) > 0);
  return { picks, personalized };
}

function BuyerDashboardSkeleton() {
  return (
    <>
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0 flex-1 space-y-3">
          <Skeleton className="h-9 w-52 max-w-full rounded-full" />
          <Skeleton className="h-12 w-full max-w-lg" />
          <Skeleton className="h-5 w-full max-w-md" />
          <Skeleton className="h-4 w-40" />
        </div>
        <Skeleton className="h-12 w-12 shrink-0 rounded-xl" />
      </div>
      <div className="mb-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="space-y-3 rounded-2xl border border-border/60 p-6">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-3 w-36" />
          </div>
        ))}
      </div>
      <Skeleton className="mb-10 h-44 w-full rounded-xl" />
      <Skeleton className="mb-10 min-h-[280px] w-full rounded-xl border border-border/60" />
      <div className="mb-8 space-y-4 rounded-xl border border-border/60 p-6">
        <Skeleton className="h-6 w-48" />
        {[1, 2].map((i) => (
          <Skeleton key={i} className="h-28 w-full rounded-lg" />
        ))}
      </div>
      <div className="space-y-4 rounded-xl border border-border/60 p-6">
        <Skeleton className="h-6 w-56" />
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-3 rounded-xl border border-border/50 p-3">
              <Skeleton className="aspect-[4/3] w-full rounded-lg" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

const BuyerDashboard = () => {
  const { user } = useAppSelector((state) => state.auth);
  const { currentLanguage } = useAppSelector((state) => state.language);
  const { items: cartItems } = useAppSelector((state) => state.cart);
  const { items: wishlistItems } = useAppSelector((state) => state.wishlist);
  const { toast } = useToast();
  const firstFetchDoneRef = useRef(false);
  const { setCopilotContext } = useCopilot();

  const cartItemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const wishlistCount = wishlistItems.length;

  const [orders, setOrders] = useState<Order[]>([]);
  const [marketplacePool, setMarketplacePool] = useState<Product[]>([]);
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const [initialLoading, setInitialLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { picks: marketplacePicks, personalized: picksPersonalized } = useMemo(
    () => selectMarketplacePicks(marketplacePool, orders, wishlistItems),
    [marketplacePool, orders, wishlistItems]
  );

  const loadDashboard = useCallback(async () => {
    if (!user) {
      setInitialLoading(false);
      return;
    }
    if (firstFetchDoneRef.current) setIsRefreshing(true);
    try {
      const [ordersRes, productsRes, chatsRes] = await Promise.all([
        apiService.orders.getAll({ limit: 25, skip: 0 }),
        apiService.products.getAll({ limit: 24, skip: 0 }),
        apiService.chats.getAll({ limit: 20, skip: 0 }),
      ]);

      const backendOrders = ordersRes.data?.orders || [];
      const backendProducts = productsRes.data?.products || [];
      const backendChats = chatsRes.data?.chats || [];

      const mappedOrders: Order[] = backendOrders.map((o: any) => mapApiOrderToOrder(o));

      const mappedProducts: Product[] = backendProducts.map((p: any) => ({
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
      }));

      setOrders(mappedOrders);
      setMarketplacePool(mappedProducts);
      const unread = backendChats.reduce((sum: number, chat: any) => {
        const count = Number(chat.unreadCount ?? chat.unreadCountBuyer ?? 0);
        return sum + (Number.isFinite(count) ? count : 0);
      }, 0);
      setUnreadChatCount(unread);
    } catch (error: any) {
      console.error('Failed to load buyer dashboard data', error);
      toast({
        title: currentLanguage === 'en' ? 'Error' : 'त्रुटि',
        description:
          error?.response?.data?.message ||
          error?.message ||
          (currentLanguage === 'en'
            ? 'Failed to load dashboard.'
            : 'डैशबोर्ड लोड करने में विफल।'),
        variant: 'destructive',
      });
    } finally {
      setIsRefreshing(false);
      setInitialLoading(false);
      firstFetchDoneRef.current = true;
    }
  }, [user, currentLanguage, toast]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  useEffect(() => {
    setCopilotContext({ page: 'dashboard' });
    return () => setCopilotContext(null);
  }, [setCopilotContext]);

  const buyerOrders = orders;

  const totalSpent = buyerOrders
    .filter((o) => o.paymentStatus === 'paid')
    .reduce((sum, o) => sum + o.totalAmount, 0);

  const pendingOrders = buyerOrders.filter(
    (o) => o.status === 'pending' || o.status === 'processing'
  ).length;

  const deliveredOrders = buyerOrders.filter(
    (o) => o.status === 'delivered'
  ).length;

  const processingOrderCount = buyerOrders.filter((o) => o.status === 'processing').length;
  const paymentPendingCount = buyerOrders.filter(
    (o) => o.paymentStatus === 'pending' && o.status !== 'cancelled'
  ).length;

  usePullToRefresh(
    useCallback(() => {
      void loadDashboard();
    }, [loadDashboard]),
    { enabled: !initialLoading }
  );

  return (
    <Layout>
      <div className="min-h-screen min-w-0 overflow-x-hidden bg-gradient-to-b from-blue-50/50 to-background dark:from-background">
        <div className="container mx-auto min-w-0 px-3 py-6 sm:px-4 sm:py-8">
          {!initialLoading ? (
            <div className="mb-6 flex flex-col gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 md:hidden">
              <p className={`text-sm text-muted-foreground ${currentLanguage === 'hi' ? 'font-hindi' : ''}`}>
                {currentLanguage === 'en'
                  ? 'Pull down from the top of the page to refresh, or tap Refresh.'
                  : 'पेज के ऊपर से नीचे खींचकर रिफ्रेश करें, या रिफ्रेश दबाएँ।'}
              </p>
              <Button
                type="button"
                variant="secondary"
                className="w-full gap-2 sm:w-auto"
                onClick={() => void loadDashboard()}
                disabled={isRefreshing}
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                {currentLanguage === 'en' ? 'Refresh dashboard' : 'डैशबोर्ड रिफ्रेश'}
              </Button>
            </div>
          ) : null}

          {initialLoading ? (
            <BuyerDashboardSkeleton />
          ) : (
            <>
          {/* Welcome Section */}
          <AnimateOnScroll animation="fade-in">
            <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
              <div className="inline-flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full mb-4">
                <Calendar className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold text-primary">
                  {new Date().toLocaleDateString(currentLanguage === 'en' ? 'en-US' : 'hi-IN', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </span>
              </div>
              <h1 className={`text-4xl md:text-5xl font-extrabold text-foreground mb-2 ${currentLanguage === 'hi' ? 'font-hindi' : ''}`}>
                {currentLanguage === 'en' ? `Welcome back, ${user?.name?.split(' ')[0]}!` : `वापसी पर स्वागत है, ${user?.name?.split(' ')[0]}!`}
              </h1>
              <p className={`text-lg text-muted-foreground ${currentLanguage === 'hi' ? 'font-hindi' : ''}`}>
                {currentLanguage === 'en' ? 'Find fresh produce directly from farmers' : 'किसानों से सीधे ताज़ा उपज पाएं'}
              </p>
              <p className="text-sm text-blue-700 dark:text-blue-400 font-medium mt-2">
                {currentLanguage === 'en' ? 'Buyer Workspace' : 'खरीदार कार्यक्षेत्र'}
              </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-12 w-12 shrink-0 rounded-xl"
                onClick={() => void loadDashboard()}
                disabled={isRefreshing}
                title={currentLanguage === 'en' ? 'Refresh dashboard' : 'डैशबोर्ड रिफ्रेश'}
              >
                <RefreshCw className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </AnimateOnScroll>

          {/* Stats */}
          <AnimateOnScroll animation="slide-up" delay={0.1}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
              <StatCard 
                title={currentLanguage === 'en' ? 'Total Orders' : 'कुल ऑर्डर'} 
                value={buyerOrders.length} 
                icon={ShoppingCart} 
                variant="primary"
                subtitle={`${deliveredOrders} ${currentLanguage === 'en' ? 'delivered' : 'डिलीवर'}`}
              />
              <StatCard 
                title={currentLanguage === 'en' ? 'Unread chats' : 'अनपढ़ चैट'} 
                value={unreadChatCount} 
                icon={MessageCircle} 
                variant="success"
                subtitle={currentLanguage === 'en' ? 'Unread messages' : 'अपठित संदेश'}
              />
              <StatCard 
                title={currentLanguage === 'en' ? 'Total Spent' : 'कुल खर्च'} 
                value={`₹${totalSpent.toLocaleString()}`} 
                icon={TrendingUp} 
                variant="accent"
                subtitle={currentLanguage === 'en' ? 'All time' : 'सभी समय'}
              />
              <StatCard 
                title={currentLanguage === 'en' ? 'Pending' : 'लंबित'} 
                value={pendingOrders} 
                icon={Clock} 
                variant="warning"
                subtitle={currentLanguage === 'en' ? 'In progress' : 'प्रगति में'}
              />
            </div>
          </AnimateOnScroll>

          {/* Orders & chat — actionable (parity with farmer operations board) */}
          <AnimateOnScroll animation="slide-up" delay={0.15}>
            <Card className="border-2 border-blue-200/70 dark:border-blue-900/40 shadow-lg mb-10">
              <CardHeader className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border-b">
                <CardTitle>
                  {currentLanguage === 'en' ? 'Orders & chat' : 'ऑर्डर और चैट'}
                </CardTitle>
                <CardDescription>
                  {currentLanguage === 'en'
                    ? 'Open filtered lists in one tap.'
                    : 'एक टैप में फ़िल्टर सूची खोलें।'}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 grid sm:grid-cols-3 gap-4">
                <Link
                  to="/buyer/orders?status=processing"
                  aria-label={
                    currentLanguage === 'en'
                      ? `In progress, ${processingOrderCount} orders. Open orders filtered by processing.`
                      : `प्रगति में, ${processingOrderCount} ऑर्डर। प्रोसेसिंग ऑर्डर खोलें।`
                  }
                  className="group relative flex flex-col rounded-xl border bg-card p-4 text-left shadow-sm transition-all hover:border-primary/45 hover:bg-primary/[0.04] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm text-muted-foreground">
                        {currentLanguage === 'en' ? 'In progress' : 'प्रगति में'}
                      </p>
                      <p className="text-2xl font-bold mt-1 tabular-nums">{processingOrderCount}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {currentLanguage === 'en' ? 'Processing orders' : 'प्रोसेसिंग ऑर्डर'}
                      </p>
                    </div>
                    <ArrowRight
                      className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary"
                      aria-hidden
                    />
                  </div>
                </Link>
                <Link
                  to="/buyer/orders?payment=pending"
                  aria-label={
                    currentLanguage === 'en'
                      ? `Payment pending, ${paymentPendingCount} orders. Open orders awaiting payment.`
                      : `भुगतान लंबित, ${paymentPendingCount} ऑर्डर। लंबित भुगतान खोलें।`
                  }
                  className="group relative flex flex-col rounded-xl border bg-card p-4 text-left shadow-sm transition-all hover:border-primary/45 hover:bg-primary/[0.04] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm text-muted-foreground">
                        {currentLanguage === 'en' ? 'Payment pending' : 'भुगतान लंबित'}
                      </p>
                      <p className="text-2xl font-bold mt-1 tabular-nums">{paymentPendingCount}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {currentLanguage === 'en' ? 'Awaiting payment' : 'भुगतान की प्रतीक्षा'}
                      </p>
                    </div>
                    <ArrowRight
                      className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary"
                      aria-hidden
                    />
                  </div>
                </Link>
                <Link
                  to="/buyer/chats"
                  aria-label={
                    currentLanguage === 'en'
                      ? `Chats, ${unreadChatCount} unread. Open messages.`
                      : `चैट, ${unreadChatCount} अनपढ़। संदेश खोलें।`
                  }
                  className="group relative flex flex-col rounded-xl border bg-card p-4 text-left shadow-sm transition-all hover:border-primary/45 hover:bg-primary/[0.04] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm text-muted-foreground">
                        {currentLanguage === 'en' ? 'Chats' : 'चैट'}
                      </p>
                      <p className="text-2xl font-bold mt-1 tabular-nums">{unreadChatCount}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {currentLanguage === 'en' ? 'Unread messages' : 'अपठित संदेश'}
                      </p>
                    </div>
                    <ArrowRight
                      className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary"
                      aria-hidden
                    />
                  </div>
                </Link>
              </CardContent>
            </Card>
          </AnimateOnScroll>

          {/* Quick Actions */}
          <AnimateOnScroll animation="slide-up" delay={0.2}>
            <Card className="border-2 shadow-lg mb-10">
              <CardHeader className="bg-gradient-to-r from-primary/10 to-secondary/10 border-b">
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  {currentLanguage === 'en' ? 'Quick Actions' : 'त्वरित कार्य'}
                </CardTitle>
                <CardDescription>
                  {currentLanguage === 'en' ? 'Access your most used features' : 'अपनी सबसे अधिक उपयोग की जाने वाली सुविधाओं तक पहुंचें'}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <StaggerContainer
                  staggerDelay={0.05}
                  animation="slide-up"
                  className="grid grid-cols-2 sm:grid-cols-3 gap-4"
                >
                  {[
                    {
                      icon: Search,
                      label: currentLanguage === 'en' ? 'Browse Marketplace' : 'बाज़ार खोजें',
                      path: '/marketplace',
                      color: 'from-primary/20 to-primary/10',
                    },
                    {
                      icon: ShoppingCart,
                      label: currentLanguage === 'en' ? 'Cart' : 'कार्ट',
                      path: '/buyer/cart',
                      color: 'from-accent/20 to-accent/10',
                      badge: cartItemCount,
                    },
                    {
                      icon: Heart,
                      label: currentLanguage === 'en' ? 'Wishlist' : 'इच्छा सूची',
                      path: '/buyer/wishlist',
                      color: 'from-rose-500/20 to-rose-500/10',
                      badge: wishlistCount,
                    },
                    {
                      icon: Package,
                      label: currentLanguage === 'en' ? 'My Orders' : 'मेरे ऑर्डर',
                      path: '/buyer/orders',
                      color: 'from-success/20 to-success/10',
                    },
                    {
                      icon: MessageCircle,
                      label: currentLanguage === 'en' ? 'Chats' : 'चैट',
                      path: '/buyer/chats',
                      badge: unreadChatCount,
                      color: 'from-purple-500/20 to-purple-500/10',
                    },
                    {
                      icon: Star,
                      label: currentLanguage === 'en' ? 'Reviews' : 'समीक्षाएं',
                      path: '/buyer/reviews',
                      color: 'from-warning/20 to-warning/10',
                    },
                  ].map((item) => (
                    <Link
                      key={item.path}
                      to={item.path}
                      className="group relative flex h-full min-h-[124px] flex-col items-center justify-center gap-3 rounded-xl border-2 border-border bg-gradient-to-br from-card to-muted/30 p-5 transition-all duration-300 hover:scale-105 hover:border-primary/50 hover:shadow-xl"
                    >
                      <div
                        className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${item.color} transition-transform group-hover:scale-110`}
                      >
                        <item.icon className="h-6 w-6 shrink-0 text-primary" strokeWidth={2} />
                      </div>
                      {typeof item.badge === 'number' && item.badge > 0 ? (
                        <Badge className="absolute -right-2 -top-2 bg-accent px-2 py-0.5 text-xs font-bold text-accent-foreground">
                          {item.badge > 99 ? '99+' : item.badge}
                        </Badge>
                      ) : null}
                      <span
                        className={`text-center text-sm font-semibold ${currentLanguage === 'hi' ? 'font-hindi' : ''}`}
                      >
                        {item.label}
                      </span>
                    </Link>
                  ))}
                </StaggerContainer>
              </CardContent>
            </Card>
          </AnimateOnScroll>

          {/* Recent Orders */}
          <AnimateOnScroll animation="slide-up" delay={0.3}>
            <Card className="border-2 shadow-lg mb-8">
              <CardHeader className="bg-gradient-to-r from-success/10 to-success/5 border-b">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <ShoppingCart className="w-5 h-5 text-success" />
                      {currentLanguage === 'en' ? 'My Orders' : 'मेरे ऑर्डर'}
                    </CardTitle>
                    <CardDescription>
                      {currentLanguage === 'en' ? 'Track your recent purchases' : 'अपनी हाल की खरीदारी ट्रैक करें'}
                    </CardDescription>
                  </div>
                  <Link to="/buyer/orders">
                    <Button variant="ghost" size="sm" className="gap-2">
                      {currentLanguage === 'en' ? 'View All' : 'सभी देखें'}
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {buyerOrders.length > 0 ? (
                  <div className="space-y-4">
                    {buyerOrders.slice(0, 2).map((order) => (
                      <OrderCard key={order.id} order={order} userRole="buyer" />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <ShoppingCart className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <p className={`text-muted-foreground mb-4 ${currentLanguage === 'hi' ? 'font-hindi' : ''}`}>
                      {currentLanguage === 'en' ? 'No orders yet' : 'अभी तक कोई ऑर्डर नहीं'}
                    </p>
                    <Link to="/marketplace">
                      <Button className="gap-2">
                        {currentLanguage === 'en' ? 'Start Shopping' : 'खरीदारी शुरू करें'}
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </AnimateOnScroll>

          {/* Marketplace listings — ranked by wishlist + order categories when possible */}
          <AnimateOnScroll animation="slide-up" delay={0.4}>
            <Card className="border-2 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5 border-b">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <CardTitle className="flex flex-wrap items-center gap-2">
                      <Package className="w-5 h-5 shrink-0 text-primary" />
                      {picksPersonalized ? (
                        <>
                          <span className={currentLanguage === 'hi' ? 'font-hindi' : ''}>
                            {currentLanguage === 'en' ? 'Picked for you' : 'आपके लिए चयन'}
                          </span>
                          <Badge variant="secondary" className="text-xs font-normal">
                            {currentLanguage === 'en' ? 'Your tastes' : 'आपकी पसंद'}
                          </Badge>
                        </>
                      ) : (
                        <span className={currentLanguage === 'hi' ? 'font-hindi' : ''}>
                          {currentLanguage === 'en' ? 'From the marketplace' : 'बाज़ार से'}
                        </span>
                      )}
                    </CardTitle>
                    <CardDescription className={currentLanguage === 'hi' ? 'font-hindi' : ''}>
                      {picksPersonalized
                        ? currentLanguage === 'en'
                          ? 'Sorted using your wishlist and categories from past orders.'
                          : 'आपकी इच्छा सूची और पिछले ऑर्डर की श्रेणियों के अनुसार क्रमबद्ध।'
                        : currentLanguage === 'en'
                          ? 'Latest listings from the bazaar — same feed as browse, shown four at a time.'
                          : 'बाज़ार की नई लिस्टिंग — ब्राउज़ जैसी फ़ीड, चार-चार दिखाई जाती है।'}
                    </CardDescription>
                  </div>
                  <Link to="/marketplace">
                    <Button variant="ghost" size="sm" className="gap-2 shrink-0">
                      {currentLanguage === 'en' ? 'View All' : 'सभी देखें'}
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <StaggerContainer staggerDelay={0.05} animation="slide-up" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {marketplacePicks.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </StaggerContainer>
              </CardContent>
            </Card>
          </AnimateOnScroll>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default BuyerDashboard;
