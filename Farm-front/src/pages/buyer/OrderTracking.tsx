import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Package, Truck, CheckCircle, Clock, MapPin, Phone, MessageCircle, Star } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { useAppSelector } from '@/hooks/useRedux';
import { apiService } from '@/services/api';
import { Order } from '@/types';
import { useToast } from '@/hooks/use-toast';

const OrderTracking = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { currentLanguage } = useAppSelector((state) => state.language);
  const { user } = useAppSelector((state) => state.auth);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setIsLoading(true);
        const response = await apiService.orders.getAll();
        const backendOrders = response.data?.orders || [];
        const mapped: Order[] = backendOrders.map((o: any) => ({
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
        setOrders(mapped);
        if (mapped.length > 0) {
          setSelectedOrder(mapped[0]);
        }
      } catch (error: any) {
        console.error('Failed to load orders', error);
        toast({
          title: currentLanguage === 'en' ? 'Error' : 'त्रुटि',
          description:
            error?.response?.data?.message ||
            error?.message ||
            (currentLanguage === 'en'
              ? 'Failed to load orders.'
              : 'ऑर्डर लोड करने में विफल।'),
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchOrders();
    }
  }, [user, currentLanguage, toast]);

  const getStatusSteps = (status: string) => {
    const steps = [
      { key: 'pending', label: currentLanguage === 'en' ? 'Order Placed' : 'ऑर्डर दिया गया', icon: Package },
      { key: 'confirmed', label: currentLanguage === 'en' ? 'Confirmed' : 'पुष्टि', icon: CheckCircle },
      { key: 'processing', label: currentLanguage === 'en' ? 'Processing' : 'प्रोसेसिंग', icon: Clock },
      { key: 'shipped', label: currentLanguage === 'en' ? 'Shipped' : 'भेज दिया', icon: Truck },
      { key: 'delivered', label: currentLanguage === 'en' ? 'Delivered' : 'पहुंचा दिया', icon: CheckCircle },
    ];

    const statusOrder = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];
    const currentIndex = statusOrder.indexOf(status);

    return steps.map((step, index) => ({
      ...step,
      completed: index <= currentIndex,
      current: index === currentIndex,
    }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'text-success bg-success/10';
      case 'shipped': return 'text-primary bg-primary/10';
      case 'cancelled': return 'text-destructive bg-destructive/10';
      default: return 'text-warning bg-warning/10';
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-muted rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold">
            {currentLanguage === 'en' ? 'My Orders' : 'मेरे ऑर्डर'}
          </h1>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Orders List */}
          <div className="lg:col-span-1 space-y-3">
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                {currentLanguage === 'en'
                  ? 'Loading orders...'
                  : 'ऑर्डर लोड हो रहे हैं...'}
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {currentLanguage === 'en'
                  ? 'No orders yet.'
                  : 'अभी तक कोई ऑर्डर नहीं।'}
              </div>
            ) : (
              <>
                {orders.map((order) => (
                  <button
                    key={order.id}
                    onClick={() => setSelectedOrder(order)}
                    className={`w-full text-left card-elevated p-4 transition-all ${selectedOrder && selectedOrder.id === order.id ? 'ring-2 ring-primary' : 'hover:shadow-md'}`}
                  >
                    <div className="flex gap-3">
                      <img
                        src={order.productImage}
                        alt={order.productName}
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{order.productName}</p>
                        <p className="text-sm text-muted-foreground">
                          {order.quantity} {order.unit}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(order.status)}`}>
                            {order.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </>
            )
            }
          </div>

          {/* Order Details */}
          <div className="lg:col-span-2">
            {selectedOrder && (
              <div className="space-y-6">
                {/* Order Info */}
                <div className="card-elevated p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        {currentLanguage === 'en' ? 'Order ID' : 'ऑर्डर आईडी'}
                      </p>
                      <p className="font-mono font-bold">#{selectedOrder.id.toUpperCase()}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedOrder.status)}`}>
                      {selectedOrder.status}
                    </span>
                  </div>

                  <div className="flex gap-4 p-4 bg-muted/50 rounded-xl">
                    <img
                      src={selectedOrder.productImage}
                      alt={selectedOrder.productName}
                      className="w-20 h-20 rounded-lg object-cover"
                    />
                    <div>
                      <h3 className="font-semibold">{selectedOrder.productName}</h3>
                      <p className="text-sm text-muted-foreground">
                        {currentLanguage === 'en' ? 'by' : 'द्वारा'} {selectedOrder.farmerName}
                      </p>
                      <p className="text-sm">
                        {selectedOrder.quantity} {selectedOrder.unit} × ₹{selectedOrder.pricePerUnit.toLocaleString()}
                      </p>
                      <p className="font-bold text-primary mt-1">
                        ₹{selectedOrder.totalAmount.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Tracking Timeline */}
                <div className="card-elevated p-6">
                  <h2 className="text-lg font-semibold mb-6">
                    {currentLanguage === 'en' ? 'Order Tracking' : 'ऑर्डर ट्रैकिंग'}
                  </h2>
                  <div className="relative">
                    {getStatusSteps(selectedOrder.status).map((step, index, arr) => (
                      <div key={step.key} className="flex gap-4 pb-8 last:pb-0">
                        <div className="relative flex flex-col items-center">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${step.completed ? 'bg-success text-white' : 'bg-muted text-muted-foreground'}`}>
                            <step.icon className="w-5 h-5" />
                          </div>
                          {index < arr.length - 1 && (
                            <div className={`w-0.5 flex-1 mt-2 ${step.completed && arr[index + 1]?.completed ? 'bg-success' : 'bg-muted'}`} />
                          )}
                        </div>
                        <div className="flex-1 pt-2">
                          <p className={`font-medium ${step.completed ? 'text-foreground' : 'text-muted-foreground'}`}>
                            {step.label}
                          </p>
                          {step.current && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {currentLanguage === 'en' ? 'Current Status' : 'वर्तमान स्थिति'}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Delivery Info */}
                <div className="card-elevated p-6">
                  <h2 className="text-lg font-semibold mb-4">
                    {currentLanguage === 'en' ? 'Delivery Details' : 'डिलीवरी विवरण'}
                  </h2>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm text-muted-foreground">
                          {currentLanguage === 'en' ? 'Delivery Address' : 'डिलीवरी पता'}
                        </p>
                        <p className="font-medium">{selectedOrder.deliveryAddress}</p>
                      </div>
                    </div>
                    {selectedOrder.expectedDelivery && (
                      <div className="flex items-start gap-3">
                        <Clock className="w-5 h-5 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-sm text-muted-foreground">
                            {currentLanguage === 'en' ? 'Expected Delivery' : 'अपेक्षित डिलीवरी'}
                          </p>
                          <p className="font-medium">{selectedOrder.expectedDelivery}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-3">
                  <Link to={`/chat/chat-1`} className="flex-1">
                    <Button variant="outline" className="w-full">
                      <MessageCircle className="w-4 h-4 mr-2" />
                      {currentLanguage === 'en' ? 'Contact Farmer' : 'किसान से संपर्क करें'}
                    </Button>
                  </Link>
                  {selectedOrder.status === 'delivered' && (
                    <Button className="flex-1 btn-primary-gradient">
                      <Star className="w-4 h-4 mr-2" />
                      {currentLanguage === 'en' ? 'Rate Order' : 'ऑर्डर रेट करें'}
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default OrderTracking;
