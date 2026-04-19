import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Check, X, Truck, Package, Clock, Filter, Search, Download, Loader2 } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAppSelector } from '@/hooks/useRedux';
import { Order } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { apiService } from '@/services/api';
import { saveCsvFromApi } from '@/lib/downloadCsv';
import { mapApiOrderToOrder } from '@/lib/mapOrderFromApi';
import { paymentLineLabel } from '@/lib/orderPaymentCopy';

const ORDER_STATUS_FILTER_VALUES = new Set([
  'pending',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
]);

const ORDER_PAGE = 50;

const FarmerOrders = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  const { currentLanguage } = useAppSelector((state) => state.language);
  const { user } = useAppSelector((state) => state.auth);

  const statusParam = searchParams.get('status');
  const filterStatus =
    statusParam && ORDER_STATUS_FILTER_VALUES.has(statusParam) ? statusParam : 'all';

  const setFilterStatus = (value: string) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (value === 'all') next.delete('status');
        else next.set('status', value);
        return next;
      },
      { replace: true }
    );
  };
  const [searchQuery, setSearchQuery] = useState('');
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [orderTotal, setOrderTotal] = useState<number | null>(null);
  const ordersRef = useRef<Order[]>([]);
  ordersRef.current = orders;
  const [exportingCsv, setExportingCsv] = useState(false);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user) return;
      try {
        setIsLoading(true);
        const params: {
          limit: number;
          skip: number;
          includeTotal: boolean;
          status?: string;
        } = {
          limit: ORDER_PAGE,
          skip: 0,
          includeTotal: true,
        };
        if (filterStatus !== 'all') params.status = filterStatus;
        const response = await apiService.orders.getAll(params);
        const backendOrders = response.data?.orders || [];
        const mapped: Order[] = backendOrders.map((o: any) => mapApiOrderToOrder(o));
        setOrders(mapped);
        const tot = response.data?.total;
        const t = typeof tot === 'number' ? tot : null;
        setOrderTotal(t);
        setHasMore(
          mapped.length === ORDER_PAGE && (t == null || mapped.length < t)
        );
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

    void fetchOrders();
  }, [user, currentLanguage, toast, filterStatus]);

  const loadMoreOrders = async () => {
    if (!user || loadingMore || !hasMore) return;
    setLoadingMore(true);
    const skip = ordersRef.current.length;
    try {
      const params: {
        limit: number;
        skip: number;
        status?: string;
      } = { limit: ORDER_PAGE, skip };
      if (filterStatus !== 'all') params.status = filterStatus;
      const response = await apiService.orders.getAll(params);
      const backendOrders = response.data?.orders || [];
      const mapped: Order[] = backendOrders.map((o: any) => mapApiOrderToOrder(o));
      const mergedLen = skip + mapped.length;
      setOrders((prev) => [...prev, ...mapped]);
      const t = orderTotal;
      setHasMore(
        mapped.length === ORDER_PAGE && (t == null || mergedLen < t)
      );
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleExportOrdersCsv = async () => {
    try {
      setExportingCsv(true);
      await saveCsvFromApi(() => apiService.orders.exportCsv(), 'orders.csv');
      toast({
        title: currentLanguage === 'en' ? 'Export started' : 'निर्यात शुरू',
        description:
          currentLanguage === 'en'
            ? 'Your orders CSV is downloading.'
            : 'आपका ऑर्डर CSV डाउनलोड हो रहा है।',
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '';
      toast({
        title: currentLanguage === 'en' ? 'Export failed' : 'निर्यात विफल',
        description: msg || (currentLanguage === 'en' ? 'Could not download CSV.' : 'CSV डाउनलोड नहीं हो सका।'),
        variant: 'destructive',
      });
    } finally {
      setExportingCsv(false);
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         order.buyerName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || order.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const handleAcceptOrder = async (orderId: string) => {
    try {
      await apiService.orders.update(orderId, { status: 'processing' });
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId ? { ...o, status: 'processing' as const } : o
        )
      );
      toast({
        title: currentLanguage === 'en' ? 'Order Accepted' : 'ऑर्डर स्वीकृत',
        description:
          currentLanguage === 'en'
            ? 'The buyer has been notified.'
            : 'खरीदार को सूचित किया गया है।',
      });
    } catch (error: any) {
      toast({
        title: currentLanguage === 'en' ? 'Error' : 'त्रुटि',
        description:
          error?.response?.data?.message ||
          error?.message ||
          (currentLanguage === 'en'
            ? 'Failed to accept order.'
            : 'ऑर्डर स्वीकार करने में विफल।'),
        variant: 'destructive',
      });
    }
  };

  const handleRejectOrder = async (orderId: string) => {
    try {
      await apiService.orders.cancel(orderId);
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId ? { ...o, status: 'cancelled' as const } : o
        )
      );
      toast({
        title:
          currentLanguage === 'en' ? 'Order Rejected' : 'ऑर्डर अस्वीकृत',
        variant: 'destructive',
      });
    } catch (error: any) {
      toast({
        title: currentLanguage === 'en' ? 'Error' : 'त्रुटि',
        description:
          error?.response?.data?.message ||
          error?.message ||
          (currentLanguage === 'en'
            ? 'Failed to reject order.'
            : 'ऑर्डर अस्वीकृत करने में विफल।'),
        variant: 'destructive',
      });
    }
  };

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    try {
      await apiService.orders.update(orderId, { status: newStatus });
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId ? { ...o, status: newStatus as Order['status'] } : o
        )
      );
      toast({
        title:
          currentLanguage === 'en' ? 'Status Updated' : 'स्थिति अपडेट',
      });
    } catch (error: any) {
      toast({
        title: currentLanguage === 'en' ? 'Error' : 'त्रुटि',
        description:
          error?.response?.data?.message ||
          error?.message ||
          (currentLanguage === 'en'
            ? 'Failed to update status.'
            : 'स्थिति अपडेट करने में विफल।'),
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; label: string; labelHi: string }> = {
      pending: { color: 'bg-warning/10 text-warning', label: 'Pending', labelHi: 'लंबित' },
      processing: { color: 'bg-accent/10 text-accent', label: 'Processing', labelHi: 'प्रोसेसिंग' },
      shipped: { color: 'bg-info/10 text-info', label: 'Shipped', labelHi: 'भेज दिया' },
      delivered: { color: 'bg-success/10 text-success', label: 'Delivered', labelHi: 'पहुंचा दिया' },
      cancelled: { color: 'bg-destructive/10 text-destructive', label: 'Cancelled', labelHi: 'रद्द' },
    };
    const config = statusConfig[status] || statusConfig.pending;
    return (
      <Badge className={config.color}>
        {currentLanguage === 'en' ? config.label : config.labelHi}
      </Badge>
    );
  };

  const stats = {
    pending: orders.filter((o) => o.status === 'pending').length,
    processing: orders.filter((o) => o.status === 'processing').length,
    shipped: orders.filter((o) => o.status === 'shipped').length,
    delivered: orders.filter((o) => o.status === 'delivered').length,
  };

  return (
    <Layout>
      <div className="container mx-auto min-w-0 px-3 py-5 sm:px-4 sm:py-6">
        {/* Header */}
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-muted rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold">
              {currentLanguage === 'en' ? 'Orders' : 'ऑर्डर'}
            </h1>
            <p className="text-muted-foreground">
              {currentLanguage === 'en' ? 'Manage your incoming orders' : 'अपने आने वाले ऑर्डर प्रबंधित करें'}
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="shrink-0"
            disabled={exportingCsv}
            onClick={() => void handleExportOrdersCsv()}
          >
            {exportingCsv ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Download className="w-4 h-4 mr-2" />
            )}
            {currentLanguage === 'en' ? 'Export CSV' : 'CSV निर्यात'}
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="card-elevated p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-warning/10 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.pending}</p>
              <p className="text-sm text-muted-foreground">{currentLanguage === 'en' ? 'Pending' : 'लंबित'}</p>
            </div>
          </div>
          <div className="card-elevated p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <Check className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.processing}</p>
              <p className="text-sm text-muted-foreground">{currentLanguage === 'en' ? 'Processing' : 'प्रोसेसिंग'}</p>
            </div>
          </div>
          <div className="card-elevated p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
              <Truck className="w-5 h-5 text-accent" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.shipped}</p>
              <p className="text-sm text-muted-foreground">{currentLanguage === 'en' ? 'Shipped' : 'भेज दिया'}</p>
            </div>
          </div>
          <div className="card-elevated p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.delivered}</p>
              <p className="text-sm text-muted-foreground">{currentLanguage === 'en' ? 'Delivered' : 'पहुंचा दिया'}</p>
            </div>
          </div>
        </div>
        {hasMore && filterStatus === 'all' && (
          <p className="text-xs text-muted-foreground mb-4">
            {currentLanguage === 'en'
              ? 'Summary counts reflect loaded orders only. Use Load more for additional rows.'
              : 'सारांश केवल लोड किए गए ऑर्डर पर आधारित है। और पंक्तियों के लिए लोड करें।'}
          </p>
        )}

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder={currentLanguage === 'en' ? 'Search orders...' : 'ऑर्डर खोजें...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-full sm:w-40">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{currentLanguage === 'en' ? 'All Status' : 'सभी स्थिति'}</SelectItem>
              <SelectItem value="pending">{currentLanguage === 'en' ? 'Pending' : 'लंबित'}</SelectItem>
              <SelectItem value="processing">{currentLanguage === 'en' ? 'Processing' : 'प्रोसेसिंग'}</SelectItem>
              <SelectItem value="shipped">{currentLanguage === 'en' ? 'Shipped' : 'भेज दिया'}</SelectItem>
              <SelectItem value="delivered">{currentLanguage === 'en' ? 'Delivered' : 'पहुंचा दिया'}</SelectItem>
              <SelectItem value="cancelled">{currentLanguage === 'en' ? 'Cancelled' : 'रद्द'}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Orders List */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                {currentLanguage === 'en'
                  ? 'Loading orders...'
                  : 'ऑर्डर लोड हो रहे हैं...'}
              </p>
            </div>
          ) : (
            <>
            {filteredOrders.map((order) => (
            <div key={order.id} className="card-elevated p-4">
              <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                {/* Product Info */}
                <div className="flex gap-4 flex-1">
                  <img
                    src={order.productImage}
                    alt={order.productName}
                    className="w-20 h-20 rounded-lg object-cover"
                  />
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold">{order.productName}</h3>
                      {getStatusBadge(order.status)}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {currentLanguage === 'en' ? 'Buyer:' : 'खरीदार:'} {order.buyerName}
                    </p>
                    <p className="text-sm">
                      {order.quantity} {order.unit} × ₹{order.pricePerUnit.toLocaleString()}
                    </p>
                    <p className="font-bold text-primary">₹{order.totalAmount.toLocaleString()}</p>
                  </div>
                </div>

                {/* Order Details */}
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">
                    {currentLanguage === 'en' ? 'Order ID:' : 'ऑर्डर आईडी:'}{' '}
                    <span className="font-mono">{order.id}</span>
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {currentLanguage === 'en' ? 'Delivery:' : 'डिलीवरी:'}{' '}
                    {order.deliveryAddress.substring(0, 40)}...
                  </p>
                  <div className="text-sm text-muted-foreground">
                    {currentLanguage === 'en' ? 'Payment:' : 'भुगतान:'}{' '}
                    <Badge variant="outline" className="text-xs font-normal">
                      {paymentLineLabel(
                        order.paymentStatus,
                        order.paymentMethod,
                        currentLanguage === 'en'
                      )}
                    </Badge>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-2 lg:flex-col">
                  <Button size="sm" variant="secondary" asChild className="flex-1 lg:flex-none">
                    <Link to={`/farmer/orders/${order.id}`}>
                      {currentLanguage === 'en' ? 'View order' : 'ऑर्डर देखें'}
                    </Link>
                  </Button>
                  {order.status === 'pending' && (
                    <>
                      <Button
                        size="sm"
                        onClick={() => handleAcceptOrder(order.id)}
                        className="bg-success hover:bg-success/90 flex-1 lg:flex-none"
                      >
                        <Check className="w-4 h-4 mr-1" />
                        {currentLanguage === 'en' ? 'Accept' : 'स्वीकार'}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRejectOrder(order.id)}
                        className="text-destructive flex-1 lg:flex-none"
                      >
                        <X className="w-4 h-4 mr-1" />
                        {currentLanguage === 'en' ? 'Reject' : 'अस्वीकार'}
                      </Button>
                    </>
                  )}
                  {order.status === 'processing' && (
                    <Button
                      size="sm"
                      onClick={() => handleUpdateStatus(order.id, 'shipped')}
                      className="btn-primary-gradient"
                    >
                      <Truck className="w-4 h-4 mr-1" />
                      {currentLanguage === 'en' ? 'Mark Shipped' : 'भेजा गया'}
                    </Button>
                  )}
                  {order.status === 'shipped' && (
                    <Button
                      size="sm"
                      onClick={() => handleUpdateStatus(order.id, 'delivered')}
                      className="bg-success hover:bg-success/90"
                    >
                      <Check className="w-4 h-4 mr-1" />
                      {currentLanguage === 'en' ? 'Mark Delivered' : 'पहुंचा दिया'}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
            {!isLoading && hasMore && searchQuery.trim() === '' && (
              <div className="flex justify-center pt-4">
                <Button
                  type="button"
                  variant="outline"
                  disabled={loadingMore}
                  onClick={() => void loadMoreOrders()}
                >
                  {loadingMore
                    ? currentLanguage === 'en'
                      ? 'Loading…'
                      : 'लोड हो रहा है…'
                    : currentLanguage === 'en'
                      ? 'Load more orders'
                      : 'और ऑर्डर लोड करें'}
                </Button>
              </div>
            )}
            </>
          )}
        </div>

        {filteredOrders.length === 0 && (
          <div className="text-center py-12">
            <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">
              {currentLanguage === 'en' ? 'No orders found' : 'कोई ऑर्डर नहीं मिला'}
            </h3>
            <p className="text-muted-foreground">
              {currentLanguage === 'en' ? 'Try adjusting your filters' : 'अपने फ़िल्टर बदलें'}
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default FarmerOrders;
