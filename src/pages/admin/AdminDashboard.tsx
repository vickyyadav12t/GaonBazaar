import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, Package, ShoppingCart, TrendingUp, AlertCircle, CheckCircle, XCircle, Eye, Search, Filter, Shield, Star, Trash2, Calendar, Sparkles, ArrowRight, Activity } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import StatCard from '@/components/dashboard/StatCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { mockDashboardStats, mockFarmers, mockOrders, mockProducts, mockReviews, mockBuyers } from '@/data/mockData';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { useToast } from '@/hooks/use-toast';
import { AnimateOnScroll, StaggerContainer } from '@/components/animations';

const AdminDashboard = () => {
  const { toast } = useToast();
  const [kycFilter, setKycFilter] = useState('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  
  const [farmers, setFarmers] = useState(mockFarmers);
  const [listings, setListings] = useState(mockProducts);
  const [reviews, setReviews] = useState(mockReviews);

  const chartData = [
    { name: 'Jan', orders: 400, revenue: 240000, users: 120 },
    { name: 'Feb', orders: 300, revenue: 180000, users: 150 },
    { name: 'Mar', orders: 500, revenue: 320000, users: 200 },
    { name: 'Apr', orders: 450, revenue: 280000, users: 180 },
    { name: 'May', orders: 600, revenue: 400000, users: 250 },
    { name: 'Jun', orders: 550, revenue: 350000, users: 220 },
  ];

  const categoryData = [
    { name: 'Vegetables', value: 35, color: 'hsl(var(--primary))' },
    { name: 'Grains', value: 30, color: 'hsl(var(--secondary))' },
    { name: 'Fruits', value: 20, color: 'hsl(var(--accent))' },
    { name: 'Pulses', value: 10, color: 'hsl(var(--warning))' },
    { name: 'Others', value: 5, color: 'hsl(var(--muted))' },
  ];

  const handleKycAction = (farmerId: string, action: 'approve' | 'reject') => {
    setFarmers(prev => prev.map(f => 
      f.id === farmerId 
        ? { ...f, kycStatus: action === 'approve' ? 'approved' as const : 'rejected' as const, isVerified: action === 'approve' }
        : f
    ));
    toast({
      title: action === 'approve' ? 'KYC Approved' : 'KYC Rejected',
      description: `Farmer has been ${action === 'approve' ? 'verified' : 'notified'}`,
    });
  };

  const handleListingAction = (listingId: string, action: 'suspend' | 'remove') => {
    if (action === 'remove') {
      setListings(prev => prev.filter(l => l.id !== listingId));
    } else {
      setListings(prev => prev.map(l => 
        l.id === listingId ? { ...l, status: 'hidden' as const } : l
      ));
    }
    toast({
      title: action === 'remove' ? 'Listing Removed' : 'Listing Suspended',
      variant: action === 'remove' ? 'destructive' : 'default',
    });
  };

  const handleReviewAction = (reviewId: string, action: 'approve' | 'remove') => {
    if (action === 'remove') {
      setReviews(prev => prev.filter(r => r.id !== reviewId));
      toast({ title: 'Review Removed', variant: 'destructive' });
    } else {
      setReviews(prev => prev.map(r => 
        r.id === reviewId ? { ...r, isApproved: true } : r
      ));
      toast({ title: 'Review Approved' });
    }
  };

  const getKycBadge = (status: string) => {
    switch (status) {
      case 'approved': return <Badge className="bg-success/10 text-success">Verified</Badge>;
      case 'rejected': return <Badge className="bg-destructive/10 text-destructive">Rejected</Badge>;
      default: return <Badge className="bg-warning/10 text-warning">Pending</Badge>;
    }
  };

  const pendingKYC = farmers.filter(f => f.kycStatus === 'pending').length;
  const activeListings = listings.filter(l => l.status === 'active').length;
  const totalRevenue = mockOrders.filter(o => o.paymentStatus === 'paid').reduce((sum, o) => sum + o.totalAmount, 0);

  return (
    <Layout showMobileNav={false}>
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <AnimateOnScroll animation="fade-in">
            <div className="mb-8">
              <div className="inline-flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full mb-4">
                <Calendar className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold text-primary">
                  {new Date().toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </span>
              </div>
              <h1 className="text-4xl md:text-5xl font-extrabold text-foreground mb-2">Admin Dashboard</h1>
              <p className="text-lg text-muted-foreground">Platform overview and management</p>
            </div>
          </AnimateOnScroll>

          {/* Stats */}
          <AnimateOnScroll animation="slide-up" delay={0.1}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
              <StatCard 
                title="Total Users" 
                value={mockDashboardStats.totalUsers} 
                icon={Users} 
                variant="primary" 
                trend={{ value: 12, isPositive: true }}
                subtitle={`${mockDashboardStats.totalFarmers} farmers, ${mockDashboardStats.totalBuyers} buyers`}
              />
              <StatCard 
                title="Active Listings" 
                value={activeListings} 
                icon={Package} 
                variant="success"
                subtitle={`${listings.length} total products`}
              />
              <StatCard 
                title="Total Orders" 
                value={mockDashboardStats.totalOrders} 
                icon={ShoppingCart} 
                variant="accent"
                subtitle={`${mockOrders.filter(o => o.status === 'delivered').length} delivered`}
              />
              <StatCard 
                title="Revenue" 
                value={`₹${totalRevenue.toLocaleString()}`} 
                icon={TrendingUp} 
                variant="warning"
                subtitle="All time earnings"
              />
            </div>
          </AnimateOnScroll>

          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid grid-cols-5 w-full bg-muted/50 p-1 rounded-lg">
              <TabsTrigger value="overview" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">
                <Activity className="w-4 h-4 mr-2" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="users" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">
                <Users className="w-4 h-4 mr-2" />
                Users
              </TabsTrigger>
              <TabsTrigger value="kyc" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">
                <Shield className="w-4 h-4 mr-2" />
                KYC
                {pendingKYC > 0 && (
                  <Badge className="ml-2 bg-warning text-warning-foreground">{pendingKYC}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="listings" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">
                <Package className="w-4 h-4 mr-2" />
                Listings
              </TabsTrigger>
              <TabsTrigger value="reviews" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">
                <Star className="w-4 h-4 mr-2" />
                Reviews
              </TabsTrigger>
            </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Charts Row 1 */}
            <AnimateOnScroll animation="slide-up" delay={0.2}>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="border-2 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-primary" />
                      Orders & Revenue Trend
                    </CardTitle>
                    <CardDescription>Monthly order and revenue statistics</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                          <XAxis dataKey="name" className="text-xs" />
                          <YAxis className="text-xs" />
                          <Tooltip />
                          <Area type="monotone" dataKey="orders" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.2)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-2 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-success" />
                      Revenue (₹)
                    </CardTitle>
                    <CardDescription>Monthly revenue breakdown</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                          <XAxis dataKey="name" className="text-xs" />
                          <YAxis className="text-xs" />
                          <Tooltip />
                          <Bar dataKey="revenue" fill="hsl(var(--secondary))" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </AnimateOnScroll>

            {/* Charts Row 2 */}
            <AnimateOnScroll animation="slide-up" delay={0.3}>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="border-2 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="w-5 h-5 text-accent" />
                      User Growth
                    </CardTitle>
                    <CardDescription>Monthly user registration</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                          <XAxis dataKey="name" className="text-xs" />
                          <YAxis className="text-xs" />
                          <Tooltip />
                          <Line type="monotone" dataKey="users" stroke="hsl(var(--accent))" strokeWidth={2} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-2 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="w-5 h-5 text-secondary" />
                      Category Distribution
                    </CardTitle>
                    <CardDescription>Product categories breakdown</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={categoryData}
                            cx="50%"
                            cy="50%"
                            innerRadius={40}
                            outerRadius={70}
                            dataKey="value"
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            labelLine={false}
                          >
                            {categoryData.map((entry, index) => (
                              <Cell key={index} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-2 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="w-5 h-5 text-primary" />
                      Quick Stats
                    </CardTitle>
                    <CardDescription>Platform at a glance</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                        <span className="text-sm font-medium text-muted-foreground">Farmers</span>
                        <span className="font-bold text-lg">{mockDashboardStats.totalFarmers}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                        <span className="text-sm font-medium text-muted-foreground">Buyers</span>
                        <span className="font-bold text-lg">{mockDashboardStats.totalBuyers}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-warning/10 rounded-lg">
                        <span className="text-sm font-medium text-warning">Pending KYC</span>
                        <span className="font-bold text-lg text-warning">{mockDashboardStats.pendingKYC}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-success/10 rounded-lg">
                        <span className="text-sm font-medium text-success">Active Listings</span>
                        <span className="font-bold text-lg text-success">{mockDashboardStats.activeListings}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </AnimateOnScroll>

            {/* Recent Activity */}
            <AnimateOnScroll animation="slide-up" delay={0.4}>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="border-2 shadow-lg">
                  <CardHeader className="bg-gradient-to-r from-warning/10 to-warning/5 border-b">
                    <CardTitle className="flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-warning" />
                      Pending KYC
                    </CardTitle>
                    <CardDescription>Requires immediate attention</CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-3">
                      {farmers.filter(f => f.kycStatus === 'pending').slice(0, 3).map((farmer) => (
                        <div key={farmer.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors border border-border">
                          <div className="flex items-center gap-3">
                            <img src={farmer.avatar} alt={farmer.name} className="w-12 h-12 rounded-full object-cover border-2 border-warning/20" />
                            <div>
                              <p className="font-semibold text-sm">{farmer.name}</p>
                              <p className="text-xs text-muted-foreground">{farmer.location.district}</p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" className="bg-success hover:bg-success/90 h-8 text-xs" onClick={() => handleKycAction(farmer.id, 'approve')}>
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Approve
                            </Button>
                            <Button size="sm" variant="destructive" className="h-8 text-xs" onClick={() => handleKycAction(farmer.id, 'reject')}>
                              <XCircle className="w-3 h-3 mr-1" />
                              Reject
                            </Button>
                          </div>
                        </div>
                      ))}
                      {farmers.filter(f => f.kycStatus === 'pending').length === 0 && (
                        <div className="text-center py-8">
                          <CheckCircle className="w-12 h-12 text-success mx-auto mb-2" />
                          <p className="text-muted-foreground">All KYC requests processed</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-2 shadow-lg">
                  <CardHeader className="bg-gradient-to-r from-success/10 to-success/5 border-b">
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-success" />
                      Recent Orders
                    </CardTitle>
                    <CardDescription>Latest platform transactions</CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-3">
                      {mockOrders.slice(0, 5).map((order) => (
                        <div key={order.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors border border-border">
                          <div className="flex-1">
                            <p className="font-semibold text-sm mb-1">{order.productName}</p>
                            <p className="text-xs text-muted-foreground">{order.buyerName} → {order.farmerName}</p>
                          </div>
                          <div className="text-right ml-4">
                            <p className="font-bold text-sm mb-1">₹{order.totalAmount.toLocaleString()}</p>
                            <Badge className={order.status === 'delivered' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}>
                              {order.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </AnimateOnScroll>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-6">
            <AnimateOnScroll animation="slide-up">
              <Card className="border-2 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-primary" />
                    User Management
                  </CardTitle>
                  <CardDescription>Manage farmers and buyers on the platform</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col sm:flex-row gap-4 mb-6">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Search users..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                        <Package className="w-5 h-5 text-success" />
                        Farmers ({farmers.length})
                      </h3>
                      <div className="space-y-3">
                        {farmers.map((farmer) => (
                          <div key={farmer.id} className="card-elevated p-4 flex items-center gap-4 hover:shadow-lg transition-shadow border-2 border-border">
                            <img src={farmer.avatar} alt={farmer.name} className="w-14 h-14 rounded-full object-cover border-2 border-success/20" />
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-semibold text-base">{farmer.name}</p>
                                {getKycBadge(farmer.kycStatus)}
                              </div>
                              <p className="text-sm text-muted-foreground">{farmer.email} • {farmer.phone}</p>
                              <p className="text-sm text-muted-foreground">{farmer.location.district}, {farmer.location.state}</p>
                            </div>
                            <div className="text-right">
                              <div className="flex items-center gap-1 mb-1">
                                <Star className="w-4 h-4 text-warning fill-warning" />
                                <p className="text-sm font-semibold">{farmer.rating}</p>
                              </div>
                              <p className="text-sm text-muted-foreground">{farmer.totalSales} sales</p>
                              <p className="text-sm text-muted-foreground">Farm: {farmer.farmSize}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                        <ShoppingCart className="w-5 h-5 text-accent" />
                        Buyers ({mockBuyers.length})
                      </h3>
                      <div className="space-y-3">
                        {mockBuyers.map((buyer) => (
                          <div key={buyer.id} className="card-elevated p-4 flex items-center gap-4 hover:shadow-lg transition-shadow border-2 border-border">
                            <img src={buyer.avatar} alt={buyer.name} className="w-14 h-14 rounded-full object-cover border-2 border-accent/20" />
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-semibold text-base">{buyer.name}</p>
                                {getKycBadge(buyer.kycStatus)}
                              </div>
                              <p className="text-sm text-muted-foreground">{buyer.businessName} • {buyer.businessType}</p>
                              <p className="text-sm text-muted-foreground">{buyer.location.district}, {buyer.location.state}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-semibold">{buyer.totalOrders} orders</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </AnimateOnScroll>
          </TabsContent>

          {/* KYC Tab */}
          <TabsContent value="kyc" className="space-y-6">
            <AnimateOnScroll animation="slide-up">
              <Card className="border-2 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-warning/10 to-warning/5 border-b">
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-warning" />
                    KYC Management
                  </CardTitle>
                  <CardDescription>Review and verify farmer KYC documents</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-4 mb-6">
                    <Select value={kycFilter} onValueChange={setKycFilter}>
                      <SelectTrigger className="w-48">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-4">
                    {farmers.filter(f => f.kycStatus === kycFilter).length > 0 ? (
                      farmers.filter(f => f.kycStatus === kycFilter).map((farmer) => (
                        <div key={farmer.id} className="card-elevated p-6 border-2 border-border hover:shadow-lg transition-shadow">
                          <div className="flex items-start gap-4">
                            <img src={farmer.avatar} alt={farmer.name} className="w-20 h-20 rounded-full object-cover border-2 border-warning/20" />
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <p className="font-semibold text-lg">{farmer.name}</p>
                                {getKycBadge(farmer.kycStatus)}
                              </div>
                              <p className="text-sm text-muted-foreground mb-1">{farmer.email}</p>
                              <p className="text-sm text-muted-foreground mb-1">{farmer.phone}</p>
                              <p className="text-sm mb-3">{farmer.location.village}, {farmer.location.district}, {farmer.location.state}</p>
                              <div className="flex flex-wrap gap-2">
                                <Badge variant="outline" className="bg-muted">Farm: {farmer.farmSize}</Badge>
                                <Badge variant="outline" className="bg-muted">Crops: {farmer.crops.join(', ')}</Badge>
                              </div>
                            </div>
                            <div className="flex flex-col gap-2">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button size="sm" variant="outline" onClick={() => setSelectedUser(farmer)}>
                                    <Eye className="w-4 h-4 mr-1" /> View Docs
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-2xl">
                                  <DialogHeader>
                                    <DialogTitle>KYC Documents - {farmer.name}</DialogTitle>
                                  </DialogHeader>
                                  <div className="space-y-4 py-4">
                                    <div className="p-4 bg-muted rounded-lg border-2 border-border">
                                      <div className="flex items-center gap-3 mb-3">
                                        <Shield className="w-5 h-5 text-primary" />
                                        <p className="font-semibold">Aadhaar Card</p>
                                      </div>
                                      <div className="h-48 bg-muted-foreground/10 rounded-lg flex items-center justify-center border-2 border-dashed border-muted-foreground/20">
                                        <p className="text-sm text-muted-foreground">[Document Preview]</p>
                                      </div>
                                    </div>
                                    <div className="p-4 bg-muted rounded-lg border-2 border-border">
                                      <div className="flex items-center gap-3 mb-3">
                                        <Shield className="w-5 h-5 text-success" />
                                        <p className="font-semibold">Kisan ID</p>
                                      </div>
                                      <div className="h-48 bg-muted-foreground/10 rounded-lg flex items-center justify-center border-2 border-dashed border-muted-foreground/20">
                                        <p className="text-sm text-muted-foreground">[Document Preview]</p>
                                      </div>
                                    </div>
                                  </div>
                                </DialogContent>
                              </Dialog>
                              {farmer.kycStatus === 'pending' && (
                                <>
                                  <Button size="sm" className="bg-success hover:bg-success/90" onClick={() => handleKycAction(farmer.id, 'approve')}>
                                    <CheckCircle className="w-4 h-4 mr-1" /> Approve
                                  </Button>
                                  <Button size="sm" variant="destructive" onClick={() => handleKycAction(farmer.id, 'reject')}>
                                    <XCircle className="w-4 h-4 mr-1" /> Reject
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-12">
                        <Shield className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">No {kycFilter} KYC requests</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </AnimateOnScroll>
          </TabsContent>

          {/* Listings Tab */}
          <TabsContent value="listings" className="space-y-6">
            <AnimateOnScroll animation="slide-up">
              <Card className="border-2 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5 border-b">
                  <CardTitle className="flex items-center gap-2">
                    <Package className="w-5 h-5 text-primary" />
                    Product Listings
                  </CardTitle>
                  <CardDescription>Manage all product listings on the platform</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-4 mb-6">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input placeholder="Search listings..." className="pl-10" />
                    </div>
                  </div>

                  <StaggerContainer staggerDelay={0.05} animation="slide-up" className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {listings.map((listing) => (
                      <Card key={listing.id} className="overflow-hidden border-2 border-border hover:shadow-xl transition-shadow">
                        <div className="relative">
                          <img src={listing.images[0]} alt={listing.name} className="w-full h-40 object-cover" />
                          <Badge className={`absolute top-2 right-2 ${
                            listing.status === 'active' ? 'bg-success/90 text-success-foreground' : 'bg-muted'
                          }`}>
                            {listing.status}
                          </Badge>
                        </div>
                        <CardContent className="p-4">
                          <div className="mb-2">
                            <h4 className="font-semibold text-lg mb-1">{listing.name}</h4>
                            <p className="text-sm text-muted-foreground">by {listing.farmerName}</p>
                          </div>
                          <p className="font-bold text-primary text-lg mb-4">₹{listing.price}/{listing.unit}</p>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" className="flex-1" onClick={() => handleListingAction(listing.id, 'suspend')}>
                              Suspend
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => handleListingAction(listing.id, 'remove')}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </StaggerContainer>
                </CardContent>
              </Card>
            </AnimateOnScroll>
          </TabsContent>

          {/* Reviews Tab */}
          <TabsContent value="reviews" className="space-y-6">
            <AnimateOnScroll animation="slide-up">
              <Card className="border-2 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-warning/10 to-warning/5 border-b">
                  <CardTitle className="flex items-center gap-2">
                    <Star className="w-5 h-5 text-warning" />
                    Review Management
                  </CardTitle>
                  <CardDescription>Moderate and approve user reviews</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {reviews.map((review) => (
                      <Card key={review.id} className="border-2 border-border hover:shadow-lg transition-shadow">
                        <CardContent className="p-5">
                          <div className="flex items-start gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2 flex-wrap">
                                <p className="font-semibold text-base">{review.reviewerName}</p>
                                <span className="text-muted-foreground">→</span>
                                <p className="font-medium">{review.targetName}</p>
                                <div className="flex items-center gap-1">
                                  <Star className="w-4 h-4 text-warning fill-warning" />
                                  <span className="font-semibold">{review.rating}</span>
                                </div>
                                {review.isApproved ? (
                                  <Badge className="bg-success/10 text-success">Approved</Badge>
                                ) : (
                                  <Badge className="bg-warning/10 text-warning">Pending</Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground mb-2">{review.productName}</p>
                              <p className="text-foreground mb-2 leading-relaxed">{review.comment}</p>
                              <p className="text-xs text-muted-foreground">{review.createdAt}</p>
                            </div>
                            <div className="flex flex-col gap-2">
                              {!review.isApproved && (
                                <Button size="sm" onClick={() => handleReviewAction(review.id, 'approve')}>
                                  <CheckCircle className="w-4 h-4 mr-1" /> Approve
                                </Button>
                              )}
                              <Button size="sm" variant="destructive" onClick={() => handleReviewAction(review.id, 'remove')}>
                                <Trash2 className="w-4 h-4 mr-1" /> Remove
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </AnimateOnScroll>
          </TabsContent>
        </Tabs>
        </div>
      </div>
    </Layout>
  );
};

export default AdminDashboard;
