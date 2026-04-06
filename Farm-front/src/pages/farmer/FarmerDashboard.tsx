import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Package,
  ShoppingCart,
  TrendingUp,
  MessageCircle,
  Plus,
  Bell,
  Star,
  Wallet,
  BarChart3,
  Sparkles,
  ArrowRight,
  Calendar,
  RefreshCw,
  Shield,
  AlertTriangle,
  Share2,
  Newspaper,
} from 'lucide-react';
import Layout from '@/components/layout/Layout';
import StatCard from '@/components/dashboard/StatCard';
import OrderCard from '@/components/orders/OrderCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAppDispatch, useAppSelector } from '@/hooks/useRedux';
import { updateUser } from '@/store/slices/authSlice';
import { mapApiUserToAuth } from '@/lib/mapAuthUser';
import { AnimateOnScroll, StaggerContainer } from '@/components/animations';
import { apiService } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { mapApiOrderToOrder } from '@/lib/mapOrderFromApi';
import { resolveFarmerAvatarUrl } from '@/lib/farmerAvatarUrl';
import { Order, Product, Notification, User, Withdrawal, EarningsSummary } from '@/types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { formatPrice } from '@/lib/format';
import { FarmerWeatherWidget } from '@/components/farmer/FarmerWeatherWidget';
import { Skeleton } from '@/components/ui/skeleton';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { useCopilot } from '@/context/CopilotContext';

