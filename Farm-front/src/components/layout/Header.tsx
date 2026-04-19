import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ShoppingCart, User, Menu, X, Globe, Bell, Settings, LogOut } from 'lucide-react';
import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAppSelector, useAppDispatch } from '@/hooks/useRedux';
import { toggleLanguage } from '@/store/slices/languageSlice';
import { logout } from '@/store/slices/authSlice';
import { clearCart } from '@/store/slices/cartSlice';
import { Button } from '@/components/ui/button';
import { apiService, clearAuthToken, getAuthToken } from '@/services/api';
import {
  FARM_CHAT_UNREAD_CHANGED_EVENT,
  FARM_NOTIFICATION_UNREAD_CHANGED_EVENT,
  ROUTES,
} from '@/constants';
import { getSocketOrigin } from '@/lib/resolveApiBaseUrl';
import { resolveBackendAssetUrl } from '@/lib/productImageUrl';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { currentLanguage } = useAppSelector((state) => state.language);
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  const { items } = useAppSelector((state) => state.cart);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const cartItemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const handleLogout = () => {
    clearAuthToken();
    dispatch(clearCart());
    dispatch(logout());
    setIsMenuOpen(false);
    navigate('/login');
  };

  useEffect(() => {
    const fetchUnreadCount = async () => {
      if (!isAuthenticated) {
        setUnreadNotificationCount(0);
        return;
      }
      try {
        const res = await apiService.notifications.getUnreadCount();
        setUnreadNotificationCount(Number(res.data?.unreadCount) || 0);
      } catch {
        setUnreadNotificationCount(0);
      }
    };

    fetchUnreadCount();
  }, [isAuthenticated, location.pathname]);

  // Bell count when notifications are marked read / deleted on the Notifications page (no socket).
  useEffect(() => {
    if (!isAuthenticated) return;
    const refresh = async () => {
      try {
        const res = await apiService.notifications.getUnreadCount();
        setUnreadNotificationCount(Number(res.data?.unreadCount) || 0);
      } catch {
        setUnreadNotificationCount(0);
      }
    };
    const onUnreadChanged = (evt: Event) => {
      const maybe = evt as CustomEvent<{ unreadCount?: number }>;
      const next = maybe?.detail?.unreadCount;
      if (typeof next === 'number') {
        setUnreadNotificationCount(next);
        return;
      }
      void refresh();
    };
    window.addEventListener(FARM_NOTIFICATION_UNREAD_CHANGED_EVENT, onUnreadChanged);
    return () => window.removeEventListener(FARM_NOTIFICATION_UNREAD_CHANGED_EVENT, onUnreadChanged);
  }, [isAuthenticated]);

  // Live bell count + nudge chat list pages when a message notification is created (Socket.IO).
  useEffect(() => {
    if (!isAuthenticated) return;
    const token = getAuthToken();
    if (!token) return;

    const socketBase = getSocketOrigin();

    const socket = io(socketBase, { auth: { token } });

    const refreshUnread = async () => {
      try {
        const res = await apiService.notifications.getUnreadCount();
        setUnreadNotificationCount(Number(res.data?.unreadCount) || 0);
      } catch {
        setUnreadNotificationCount(0);
      }
    };

    const onNotificationNew = (payload?: { scope?: string }) => {
      void refreshUnread();
      if (payload?.scope === 'message') {
        window.dispatchEvent(new CustomEvent(FARM_CHAT_UNREAD_CHANGED_EVENT));
      }
    };

    socket.on('notification:new', onNotificationNew);

    return () => {
      socket.off('notification:new', onNotificationNew);
      socket.disconnect();
    };
  }, [isAuthenticated, user?.id]);

  const barLink = (active: boolean) =>
    `text-sm font-medium transition-colors ${
      active ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
    }`;

  return (
    <header className="sticky top-0 z-50 border-b border-border/80 bg-card/90 shadow-sm backdrop-blur-md supports-[backdrop-filter]:bg-card/80">
      <div className="relative">
        <div className="relative container mx-auto min-w-0 px-3 sm:px-4">
          <div className="flex min-h-[4.25rem] items-center justify-between gap-3 py-2 sm:gap-6 md:min-h-[4.5rem] md:py-2.5">
            <div className="flex items-center gap-4 md:gap-8 min-w-0 flex-1">
              <Link
                to="/"
                className="shrink-0 flex items-center self-center bg-transparent shadow-none leading-none [-webkit-tap-highlight-color:transparent]"
                aria-label="GaonBazaar home"
              >
                <img
                  src={`${import.meta.env.BASE_URL}assets/logo.png`}
                  alt="GaonBazaar"
                  className="block h-[30px] w-auto max-w-[200px] shrink-0 border-0 bg-transparent object-contain p-0 align-middle sm:h-[32px]"
                />
              </Link>
            <nav className="hidden md:flex items-center gap-5 lg:gap-7 flex-wrap min-w-0">
            {isAuthenticated && user?.role === 'farmer' && (
              <>
                <Link
                  to="/farmer/dashboard"
                  className={barLink(location.pathname === '/farmer/dashboard')}
                >
                  Farm Home
                </Link>
                <Link
                  to="/marketplace"
                  className={barLink(location.pathname === '/marketplace')}
                >
                  Marketplace
                </Link>
                <Link
                  to="/farmer/listings"
                  className={barLink(location.pathname.includes('/farmer/listings'))}
                >
                  Listings
                </Link>
                <Link
                  to="/farmer/orders"
                  className={barLink(location.pathname.includes('/farmer/orders'))}
                >
                  Fulfillment
                </Link>
                <Link
                  to="/farmer/news"
                  className={barLink(location.pathname === '/farmer/news')}
                >
                  News
                </Link>
              </>
            )}
            {isAuthenticated && user?.role === 'buyer' && (
              <>
                <Link
                  to="/buyer/dashboard"
                  className={barLink(location.pathname === '/buyer/dashboard')}
                >
                  Buyer Home
                </Link>
                <Link
                  to="/marketplace"
                  className={barLink(location.pathname === '/marketplace')}
                >
                  Marketplace
                </Link>
                <Link
                  to="/buyer/wishlist"
                  className={barLink(location.pathname.includes('/buyer/wishlist'))}
                >
                  Wishlist
                </Link>
                <Link
                  to="/buyer/chats"
                  className={barLink(
                    location.pathname.includes('/buyer/chats') || location.pathname.startsWith('/chat/')
                  )}
                >
                  Chats
                </Link>
                <Link
                  to="/buyer/orders"
                  className={barLink(location.pathname.includes('/buyer/orders'))}
                >
                  My Orders
                </Link>
              </>
            )}
            {isAuthenticated && user?.role === 'admin' && (
              <Link
                to={ROUTES.ADMIN_DASHBOARD}
                className={barLink(location.pathname.startsWith('/admin'))}
              >
                Admin
              </Link>
            )}
            {isAuthenticated && (
              <>
                <Link to="/calendar" className={barLink(location.pathname === '/calendar')}>
                  Seasonal Guide
                </Link>
                <Link to="/support" className={barLink(location.pathname === '/support')}>
                  Help
                </Link>
              </>
            )}
              </nav>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <button
              type="button"
              onClick={() => dispatch(toggleLanguage())}
              className="flex items-center gap-1 rounded-lg border border-border bg-muted/60 px-2.5 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              <Globe className="w-4 h-4 shrink-0" />
              <span>{currentLanguage === 'en' ? 'हिं' : 'EN'}</span>
            </button>

            {isAuthenticated && (
              <Link
                to="/notifications"
                className="relative rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <Bell className="h-5 w-5" />
                {unreadNotificationCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-[1.125rem] min-w-[1.125rem] items-center justify-center rounded-full bg-gold px-0.5 text-[10px] font-bold text-gold-foreground shadow-sm">
                    {unreadNotificationCount > 99 ? '99+' : unreadNotificationCount}
                  </span>
                )}
              </Link>
            )}

            {isAuthenticated && (
              <Link
                to="/settings"
                className="hidden rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:inline-flex"
              >
                <Settings className="h-5 w-5" />
              </Link>
            )}

            {isAuthenticated && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="hidden border-border bg-transparent md:inline-flex hover:bg-muted"
                onClick={handleLogout}
              >
                <LogOut className="w-4 h-4" />
                {currentLanguage === 'en' ? 'Log out' : 'लॉग आउट'}
              </Button>
            )}

            {isAuthenticated && user?.role === 'buyer' && (
              <Link
                to="/buyer/cart"
                className="relative rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <ShoppingCart className="h-5 w-5" />
                {cartItemCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-[1.125rem] min-w-[1.125rem] items-center justify-center rounded-full bg-gold px-0.5 text-[10px] font-bold text-gold-foreground shadow-sm">
                    {cartItemCount}
                  </span>
                )}
              </Link>
            )}

            {!isAuthenticated ? (
              <div className="hidden sm:flex items-center gap-2">
                <Link to="/login">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    Login
                  </Button>
                </Link>
                <Link to="/register">
                  <Button size="sm" className="shadow-sm">
                    Register
                  </Button>
                </Link>
              </div>
            ) : (
              <Link
                to={
                  user?.role === 'farmer'
                    ? '/farmer/profile'
                    : user?.role === 'buyer'
                      ? '/buyer/profile'
                      : '/admin/profile'
                }
                className="hidden sm:block"
              >
                <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-border bg-muted ring-2 ring-background sm:h-10 sm:w-10">
                  {user?.avatar ? (
                    <img
                      src={resolveBackendAssetUrl(user.avatar)}
                      alt={user.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      decoding="async"
                      onError={(e) => {
                        const el = e.currentTarget;
                        el.onerror = null;
                        el.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'User')}&size=128`;
                      }}
                    />
                  ) : (
                    <User className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
              </Link>
            )}

            <button
              type="button"
              className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted md:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-expanded={isMenuOpen}
              aria-label="Menu"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <nav className="animate-slide-up border-t border-border bg-card shadow-inner md:hidden">
            <div className="container mx-auto flex flex-col gap-1 px-4 py-4">
              {isAuthenticated && (
                <>
                  <Link
                    to="/marketplace"
                    className="rounded-lg px-4 py-3 font-medium text-foreground transition-colors hover:bg-muted hover:text-primary"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Marketplace
                  </Link>
                  <Link
                    to="/calendar"
                    className="rounded-lg px-4 py-3 font-medium text-foreground transition-colors hover:bg-muted hover:text-primary"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Seasonal Guide
                  </Link>
                  <Link
                    to="/support"
                    className="rounded-lg px-4 py-3 font-medium text-foreground transition-colors hover:bg-muted hover:text-primary"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Help &amp; Support
                  </Link>
                </>
              )}
              {isAuthenticated && user?.role === 'farmer' && (
                <>
                  <Link
                    to="/farmer/dashboard"
                    className="rounded-lg px-4 py-3 font-medium text-foreground transition-colors hover:bg-muted hover:text-primary"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Farmer Dashboard
                  </Link>
                  <Link
                    to="/farmer/news"
                    className="rounded-lg px-4 py-3 font-medium text-foreground transition-colors hover:bg-muted hover:text-primary"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Farmer news
                  </Link>
                </>
              )}
              {isAuthenticated && user?.role === 'buyer' && (
                <Link 
                  to="/buyer/dashboard" 
                  className="rounded-lg px-4 py-3 font-medium text-foreground transition-colors hover:bg-muted hover:text-primary"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Buyer Dashboard
                </Link>
              )}
              {isAuthenticated && user?.role === 'admin' && (
                <Link 
                  to={ROUTES.ADMIN_DASHBOARD} 
                  className="rounded-lg px-4 py-3 font-medium text-foreground transition-colors hover:bg-muted hover:text-primary"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Admin Dashboard
                </Link>
              )}
              {isAuthenticated && (
                <>
                  <Link 
                    to="/notifications" 
                    className="rounded-lg px-4 py-3 font-medium text-foreground transition-colors hover:bg-muted hover:text-primary"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Notifications
                  </Link>
                  <Link 
                    to="/settings" 
                    className="rounded-lg px-4 py-3 font-medium text-foreground transition-colors hover:bg-muted hover:text-primary"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Settings
                  </Link>
                  <button
                    type="button"
                    className="px-4 py-3 rounded-lg hover:bg-muted transition-colors font-medium text-left flex items-center gap-2 text-destructive"
                    onClick={handleLogout}
                  >
                    <LogOut className="w-4 h-4 shrink-0" />
                    {currentLanguage === 'en' ? 'Log out' : 'लॉग आउट'}
                  </button>
                </>
              )}
              {!isAuthenticated && (
                <div className="flex gap-2 px-4 pt-2">
                  <Link to="/login" className="flex-1" onClick={() => setIsMenuOpen(false)}>
                    <Button variant="outline" className="w-full">Login</Button>
                  </Link>
                  <Link to="/register" className="flex-1" onClick={() => setIsMenuOpen(false)}>
                    <Button className="w-full bg-primary hover:bg-primary-dark">Register</Button>
                  </Link>
                </div>
              )}
            </div>
        </nav>
      )}
      </div>
    </header>
  );
};

export default Header;
