import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, TrendingUp, TrendingDown, Package, ShoppingCart, Award, BarChart3, Download, Filter, RefreshCw, Loader2 } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useAppSelector } from '@/hooks/useRedux';
import { useToast } from '@/hooks/use-toast';
import { apiService } from '@/services/api';
import { saveCsvFromApi } from '@/lib/downloadCsv';
import { Order, Product } from '@/types';
import { formatPrice } from '@/lib/format';
import { mapApiOrderToOrder } from '@/lib/mapOrderFromApi';
import { getAnalyticsPeriodStart, isOrderInPeriod } from '@/lib/analyticsPeriod';
import { resolveFarmerAvatarUrl } from '@/lib/farmerAvatarUrl';
import { sanitizeImageUrlList } from '@/lib/productImageUrl';
import { fetchAllOrdersForCurrentUser } from '@/lib/fetchAllPaginated';
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, AreaChart, Area
} from 'recharts';

const PIE_COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#a855f7', '#ec4899', '#14b8a6', '#64748b'];

const Analytics = () => {
  const navigate = useNavigate();
  const { currentLanguage } = useAppSelector((state) => state.language);
  const { user } = useAppSelector((state) => state.auth);
  const { toast } = useToast();

  const [timePeriod, setTimePeriod] = useState<'week' | 'month' | 'quarter' | 'year'>('month');
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [fetchedAt, setFetchedAt] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isExportingOrdersCsv, setIsExportingOrdersCsv] = useState(false);

  const loadAnalytics = useCallback(async () => {
    if (!user || user.role !== 'farmer') return;
    try {
      setIsLoading(true);
      const [backendOrders, productsRes] = await Promise.all([
        fetchAllOrdersForCurrentUser(),
        apiService.products.getAllMine(),
      ]);
      const backendProducts = productsRes.data?.products || [];

      const mappedOrders: Order[] = backendOrders.map((o: any) => mapApiOrderToOrder(o));

      const mappedProducts: Product[] = backendProducts.map((p: any) => ({
        id: p._id || p.id,
        farmerId: p.farmer?._id || p.farmer || '',
        farmerName: p.farmer?.name || 'Farmer',
        farmerAvatar: resolveFarmerAvatarUrl(p.farmer?.avatar),
        farmerRating: 4.8,
        farmerLocation: p.farmer?.location
          ? `${p.farmer.location.district}, ${p.farmer.location.state}`
          : '',
        name: p.name,
        nameHindi: p.nameHindi,
        category: p.category,
        description: p.description || '',
        images: sanitizeImageUrlList(p.images),
        price: p.price,
        unit: p.unit,
        minOrderQuantity: p.minOrderQuantity || 1,
        availableQuantity: p.availableQuantity,
        harvestDate: p.harvestDate || new Date().toISOString(),
        isOrganic: !!p.isOrganic,
        isNegotiable: !!p.isNegotiable,
        status: (p.status as Product['status']) || 'active',
        createdAt: p.createdAt || new Date().toISOString(),
        views: p.views || 0,
        inquiries: 0,
      }));

      setAllOrders(mappedOrders);
      setAllProducts(mappedProducts);
      setFetchedAt(new Date());
    } catch (error: any) {
      console.error('Failed to load analytics data', error);
      toast({
        title: currentLanguage === 'en' ? 'Error' : 'त्रुटि',
        description:
          error?.response?.data?.message ||
          error?.message ||
          (currentLanguage === 'en'
            ? 'Failed to load analytics.'
            : 'विश्लेषण लोड करने में विफल।'),
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [user, currentLanguage, toast]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  const filteredOrders = useMemo(() => {
    if (!fetchedAt) return [];
    const end = fetchedAt;
    const start = getAnalyticsPeriodStart(timePeriod, end);
    return allOrders.filter((o) => isOrderInPeriod(o.createdAt, start, end));
  }, [allOrders, timePeriod, fetchedAt]);

  const categoryForOrder = useCallback(
    (productId: string) => allProducts.find((p) => p.id === productId)?.category || 'Other',
    [allProducts]
  );

  const {
    totalRevenue,
    totalOrders,
    averageOrderValue,
    revenueGrowth,
    orderGrowth,
    salesTrendData,
    revenueByCategory,
    topProducts,
    monthlyInPeriod,
    dailySalesData,
    topCustomer,
    bestSellingProduct,
  } = useMemo(() => {
    if (!fetchedAt) {
      return {
        totalRevenue: 0,
        totalOrders: 0,
        averageOrderValue: 0,
        revenueGrowth: 0,
        orderGrowth: 0,
        salesTrendData: [] as { date: string; sales: number; orders: number }[],
        revenueByCategory: [] as { name: string; value: number; percentage: number; color: string }[],
        topProducts: [] as { name: string; sales: number; orders: number; growth: number }[],
        monthlyInPeriod: [] as { month: string; revenue: number }[],
        dailySalesData: [] as { day: string; sales: number }[],
        topCustomer: '-',
        bestSellingProduct: '-',
      };
    }

    const paid = filteredOrders.filter((o) => o.paymentStatus === 'paid');
    const totalRev = paid.reduce((s, o) => s + o.totalAmount, 0);
    const tOrders = filteredOrders.length;
    const avgVal = tOrders > 0 ? totalRev / tOrders : 0;

    const endTs = fetchedAt.getTime();
    const startTs = getAnalyticsPeriodStart(timePeriod, fetchedAt).getTime();
    const midTs = (startTs + endTs) / 2;
    const firstHalf = filteredOrders.filter((o) => new Date(o.createdAt).getTime() < midTs);
    const secondHalf = filteredOrders.filter((o) => new Date(o.createdAt).getTime() >= midTs);
    const r1 = firstHalf.filter((o) => o.paymentStatus === 'paid').reduce((s, o) => s + o.totalAmount, 0);
    const r2 = secondHalf.filter((o) => o.paymentStatus === 'paid').reduce((s, o) => s + o.totalAmount, 0);
    const revGrowth = r1 > 0 ? ((r2 - r1) / r1) * 100 : r2 > 0 ? 100 : 0;
    const c1 = firstHalf.length;
    const c2 = secondHalf.length;
    const ordGrowth = c1 > 0 ? ((c2 - c1) / c1) * 100 : c2 > 0 ? 100 : 0;

    const byDay: Record<string, { sales: number; orders: number }> = {};
    filteredOrders.forEach((o) => {
      const key = new Date(o.createdAt).toISOString().slice(0, 10);
      if (!byDay[key]) byDay[key] = { sales: 0, orders: 0 };
      byDay[key].sales += o.totalAmount;
      byDay[key].orders += 1;
    });
    const locale = currentLanguage === 'hi' ? 'hi-IN' : 'en-IN';
    const salesTrendData = Object.keys(byDay)
      .sort()
      .map((key) => ({
        date: new Date(key).toLocaleDateString(locale, { month: 'short', day: 'numeric' }),
        sales: byDay[key].sales,
        orders: byDay[key].orders,
      }));

    const revenueByCategoryMap: Record<string, number> = {};
    filteredOrders
      .filter((o) => o.paymentStatus === 'paid')
      .forEach((o) => {
        const cat = categoryForOrder(o.productId);
        revenueByCategoryMap[cat] = (revenueByCategoryMap[cat] || 0) + o.totalAmount;
      });
    const revenueByCategory = Object.entries(revenueByCategoryMap).map(([name, value], index) => ({
      name,
      value,
      percentage: totalRev > 0 ? Math.round((value / totalRev) * 100) : 0,
      color: PIE_COLORS[index % PIE_COLORS.length],
    }));

    const productSalesMap: Record<string, { name: string; sales: number; orders: number }> = {};
    filteredOrders.forEach((o) => {
      const name = o.productName || 'Product';
      if (!productSalesMap[name]) {
        productSalesMap[name] = { name, sales: 0, orders: 0 };
      }
      productSalesMap[name].sales += o.totalAmount;
      productSalesMap[name].orders += 1;
    });
    const topProducts = Object.values(productSalesMap)
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 4)
      .map((p, index, arr) => ({
        ...p,
        growth:
          index === 0 || arr.length < 2
            ? 0
            : ((p.sales - arr[arr.length - 1].sales) / Math.max(1, arr[arr.length - 1].sales)) * 100,
      }));

    const monthBuckets: { sort: number; label: string; revenue: number }[] = [];
    const idx = new Map<number, number>();
    filteredOrders.forEach((o) => {
      const d = new Date(o.createdAt);
      const sort = d.getFullYear() * 12 + d.getMonth();
      const label = d.toLocaleString(locale, { month: 'short', year: 'numeric' });
      const existing = idx.get(sort);
      if (existing === undefined) {
        idx.set(sort, monthBuckets.length);
        monthBuckets.push({ sort, label, revenue: o.totalAmount });
      } else {
        monthBuckets[existing].revenue += o.totalAmount;
      }
    });
    const monthlyInPeriod = monthBuckets.sort((a, b) => a.sort - b.sort).map((b) => ({
      month: b.label,
      revenue: b.revenue,
    }));

    const dailyMap: Record<string, number> = {};
    filteredOrders.forEach((o) => {
      const day = new Date(o.createdAt).toLocaleString(locale, { weekday: 'short' });
      dailyMap[day] = (dailyMap[day] || 0) + o.totalAmount;
    });
    const dailySalesData = Object.entries(dailyMap).map(([day, sales]) => ({ day, sales }));

    const customerSpendMap: Record<string, { name: string; total: number }> = {};
    filteredOrders.forEach((o) => {
      const name = o.buyerName || 'Customer';
      if (!customerSpendMap[name]) customerSpendMap[name] = { name, total: 0 };
      customerSpendMap[name].total += o.totalAmount;
    });
    const topCustomerEntry = Object.values(customerSpendMap).sort((a, b) => b.total - a.total)[0];
    const bestProductEntry = Object.values(productSalesMap).sort((a, b) => b.sales - a.sales)[0];

    return {
      totalRevenue: totalRev,
      totalOrders: tOrders,
      averageOrderValue: avgVal,
      revenueGrowth: revGrowth,
      orderGrowth: ordGrowth,
      salesTrendData,
      revenueByCategory,
      topProducts,
      monthlyInPeriod,
      dailySalesData,
      topCustomer: topCustomerEntry?.name || '-',
      bestSellingProduct: bestProductEntry?.name || '-',
    };
  }, [filteredOrders, timePeriod, fetchedAt, categoryForOrder, currentLanguage]);

  const metrics = {
    totalRevenue,
    totalOrders,
    averageOrderValue,
    conversionRate: 0,
    customerRetention: 0,
    topCustomer,
    bestSellingProduct,
    revenueGrowth,
    orderGrowth,
  };

  const handleDownload = () => {
    try {
      const blob = new Blob(
        [
          JSON.stringify(
            {
              exportedAt: new Date().toISOString(),
              period: timePeriod,
              orderCount: filteredOrders.length,
              orders: filteredOrders,
            },
            null,
            2
          ),
        ],
        { type: 'application/json' }
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `farmer-analytics-${timePeriod}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast({
        title: currentLanguage === 'en' ? 'Download started' : 'डाउनलोड शुरू',
      });
    } catch {
      toast({
        title: currentLanguage === 'en' ? 'Export failed' : 'निर्यात विफल',
        variant: 'destructive',
      });
    }
  };

  const content = {
    en: {
      title: 'Analytics & Reports',
      subtitle: 'Track your business performance and insights',
      overview: 'Overview',
      salesTrend: 'Sales Trend',
      revenueByCategory: 'Revenue by Category',
      topProducts: 'Top Selling Products',
      performance: 'Performance Metrics',
      monthlyComparison: 'Revenue by month',
      monthlyComparisonHint: 'Within selected period',
      refresh: 'Refresh',
      dailySales: 'Daily Sales',
      totalRevenue: 'Total Revenue',
      totalOrders: 'Total Orders',
      avgOrderValue: 'Avg Order Value',
      conversionRate: 'Conversion Rate',
      customerRetention: 'Customer Retention',
      topCustomer: 'Top Customer',
      bestProduct: 'Best Selling Product',
      revenueGrowth: 'Revenue Growth',
      orderGrowth: 'Order Growth',
      sales: 'Sales',
      orders: 'Orders',
      thisYear: 'This Year',
      lastYear: 'Last Year',
      product: 'Product',
      revenue: 'Revenue',
      growth: 'Growth',
      download: 'Download Report',
      downloadOrdersCsv: 'All orders (CSV)',
      filterBy: 'Filter By',
      week: 'Last Week',
      month: 'Last Month',
      quarter: 'Last Quarter',
      year: 'Last Year',
      noData: 'No data available',
      splitPeriodNote: '1st vs 2nd half of range',
    },
    hi: {
      title: 'विश्लेषण और रिपोर्ट',
      subtitle: 'अपने व्यापार प्रदर्शन और अंतर्दृष्टि ट्रैक करें',
      overview: 'अवलोकन',
      salesTrend: 'बिक्री रुझान',
      revenueByCategory: 'श्रेणी द्वारा राजस्व',
      topProducts: 'सर्वश्रेष्ठ बिकने वाले उत्पाद',
      performance: 'प्रदर्शन मेट्रिक्स',
      monthlyComparison: 'महीने के अनुसार राजस्व',
      monthlyComparisonHint: 'चयनित अवधि में',
      refresh: 'रिफ्रेश',
      dailySales: 'दैनिक बिक्री',
      totalRevenue: 'कुल राजस्व',
      totalOrders: 'कुल ऑर्डर',
      avgOrderValue: 'औसत ऑर्डर मूल्य',
      conversionRate: 'रूपांतरण दर',
      customerRetention: 'ग्राहक प्रतिधारण',
      topCustomer: 'शीर्ष ग्राहक',
      bestProduct: 'सर्वश्रेष्ठ बिकने वाला उत्पाद',
      revenueGrowth: 'राजस्व वृद्धि',
      orderGrowth: 'ऑर्डर वृद्धि',
      sales: 'बिक्री',
      orders: 'ऑर्डर',
      thisYear: 'इस वर्ष',
      lastYear: 'पिछले साल',
      product: 'उत्पाद',
      revenue: 'राजस्व',
      growth: 'वृद्धि',
      download: 'रिपोर्ट डाउनलोड करें',
      downloadOrdersCsv: 'सभी ऑर्डर (CSV)',
      filterBy: 'फ़िल्टर करें',
      week: 'पिछला सप्ताह',
      month: 'पिछला महीना',
      quarter: 'पिछली तिमाही',
      year: 'पिछला साल',
      noData: 'कोई डेटा उपलब्ध नहीं',
      splitPeriodNote: 'अवधि का पहला बनाम दूसरा आधा',
    },
  };

  const t = content[currentLanguage];

  const handleExportOrdersCsv = async () => {
    try {
      setIsExportingOrdersCsv(true);
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
        description:
          msg ||
          (currentLanguage === 'en' ? 'Could not download CSV.' : 'CSV डाउनलोड नहीं हो सका।'),
        variant: 'destructive',
      });
    } finally {
      setIsExportingOrdersCsv(false);
    }
  };

  const revGrowthPositive = metrics.revenueGrowth >= 0;
  const ordGrowthPositive = metrics.orderGrowth >= 0;

  return (
    <Layout>
      <div
        className={`container mx-auto min-w-0 px-3 py-5 transition-opacity sm:px-4 sm:py-6 ${isLoading ? 'opacity-70' : ''}`}
      >
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
          <div className="flex items-center gap-4">
            <button type="button" onClick={() => navigate(-1)} className="p-2 hover:bg-muted rounded-lg">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className={`text-2xl font-bold ${currentLanguage === 'hi' ? 'font-hindi' : ''}`}>
                {t.title}
              </h1>
              <p className={`text-muted-foreground ${currentLanguage === 'hi' ? 'font-hindi' : ''}`}>
                {t.subtitle}
              </p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => void loadAnalytics()}
              disabled={isLoading}
              title={t.refresh}
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
            <Select value={timePeriod} onValueChange={(v: 'week' | 'month' | 'quarter' | 'year') => setTimePeriod(v)}>
              <SelectTrigger className="w-40">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">{t.week}</SelectItem>
                <SelectItem value="month">{t.month}</SelectItem>
                <SelectItem value="quarter">{t.quarter}</SelectItem>
                <SelectItem value="year">{t.year}</SelectItem>
              </SelectContent>
            </Select>
            
            <Button type="button" variant="outline" onClick={handleDownload}>
              <Download className="w-4 h-4 mr-2" />
              {t.download}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={isExportingOrdersCsv}
              onClick={() => void handleExportOrdersCsv()}
            >
              {isExportingOrdersCsv ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Download className="w-4 h-4 mr-2" />
              )}
              {t.downloadOrdersCsv}
            </Button>
          </div>
        </div>

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>{t.totalRevenue}</CardDescription>
              <CardTitle className="text-2xl">{formatPrice(metrics.totalRevenue)}</CardTitle>
            </CardHeader>
            <CardContent>
              {filteredOrders.length > 0 ? (
                <div
                  className={`flex items-center gap-1 text-sm ${revGrowthPositive ? 'text-success' : 'text-destructive'}`}
                >
                  {revGrowthPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  <span>
                    {revGrowthPositive ? '+' : ''}
                    {metrics.revenueGrowth.toFixed(1)}%{' '}
                    <span className="text-muted-foreground font-normal">{t.splitPeriodNote}</span>
                  </span>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">—</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>{t.totalOrders}</CardDescription>
              <CardTitle className="text-2xl">{metrics.totalOrders}</CardTitle>
            </CardHeader>
            <CardContent>
              {filteredOrders.length > 0 ? (
                <div
                  className={`flex items-center gap-1 text-sm ${ordGrowthPositive ? 'text-success' : 'text-destructive'}`}
                >
                  {ordGrowthPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  <span>
                    {ordGrowthPositive ? '+' : ''}
                    {metrics.orderGrowth.toFixed(1)}%{' '}
                    <span className="text-muted-foreground font-normal">{t.splitPeriodNote}</span>
                  </span>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">—</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>{t.avgOrderValue}</CardDescription>
              <CardTitle className="text-2xl">{formatPrice(metrics.averageOrderValue)}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-1 text-muted-foreground text-sm">
                <ShoppingCart className="w-4 h-4" />
                <span>{currentLanguage === 'en' ? 'Per order' : 'प्रति ऑर्डर'}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>{t.conversionRate}</CardDescription>
              <CardTitle className="text-2xl">{metrics.conversionRate}%</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-1 text-primary text-sm">
                <BarChart3 className="w-4 h-4" />
                <span>{currentLanguage === 'en' ? 'View to order' : 'देखें से ऑर्डर'}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 1 */}
        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          {/* Sales Trend */}
          <Card>
            <CardHeader>
              <CardTitle>{t.salesTrend}</CardTitle>
              <CardDescription>{currentLanguage === 'en' ? 'Revenue and orders over time' : 'समय के साथ राजस्व और ऑर्डर'}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={
                      salesTrendData.length > 0
                        ? salesTrendData
                        : [{ date: '—', sales: 0, orders: 0 }]
                    }
                  >
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="date" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip 
                      formatter={(value: any) => formatPrice(value)}
                      contentStyle={{ borderRadius: '8px' }}
                    />
                    <Legend />
                    <Area 
                      type="monotone" 
                      dataKey="sales" 
                      stroke="hsl(var(--primary))" 
                      fill="hsl(var(--primary) / 0.2)"
                      name={currentLanguage === 'en' ? 'Revenue' : 'राजस्व'}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="orders" 
                      stroke="hsl(var(--accent))" 
                      fill="hsl(var(--accent) / 0.2)"
                      name={currentLanguage === 'en' ? 'Orders' : 'ऑर्डर'}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Revenue by Category */}
          <Card>
            <CardHeader>
              <CardTitle>{t.revenueByCategory}</CardTitle>
              <CardDescription>{currentLanguage === 'en' ? 'Breakdown by crop category' : 'फसल श्रेणी द्वारा विवरण'}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={revenueByCategory}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percentage }) => `${name} ${percentage}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {revenueByCategory.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: any) => formatPrice(value)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              
              {/* Legend */}
              <div className="grid grid-cols-2 gap-2 mt-4">
                {revenueByCategory.map((category) => (
                  <div key={category.name} className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: category.color }}
                    />
                    <span className="text-sm">{category.name}</span>
                    <span className="text-sm font-medium ml-auto">{formatPrice(category.value)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 2 */}
        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          {/* Monthly Comparison */}
          <Card>
            <CardHeader>
              <CardTitle>{t.monthlyComparison}</CardTitle>
              <CardDescription>{t.monthlyComparisonHint}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={
                      monthlyInPeriod.length > 0
                        ? monthlyInPeriod
                        : [{ month: currentLanguage === 'en' ? 'No data' : 'कोई डेटा नहीं', revenue: 0 }]
                    }
                  >
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="month" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip formatter={(value: any) => formatPrice(value)} />
                    <Legend />
                    <Bar
                      dataKey="revenue"
                      fill="hsl(var(--primary))"
                      radius={[4, 4, 0, 0]}
                      name={t.revenue}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Daily Sales */}
          <Card>
            <CardHeader>
              <CardTitle>{t.dailySales}</CardTitle>
              <CardDescription>{currentLanguage === 'en' ? 'Sales by day of week' : 'सप्ताह के दिन के अनुसार बिक्री'}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={dailySalesData}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="day" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip formatter={(value: any) => formatPrice(value)} />
                    <Line 
                      type="monotone" 
                      dataKey="sales" 
                      stroke="hsl(var(--accent))" 
                      strokeWidth={2}
                      dot={{ fill: 'hsl(var(--accent))', r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Top Products and Performance */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Top Selling Products */}
          <Card>
            <CardHeader>
              <CardTitle>{t.topProducts}</CardTitle>
              <CardDescription>{currentLanguage === 'en' ? 'Best performing products' : 'सर्वश्रेष्ठ प्रदर्शन करने वाले उत्पाद'}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topProducts.map((product, index) => (
                  <div key={`${product.name}-${index}`} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                        <span className="text-sm font-bold text-primary">#{index + 1}</span>
                      </div>
                      <div>
                        <p className="font-medium text-sm">{product.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {product.orders} {currentLanguage === 'en' ? 'orders' : 'ऑर्डर'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{formatPrice(product.sales)}</p>
                      <div className={`flex items-center gap-1 text-xs ${
                        product.growth >= 0 ? 'text-success' : 'text-destructive'
                      }`}>
                        {product.growth >= 0 ? (
                          <TrendingUp className="w-3 h-3" />
                        ) : (
                          <TrendingDown className="w-3 h-3" />
                        )}
                        <span>{Math.abs(product.growth)}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Performance Metrics */}
          <Card>
            <CardHeader>
              <CardTitle>{t.performance}</CardTitle>
              <CardDescription>{currentLanguage === 'en' ? 'Key business metrics' : 'मुख्य व्यापार मेट्रिक्स'}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Award className="w-5 h-5 text-primary" />
                    <span className="text-sm font-medium">{t.topCustomer}</span>
                  </div>
                  <span className="font-medium">{metrics.topCustomer}</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Package className="w-5 h-5 text-success" />
                    <span className="text-sm font-medium">{t.bestProduct}</span>
                  </div>
                  <span className="font-medium text-sm">{metrics.bestSellingProduct}</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <TrendingUp className="w-5 h-5 text-accent" />
                    <span className="text-sm font-medium">{t.revenueGrowth}</span>
                  </div>
                  <Badge
                    className={
                      metrics.revenueGrowth >= 0
                        ? 'bg-success/10 text-success'
                        : 'bg-destructive/10 text-destructive'
                    }
                  >
                    {metrics.revenueGrowth >= 0 ? '+' : ''}
                    {metrics.revenueGrowth.toFixed(1)}%
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <ShoppingCart className="w-5 h-5 text-primary" />
                    <span className="text-sm font-medium">{t.orderGrowth}</span>
                  </div>
                  <Badge
                    className={
                      metrics.orderGrowth >= 0
                        ? 'bg-success/10 text-success'
                        : 'bg-destructive/10 text-destructive'
                    }
                  >
                    {metrics.orderGrowth >= 0 ? '+' : ''}
                    {metrics.orderGrowth.toFixed(1)}%
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <BarChart3 className="w-5 h-5 text-warning" />
                    <span className="text-sm font-medium">{t.customerRetention}</span>
                  </div>
                  <Badge className="bg-primary/10 text-primary">
                    {metrics.customerRetention}%
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Analytics;