function FarmerKycAccountBanner({
  user,
  currentLanguage,
}: {
  user: User;
  currentLanguage: string;
}) {
  if (user.role !== 'farmer') return null;

  const isHi = currentLanguage === 'hi';
  const profileKycHref = '/farmer/profile?tab=kyc';
  const supportHref = '/support';

  if (user.accountStatus === 'suspended') {
    return (
      <Alert variant="destructive" className="mb-8 border-2 shadow-sm">
        <AlertTriangle className="h-5 w-5" />
        <AlertTitle>
          {isHi ? 'खाता निलंबित' : 'Account suspended'}
        </AlertTitle>
        <AlertDescription className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <span>
            {isHi
              ? 'आपका खाता निलंबित है। खरीदार आपकी लिस्टिंग नहीं देख सकते और नए ऑर्डर संसाधित नहीं हो सकते। सहायता से संपर्क करें।'
              : 'Your account is suspended. Buyers cannot see your listings and new orders cannot proceed. Contact support if you think this is a mistake.'}
          </span>
          <Button variant="secondary" size="sm" className="shrink-0 w-fit" asChild>
            <Link to={supportHref}>{isHi ? 'सहायता' : 'Contact support'}</Link>
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (user.kycStatus === 'approved') {
    return null;
  }

  if (user.kycStatus === 'rejected') {
    const reason = (user.kycRejectionReason || '').trim();
    return (
      <Alert className="mb-8 border-2 border-destructive/50 bg-destructive/5 shadow-sm">
        <AlertTriangle className="h-5 w-5 text-destructive" />
        <AlertTitle className="text-destructive">
          {isHi ? 'केवाईसी अस्वीकृत' : 'KYC rejected'}
        </AlertTitle>
        <AlertDescription className="mt-2 space-y-3 text-foreground">
          <p>
            {isHi
              ? 'अपने दस्तावेज़ फिर से अपलोड करें। अनुमोदन के बाद ही खरीदार आपको पूरी तरह भरोसा कर सकेंगे।'
              : 'Please upload valid documents again. Buyers trust verified farmers for quality and payouts.'}
          </p>
          {reason ? (
            <p className="rounded-md border border-border bg-background/80 p-3 text-sm">
              <span className="font-medium">{isHi ? 'कारण: ' : 'Reason: '}</span>
              {reason}
            </p>
          ) : null}
          <div>
            <Button size="sm" asChild>
              <Link to={profileKycHref}>{isHi ? 'केवाईसी अपडेट करें' : 'Update KYC documents'}</Link>
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  // pending
  return (
    <Alert className="mb-8 border-2 border-amber-500/50 bg-amber-50/90 text-foreground shadow-sm dark:border-amber-500/40 dark:bg-amber-950/30">
      <Shield className="h-5 w-5 text-amber-700 dark:text-amber-400" />
      <AlertTitle className="text-amber-900 dark:text-amber-100">
        {isHi ? 'केवाईसी सत्यापन लंबित' : 'KYC verification pending'}
      </AlertTitle>
      <AlertDescription className="mt-2 flex flex-col gap-3 text-amber-950/90 dark:text-amber-50/90 sm:flex-row sm:items-center sm:justify-between">
        <span>
          {isHi
            ? 'अपना आधार या किसान आईडी अपलोड करें। प्रशासन अनुमोदन तक कुछ सुविधाएँ सीमित हो सकती हैं। प्रोफाइल में केवाईसी टैब खोलें।'
            : 'Upload Aadhaar or Kisan ID for review. Until you are verified, some features (e.g. buyer trust, payouts) work best after approval. Open the KYC tab on your profile.'}
        </span>
        <Button
          size="sm"
          className="shrink-0 border-amber-600/30 bg-amber-600/90 text-white hover:bg-amber-700 dark:bg-amber-600"
          asChild
        >
          <Link to={profileKycHref}>{isHi ? 'केवाईसी पूरा करें' : 'Complete KYC'}</Link>
        </Button>
      </AlertDescription>
    </Alert>
  );
}

function FarmerDashboardSkeleton() {
  return (
    <>
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0 flex-1 space-y-3">
          <Skeleton className="h-9 w-52 max-w-full rounded-full" />
          <Skeleton className="h-12 w-full max-w-lg" />
          <Skeleton className="h-5 w-full max-w-md" />
          <Skeleton className="h-4 w-40" />
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-3">
          <Skeleton className="h-14 w-14 rounded-xl" />
          <Skeleton className="h-14 w-48 rounded-xl md:w-56" />
        </div>
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
      <Skeleton className="mb-10 h-40 w-full rounded-xl" />
      <div className="mb-10 grid gap-4 sm:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
      <Skeleton className="mb-10 min-h-[280px] w-full rounded-xl border border-border/60" />
      <div className="mb-8 space-y-4 rounded-xl border border-border/60 p-6">
        <Skeleton className="h-6 w-48" />
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 w-full rounded-lg" />
        ))}
      </div>
      <div className="space-y-0 overflow-hidden rounded-xl border border-border/60">
        <Skeleton className="h-14 w-full rounded-none" />
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 w-full rounded-none border-t border-border/40" />
        ))}
      </div>
    </>
  );
}

