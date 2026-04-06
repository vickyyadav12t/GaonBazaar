import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Package, Download, Loader2, Filter } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAppSelector } from '@/hooks/useRedux';
import { apiService } from '@/services/api';
import { saveCsvFromApi } from '@/lib/downloadCsv';
import { Order } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { mapApiOrderToOrder } from '@/lib/mapOrderFromApi';

const ORDER_STATUS_FILTER_VALUES = new Set([
  'pending',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
]);

const ORDER_PAGE = 50;

const OrderTracking = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  const { currentLanguage } = useAppSelector((state) => state.language);
  const { user } = useAppSelector((state) => state.auth);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [orderTotal, setOrderTotal] = useState<number | null>(null);
  const ordersRef = useRef<Order[]>([]);
  ordersRef.current = orders;
  const [exportingCsv, setExportingCsv] = useState(false);

  const statusParam = searchParams.get('status');
  const filterStatus =
    statusParam && ORDER_STATUS_FILTER_VALUES.has(statusParam) ? statusParam : 'all';

  const filterPaymentPending = searchParams.get('payment') === 'pending';

  const setFilterStatus = (value: string) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (value === 'all') next.delete('status');
        else next.set('status', value);
        next.delete('payment');
        return next;
      },
      { replace: true }
    );
  };

  const setPaymentFilter = (value: 'all' | 'pending') => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (value === 'pending') {
          next.set('payment', 'pending');
          next.delete('status');
        } else {
          next.delete('payment');
        }
        return next;
      },
      { replace: true }
    );
  };

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
          paymentStatus?: string;
        } = {
          limit: ORDER_PAGE,
          skip: 0,
          includeTotal: true,
        };
        if (filterStatus !== 'all') params.status = filterStatus;
        if (filterPaymentPending) params.paymentStatus = 'pending';
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
  }, [user, currentLanguage, toast, filterStatus, filterPaymentPending]);

  const loadMoreOrders = async () => {
    if (!user || loadingMore || !hasMore) return;
    setLoadingMore(true);
    const skip = ordersRef.current.length;
    try {
      const params: {
        limit: number;
        skip: number;
        status?: string;
        paymentStatus?: string;
      } = { limit: ORDER_PAGE, skip };
      if (filterStatus !== 'all') params.status = filterStatus;
      if (filterPaymentPending) params.paymentStatus = 'pending';
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

  const en = currentLanguage === 'en';

  const handleExportOrdersCsv = async () => {
    try {
      setExportingCsv(true);
      await saveCsvFromApi(() => apiService.orders.exportCsv(), 'orders.csv');
      toast({
        title: en ? 'Export started' : 'निर्यात शुरू',
        description: en ? 'Your orders CSV is downloading.' : 'आपका ऑर्डर CSV डाउनलोड हो रहा है।',
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '';
      toast({
        title: en ? 'Export failed' : 'निर्यात विफल',
        description: msg || (en ? 'Could not download CSV.' : 'CSV डाउनलोड नहीं हो सका।'),
        variant: 'destructive',
      });
    } finally {
      setExportingCsv(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'text-success bg-success/10';
      case 'shipped':
        return 'text-primary bg-primary/10';
      case 'cancelled':
        return 'text-destructive bg-destructive/10';
      default:
        return 'text-warning bg-warning/10';
    }
  };

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const statusOk = filterStatus === 'all' || o.status === filterStatus;
      const paymentOk =
        !filterPaymentPending ||
        (o.paymentStatus === 'pending' && o.status !== 'cancelled');
      return statusOk && paymentOk;
    });
  }, [orders, filterStatus, filterPaymentPending]);

  const paymentFilterValue = filterPaymentPending ? 'pending' : 'all';

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6 max-w-2xl">
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <button type="button" onClick={() => navigate(-1)} className="p-2 hover:bg-muted rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold flex-1 min-w-0">{en ? 'My orders' : 'मेरे ऑर्डर'}</h1>
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
            {en ? 'Export CSV' : 'CSV निर्यात'}
          </Button>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">
            {en ? 'Loading orders…' : 'ऑर्डर लोड हो रहे हैं…'}
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Package className="w-14 h-14 mx-auto mb-4 opacity-50" />
            <p className="mb-4">{en ? 'No orders yet.' : 'अभी तक कोई ऑर्डर नहीं।'}</p>
            <Button asChild>
              <Link to="/marketplace">{en ? 'Browse marketplace' : 'बाज़ार देखें'}</Link>
            </Button>
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center mb-6">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <Filter className="w-4 h-4 mr-2 shrink-0" />
                  <SelectValue placeholder={en ? 'Order status' : 'ऑर्डर स्थिति'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{en ? 'All statuses' : 'सभी स्थिति'}</SelectItem>
                  <SelectItem value="pending">{en ? 'Pending' : 'लंबित'}</SelectItem>
                  <SelectItem value="processing">{en ? 'Processing' : 'प्रोसेसिंग'}</SelectItem>
                  <SelectItem value="shipped">{en ? 'Shipped' : 'भेज दिया'}</SelectItem>
                  <SelectItem value="delivered">{en ? 'Delivered' : 'डिलीवर'}</SelectItem>
                  <SelectItem value="cancelled">{en ? 'Cancelled' : 'रद्द'}</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={paymentFilterValue}
                onValueChange={(v) => setPaymentFilter(v as 'all' | 'pending')}
              >
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder={en ? 'Payment' : 'भुगतान'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{en ? 'All payments' : 'सभी भुगतान'}</SelectItem>
                  <SelectItem value="pending">
                    {en ? 'Payment pending' : 'भुगतान लंबित'}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {filteredOrders.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground rounded-xl border border-dashed">
                <p className="mb-4">
                  {en ? 'No orders match this filter.' : 'इस फ़िल्टर से कोई ऑर्डर नहीं मिला।'}
                </p>
                <Button type="button" variant="outline" size="sm" asChild>
                  <Link to="/buyer/orders">{en ? 'Clear filters' : 'फ़िल्टर हटाएं'}</Link>
                </Button>
              </div>
            ) : (
              <ul className="space-y-3">
                {filteredOrders.map((order) => (
                  <li key={order.id}>
                    <Link
                      to={`/buyer/orders/${order.id}`}
                      className="block card-elevated p-4 transition-all hover:ring-2 hover:ring-primary/30"
                    >
                      <div className="flex gap-4">
                        <img
                          src={order.productImage}
                          alt=""
                          className="w-16 h-16 rounded-lg object-cover shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{order.productName}</p>
                          <p className="text-sm text-muted-foreground">
                            {order.quantity} {order.unit} · {en ? 'Seller' : 'विक्रेता'}:{' '}
                            {order.farmerName}
                          </p>
                          <div className="flex flex-wrap items-center gap-2 mt-2">
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full capitalize ${getStatusColor(order.status)}`}
                            >
                              {order.status}
                            </span>
                            <span className="text-sm font-semibold text-primary">
                              ₹{order.totalAmount.toLocaleString('en-IN')}
                            </span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            {hasMore && filteredOrders.length > 0 && (
              <div className="flex justify-center mt-6">
                <Button
                  type="button"
                  variant="outline"
                  disabled={loadingMore}
                  onClick={() => void loadMoreOrders()}
                >
                  {loadingMore
                    ? en
                      ? 'Loading…'
                      : 'लोड हो रहा है…'
                    : en
                      ? 'Load more'
                      : 'और लोड करें'}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
};

export default OrderTracking;
