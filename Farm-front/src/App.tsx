import { Provider } from 'react-redux';
import { lazy, Suspense, useEffect, type ReactNode } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useDispatch } from 'react-redux';
import { store } from '@/store';
import { finishAuthCheck, loginSuccess, logout } from '@/store/slices/authSlice';
import { apiService, clearAuthToken, getAuthToken } from '@/services/api';
import { mapApiUserToAuth } from '@/lib/mapAuthUser';

// Auth Components
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import AdminRoute from "@/components/auth/AdminRoute";

// Error Boundary
import ErrorBoundary from "@/components/ErrorBoundary";

// Scroll to Top
import ScrollToTop from "@/components/ScrollToTop";
import { RoutePageFallback } from '@/components/routing/RoutePageFallback';
import { CopilotProvider } from '@/context/CopilotContext';

const Landing = lazy(() => import('./pages/Landing'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const Marketplace = lazy(() => import('./pages/Marketplace'));
const ProductDetail = lazy(() => import('./pages/ProductDetail'));
const Support = lazy(() => import('./pages/Support'));
const NotFound = lazy(() => import('./pages/NotFound'));
const CropCalendar = lazy(() => import('./pages/CropCalendar'));
const PricingGuidePage = lazy(() =>
  import('./pages/ResourcePages').then((m) => ({ default: m.PricingGuidePage }))
);
const QualityStandardsPage = lazy(() =>
  import('./pages/ResourcePages').then((m) => ({ default: m.QualityStandardsPage }))
);
const TermsPage = lazy(() => import('./pages/ResourcePages').then((m) => ({ default: m.TermsPage })));
const PrivacyPolicyPage = lazy(() =>
  import('./pages/ResourcePages').then((m) => ({ default: m.PrivacyPolicyPage }))
);
const FarmerDashboard = lazy(() => import('./pages/farmer/FarmerDashboard'));
const BuyerDashboard = lazy(() => import('./pages/buyer/BuyerDashboard'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const Cart = lazy(() => import('./pages/buyer/Cart'));
const Checkout = lazy(() => import('./pages/buyer/Checkout'));
const OrderTracking = lazy(() => import('./pages/buyer/OrderTracking'));
const OrderDetailPage = lazy(() => import('./pages/orders/OrderDetailPage'));
const BuyerProfile = lazy(() => import('./pages/buyer/BuyerProfile'));
const BuyerChats = lazy(() => import('./pages/buyer/BuyerChats'));
const Wishlist = lazy(() => import('./pages/buyer/Wishlist'));
const ListingManagement = lazy(() => import('./pages/farmer/ListingManagement'));
const FarmerOrders = lazy(() => import('./pages/farmer/FarmerOrders'));
const FarmerProfile = lazy(() => import('./pages/farmer/FarmerProfile'));
const FarmerChats = lazy(() => import('./pages/farmer/FarmerChats'));
const Earnings = lazy(() => import('./pages/farmer/Earnings'));
const Analytics = lazy(() => import('./pages/farmer/Analytics'));
const FarmerNews = lazy(() => import('./pages/farmer/FarmerNews'));
const Notifications = lazy(() => import('./pages/Notifications'));
const Settings = lazy(() => import('./pages/Settings'));
const NegotiationChat = lazy(() => import('./pages/chat/NegotiationChat'));
const Reviews = lazy(() => import('./pages/reviews/Reviews'));

function PageSuspense({ children }: { children: ReactNode }) {
  return <Suspense fallback={<RoutePageFallback />}>{children}</Suspense>;
}

const queryClient = new QueryClient();
const googleClientId = (import.meta.env.VITE_GOOGLE_CLIENT_ID || "").trim();

const AuthBootstrap = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    const initAuth = async () => {
      const token = getAuthToken();
      if (!token) {
        dispatch(logout());
        dispatch(finishAuthCheck());
        return;
      }

      try {
        const response = await apiService.users.getProfile();
        const user = response.data?.user;
        if (!user) {
          dispatch(logout());
          return;
        }

        dispatch(loginSuccess(mapApiUserToAuth(user)));
      } catch {
        clearAuthToken();
        dispatch(logout());
      } finally {
        dispatch(finishAuthCheck());
      }
    };

    initAuth();
  }, [dispatch]);

  return null;
};

const AppInner = () => (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
          <BrowserRouter
            future={{
              v7_startTransition: true,
              v7_relativeSplatPath: true,
            }}
          >
        <CopilotProvider>
        <ErrorBoundary>
          <AuthBootstrap />
          <Toaster />
          <Sonner />
            <ScrollToTop />
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<PageSuspense><Landing /></PageSuspense>} />
              <Route path="/login" element={<PageSuspense><Login /></PageSuspense>} />
              <Route path="/register" element={<PageSuspense><Register /></PageSuspense>} />
              <Route path="/reset-password" element={<PageSuspense><ResetPassword /></PageSuspense>} />
              <Route path="/forgot-password" element={<PageSuspense><ForgotPassword /></PageSuspense>} />
              <Route path="/guides/pricing" element={<PageSuspense><PricingGuidePage /></PageSuspense>} />
              <Route path="/guides/quality" element={<PageSuspense><QualityStandardsPage /></PageSuspense>} />
              <Route path="/legal/terms" element={<PageSuspense><TermsPage /></PageSuspense>} />
              <Route path="/legal/privacy" element={<PageSuspense><PrivacyPolicyPage /></PageSuspense>} />
            <Route
              path="/marketplace"
              element={
                <ProtectedRoute allowedRoles={['farmer', 'buyer', 'admin']}>
                  <PageSuspense>
                    <Marketplace />
                  </PageSuspense>
                </ProtectedRoute>
              }
            />
            <Route
              path="/product/:id"
              element={
                <ProtectedRoute allowedRoles={['farmer', 'buyer', 'admin']}>
                  <PageSuspense>
                    <ProductDetail />
                  </PageSuspense>
                </ProtectedRoute>
              }
            />
            <Route
              path="/support"
              element={
                <ProtectedRoute allowedRoles={['farmer', 'buyer', 'admin']}>
                  <PageSuspense>
                    <Support />
                  </PageSuspense>
                </ProtectedRoute>
              }
            />
            <Route
              path="/calendar"
              element={
                <ProtectedRoute allowedRoles={['farmer', 'buyer', 'admin']}>
                  <PageSuspense>
                    <CropCalendar />
                  </PageSuspense>
                </ProtectedRoute>
              }
            />

              {/* Protected Routes - All Users */}
              <Route 
                path="/notifications" 
                element={
                  <ProtectedRoute allowedRoles={['farmer', 'buyer', 'admin']}>
                    <PageSuspense>
                      <Notifications />
                    </PageSuspense>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/settings" 
                element={
                  <ProtectedRoute allowedRoles={['farmer', 'buyer', 'admin']}>
                    <PageSuspense>
                      <Settings />
                    </PageSuspense>
                  </ProtectedRoute>
                } 
              />

              {/* Protected Farmer Routes */}
              <Route 
                path="/farmer/dashboard" 
                element={
                  <ProtectedRoute allowedRoles={['farmer']}>
                    <PageSuspense>
                      <FarmerDashboard />
                    </PageSuspense>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/farmer/listings" 
                element={
                  <ProtectedRoute allowedRoles={['farmer']}>
                    <PageSuspense>
                      <ListingManagement />
                    </PageSuspense>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/farmer/orders/:orderId" 
                element={
                  <ProtectedRoute allowedRoles={['farmer']}>
                    <PageSuspense>
                      <OrderDetailPage />
                    </PageSuspense>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/farmer/orders" 
                element={
                  <ProtectedRoute allowedRoles={['farmer']}>
                    <PageSuspense>
                      <FarmerOrders />
                    </PageSuspense>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/farmer/chats" 
                element={
                  <ProtectedRoute allowedRoles={['farmer']}>
                    <PageSuspense>
                      <FarmerChats />
                    </PageSuspense>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/farmer/reviews" 
                element={
                  <ProtectedRoute allowedRoles={['farmer']}>
                    <PageSuspense>
                      <Reviews />
                    </PageSuspense>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/farmer/profile" 
                element={
                  <ProtectedRoute allowedRoles={['farmer']}>
                    <PageSuspense>
                      <FarmerProfile />
                    </PageSuspense>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/farmer/earnings" 
                element={
                  <ProtectedRoute allowedRoles={['farmer']}>
                    <PageSuspense>
                      <Earnings />
                    </PageSuspense>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/farmer/analytics" 
                element={
                  <ProtectedRoute allowedRoles={['farmer']}>
                    <PageSuspense>
                      <Analytics />
                    </PageSuspense>
                  </ProtectedRoute>
                } 
              />
              <Route
                path="/farmer/news"
                element={
                  <ProtectedRoute allowedRoles={['farmer']}>
                    <PageSuspense>
                      <FarmerNews />
                    </PageSuspense>
                  </ProtectedRoute>
                }
              />

              {/* Protected Buyer Routes */}
              <Route 
                path="/buyer/dashboard" 
                element={
                  <ProtectedRoute allowedRoles={['buyer']}>
                    <PageSuspense>
                      <BuyerDashboard />
                    </PageSuspense>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/buyer/orders/:orderId" 
                element={
                  <ProtectedRoute allowedRoles={['buyer']}>
                    <PageSuspense>
                      <OrderDetailPage />
                    </PageSuspense>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/buyer/orders" 
                element={
                  <ProtectedRoute allowedRoles={['buyer']}>
                    <PageSuspense>
                      <OrderTracking />
                    </PageSuspense>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/buyer/chats" 
                element={
                  <ProtectedRoute allowedRoles={['buyer']}>
                    <PageSuspense>
                      <BuyerChats />
                    </PageSuspense>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/buyer/cart" 
                element={
                  <ProtectedRoute allowedRoles={['buyer']}>
                    <PageSuspense>
                      <Cart />
                    </PageSuspense>
                  </ProtectedRoute>
                } 
              />
              <Route
                path="/buyer/wishlist"
                element={
                  <ProtectedRoute allowedRoles={['buyer']}>
                    <PageSuspense>
                      <Wishlist />
                    </PageSuspense>
                  </ProtectedRoute>
                }
              />
              <Route 
                path="/buyer/checkout" 
                element={
                  <ProtectedRoute allowedRoles={['buyer']}>
                    <PageSuspense>
                      <Checkout />
                    </PageSuspense>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/buyer/reviews" 
                element={
                  <ProtectedRoute allowedRoles={['buyer']}>
                    <PageSuspense>
                      <Reviews />
                    </PageSuspense>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/buyer/profile" 
                element={
                  <ProtectedRoute allowedRoles={['buyer']}>
                    <PageSuspense>
                      <BuyerProfile />
                    </PageSuspense>
                  </ProtectedRoute>
                } 
              />

              {/* Protected Admin Routes — shell at /admin?tab=…; legacy paths redirect */}
              <Route
                path="/admin/orders/:orderId"
                element={
                  <AdminRoute>
                    <PageSuspense>
                      <OrderDetailPage />
                    </PageSuspense>
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/dashboard"
                element={
                  <AdminRoute>
                    <Navigate to="/admin?tab=overview" replace />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/orders"
                element={
                  <AdminRoute>
                    <Navigate to="/admin?tab=orders" replace />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/users"
                element={
                  <AdminRoute>
                    <Navigate to="/admin?tab=users" replace />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/kyc"
                element={
                  <AdminRoute>
                    <Navigate to="/admin?tab=kyc" replace />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/payouts"
                element={
                  <AdminRoute>
                    <Navigate to="/admin?tab=payouts" replace />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/listings"
                element={
                  <AdminRoute>
                    <Navigate to="/admin?tab=listings" replace />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/reviews"
                element={
                  <AdminRoute>
                    <Navigate to="/admin?tab=reviews" replace />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/support"
                element={
                  <AdminRoute>
                    <Navigate to="/admin?tab=support" replace />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/audit"
                element={
                  <AdminRoute>
                    <Navigate to="/admin?tab=audit" replace />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/profile"
                element={
                  <AdminRoute>
                    <PageSuspense>
                      <Settings />
                    </PageSuspense>
                  </AdminRoute>
                }
              />
              <Route
                path="/admin"
                element={
                  <AdminRoute>
                    <PageSuspense>
                      <AdminDashboard />
                    </PageSuspense>
                  </AdminRoute>
                }
              />

              {/* Protected Chat Route */}
              <Route 
                path="/chat/:id" 
                element={
                  <ProtectedRoute allowedRoles={['farmer', 'buyer']}>
                    <PageSuspense>
                      <NegotiationChat />
                    </PageSuspense>
                  </ProtectedRoute>
                } 
              />

              {/* Catch-all */}
              <Route path="*" element={<PageSuspense><NotFound /></PageSuspense>} />
            </Routes>
        </ErrorBoundary>
        </CopilotProvider>
          </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
);

const App = () => (
  <Provider store={store}>
    {googleClientId ? (
      <GoogleOAuthProvider clientId={googleClientId}>
        <AppInner />
      </GoogleOAuthProvider>
    ) : (
      <AppInner />
    )}
  </Provider>
);

export default App;