const FarmerDashboard = () => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { currentLanguage } = useAppSelector((state) => state.language);
  const { toast } = useToast();
  const firstFetchDoneRef = useRef(false);
  const { setCopilotContext } = useCopilot();

  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [ratingStats, setRatingStats] = useState({
    avgDisplay: '—' as string,
    count: 0,
  });

  const [payoutSnapshot, setPayoutSnapshot] = useState<{
    availableBalance: number;
    pendingWithdrawal: number;
  } | null>(null);

  const loadDashboard = useCallback(async () => {
    if (!user) {
      setInitialLoading(false);
      return;
    }
    if (firstFetchDoneRef.current) setIsRefreshing(true);
    try {
      const [ordersRes, productsRes, chatsRes, notifRes, reviewsRes, earningsRes] = await Promise.all([
        apiService.orders.getAll({ limit: 25, skip: 0 }),
        apiService.products.getAllMine(),
        apiService.chats.getAll({ limit: 20, skip: 0 }),
        apiService.notifications.getAll({ limit: 15, skip: 0 }),
        apiService.reviews.getAll(),
        apiService.earnings.getDashboard().catch(() => null),
      ]);

      const backendOrders = ordersRes.data?.orders || [];
      const backendProducts = productsRes.data?.products || [];
      const backendChats = chatsRes.data?.chats || [];
      const backendNotifs: any[] = notifRes.data?.notifications || [];
      const rawReviews: any[] = reviewsRes.data?.reviews || [];
      // Defense in depth: avg rating must only use reviews about this farmer (API already scopes GET /reviews for farmers).
      const myFarmerId = String(user.id);
      const backendReviews = rawReviews.filter((r) => {
        const tid = r.target?._id != null ? String(r.target._id) : String(r.target ?? '');
        return tid === myFarmerId;
      });

      const mappedOrders: Order[] = backendOrders.map((o: any) => mapApiOrderToOrder(o));

      const ratings = backendReviews
        .map((r) => Number(r.rating))
        .filter((n) => Number.isFinite(n) && n >= 1 && n <= 5);
      const count = ratings.length;
      const avg = count > 0 ? ratings.reduce((a, b) => a + b, 0) / count : null;
      setRatingStats({
        avgDisplay: avg != null ? avg.toFixed(1) : '—',
        count,
      });

      const mappedProducts: Product[] = backendProducts.map((p: any) => ({
        id: p._id || p.id,
        farmerId: p.farmer?._id || p.farmer || '',
        farmerName: p.farmer?.name || 'Farmer',
        farmerAvatar: resolveFarmerAvatarUrl(p.farmer?.avatar),
        farmerRating: avg ?? 0,
        farmerLocation: p.farmer?.location
          ? `${p.farmer.location.district}, ${p.farmer.location.state}`
          : '',
        name: p.name,
        nameHindi: p.nameHindi,
        category: p.category,
        description: p.description || '',
        images:
          p.images && p.images.length > 0
            ? p.images
            : ['https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=600'],
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

      const mappedNotifs: Notification[] = backendNotifs.map((n) => ({
        id: String(n.id || n._id),
        userId: String(n.userId || ''),
        type: (n.type || 'system') as Notification['type'],
        title: n.title || '',
        message: n.message || '',
        link: n.link,
        isRead: !!n.isRead,
        createdAt: n.createdAt || new Date().toISOString(),
      }));

      setOrders(mappedOrders);
      setProducts(mappedProducts);
      setNotifications(mappedNotifs);
      const unread = backendChats.reduce((sum: number, chat: any) => {
        const c = Number(chat.unreadCount ?? chat.unreadCountFarmer ?? 0);
        return sum + (Number.isFinite(c) ? c : 0);
      }, 0);
      setUnreadChatCount(unread);

      if (earningsRes?.data?.summary) {
        const summary = earningsRes.data.summary as EarningsSummary;
        const withdrawalList = (earningsRes.data.withdrawals || []) as Withdrawal[];
        const pendingWithdrawal = withdrawalList
          .filter((w) => w.status === 'pending' || w.status === 'processing')
          .reduce((sum, w) => sum + (Number(w.amount) || 0), 0);
        setPayoutSnapshot({
          availableBalance: Number(summary.availableBalance) || 0,
          pendingWithdrawal,
        });
      } else {
        setPayoutSnapshot(null);
      }
    } catch (error: any) {
      console.error('Failed to load farmer dashboard data', error);
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
    let cancelled = false;
    (async () => {
      try {
        const res = await apiService.users.getProfile();
        const raw = res.data?.user;
        if (!raw || cancelled) return;
        dispatch(updateUser(mapApiUserToAuth(raw)));
      } catch {
        /* keep cached user if profile refresh fails */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [dispatch]);

  useEffect(() => {
    setCopilotContext({ page: 'dashboard' });
    return () => setCopilotContext(null);
  }, [setCopilotContext]);

  const farmerOrders = orders;
  const farmerProducts = products;
  const activeListingsCount = farmerProducts.filter((p) => p.status === 'active').length;

  const totalEarnings = farmerOrders
    .filter((o) => o.paymentStatus === 'paid')
    .reduce((sum, o) => sum + o.totalAmount, 0);

  const pendingOrders = farmerOrders.filter(
    (o) => o.status === 'pending' || o.status === 'processing'
  ).length;

  const todayEarnings = farmerOrders
    .filter(
      (o) =>
        o.paymentStatus === 'paid' &&
        new Date(o.createdAt).toDateString() === new Date().toDateString()
    )
    .reduce((sum, o) => sum + o.totalAmount, 0);

  const pendingOrderCount = farmerOrders.filter((o) => o.status === 'pending').length;
  const processingOrderCount = farmerOrders.filter((o) => o.status === 'processing').length;
  const lowStockListingCount = farmerProducts.filter((p) => p.availableQuantity <= 10).length;

  const copyShopShareLink = useCallback(() => {
    const id = user?.id;
    if (!id || !/^[a-f0-9]{24}$/i.test(String(id))) {
      toast({
        title: currentLanguage === 'en' ? 'Cannot share yet' : 'अभी साझा नहीं कर सकते',
        description:
          currentLanguage === 'en'
            ? 'Try again after your profile has fully loaded.'
            : 'प्रोफ़ाइल लोड होने के बाद पुनः प्रयास करें।',
        variant: 'destructive',
      });
      return;
    }
    const href = new URL(
      `marketplace?farmer=${encodeURIComponent(String(id))}`,
      window.location.origin + (import.meta.env.BASE_URL || '/')
    ).href;
    void navigator.clipboard.writeText(href).then(
      () => {
        toast({
          title: currentLanguage === 'en' ? 'Shop link copied' : 'दुकान का लिंक कॉपी हुआ',
          description:
            currentLanguage === 'en'
              ? 'Buyers who open it see only your public listings on the marketplace.'
              : 'खरीदार इस पर केवल आपकी सार्वजनिक लिस्टिंग देखेंगे।',
        });
      },
      () => {
        toast({
          title: currentLanguage === 'en' ? 'Could not copy' : 'कॉपी नहीं हुआ',
          description: href,
          variant: 'destructive',
        });
      }
    );
  }, [user?.id, currentLanguage, toast]);

  usePullToRefresh(
    useCallback(() => {
      void loadDashboard();
    }, [loadDashboard]),
    { enabled: !initialLoading }
  );

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-b from-green-50/50 to-background dark:from-background">
        <div className="container mx-auto px-4 py-8">
          {user ? <FarmerKycAccountBanner user={user} currentLanguage={currentLanguage} /> : null}

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
            <FarmerDashboardSkeleton />
          ) : (
            <>
          {/* Welcome Section */}
          <AnimateOnScroll animation="fade-in">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
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
                  {currentLanguage === 'en' ? "Here's your farm overview and recent activity" : 'यहाँ आपका खेत अवलोकन और हाल की गतिविधि है'}
                </p>
                <p className="text-sm text-green-700 dark:text-green-400 font-medium mt-2">
                  {currentLanguage === 'en' ? 'Farmer Workspace' : 'किसान कार्यक्षेत्र'}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-14 w-14 shrink-0 rounded-xl border-2 shadow-sm md:border"
                  onClick={() => void loadDashboard()}
                  disabled={isRefreshing}
                  title={currentLanguage === 'en' ? 'Refresh dashboard' : 'डैशबोर्ड रिफ्रेश'}
                >
                  <RefreshCw className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} />
                </Button>
                <Button variant="outline" className="h-14 gap-2 rounded-xl border-2 shadow-sm px-4" asChild>
                  <Link to="/farmer/news">
                    <Newspaper className="h-5 w-5 shrink-0" />
                    <span className={currentLanguage === 'hi' ? 'font-hindi' : ''}>
                      {currentLanguage === 'en' ? 'News' : 'समाचार'}
                    </span>
                  </Link>
                </Button>
                <Link to="/farmer/listings">
                  <Button className="btn-primary-gradient text-lg px-8 py-7 hover:scale-105 transition-transform shadow-lg">
                    <Plus className="w-5 h-5 mr-2" />
                    {currentLanguage === 'en' ? 'Add New Listing' : 'नई लिस्टिंग जोड़ें'}
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
              </div>
            </div>
          </AnimateOnScroll>

          {farmerProducts.length === 0 ? (
            <AnimateOnScroll animation="slide-up" delay={0.05}>
              <Card className="mb-10 border-2 border-dashed border-primary/35 bg-primary/[0.04] shadow-sm">
                <CardHeader>
                  <CardTitle className={`flex items-center gap-2 ${currentLanguage === 'hi' ? 'font-hindi' : ''}`}>
                    <Package className="h-5 w-5 text-primary" />
                    {currentLanguage === 'en' ? 'No listings yet' : 'अभी कोई लिस्टिंग नहीं'}
                  </CardTitle>
                  <CardDescription className={currentLanguage === 'hi' ? 'font-hindi' : ''}>
                    {currentLanguage === 'en'
                      ? 'Add your first product so buyers can find you. Share your shop link with regular customers.'
                      : 'पहला उत्पाद जोड़ें ताकि खरीदार आपको ढूँढ सकें। नियमित ग्राहकों को अपनी दुकान का लिंक भेजें।'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                  <Button className="btn-primary-gradient gap-2" asChild>
                    <Link to="/farmer/listings?coach=1">
                      <Plus className="h-4 w-4" />
                      {currentLanguage === 'en' ? 'Add listing' : 'लिस्टिंग जोड़ें'}
                    </Link>
                  </Button>
                  <Button type="button" variant="outline" className="gap-2" onClick={() => copyShopShareLink()}>
                    <Share2 className="h-4 w-4" />
                    {currentLanguage === 'en' ? 'Copy shop link' : 'दुकान का लिंक कॉपी करें'}
                  </Button>
                </CardContent>
              </Card>
            </AnimateOnScroll>
          ) : null}

          {/* Stats */}
          <AnimateOnScroll animation="slide-up" delay={0.1}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
              <StatCard 
                title={currentLanguage === 'en' ? 'Active Listings' : 'सक्रिय लिस्टिंग'} 
                value={activeListingsCount} 
                icon={Package} 
                variant="primary"
                subtitle={
                  farmerProducts.length === activeListingsCount
                    ? currentLanguage === 'en'
                      ? 'Products live'
                      : 'उत्पाद लाइव'
                    : currentLanguage === 'en'
                      ? `${farmerProducts.length} total incl. hidden`
                      : `${farmerProducts.length} कुल (छिपी सहित)`
                }
              />
              <StatCard 
                title={currentLanguage === 'en' ? 'Total Orders' : 'कुल ऑर्डर'} 
                value={farmerOrders.length} 
                icon={ShoppingCart} 
                variant="success"
                subtitle={`${pendingOrders} ${currentLanguage === 'en' ? 'pending' : 'लंबित'}`}
              />
              <Link to="/farmer/earnings" className="block">
                <StatCard 
                  title={currentLanguage === 'en' ? 'Total Earnings' : 'कुल कमाई'} 
                  value={`₹${totalEarnings.toLocaleString()}`} 
                  icon={TrendingUp} 
                  variant="accent"
                  subtitle={`₹${todayEarnings.toLocaleString()} ${currentLanguage === 'en' ? 'today' : 'आज'}`}
                />
              </Link>
              <StatCard 
                title={currentLanguage === 'en' ? 'Avg Rating' : 'औसत रेटिंग'} 
                value={ratingStats.avgDisplay}
                icon={Star} 
                variant="warning"
                subtitle={
                  ratingStats.count > 0
                    ? `${ratingStats.count} ${currentLanguage === 'en' ? 'reviews' : 'समीक्षाएं'}`
                    : currentLanguage === 'en'
                      ? 'No reviews yet'
                      : 'अभी कोई समीक्षा नहीं'
                }
              />
            </div>
          </AnimateOnScroll>

          <AnimateOnScroll animation="slide-up" delay={0.11}>
            <FarmerWeatherWidget user={user} currentLanguage={currentLanguage} />
          </AnimateOnScroll>

          {payoutSnapshot !== null ? (
            <AnimateOnScroll animation="slide-up" delay={0.12}>
              <Link
                to="/farmer/earnings"
                className="mb-6 flex items-center gap-3 rounded-xl border border-border/80 bg-card/90 px-4 py-3 text-sm shadow-sm transition-colors hover:border-primary/35 hover:bg-primary/[0.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/15 text-accent">
                  <Wallet className="h-5 w-5" aria-hidden />
                </div>
                <p
                  className={`min-w-0 flex-1 leading-snug text-muted-foreground ${currentLanguage === 'hi' ? 'font-hindi' : ''}`}
                >
                  {currentLanguage === 'en' ? (
                    <>
                      <span className="font-medium text-foreground">Available balance</span>{' '}
                      <span className="tabular-nums text-foreground">{formatPrice(payoutSnapshot.availableBalance)}</span>
                      <span className="mx-1.5 text-border">·</span>
                      <span className="font-medium text-foreground">Pending withdrawal</span>{' '}
                      <span className="tabular-nums text-foreground">{formatPrice(payoutSnapshot.pendingWithdrawal)}</span>
                    </>
                  ) : (
                    <>
                      <span className="font-medium text-foreground">उपलब्ध शेष</span>{' '}
                      <span className="tabular-nums text-foreground">{formatPrice(payoutSnapshot.availableBalance)}</span>
                      <span className="mx-1.5 text-border">·</span>
                      <span className="font-medium text-foreground">लंबित निकासी</span>{' '}
                      <span className="tabular-nums text-foreground">{formatPrice(payoutSnapshot.pendingWithdrawal)}</span>
                    </>
                  )}
                </p>
                <ArrowRight className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
              </Link>
            </AnimateOnScroll>
          ) : null}

          {/* Farmer Operations Board */}
          <AnimateOnScroll animation="slide-up" delay={0.15}>
            <Card className="border-2 border-green-200/70 dark:border-green-900/40 shadow-lg mb-10">
              <CardHeader className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-b">
                <CardTitle>
                  {currentLanguage === 'en' ? "Today's Farm Operations" : 'आज के कृषि कार्य'}
                </CardTitle>
                <CardDescription>
                  {currentLanguage === 'en'
                    ? 'Prioritize dispatch and stock readiness.'
                    : 'डिस्पैच और स्टॉक तैयारी को प्राथमिकता दें।'}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 grid sm:grid-cols-3 gap-4">
                <Link
                  to="/farmer/orders?status=pending"
                  aria-label={
                    currentLanguage === 'en'
                      ? `Need confirmation, ${pendingOrderCount} orders. Open orders filtered by pending.`
                      : `पुष्टि लंबित, ${pendingOrderCount} ऑर्डर। लंबित ऑर्डर सूची खोलें।`
                  }
                  className="group relative flex flex-col rounded-xl border bg-card p-4 text-left shadow-sm transition-all hover:border-primary/45 hover:bg-primary/[0.04] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm text-muted-foreground">
                        {currentLanguage === 'en' ? 'Need confirmation' : 'पुष्टि लंबित'}
                      </p>
                      <p className="text-2xl font-bold mt-1 tabular-nums">
                        {pendingOrderCount}
                      </p>
                    </div>
                    <ArrowRight
                      className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary"
                      aria-hidden
                    />
                  </div>
                </Link>
                <Link
                  to="/farmer/orders?status=processing"
                  aria-label={
                    currentLanguage === 'en'
                      ? `In processing, ${processingOrderCount} orders. Open orders filtered by processing.`
                      : `प्रोसेसिंग में, ${processingOrderCount} ऑर्डर। प्रोसेसिंग ऑर्डर सूची खोलें।`
                  }
                  className="group relative flex flex-col rounded-xl border bg-card p-4 text-left shadow-sm transition-all hover:border-primary/45 hover:bg-primary/[0.04] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm text-muted-foreground">
                        {currentLanguage === 'en' ? 'In processing' : 'प्रोसेसिंग में'}
                      </p>
                      <p className="text-2xl font-bold mt-1 tabular-nums">
                        {processingOrderCount}
                      </p>
                    </div>
                    <ArrowRight
                      className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary"
                      aria-hidden
                    />
                  </div>
                </Link>
                <Link
                  to="/farmer/listings?sort=quantity"
                  aria-label={
                    currentLanguage === 'en'
                      ? `Low stock listings, ${lowStockListingCount} items. Open listings sorted by quantity, lowest first.`
                      : `कम स्टॉक लिस्टिंग, ${lowStockListingCount}। मात्रा के अनुसार लिस्टिंग खोलें।`
                  }
                  className="group relative flex flex-col rounded-xl border bg-card p-4 text-left shadow-sm transition-all hover:border-primary/45 hover:bg-primary/[0.04] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm text-muted-foreground">
                        {currentLanguage === 'en' ? 'Low stock listings' : 'कम स्टॉक लिस्टिंग'}
                      </p>
                      <p className="text-2xl font-bold mt-1 tabular-nums">
                        {lowStockListingCount}
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
                  stretchGridItems
                  className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4"
                >
                  {[
                    { icon: Package, label: currentLanguage === 'en' ? 'My Listings' : 'मेरी लिस्टिंग', path: '/farmer/listings', color: 'from-primary/20 to-primary/10' },
                    {
                      icon: Sparkles,
                      label: currentLanguage === 'en' ? 'AI listing help' : 'AI लिस्टिंग मदद',
                      path: '/farmer/listings?coach=1',
                      color: 'from-violet-500/25 to-violet-500/10',
                    },
                    { icon: ShoppingCart, label: currentLanguage === 'en' ? 'Orders' : 'ऑर्डर', path: '/farmer/orders', color: 'from-success/20 to-success/10' },
                    { icon: Wallet, label: currentLanguage === 'en' ? 'Earnings' : 'कमाई', path: '/farmer/earnings', color: 'from-accent/20 to-accent/10' },
                    { icon: BarChart3, label: currentLanguage === 'en' ? 'Analytics' : 'विश्लेषण', path: '/farmer/analytics', color: 'from-secondary/20 to-secondary/10' },
                    { icon: MessageCircle, label: currentLanguage === 'en' ? 'Messages' : 'संदेश', path: '/farmer/chats', badge: unreadChatCount, color: 'from-purple-500/20 to-purple-500/10' },
                    { icon: Star, label: currentLanguage === 'en' ? 'Reviews' : 'समीक्षाएं', path: '/farmer/reviews', color: 'from-warning/20 to-warning/10' },
                  ].map((item) => (
                    <Link 
                      key={item.path} 
                      to={item.path} 
                      className="group relative flex h-full min-h-[124px] flex-col items-center justify-center gap-3 rounded-xl border-2 border-border bg-gradient-to-br from-card to-muted/30 p-5 transition-all duration-300 hover:scale-105 hover:border-primary/50 hover:shadow-xl"
                    >
                      <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${item.color} transition-transform group-hover:scale-110`}>
                        <item.icon className="h-6 w-6 shrink-0 text-primary" strokeWidth={2} />
                      </div>
                      {typeof item.badge === 'number' && item.badge > 0 ? (
                        <Badge className="absolute -right-2 -top-2 bg-accent px-2 py-0.5 text-xs font-bold text-accent-foreground">
                          {item.badge > 99 ? '99+' : item.badge}
                        </Badge>
                      ) : null}
                      <span className={`text-center text-sm font-semibold ${currentLanguage === 'hi' ? 'font-hindi' : ''}`}>{item.label}</span>
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
                      {currentLanguage === 'en' ? 'Recent Orders' : 'हाल के ऑर्डर'}
                    </CardTitle>
                    <CardDescription>
                      {currentLanguage === 'en' ? 'Your latest order updates' : 'आपके नवीनतम ऑर्डर अपडेट'}
                    </CardDescription>
                  </div>
                  <Link to="/farmer/orders">
                    <Button variant="ghost" size="sm" className="gap-2">
                      {currentLanguage === 'en' ? 'View All' : 'सभी देखें'}
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {farmerOrders.length > 0 ? (
                  <div className="space-y-4">
                    {farmerOrders.slice(0, 3).map((order) => (
                      <OrderCard key={order.id} order={order} userRole="farmer" />
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center py-12 text-center">
                    <ShoppingCart className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
                    <p className={`mb-6 max-w-md text-muted-foreground ${currentLanguage === 'hi' ? 'font-hindi' : ''}`}>
                      {currentLanguage === 'en'
                        ? 'When buyers place orders, they will show up here. List products and share your shop link.'
                        : 'जब खरीदार ऑर्डर करेंगे, वे यहाँ दिखेंगे। उत्पाद लिस्ट करें और दुकान का लिंक साझा करें।'}
                    </p>
                    <div className="flex w-full max-w-md flex-col gap-3 sm:flex-row sm:justify-center">
                      <Button className="btn-primary-gradient gap-2" asChild>
                        <Link to="/farmer/listings?coach=1">
                          <Plus className="h-4 w-4" />
                          {currentLanguage === 'en' ? 'Add listing' : 'लिस्टिंग जोड़ें'}
                        </Link>
                      </Button>
                      <Button type="button" variant="outline" className="gap-2" onClick={() => copyShopShareLink()}>
                        <Share2 className="h-4 w-4" />
                        {currentLanguage === 'en' ? 'Copy shop link' : 'दुकान का लिंक कॉपी करें'}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </AnimateOnScroll>

          {/* Notifications */}
          <AnimateOnScroll animation="slide-up" delay={0.4}>
            <Card className="border-2 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-secondary/10 to-secondary/5 border-b">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Bell className="w-5 h-5 text-secondary" />
                      {currentLanguage === 'en' ? 'Notifications' : 'सूचनाएं'}
                    </CardTitle>
                    <CardDescription>
                      {currentLanguage === 'en' ? 'Stay updated with your farm activities' : 'अपनी खेती की गतिविधियों से अपडेट रहें'}
                    </CardDescription>
                  </div>
                  <Link to="/notifications">
                    <Button variant="ghost" size="sm" className="gap-2">
                      {currentLanguage === 'en' ? 'View All' : 'सभी देखें'}
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {notifications.length > 0 ? (
                  <div className="divide-y divide-border">
                    {notifications.slice(0, 3).map((notif) => {
                      const row = (
                        <div
                          className={`p-5 hover:bg-muted/50 transition-colors ${!notif.isRead ? 'bg-primary/5 border-l-4 border-l-primary' : ''}`}
                        >
                          <div className="flex items-start gap-3">
                            <div
                              className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                !notif.isRead ? 'bg-primary/20' : 'bg-muted'
                              }`}
                            >
                              <Bell
                                className={`w-5 h-5 ${!notif.isRead ? 'text-primary' : 'text-muted-foreground'}`}
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-base mb-1">{notif.title}</h4>
                              <p className="text-sm text-muted-foreground leading-relaxed">{notif.message}</p>
                              <p className="text-xs text-muted-foreground mt-2">
                                {new Date(notif.createdAt).toLocaleString(
                                  currentLanguage === 'en' ? 'en-IN' : 'hi-IN'
                                )}
                              </p>
                            </div>
                            {!notif.isRead && (
                              <Badge variant="secondary" className="bg-primary text-primary-foreground shrink-0">
                                {currentLanguage === 'en' ? 'New' : 'नया'}
                              </Badge>
                            )}
                          </div>
                        </div>
                      );
                      if (notif.link && notif.link.startsWith('/')) {
                        return (
                          <Link key={notif.id} to={notif.link} className="block">
                            {row}
                          </Link>
                        );
                      }
                      return <div key={notif.id}>{row}</div>;
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Bell className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <p className={`text-muted-foreground ${currentLanguage === 'hi' ? 'font-hindi' : ''}`}>
                      {currentLanguage === 'en' ? 'No notifications' : 'कोई सूचना नहीं'}
                    </p>
                  </div>
                )}
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

export default FarmerDashboard;
