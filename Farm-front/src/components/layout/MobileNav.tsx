import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Home,
  Search,
  MessageCircle,
  Package,
  User,
  ShoppingCart,
  Wallet,
  LayoutGrid,
  BarChart3,
  Star,
  Bell,
  Newspaper,
} from 'lucide-react';
import { useAppSelector } from '@/hooks/useRedux';
import { adminPanelHref, FARM_NOTIFICATION_UNREAD_CHANGED_EVENT } from '@/constants';
import { apiService } from '@/services/api';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';

const FARMER_MORE_PATHS = ['/farmer/profile', '/farmer/analytics', '/farmer/reviews', '/farmer/news'] as const;
const BUYER_MORE_PATHS = ['/buyer/profile', '/notifications', '/buyer/reviews'] as const;

const MobileNav = () => {
  const location = useLocation();
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  const { currentLanguage } = useAppSelector((state) => state.language);
  const { items: cartItems } = useAppSelector((state) => state.cart);
  const [farmerMoreOpen, setFarmerMoreOpen] = useState(false);
  const [buyerMoreOpen, setBuyerMoreOpen] = useState(false);
  const [buyerNotifUnread, setBuyerNotifUnread] = useState(0);

  const t = (en: string, hi: string) => (currentLanguage === 'hi' ? hi : en);

  const cartItemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'buyer') {
      setBuyerNotifUnread(0);
      return;
    }

    const refreshUnread = async () => {
      try {
        const res = await apiService.notifications.getUnreadCount();
        setBuyerNotifUnread(Number(res.data?.unreadCount) || 0);
      } catch {
        setBuyerNotifUnread(0);
      }
    };

    void refreshUnread();

    const onUnreadChanged = (evt: Event) => {
      const maybe = evt as CustomEvent<{ unreadCount?: number }>;
      const next = maybe?.detail?.unreadCount;
      if (typeof next === 'number') {
        setBuyerNotifUnread(next);
        return;
      }
      void refreshUnread();
    };
    window.addEventListener(FARM_NOTIFICATION_UNREAD_CHANGED_EVENT, onUnreadChanged);
    return () => window.removeEventListener(FARM_NOTIFICATION_UNREAD_CHANGED_EVENT, onUnreadChanged);
  }, [isAuthenticated, user?.role, location.pathname]);

  const getNavItems = () => {
    if (!isAuthenticated) {
      return [
        { icon: Home, label: 'Home', path: '/' },
        { icon: Search, label: 'Browse', path: '/marketplace' },
        { icon: User, label: 'Login', path: '/login' },
      ];
    }

    if (user?.role === 'farmer') {
      return [
        { icon: Home, label: t('Home', 'होम'), path: '/farmer/dashboard' },
        { icon: Package, label: t('Listings', 'लिस्टिंग'), path: '/farmer/listings' },
        { icon: MessageCircle, label: t('Chats', 'चैट'), path: '/farmer/chats' },
        { icon: ShoppingCart, label: t('Orders', 'ऑर्डर'), path: '/farmer/orders' },
        { icon: Wallet, label: t('Earnings', 'कमाई'), path: '/farmer/earnings' },
      ];
    }

    if (user?.role === 'buyer') {
      return [
        { icon: Home, label: t('Home', 'होम'), path: '/buyer/dashboard' },
        { icon: Search, label: t('Browse', 'बाज़ार'), path: '/marketplace' },
        { icon: MessageCircle, label: t('Chats', 'चैट'), path: '/buyer/chats' },
        { icon: ShoppingCart, label: t('Cart', 'कार्ट'), path: '/buyer/cart' },
        { icon: Package, label: t('Orders', 'ऑर्डर'), path: '/buyer/orders' },
      ];
    }

    // Admin — /admin?tab=… (canonical); order detail stays /admin/orders/:id
    return [
      { icon: Home, label: 'Dashboard', to: adminPanelHref('overview') },
      { icon: ShoppingCart, label: 'Orders', to: adminPanelHref('orders') },
      { icon: User, label: 'Users', to: adminPanelHref('users') },
      { icon: Package, label: 'Listings', to: adminPanelHref('listings') },
      { icon: MessageCircle, label: 'Reviews', to: adminPanelHref('reviews') },
    ];
  };

  const navItems = getNavItems();

  const isFarmerPathActive = (path: string) => {
    const p = location.pathname;
    if (path === '/farmer/dashboard') return p === '/farmer/dashboard';
    if (path === '/farmer/listings') return p.startsWith('/farmer/listings');
    if (path === '/farmer/chats') return p.startsWith('/farmer/chats') || p.startsWith('/chat');
    if (path === '/farmer/orders') return p.startsWith('/farmer/orders');
    if (path === '/farmer/earnings') return p === '/farmer/earnings';
    return p === path;
  };

  const farmerMoreActive = FARMER_MORE_PATHS.some((path) => location.pathname === path);

  const buyerMoreActive = BUYER_MORE_PATHS.some((path) => location.pathname === path);

  const isBuyerPathActive = (path: string) => {
    const p = location.pathname;
    if (path === '/buyer/dashboard') return p === '/buyer/dashboard';
    if (path === '/marketplace') return p === '/marketplace';
    if (path === '/buyer/chats') return p.startsWith('/buyer/chats') || p.startsWith('/chat');
    if (path === '/buyer/cart') return p === '/buyer/cart';
    if (path === '/buyer/orders') return p.startsWith('/buyer/orders');
    return p === path;
  };

  const farmerMoreLinks: {
    path: string;
    icon: typeof User;
    labelEn: string;
    labelHi: string;
  }[] = [
    { path: '/farmer/profile', icon: User, labelEn: 'Profile', labelHi: 'प्रोफ़ाइल' },
    { path: '/farmer/analytics', icon: BarChart3, labelEn: 'Analytics', labelHi: 'विश्लेषण' },
    { path: '/farmer/reviews', icon: Star, labelEn: 'Reviews', labelHi: 'समीक्षाएं' },
    { path: '/farmer/news', icon: Newspaper, labelEn: 'News', labelHi: 'समाचार' },
  ];

  const buyerMoreLinks: {
    path: string;
    icon: typeof User;
    labelEn: string;
    labelHi: string;
  }[] = [
    { path: '/buyer/profile', icon: User, labelEn: 'Profile', labelHi: 'प्रोफ़ाइल' },
    { path: '/notifications', icon: Bell, labelEn: 'Notifications', labelHi: 'सूचनाएं' },
    { path: '/buyer/reviews', icon: Star, labelEn: 'Reviews', labelHi: 'समीक्षाएं' },
  ];

  return (
    <nav className="mobile-nav md:hidden">
      {user?.role === 'farmer' && navItems ? (
        <Sheet open={farmerMoreOpen} onOpenChange={setFarmerMoreOpen}>
          <div className="flex items-stretch justify-between gap-0.5 px-1.5 py-2 sm:px-3">
            {navItems.map((item) => {
              if (!('path' in item)) return null;
              const path = item.path;
              const isActive = isFarmerPathActive(path);
              return (
                <Link
                  key={path}
                  to={path}
                  className={`nav-item flex-1 min-w-0 max-w-[68px] py-2 px-0.5 sm:max-w-[76px] ${isActive ? 'active' : ''}`}
                >
                  <item.icon className={`h-6 w-6 shrink-0 ${isActive ? 'text-primary' : ''}`} />
                  <span
                    className={`max-w-full truncate text-center text-[11px] leading-tight sm:text-xs ${isActive ? 'font-medium text-primary' : ''}`}
                  >
                    {item.label}
                  </span>
                </Link>
              );
            })}
            <button
              type="button"
              onClick={() => setFarmerMoreOpen(true)}
              className={`nav-item flex-1 min-w-0 max-w-[68px] py-2 px-0.5 sm:max-w-[76px] ${farmerMoreActive ? 'active' : ''}`}
              aria-label={t('More options', 'और विकल्प')}
              aria-expanded={farmerMoreOpen}
            >
              <LayoutGrid className={`h-6 w-6 shrink-0 ${farmerMoreActive ? 'text-primary' : ''}`} />
              <span
                className={`max-w-full truncate text-center text-[11px] leading-tight sm:text-xs ${farmerMoreActive ? 'font-medium text-primary' : ''}`}
              >
                {t('More', 'और')}
              </span>
            </button>
          </div>
          <SheetContent side="bottom" className="rounded-t-2xl pb-8">
            <SheetHeader className="text-left">
              <SheetTitle>{t('More', 'और')}</SheetTitle>
            </SheetHeader>
            <nav className="mt-4 flex flex-col gap-1" aria-label={t('Farmer navigation', 'किसान नेविगेशन')}>
              {farmerMoreLinks.map(({ path, icon: Icon, labelEn, labelHi }) => {
                const active = location.pathname === path;
                return (
                  <Link
                    key={path}
                    to={path}
                    onClick={() => setFarmerMoreOpen(false)}
                    className={`flex items-center gap-3 rounded-xl px-4 py-3.5 text-left text-base font-medium transition-colors ${
                      active ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-muted'
                    }`}
                  >
                    <Icon className="h-5 w-5 shrink-0 opacity-90" />
                    {t(labelEn, labelHi)}
                  </Link>
                );
              })}
            </nav>
          </SheetContent>
        </Sheet>
      ) : user?.role === 'buyer' && navItems ? (
        <Sheet open={buyerMoreOpen} onOpenChange={setBuyerMoreOpen}>
          <div className="flex items-stretch justify-between gap-0.5 px-1.5 py-2 sm:px-3">
            {navItems.map((item) => {
              if (!('path' in item)) return null;
              const path = item.path;
              const isActive = isBuyerPathActive(path);
              const showCartBadge = path === '/buyer/cart' && cartItemCount > 0;
              return (
                <Link
                  key={path}
                  to={path}
                  className={`nav-item relative flex-1 min-w-0 max-w-[68px] py-2 px-0.5 sm:max-w-[76px] ${isActive ? 'active' : ''}`}
                >
                  <span className="relative inline-flex">
                    <item.icon className={`h-6 w-6 shrink-0 ${isActive ? 'text-primary' : ''}`} />
                    {showCartBadge ? (
                      <Badge className="absolute -right-2.5 -top-2 min-h-[1.125rem] min-w-[1.125rem] border-2 border-card bg-gold px-0.5 py-0 text-[10px] font-bold leading-none text-gold-foreground">
                        {cartItemCount > 99 ? '99+' : cartItemCount}
                      </Badge>
                    ) : null}
                  </span>
                  <span
                    className={`max-w-full truncate text-center text-[11px] leading-tight sm:text-xs ${isActive ? 'font-medium text-primary' : ''}`}
                  >
                    {item.label}
                  </span>
                </Link>
              );
            })}
            <button
              type="button"
              onClick={() => setBuyerMoreOpen(true)}
              className={`nav-item flex-1 min-w-0 max-w-[68px] py-2 px-0.5 sm:max-w-[76px] ${buyerMoreActive ? 'active' : ''}`}
              aria-label={t('More options', 'और विकल्प')}
              aria-expanded={buyerMoreOpen}
            >
              <LayoutGrid className={`h-6 w-6 shrink-0 ${buyerMoreActive ? 'text-primary' : ''}`} />
              <span
                className={`max-w-full truncate text-center text-[11px] leading-tight sm:text-xs ${buyerMoreActive ? 'font-medium text-primary' : ''}`}
              >
                {t('More', 'और')}
              </span>
            </button>
          </div>
          <SheetContent side="bottom" className="rounded-t-2xl pb-8">
            <SheetHeader className="text-left">
              <SheetTitle>{t('More', 'और')}</SheetTitle>
            </SheetHeader>
            <nav className="mt-4 flex flex-col gap-1" aria-label={t('Buyer navigation', 'खरीदार नेविगेशन')}>
              {buyerMoreLinks.map(({ path, icon: Icon, labelEn, labelHi }) => {
                const active = location.pathname === path;
                const notifBadge = path === '/notifications' ? buyerNotifUnread : 0;
                return (
                  <Link
                    key={path}
                    to={path}
                    onClick={() => setBuyerMoreOpen(false)}
                    className={`flex items-center justify-between gap-3 rounded-xl px-4 py-3.5 text-left text-base font-medium transition-colors ${
                      active ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-muted'
                    }`}
                  >
                    <span className="flex min-w-0 items-center gap-3">
                      <Icon className="h-5 w-5 shrink-0 opacity-90" />
                      <span className="truncate">{t(labelEn, labelHi)}</span>
                    </span>
                    {notifBadge > 0 ? (
                      <Badge className="shrink-0 bg-gold px-2 py-0.5 text-xs font-bold text-gold-foreground">
                        {notifBadge > 99 ? '99+' : notifBadge}
                      </Badge>
                    ) : null}
                  </Link>
                );
              })}
            </nav>
          </SheetContent>
        </Sheet>
      ) : (
        <div className="flex items-center justify-around py-2 px-4">
          {navItems?.map((item) => {
            const path = 'to' in item ? item.to : item.path;
            const isActive =
              ('to' in item &&
                item.to.startsWith('/admin?') &&
                location.pathname === '/admin' &&
                new URLSearchParams(location.search).get('tab') ===
                  new URLSearchParams(item.to.split('?')[1] || '').get('tab')) ||
              ('to' in item &&
                item.to.includes('tab=orders') &&
                location.pathname.startsWith('/admin/orders/')) ||
              (!('to' in item) &&
                (location.pathname === item.path ||
                  (item.path === '/buyer/orders' &&
                    location.pathname.startsWith('/buyer/orders')))) ||
              ((item.path === '/buyer/chats' || item.path === '/farmer/chats') &&
                location.pathname.startsWith('/chat'));
            return (
              <Link
                key={path}
                to={path}
                className={`nav-item flex-1 max-w-[72px] ${isActive ? 'active' : ''}`}
              >
                <item.icon className={`w-6 h-6 ${isActive ? 'text-primary' : ''}`} />
                <span className={`text-xs ${isActive ? 'text-primary font-medium' : ''}`}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </nav>
  );
};

export default MobileNav;
