import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, TrendingUp, TrendingDown, Package, DollarSign, ShoppingCart, Award, BarChart3, Calendar, Download, Filter } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useAppSelector } from '@/hooks/useRedux';
import { mockProducts, mockOrders } from '@/data/mockData';
import { formatPrice, formatDate, formatNumber } from '@/lib/format';
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, AreaChart, Area
} from 'recharts';

const Analytics = () => {
  const navigate = useNavigate();
  const { currentLanguage } = useAppSelector((state) => state.language);
  
  const [timePeriod, setTimePeriod] = useState<'week' | 'month' | 'quarter' | 'year'>('month');
  
  const farmerOrders = mockOrders.filter((o) => o.farmerId === 'farmer-1');
  const farmerProducts = mockProducts.filter((p) => p.farmerId === 'farmer-1');

  // Sales Trend Data
  const salesTrendData = [
    { date: 'Week 1', sales: 12000, orders: 3 },
    { date: 'Week 2', sales: 15000, orders: 4 },
    { date: 'Week 3', sales: 18000, orders: 5 },
    { date: 'Week 4', sales: 22000, orders: 6 },
  ];

  // Revenue by Category
  const revenueByCategory = [
    { name: 'Grains', value: 35400, percentage: 45, color: '#22c55e' },
    { name: 'Vegetables', value: 24000, percentage: 30, color: '#f59e0b' },
    { name: 'Fruits', value: 12000, percentage: 15, color: '#3b82f6' },
    { name: 'Other', value: 7020, percentage: 9, color: '#8b5cf6' },
  ];

  // Top Selling Products
  const topProducts = [
    { name: 'Fresh Organic Wheat', sales: 27000, orders: 10, growth: 15 },
    { name: 'Premium Red Onions', sales: 12000, orders: 5, growth: 8 },
    { name: 'Basmati Rice', sales: 8500, orders: 3, growth: 12 },
    { name: 'Fresh Tomatoes', sales: 6000, orders: 2, growth: -5 },
  ];

  // Monthly Comparison
  const monthlyComparison = [
    { month: 'Oct', thisYear: 23000, lastYear: 20000 },
    { month: 'Nov', thisYear: 25000, lastYear: 22000 },
    { month: 'Dec', thisYear: 29420, lastYear: 25000 },
  ];

  // Performance Metrics
  const metrics = {
    totalRevenue: 78420,
    totalOrders: 22,
    averageOrderValue: 3565,
    conversionRate: 12.5,
    customerRetention: 68,
    topCustomer: 'Amit Sharma',
    bestSellingProduct: 'Fresh Organic Wheat',
    revenueGrowth: 17.68,
    orderGrowth: 22,
  };

  // Daily Sales Data
  const dailySalesData = [
    { day: 'Mon', sales: 5000 },
    { day: 'Tue', sales: 7200 },
    { day: 'Wed', sales: 6800 },
    { day: 'Thu', sales: 9100 },
    { day: 'Fri', sales: 8500 },
    { day: 'Sat', sales: 12000 },
    { day: 'Sun', sales: 9800 },
  ];

  const content = {
    en: {
      title: 'Analytics & Reports',
      subtitle: 'Track your business performance and insights',
      overview: 'Overview',
      salesTrend: 'Sales Trend',
      revenueByCategory: 'Revenue by Category',
      topProducts: 'Top Selling Products',
      performance: 'Performance Metrics',
      monthlyComparison: 'Monthly Comparison',
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
      filterBy: 'Filter By',
      week: 'Last Week',
      month: 'Last Month',
      quarter: 'Last Quarter',
      year: 'Last Year',
      noData: 'No data available',
    },
    hi: {
      title: 'विश्लेषण और रिपोर्ट',
      subtitle: 'अपने व्यापार प्रदर्शन और अंतर्दृष्टि ट्रैक करें',
      overview: 'अवलोकन',
      salesTrend: 'बिक्री रुझान',
      revenueByCategory: 'श्रेणी द्वारा राजस्व',
      topProducts: 'सर्वश्रेष्ठ बिकने वाले उत्पाद',
      performance: 'प्रदर्शन मेट्रिक्स',
      monthlyComparison: 'मासिक तुलना',
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
      filterBy: 'फ़िल्टर करें',
      week: 'पिछला सप्ताह',
      month: 'पिछला महीना',
      quarter: 'पिछली तिमाही',
      year: 'पिछला साल',
      noData: 'कोई डेटा उपलब्ध नहीं',
    },
  };

  const t = content[currentLanguage];

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="p-2 hover:bg-muted rounded-lg">
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
          
          <div className="flex items-center gap-3">
            <Select value={timePeriod} onValueChange={(v: any) => setTimePeriod(v)}>
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
            
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              {t.download}
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
              <div className="flex items-center gap-1 text-success text-sm">
                <TrendingUp className="w-4 h-4" />
                <span>+{metrics.revenueGrowth.toFixed(1)}%</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>{t.totalOrders}</CardDescription>
              <CardTitle className="text-2xl">{metrics.totalOrders}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-1 text-success text-sm">
                <TrendingUp className="w-4 h-4" />
                <span>+{metrics.orderGrowth}%</span>
              </div>
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
                  <AreaChart data={salesTrendData}>
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
              <CardDescription>{currentLanguage === 'en' ? 'This year vs last year' : 'इस साल बनाम पिछले साल'}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyComparison}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="month" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip formatter={(value: any) => formatPrice(value)} />
                    <Legend />
                    <Bar 
                      dataKey="thisYear" 
                      fill="hsl(var(--primary))" 
                      radius={[4, 4, 0, 0]}
                      name={t.thisYear}
                    />
                    <Bar 
                      dataKey="lastYear" 
                      fill="hsl(var(--muted-foreground) / 0.3)" 
                      radius={[4, 4, 0, 0]}
                      name={t.lastYear}
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
                  <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
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
                  <Badge className="bg-success/10 text-success">
                    +{metrics.revenueGrowth.toFixed(1)}%
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <ShoppingCart className="w-5 h-5 text-primary" />
                    <span className="text-sm font-medium">{t.orderGrowth}</span>
                  </div>
                  <Badge className="bg-success/10 text-success">
                    +{metrics.orderGrowth}%
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







