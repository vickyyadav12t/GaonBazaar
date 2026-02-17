import { Provider } from 'react-redux';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { store } from '@/store';

// Auth Components
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import AdminRoute from "@/components/auth/AdminRoute";

// Error Boundary
import ErrorBoundary from "@/components/ErrorBoundary";

// Scroll to Top
import ScrollToTop from "@/components/ScrollToTop";

// Pages
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Marketplace from "./pages/Marketplace";
import ProductDetail from "./pages/ProductDetail";
import Support from "./pages/Support";
import NotFound from "./pages/NotFound";
import CropCalendar from "./pages/CropCalendar";

// Dashboard Pages
import FarmerDashboard from "./pages/farmer/FarmerDashboard";
import BuyerDashboard from "./pages/buyer/BuyerDashboard";
import AdminDashboard from "./pages/admin/AdminDashboard";

// New Pages
import Cart from "./pages/buyer/Cart";
import Checkout from "./pages/buyer/Checkout";
import OrderTracking from "./pages/buyer/OrderTracking";
import BuyerProfile from "./pages/buyer/BuyerProfile";
import ListingManagement from "./pages/farmer/ListingManagement";
import FarmerOrders from "./pages/farmer/FarmerOrders";
import FarmerProfile from "./pages/farmer/FarmerProfile";
import Earnings from "./pages/farmer/Earnings";
import Analytics from "./pages/farmer/Analytics";
import Notifications from "./pages/Notifications";
import Settings from "./pages/Settings";
import NegotiationChat from "./pages/chat/NegotiationChat";
import Reviews from "./pages/reviews/Reviews";

const queryClient = new QueryClient();

const App = () => (
  <Provider store={store}>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ErrorBoundary>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <ScrollToTop />
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
            <Route path="/marketplace" element={<Marketplace />} />
            <Route path="/product/:id" element={<ProductDetail />} />
            <Route path="/support" element={<Support />} />
            <Route path="/calendar" element={<CropCalendar />} />
              
              {/* Protected Routes - All Users */}
              <Route 
                path="/notifications" 
                element={
                  <ProtectedRoute allowedRoles={['farmer', 'buyer', 'admin']}>
                    <Notifications />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/settings" 
                element={
                  <ProtectedRoute allowedRoles={['farmer', 'buyer', 'admin']}>
                    <Settings />
                  </ProtectedRoute>
                } 
              />

              {/* Protected Farmer Routes */}
              <Route 
                path="/farmer/dashboard" 
                element={
                  <ProtectedRoute allowedRoles={['farmer']}>
                    <FarmerDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/farmer/listings" 
                element={
                  <ProtectedRoute allowedRoles={['farmer']}>
                    <ListingManagement />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/farmer/orders" 
                element={
                  <ProtectedRoute allowedRoles={['farmer']}>
                    <FarmerOrders />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/farmer/chats" 
                element={
                  <ProtectedRoute allowedRoles={['farmer']}>
                    <FarmerDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/farmer/reviews" 
                element={
                  <ProtectedRoute allowedRoles={['farmer']}>
                    <Reviews />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/farmer/profile" 
                element={
                  <ProtectedRoute allowedRoles={['farmer']}>
                    <FarmerProfile />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/farmer/earnings" 
                element={
                  <ProtectedRoute allowedRoles={['farmer']}>
                    <Earnings />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/farmer/analytics" 
                element={
                  <ProtectedRoute allowedRoles={['farmer']}>
                    <Analytics />
                  </ProtectedRoute>
                } 
              />

              {/* Protected Buyer Routes */}
              <Route 
                path="/buyer/dashboard" 
                element={
                  <ProtectedRoute allowedRoles={['buyer']}>
                    <BuyerDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/buyer/orders" 
                element={
                  <ProtectedRoute allowedRoles={['buyer']}>
                    <OrderTracking />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/buyer/chats" 
                element={
                  <ProtectedRoute allowedRoles={['buyer']}>
                    <BuyerDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/buyer/cart" 
                element={
                  <ProtectedRoute allowedRoles={['buyer']}>
                    <Cart />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/buyer/checkout" 
                element={
                  <ProtectedRoute allowedRoles={['buyer']}>
                    <Checkout />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/buyer/reviews" 
                element={
                  <ProtectedRoute allowedRoles={['buyer']}>
                    <Reviews />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/buyer/profile" 
                element={
                  <ProtectedRoute allowedRoles={['buyer']}>
                    <BuyerProfile />
                  </ProtectedRoute>
                } 
              />

              {/* Protected Admin Routes */}
              <Route 
                path="/admin/dashboard" 
                element={
                  <AdminRoute>
                    <AdminDashboard />
                  </AdminRoute>
                } 
              />
              <Route 
                path="/admin/users" 
                element={
                  <AdminRoute>
                    <AdminDashboard />
                  </AdminRoute>
                } 
              />
              <Route 
                path="/admin/listings" 
                element={
                  <AdminRoute>
                    <AdminDashboard />
                  </AdminRoute>
                } 
              />
              <Route 
                path="/admin/reviews" 
                element={
                  <AdminRoute>
                    <AdminDashboard />
                  </AdminRoute>
                } 
              />

              {/* Protected Chat Route */}
              <Route 
                path="/chat/:id" 
                element={
                  <ProtectedRoute allowedRoles={['farmer', 'buyer']}>
                    <NegotiationChat />
                  </ProtectedRoute>
                } 
              />

              {/* Catch-all */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </ErrorBoundary>
      </TooltipProvider>
    </QueryClientProvider>
  </Provider>
);

export default App;
