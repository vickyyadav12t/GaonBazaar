import { Link, useLocation } from 'react-router-dom';
import { Home, Search, MessageCircle, ShoppingCart, User, Menu, X, Globe, Bell, Settings } from 'lucide-react';
import { useState } from 'react';
import { useAppSelector, useAppDispatch } from '@/hooks/useRedux';
import { toggleLanguage } from '@/store/slices/languageSlice';
import { mockNotifications } from '@/data/mockData';
import { Button } from '@/components/ui/button';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const dispatch = useAppDispatch();
  const { currentLanguage } = useAppSelector((state) => state.language);
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  const { items } = useAppSelector((state) => state.cart);

  const cartItemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-md border-b border-border shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-hero rounded-xl flex items-center justify-center">
              <span className="text-2xl">🌾</span>
            </div>
            <div className="hidden sm:block">
              <h1 className="font-bold text-lg text-foreground leading-tight">Direct Access</h1>
              <p className="text-xs text-muted-foreground -mt-1">for Farmers</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <Link 
              to="/marketplace" 
              className={`font-medium transition-colors hover:text-primary ${location.pathname === '/marketplace' ? 'text-primary' : 'text-muted-foreground'}`}
            >
              Marketplace
            </Link>
            <Link 
              to="/calendar" 
              className={`font-medium transition-colors hover:text-primary ${location.pathname === '/calendar' ? 'text-primary' : 'text-muted-foreground'}`}
            >
              Crop Calendar
            </Link>
            {isAuthenticated && user?.role === 'farmer' && (
              <Link 
                to="/farmer/dashboard" 
                className={`font-medium transition-colors hover:text-primary ${location.pathname.includes('/farmer') ? 'text-primary' : 'text-muted-foreground'}`}
              >
                Dashboard
              </Link>
            )}
            {isAuthenticated && user?.role === 'buyer' && (
              <Link 
                to="/buyer/dashboard" 
                className={`font-medium transition-colors hover:text-primary ${location.pathname.includes('/buyer') ? 'text-primary' : 'text-muted-foreground'}`}
              >
                Dashboard
              </Link>
            )}
            {isAuthenticated && user?.role === 'admin' && (
              <Link 
                to="/admin/dashboard" 
                className={`font-medium transition-colors hover:text-primary ${location.pathname.includes('/admin') ? 'text-primary' : 'text-muted-foreground'}`}
              >
                Admin
              </Link>
            )}
            <Link 
              to="/support" 
              className={`font-medium transition-colors hover:text-primary ${location.pathname === '/support' ? 'text-primary' : 'text-muted-foreground'}`}
            >
              Help
            </Link>
          </nav>

          {/* Right Section */}
          <div className="flex items-center gap-3">
            {/* Language Toggle */}
            <button
              onClick={() => dispatch(toggleLanguage())}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-muted hover:bg-muted/80 transition-colors text-sm font-medium"
            >
              <Globe className="w-4 h-4" />
              <span>{currentLanguage === 'en' ? 'हिं' : 'EN'}</span>
            </button>

            {/* Notifications (for authenticated users) */}
            {isAuthenticated && (
              <Link to="/notifications" className="relative p-2 hover:bg-muted rounded-full transition-colors">
                <Bell className="w-5 h-5" />
                {mockNotifications.filter(n => n.userId === user?.id && !n.isRead).length > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-accent text-accent-foreground text-xs font-bold rounded-full flex items-center justify-center">
                    {mockNotifications.filter(n => n.userId === user?.id && !n.isRead).length}
                  </span>
                )}
              </Link>
            )}

            {/* Settings (for authenticated users) */}
            {isAuthenticated && (
              <Link to="/settings" className="p-2 hover:bg-muted rounded-full transition-colors">
                <Settings className="w-5 h-5" />
              </Link>
            )}

            {/* Cart (for buyers) */}
            {isAuthenticated && user?.role === 'buyer' && (
              <Link to="/buyer/cart" className="relative p-2 hover:bg-muted rounded-full transition-colors">
                <ShoppingCart className="w-5 h-5" />
                {cartItemCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-accent text-accent-foreground text-xs font-bold rounded-full flex items-center justify-center">
                    {cartItemCount}
                  </span>
                )}
              </Link>
            )}

            {/* Auth Buttons */}
            {!isAuthenticated ? (
              <div className="hidden sm:flex items-center gap-2">
                <Link to="/login">
                  <Button variant="ghost" size="sm">Login</Button>
                </Link>
                <Link to="/register">
                  <Button size="sm" className="bg-primary hover:bg-primary-dark text-primary-foreground">
                    Register
                  </Button>
                </Link>
              </div>
            ) : (
              <Link to={user?.role === 'farmer' ? '/farmer/profile' : user?.role === 'buyer' ? '/buyer/profile' : '/admin/profile'}>
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                  {user?.avatar ? (
                    <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-5 h-5 text-primary" />
                  )}
                </div>
              </Link>
            )}

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 hover:bg-muted rounded-lg transition-colors"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <nav className="md:hidden py-4 border-t border-border animate-slide-up">
            <div className="flex flex-col gap-2">
              <Link 
                to="/marketplace" 
                className="px-4 py-3 rounded-lg hover:bg-muted transition-colors font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                Marketplace
              </Link>
              <Link 
                to="/calendar" 
                className="px-4 py-3 rounded-lg hover:bg-muted transition-colors font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                Crop Calendar
              </Link>
              {isAuthenticated && user?.role === 'farmer' && (
                <Link 
                  to="/farmer/dashboard" 
                  className="px-4 py-3 rounded-lg hover:bg-muted transition-colors font-medium"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Farmer Dashboard
                </Link>
              )}
              {isAuthenticated && user?.role === 'buyer' && (
                <Link 
                  to="/buyer/dashboard" 
                  className="px-4 py-3 rounded-lg hover:bg-muted transition-colors font-medium"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Buyer Dashboard
                </Link>
              )}
              {isAuthenticated && user?.role === 'admin' && (
                <Link 
                  to="/admin/dashboard" 
                  className="px-4 py-3 rounded-lg hover:bg-muted transition-colors font-medium"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Admin Dashboard
                </Link>
              )}
              <Link 
                to="/support" 
                className="px-4 py-3 rounded-lg hover:bg-muted transition-colors font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                Help & Support
              </Link>
              {isAuthenticated && (
                <>
                  <Link 
                    to="/notifications" 
                    className="px-4 py-3 rounded-lg hover:bg-muted transition-colors font-medium"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Notifications
                  </Link>
                  <Link 
                    to="/settings" 
                    className="px-4 py-3 rounded-lg hover:bg-muted transition-colors font-medium"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Settings
                  </Link>
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
