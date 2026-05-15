import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ShoppingCart, User, Menu, X, Globe, Bell, Settings, LogOut } from 'lucide-react';
import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAppSelector, useAppDispatch } from '@/hooks/useRedux';
import { setLanguage } from '@/store/slices/languageSlice';
import type { Language } from '@/types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LANGUAGES, languageMenuShortLabel } from '@/lib/i18n';
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
  const isLandingPage = location.pathname === '/';

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
    `rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
      active
        ? 'border-[#d89b2b] bg-[#f1dfae] text-[#274631]'
        : 'border-transparent text-[#fff3d7] hover:border-[#ceb98c] hover:bg-white/10 hover:text-white'
    }`;

  const headerBg = isLandingPage
    ? 'bg-[#315f3b] text-[#fff8e8]'
    : 'bg-[#315f3b] text-[#fff8e8]';

  return (
    <header className="sticky top-0 z-50 border-b border-[#25462e] shadow-[0_10px_24px_rgba(29,41,31,0.12)]">
      <div className={`relative ${headerBg}`}>
        <div
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,248,232,0.08),transparent_55%),url('data:image/svg+xml,%3Csvg%20width%3D%2268%22%20height%3D%2268%22%20viewBox%3D%220%200%2068%2068%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23f4e6bf%22%20fill-opacity%3D%220.08%22%3E%3Cpath%20d%3D%22M0%2067h68v1H0zm0-17h68v1H0zm0-17h68v1H0zm0-17h68v1H0zM67%200h1v68h-1zm-17%200h1v68h-1zm-17%200h1v68h-1zm-17%200h1v68h-1z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-80"
          aria-hidden
        />
        <div className="relative container mx-auto min-w-0 px-3 sm:px-4">
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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex items-center gap-1 rounded-full border border-[#c3b184] bg-white/10 px-2.5 py-1.5 text-sm font-medium text-[#fff3d7] transition-colors hover:bg-white/18 sm:px-3"
                  aria-label="Language"
                >
                  <Globe className="h-4 w-4 shrink-0" />
                  <span className="tabular-nums">{languageMenuShortLabel(currentLanguage)}</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[14rem]">
                {LANGUAGES.map((l) => (
                  <DropdownMenuItem
                    key={l.code}
                    onClick={() => dispatch(setLanguage(l.code as Language))}
                    className={currentLanguage === l.code ? 'bg-accent' : ''}
                  >
                    <span className="font-medium">{l.native}</span>
                    <span className="ml-auto pl-2 text-xs text-muted-foreground">{l.label}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {isAuthenticated && (
              <Link
                to="/notifications"
                className="relative rounded-full border border-transparent p-2 text-[#fff3d7] transition-colors hover:border-[#c3b184] hover:bg-white/10"
              >
                <Bell className="w-5 h-5" />
                {unreadNotificationCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-[1.125rem] min-w-[1.125rem] items-center justify-center rounded-full bg-[#d89b2b] px-0.5 text-[10px] font-bold text-[#2f2513]">
                    {unreadNotificationCount > 99 ? '99+' : unreadNotificationCount}
                  </span>
                )}
              </Link>
            )}

            {isAuthenticated && (
              <Link
                to="/settings"
                className="hidden rounded-full border border-transparent p-2 text-[#fff3d7] transition-colors hover:border-[#c3b184] hover:bg-white/10 sm:inline-flex"
              >
                <Settings className="w-5 h-5" />
              </Link>
            )}

            {isAuthenticated && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="hidden items-center gap-2 border-[#c8b78d] bg-transparent text-[#fff3d7] hover:bg-white/10 hover:text-white md:inline-flex"
                onClick={handleLogout}
              >
                <LogOut className="w-4 h-4" />
                {currentLanguage === 'en' ? 'Log out' : 'लॉग आउट'}
              </Button>
            )}

            {isAuthenticated && user?.role === 'buyer' && (
              <Link
                to="/buyer/cart"
                className="relative rounded-full border border-transparent p-2 text-[#fff3d7] transition-colors hover:border-[#c3b184] hover:bg-white/10"
              >
                <ShoppingCart className="w-5 h-5" />
                {cartItemCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-[1.125rem] min-w-[1.125rem] items-center justify-center rounded-full bg-[#d89b2b] px-0.5 text-[10px] font-bold text-[#2f2513]">
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
                    className="text-[#fff3d7] hover:bg-white/10 hover:text-white"
                  >
                    Login
                  </Button>
                </Link>
                <Link to="/register">
                  <Button size="sm" className="border border-[#c89b3a] bg-[#d89b2b] text-[#2f2513] hover:bg-[#c98c1d] shadow-sm">
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
                <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-[#d7c7a8] bg-[#f0e5c7] ring-2 ring-[#fff8e8]/20 sm:h-10 sm:w-10">
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
                    <User className="h-5 w-5 text-[#315f3b]" />
                  )}
                </div>
              </Link>
            )}

            <button
              type="button"
              className="rounded-lg border border-transparent p-2 text-[#fff3d7] transition-colors hover:border-[#c3b184] hover:bg-white/10 md:hidden"
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
        <nav className="animate-slide-up border-t border-[#d7c7a8] bg-[#fbf4e4] shadow-inner md:hidden">
            <div className="container mx-auto px-4 flex flex-col gap-2 py-4">
              {isAuthenticated && (
                <>
                  <Link
                    to="/marketplace"
                    className="rounded-lg border border-transparent px-4 py-3 font-medium text-[#314837] transition-colors hover:border-[#d7c7a8] hover:bg-[#f5ead3] hover:text-[#315f3b]"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Marketplace
                  </Link>
                  <Link
                    to="/calendar"
                    className="rounded-lg border border-transparent px-4 py-3 font-medium text-[#314837] transition-colors hover:border-[#d7c7a8] hover:bg-[#f5ead3] hover:text-[#315f3b]"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Seasonal Guide
                  </Link>
                  <Link
                    to="/support"
                    className="rounded-lg border border-transparent px-4 py-3 font-medium text-[#314837] transition-colors hover:border-[#d7c7a8] hover:bg-[#f5ead3] hover:text-[#315f3b]"
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
                    className="rounded-lg border border-transparent px-4 py-3 font-medium text-[#314837] transition-colors hover:border-[#d7c7a8] hover:bg-[#f5ead3] hover:text-[#315f3b]"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Farmer Dashboard
                  </Link>
                  <Link
                    to="/farmer/news"
                    className="rounded-lg border border-transparent px-4 py-3 font-medium text-[#314837] transition-colors hover:border-[#d7c7a8] hover:bg-[#f5ead3] hover:text-[#315f3b]"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Farmer news
                  </Link>
                </>
              )}
              {isAuthenticated && user?.role === 'buyer' && (
                <Link 
                  to="/buyer/dashboard" 
                  className="rounded-lg border border-transparent px-4 py-3 font-medium text-[#314837] transition-colors hover:border-[#d7c7a8] hover:bg-[#f5ead3] hover:text-[#315f3b]"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Buyer Dashboard
                </Link>
              )}
              {isAuthenticated && user?.role === 'admin' && (
                <Link 
                  to={ROUTES.ADMIN_DASHBOARD} 
                  className="rounded-lg border border-transparent px-4 py-3 font-medium text-[#314837] transition-colors hover:border-[#d7c7a8] hover:bg-[#f5ead3] hover:text-[#315f3b]"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Admin Dashboard
                </Link>
              )}
              {isAuthenticated && (
                <>
                  <Link 
                    to="/notifications" 
                    className="rounded-lg border border-transparent px-4 py-3 font-medium text-[#314837] transition-colors hover:border-[#d7c7a8] hover:bg-[#f5ead3] hover:text-[#315f3b]"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Notifications
                  </Link>
                  <Link 
                    to="/settings" 
                    className="rounded-lg border border-transparent px-4 py-3 font-medium text-[#314837] transition-colors hover:border-[#d7c7a8] hover:bg-[#f5ead3] hover:text-[#315f3b]"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Settings
                  </Link>
                  <button
                    type="button"
                    className="flex items-center gap-2 rounded-lg border border-transparent px-4 py-3 text-left font-medium text-[#8a4f2a] transition-colors hover:border-[#dcc3a1] hover:bg-[#f8eadb]"
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
                    <Button variant="outline" className="w-full border-[#d7c7a8] bg-[#fffaf0] text-[#315f3b] hover:bg-[#f4ead6]">Login</Button>
                  </Link>
                  <Link to="/register" className="flex-1" onClick={() => setIsMenuOpen(false)}>
                    <Button className="w-full border border-[#c89b3a] bg-[#d89b2b] text-[#2f2513] hover:bg-[#c98c1d]">Register</Button>
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
