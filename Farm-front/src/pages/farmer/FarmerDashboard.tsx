import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, ShoppingCart, TrendingUp, MessageCircle, Plus, Bell, Star, Wallet, BarChart3, Sparkles, ArrowRight, Calendar } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import StatCard from '@/components/dashboard/StatCard';
import OrderCard from '@/components/orders/OrderCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAppSelector } from '@/hooks/useRedux';
import { AnimateOnScroll, StaggerContainer } from '@/components/animations';
import { apiService } from '@/services/api';
import { Order, Product } from '@/types';

const FarmerDashboard = () => {
  const { user } = useAppSelector((state) => state.auth);
  const { currentLanguage } = useAppSelector((state) => state.language);

  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // TODO: replace with real notifications API when available
  const [notifications] = useState<
    { id: string; title: string; message: string; timestamp: string; isRead: boolean }[]
  >([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);

        const [ordersRes, productsRes] = await Promise.all([
          apiService.orders.getAll(),
          apiService.products.getAll(),
        ]);

        const backendOrders = ordersRes.data?.orders || [];
        const backendProducts = productsRes.data?.products || [];

        const mappedOrders: Order[] = backendOrders.map((o: any) => ({
          id: o._id || o.id,
          buyerId: o.buyer?._id || o.buyer,
          buyerName: o.buyer?.name || 'Buyer',
          farmerId: o.farmer?._id || o.farmer,
          farmerName: o.farmer?.name || 'Farmer',
          productId: o.items?.[0]?.product || '',
          productName: o.items?.[0]?.name || 'Product',
          productImage:
            o.items?.[0]?.image ||
            'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=600',
          quantity: o.items?.[0]?.quantity || 1,
          unit: o.items?.[0]?.unit || 'kg',
          pricePerUnit: o.items?.[0]?.price || 0,
          totalAmount: o.totalAmount || 0,
          status: o.status,
          paymentStatus: o.paymentStatus || 'pending',
          deliveryAddress: o.shippingAddress || '',
          createdAt: o.createdAt || new Date().toISOString(),
          expectedDelivery: undefined,
        }));

        const mappedProducts: Product[] = backendProducts.map((p: any) => ({
          id: p._id || p.id,
          farmerId: p.farmer?._id || p.farmer || '',
          farmerName: p.farmer?.name || 'Farmer',
          farmerAvatar: undefined,
          farmerRating: 4.8,
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
          status: 'active',
          createdAt: p.createdAt || new Date().toISOString(),
          views: p.views || 0,
          inquiries: 0,
        }));

        setOrders(mappedOrders);
        setProducts(mappedProducts);
      } catch (error) {
        console.error('Failed to load farmer dashboard data', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const farmerOrders = orders;
  const farmerProducts = products;

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

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
        <div className="container mx-auto px-4 py-8">
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
              </div>
              <Link to="/farmer/listings/new">
                <Button className="btn-primary-gradient text-lg px-8 py-7 hover:scale-105 transition-transform shadow-lg">
                  <Plus className="w-5 h-5 mr-2" />
                  {currentLanguage === 'en' ? 'Add New Listing' : 'नई लिस्टिंग जोड़ें'}
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </div>
          </AnimateOnScroll>

          {/* Stats */}
          <AnimateOnScroll animation="slide-up" delay={0.1}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
              <StatCard 
                title={currentLanguage === 'en' ? 'Active Listings' : 'सक्रिय लिस्टिंग'} 
                value={farmerProducts.length} 
                icon={Package} 
                variant="primary"
                subtitle={currentLanguage === 'en' ? 'Products live' : 'उत्पाद लाइव'}
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
                value="4.8" 
                icon={Star} 
                variant="warning"
                subtitle={`${farmerOrders.length} ${currentLanguage === 'en' ? 'reviews' : 'समीक्षाएं'}`}
              />
            </div>
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
                <StaggerContainer staggerDelay={0.05} animation="slide-up" className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  {[
                    { icon: Package, label: currentLanguage === 'en' ? 'My Listings' : 'मेरी लिस्टिंग', path: '/farmer/listings', color: 'from-primary/20 to-primary/10' },
                    { icon: ShoppingCart, label: currentLanguage === 'en' ? 'Orders' : 'ऑर्डर', path: '/farmer/orders', color: 'from-success/20 to-success/10' },
                    { icon: Wallet, label: currentLanguage === 'en' ? 'Earnings' : 'कमाई', path: '/farmer/earnings', color: 'from-accent/20 to-accent/10' },
                    { icon: BarChart3, label: currentLanguage === 'en' ? 'Analytics' : 'विश्लेषण', path: '/farmer/analytics', color: 'from-secondary/20 to-secondary/10' },
                    { icon: MessageCircle, label: currentLanguage === 'en' ? 'Messages' : 'संदेश', path: '/farmer/chats', badge: 2, color: 'from-purple-500/20 to-purple-500/10' },
                    { icon: Star, label: currentLanguage === 'en' ? 'Reviews' : 'समीक्षाएं', path: '/farmer/reviews', color: 'from-warning/20 to-warning/10' },
                  ].map((item) => (
                    <Link 
                      key={item.path} 
                      to={item.path} 
                      className="group relative bg-gradient-to-br from-card to-muted/30 border-2 border-border rounded-xl p-5 flex flex-col items-center gap-3 hover:shadow-xl hover:scale-105 hover:border-primary/50 transition-all duration-300"
                    >
                      <div className={`w-14 h-14 bg-gradient-to-br ${item.color} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                        <item.icon className="w-7 h-7 text-primary" />
                      </div>
                      {item.badge && (
                        <Badge className="absolute -top-2 -right-2 bg-accent text-accent-foreground text-xs font-bold px-2 py-0.5">
                          {item.badge}
                        </Badge>
                      )}
                      <span className={`text-sm font-semibold text-center ${currentLanguage === 'hi' ? 'font-hindi' : ''}`}>{item.label}</span>
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
                  <div className="text-center py-12">
                    <ShoppingCart className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <p className={`text-muted-foreground ${currentLanguage === 'hi' ? 'font-hindi' : ''}`}>
                      {currentLanguage === 'en' ? 'No orders yet' : 'अभी तक कोई ऑर्डर नहीं'}
                    </p>
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
                    {notifications.slice(0, 3).map((notif) => (
                      <div 
                        key={notif.id} 
                        className={`p-5 hover:bg-muted/50 transition-colors ${!notif.isRead ? 'bg-primary/5 border-l-4 border-l-primary' : ''}`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            !notif.isRead ? 'bg-primary/20' : 'bg-muted'
                          }`}>
                            <Bell className={`w-5 h-5 ${!notif.isRead ? 'text-primary' : 'text-muted-foreground'}`} />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-base mb-1">{notif.title}</h4>
                            <p className="text-sm text-muted-foreground leading-relaxed">{notif.message}</p>
                            <p className="text-xs text-muted-foreground mt-2">
                              {new Date(notif.timestamp).toLocaleString()}
                            </p>
                          </div>
                          {!notif.isRead && (
                            <Badge variant="secondary" className="bg-primary text-primary-foreground">
                              {currentLanguage === 'en' ? 'New' : 'नया'}
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
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
        </div>
      </div>
    </Layout>
  );
};

export default FarmerDashboard;
