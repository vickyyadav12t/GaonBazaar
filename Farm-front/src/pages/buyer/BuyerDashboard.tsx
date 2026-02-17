import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, ShoppingCart, TrendingUp, MessageCircle, Search, Star, Clock, Sparkles, ArrowRight, Calendar, TrendingDown } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import StatCard from '@/components/dashboard/StatCard';
import OrderCard from '@/components/orders/OrderCard';
import ProductCard from '@/components/product/ProductCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAppSelector } from '@/hooks/useRedux';
import { AnimateOnScroll, StaggerContainer } from '@/components/animations';
import { apiService } from '@/services/api';
import { Order, Product } from '@/types';

const BuyerDashboard = () => {
  const { user } = useAppSelector((state) => state.auth);
  const { currentLanguage } = useAppSelector((state) => state.language);

  const [orders, setOrders] = useState<Order[]>([]);
  const [recentProducts, setRecentProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);

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
        setRecentProducts(mappedProducts.slice(0, 4));
      } catch (error) {
        console.error('Failed to load buyer dashboard data', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const buyerOrders = orders;

  const totalSpent = buyerOrders
    .filter((o) => o.paymentStatus === 'paid')
    .reduce((sum, o) => sum + o.totalAmount, 0);

  const pendingOrders = buyerOrders.filter(
    (o) => o.status === 'pending' || o.status === 'processing'
  ).length;

  const deliveredOrders = buyerOrders.filter(
    (o) => o.status === 'delivered'
  ).length;

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
        <div className="container mx-auto px-4 py-8">
          {/* Welcome Section */}
          <AnimateOnScroll animation="fade-in">
            <div className="mb-8">
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
                {currentLanguage === 'en' ? 'Find fresh produce directly from farmers' : 'किसानों से सीधे ताज़ा उपज पाएं'}
              </p>
            </div>
          </AnimateOnScroll>

          {/* Stats */}
          <AnimateOnScroll animation="slide-up" delay={0.1}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
              <StatCard 
                title={currentLanguage === 'en' ? 'Total Orders' : 'कुल ऑर्डर'} 
                value={buyerOrders.length} 
                icon={ShoppingCart} 
                variant="primary"
                subtitle={`${deliveredOrders} ${currentLanguage === 'en' ? 'delivered' : 'डिलीवर'}`}
              />
              <StatCard 
                title={currentLanguage === 'en' ? 'Active Chats' : 'सक्रिय चैट'} 
                value={3} 
                icon={MessageCircle} 
                variant="success"
                subtitle={currentLanguage === 'en' ? 'Negotiations' : 'बातचीत'}
              />
              <StatCard 
                title={currentLanguage === 'en' ? 'Total Spent' : 'कुल खर्च'} 
                value={`₹${totalSpent.toLocaleString()}`} 
                icon={TrendingUp} 
                variant="accent"
                subtitle={currentLanguage === 'en' ? 'All time' : 'सभी समय'}
              />
              <StatCard 
                title={currentLanguage === 'en' ? 'Pending' : 'लंबित'} 
                value={pendingOrders} 
                icon={Clock} 
                variant="warning"
                subtitle={currentLanguage === 'en' ? 'In progress' : 'प्रगति में'}
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
                <StaggerContainer staggerDelay={0.05} animation="slide-up" className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { icon: Search, label: currentLanguage === 'en' ? 'Browse Marketplace' : 'बाज़ार खोजें', path: '/marketplace', color: 'from-primary/20 to-primary/10' },
                    { icon: ShoppingCart, label: currentLanguage === 'en' ? 'My Orders' : 'मेरे ऑर्डर', path: '/buyer/orders', color: 'from-success/20 to-success/10' },
                    { icon: MessageCircle, label: currentLanguage === 'en' ? 'Chats' : 'चैट', path: '/buyer/chats', badge: 1, color: 'from-purple-500/20 to-purple-500/10' },
                    { icon: Star, label: currentLanguage === 'en' ? 'Reviews' : 'समीक्षाएं', path: '/buyer/reviews', color: 'from-warning/20 to-warning/10' },
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
                      {currentLanguage === 'en' ? 'My Orders' : 'मेरे ऑर्डर'}
                    </CardTitle>
                    <CardDescription>
                      {currentLanguage === 'en' ? 'Track your recent purchases' : 'अपनी हाल की खरीदारी ट्रैक करें'}
                    </CardDescription>
                  </div>
                  <Link to="/buyer/orders">
                    <Button variant="ghost" size="sm" className="gap-2">
                      {currentLanguage === 'en' ? 'View All' : 'सभी देखें'}
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {buyerOrders.length > 0 ? (
                  <div className="space-y-4">
                    {buyerOrders.slice(0, 2).map((order) => (
                      <OrderCard key={order.id} order={order} userRole="buyer" />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <ShoppingCart className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <p className={`text-muted-foreground mb-4 ${currentLanguage === 'hi' ? 'font-hindi' : ''}`}>
                      {currentLanguage === 'en' ? 'No orders yet' : 'अभी तक कोई ऑर्डर नहीं'}
                    </p>
                    <Link to="/marketplace">
                      <Button className="gap-2">
                        {currentLanguage === 'en' ? 'Start Shopping' : 'खरीदारी शुरू करें'}
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </AnimateOnScroll>

          {/* Fresh Picks */}
          <AnimateOnScroll animation="slide-up" delay={0.4}>
            <Card className="border-2 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5 border-b">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="w-5 h-5 text-primary" />
                      {currentLanguage === 'en' ? 'Fresh Picks for You' : 'आपके लिए ताज़ा चुनाव'}
                    </CardTitle>
                    <CardDescription>
                      {currentLanguage === 'en' ? 'Handpicked products just for you' : 'आपके लिए विशेष रूप से चुने गए उत्पाद'}
                    </CardDescription>
                  </div>
                  <Link to="/marketplace">
                    <Button variant="ghost" size="sm" className="gap-2">
                      {currentLanguage === 'en' ? 'View All' : 'सभी देखें'}
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <StaggerContainer staggerDelay={0.05} animation="slide-up" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {recentProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </StaggerContainer>
              </CardContent>
            </Card>
          </AnimateOnScroll>
        </div>
      </div>
    </Layout>
  );
};

export default BuyerDashboard;
