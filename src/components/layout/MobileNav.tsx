import { Link, useLocation } from 'react-router-dom';
import { Home, Search, MessageCircle, Package, User } from 'lucide-react';
import { useAppSelector } from '@/hooks/useRedux';

const MobileNav = () => {
  const location = useLocation();
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);

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
        { icon: Home, label: 'Home', path: '/farmer/dashboard' },
        { icon: Package, label: 'Listings', path: '/farmer/listings' },
        { icon: MessageCircle, label: 'Chats', path: '/farmer/chats' },
        { icon: Package, label: 'Orders', path: '/farmer/orders' },
        { icon: User, label: 'Profile', path: '/farmer/profile' },
      ];
    }

    if (user?.role === 'buyer') {
      return [
        { icon: Home, label: 'Home', path: '/buyer/dashboard' },
        { icon: Search, label: 'Browse', path: '/marketplace' },
        { icon: MessageCircle, label: 'Chats', path: '/buyer/chats' },
        { icon: Package, label: 'Orders', path: '/buyer/orders' },
        { icon: User, label: 'Profile', path: '/buyer/profile' },
      ];
    }

    // Admin
    return [
      { icon: Home, label: 'Dashboard', path: '/admin/dashboard' },
      { icon: User, label: 'Users', path: '/admin/users' },
      { icon: Package, label: 'Listings', path: '/admin/listings' },
      { icon: MessageCircle, label: 'Reviews', path: '/admin/reviews' },
    ];
  };

  const navItems = getNavItems();

  return (
    <nav className="mobile-nav md:hidden">
      <div className="flex items-center justify-around py-2 px-4">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
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
    </nav>
  );
};

export default MobileNav;
