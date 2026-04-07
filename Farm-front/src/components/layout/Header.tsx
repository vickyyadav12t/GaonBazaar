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
      active
        ? 'text-primary-foreground'
        : 'text-primary-foreground/90 hover:text-primary-foreground'
    }`;

  return (
    <header className="sticky top-0 z-50 shadow-md">
      <div className="relative bg-primary text-primary-foreground">
        <div
          className="pointer-events-none absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.08%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-40"
          aria-hidden
        />
        <div className="relative container mx-auto px-3 sm:px-4">
          <div className="flex items-center justify-between gap-3 sm:gap-6 min-h-[4.5rem] py-2 md:min-h-[4.75rem] md:py-2.5">
            <div className="flex items-center gap-4 md:gap-8 min-w-0 flex-1">
              <Link
                to="/"
                className="shrink-0 flex items-center self-center bg-transparent shadow-none leading-none [-webkit-tap-highlight-color:transparent]"
                aria-label="GaonBazaar home"
              >
                <img
                  src={`${import.meta.env.BASE_URL}assets/logo.png`}
                  alt="GaonBazaar"
                  className="h-[32px] w-auto max-w-none shrink-0 object-contain block m-0 p-0 align-middle border-0 bg-transparent"
                  style={{ filter: 'brightness(0) invert(1)', backgroundColor: 'transparent' }}
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
              className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-full bg-white/15 hover:bg-white/25 transition-colors text-sm font-medium text-primary-foreground"
            >
              <Globe className="w-4 h-4 shrink-0" />
              <span>{currentLanguage === 'en' ? 'हिं' : 'EN'}</span>
            </button>

            {isAuthenticated && (
              <Link
                to="/notifications"
                className="relative p-2 rounded-full text-primary-foreground hover:bg-white/10 transition-colors"
              >
                <Bell className="w-5 h-5" />
                {unreadNotificationCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[1.125rem] h-[1.125rem] px-0.5 bg-accent text-accent-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
                    {unreadNotificationCount > 99 ? '99+' : unreadNotificationCount}
                  </span>
                )}
              </Link>
            )}

            {isAuthenticated && (
              <Link
                to="/settings"
                className="p-2 rounded-full text-primary-foreground hover:bg-white/10 transition-colors hidden sm:inline-flex"
              >
                <Settings className="w-5 h-5" />
              </Link>
            )}

            {isAuthenticated && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="hidden md:inline-flex items-center gap-2 border-primary-foreground/40 text-primary-foreground bg-transparent hover:bg-white/10"
                onClick={handleLogout}
              >
                <LogOut className="w-4 h-4" />
                {currentLanguage === 'en' ? 'Log out' : 'लॉग आउट'}
              </Button>
            )}

            {isAuthenticated && user?.role === 'buyer' && (
              <Link
                to="/buyer/cart"
                className="relative p-2 rounded-full text-primary-foreground hover:bg-white/10 transition-colors"
              >
                <ShoppingCart className="w-5 h-5" />
                {cartItemCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[1.125rem] h-[1.125rem] px-0.5 bg-accent text-accent-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
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
                    className="text-primary-foreground hover:bg-white/10 hover:text-primary-foreground"
                  >
                    Login
                  </Button>
                </Link>
                <Link to="/register">
                  <Button size="sm" className="bg-white text-primary hover:bg-white/90 shadow-sm">
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
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/20 ring-2 ring-white/25 flex items-center justify-center overflow-hidden">
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
                    <User className="w-5 h-5 text-primary-foreground" />
                  )}
                </div>
              </Link>
            )}

            <button
              type="button"
              className="md:hidden p-2 rounded-lg text-primary-foreground hover:bg-white/10 transition-colors"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-expanded={isMenuOpen}
              aria-label="Menu"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <nav className="md:hidden border-t border-gray-100 bg-white animate-slide-up shadow-inner">
            <div className="container mx-auto px-4 flex flex-col gap-2 py-4">
              {isAuthenticated && (
                <>
                  <Link
                    to="/marketplace"
                    className="px-4 py-3 rounded-lg text-gray-800 hover:bg-gray-50 hover:text-green-600 transition-colors font-medium"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Marketplace
                  </Link>
                  <Link
                    to="/calendar"
                    className="px-4 py-3 rounded-lg text-gray-800 hover:bg-gray-50 hover:text-green-600 transition-colors font-medium"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Seasonal Guide
                  </Link>
                  <Link
                    to="/support"
                    className="px-4 py-3 rounded-lg text-gray-800 hover:bg-gray-50 hover:text-green-600 transition-colors font-medium"
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
                    className="px-4 py-3 rounded-lg text-gray-800 hover:bg-gray-50 hover:text-green-600 transition-colors font-medium"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Farmer Dashboard
                  </Link>
                  <Link
                    to="/farmer/news"
                    className="px-4 py-3 rounded-lg text-gray-800 hover:bg-gray-50 hover:text-green-600 transition-colors font-medium"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Farmer news
                  </Link>
                </>
              )}
              {isAuthenticated && user?.role === 'buyer' && (
                <Link 
                  to="/buyer/dashboard" 
                  className="px-4 py-3 rounded-lg text-gray-800 hover:bg-gray-50 hover:text-green-600 transition-colors font-medium"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Buyer Dashboard
                </Link>
              )}
              {isAuthenticated && user?.role === 'admin' && (
                <Link 
                  to={ROUTES.ADMIN_DASHBOARD} 
                  className="px-4 py-3 rounded-lg text-gray-800 hover:bg-gray-50 hover:text-green-600 transition-colors font-medium"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Admin Dashboard
                </Link>
              )}
              {isAuthenticated && (
                <>
                  <Link 
                    to="/notifications" 
                    className="px-4 py-3 rounded-lg text-gray-800 hover:bg-gray-50 hover:text-green-600 transition-colors font-medium"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Notifications
                  </Link>
                  <Link 
                    to="/settings" 
                    className="px-4 py-3 rounded-lg text-gray-800 hover:bg-gray-50 hover:text-green-600 transition-colors font-medium"
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
    </header>
  );
};

export default Header;
