import {
  ShoppingCart,
  TrendingUp,
  Users,
  Package,
  Activity,
  AlertCircle,
  CheckCircle,
  XCircle,
  Loader2,
  Download,
  Megaphone,
  Bell,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AnimateOnScroll } from '@/components/animations';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';
import { useAdminDashboard } from '../adminDashboardContext';
import { resolveBackendAssetUrl } from '@/lib/productImageUrl';


export default function AdminOverviewTab() {
  const vm = useAdminDashboard();
  return (
    <div className="space-y-6">
  {vm.stats?.orderStatusBreakdown != null && (vm.stats?.totalOrders ?? 0) > 0 && (
    <AnimateOnScroll animation="slide-up" delay={0.12}>
      <Card className="border-2 shadow-lg">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-accent" />
            Order fulfilment mix
          </CardTitle>
          <CardDescription>
            Linked orders only (same total as the KPI above). Segment width ∝ count.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex h-3 rounded-full overflow-hidden bg-muted">
            {(
              [
                { key: 'pending', n: vm.stats.orderStatusBreakdown.pending, cls: 'bg-warning' },
                {
                  key: 'processing',
                  n: vm.stats.orderStatusBreakdown.processing,
                  cls: 'bg-primary/70',
                },
                { key: 'shipped', n: vm.stats.orderStatusBreakdown.shipped, cls: 'bg-secondary' },
                { key: 'delivered', n: vm.stats.orderStatusBreakdown.delivered, cls: 'bg-success' },
                {
                  key: 'cancelled',
                  n: vm.stats.orderStatusBreakdown.cancelled,
                  cls: 'bg-destructive/80',
                },
              ] as const
            ).map(({ key, n, cls }) =>
              n > 0 ? (
                <div
                  key={key}
                  className={`${cls} min-w-[2px] transition-all`}
                  style={{
                    width: `${(n / (vm.stats.totalOrders || 1)) * 100}%`,
                  }}
                  title={`${key}: ${n}`}
                />
              ) : null
            )}
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground">
            <span>
              <span className="inline-block w-2 h-2 rounded-full bg-warning mr-1 align-middle" />
              Pending {vm.stats.orderStatusBreakdown.pending}
            </span>
            <span>
              <span className="inline-block w-2 h-2 rounded-full bg-primary/70 mr-1 align-middle" />
              Processing {vm.stats.orderStatusBreakdown.processing}
            </span>
            <span>
              <span className="inline-block w-2 h-2 rounded-full bg-secondary mr-1 align-middle" />
              Shipped {vm.stats.orderStatusBreakdown.shipped}
            </span>
            <span>
              <span className="inline-block w-2 h-2 rounded-full bg-success mr-1 align-middle" />
              Delivered {vm.stats.orderStatusBreakdown.delivered}
            </span>
            <span>
              <span className="inline-block w-2 h-2 rounded-full bg-destructive/80 mr-1 align-middle" />
              Cancelled {vm.stats.orderStatusBreakdown.cancelled}
            </span>
          </div>
        </CardContent>
      </Card>
    </AnimateOnScroll>
  )}
  {/* Charts Row 1 */}
  <AnimateOnScroll animation="slide-up" delay={0.2}>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="border-2 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Orders & Revenue Trend
          </CardTitle>
          <CardDescription>
            Linked orders only (buyer and farmer accounts exist), by month placed — same scope as
            the Total Orders KPI.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={vm.chartData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="name" className="text-xs" />
                <YAxis className="text-xs" allowDecimals={false} />
                <Tooltip
                  formatter={(value: number | string) => [Number(value).toLocaleString('en-IN'), 'Orders']}
                />
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
          <CardDescription>
            Paid linked orders — produce subtotal per month; aligns with Revenue KPI (paid, linked
            only).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={vm.chartData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="name" className="text-xs" />
                <YAxis
                  className="text-xs"
                  tickFormatter={(v) => {
                    const n = Number(v);
                    if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
                    if (n >= 1000) return `₹${(n / 1000).toFixed(0)}k`;
                    return `₹${n}`;
                  }}
                />
                <Tooltip
                  formatter={(value: number | string) => [
                    `₹${Number(value).toLocaleString('en-IN')}`,
                    'Revenue',
                  ]}
                />
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
          <CardDescription>New accounts per month (last 6 months)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={vm.chartData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="name" className="text-xs" />
                <YAxis className="text-xs" allowDecimals={false} />
                <Tooltip
                  formatter={(value: number | string) => [Number(value).toLocaleString('en-IN'), 'New users']}
                />
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
          <CardDescription>All vm.listings by category (current)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-48">
            {vm.categoryChartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                No products yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={vm.categoryChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    dataKey="value"
                    nameKey="name"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {vm.categoryChartData.map((entry, index) => (
                      <Cell key={`${entry.category}-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number | string) => [Number(value).toLocaleString('en-IN'), 'Listings']} />
                </PieChart>
              </ResponsiveContainer>
            )}
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
              <span className="font-bold text-lg">{vm.stats?.totalFarmers ?? 0}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
              <span className="text-sm font-medium text-muted-foreground">Buyers</span>
              <span className="font-bold text-lg">{vm.stats?.totalBuyers ?? 0}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-warning/10 rounded-lg">
              <span className="text-sm font-medium text-warning">Pending KYC</span>
              <span className="font-bold text-lg text-warning">{vm.pendingKYC}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-success/10 rounded-lg">
              <span className="text-sm font-medium text-success">Active Listings</span>
              <span className="font-bold text-lg text-success">{vm.activeListings}</span>
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
            {vm.overviewPendingKycFarmers.slice(0, 3).map((farmer) => (
              <div key={farmer.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors border border-border">
                <div className="flex items-center gap-3">
                  <img
                    src={resolveBackendAssetUrl(farmer.avatar)}
                    alt={farmer.name}
                    className="w-12 h-12 rounded-full object-cover border-2 border-warning/20"
                    loading="lazy"
                    decoding="async"
                    onError={(e) => {
                      const el = e.currentTarget;
                      el.onerror = null;
                      el.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(farmer.name || 'Farmer')}&size=128`;
                    }}
                  />
                  <div>
                    <p className="font-semibold text-sm">{farmer.name}</p>
                    <p className="text-xs text-muted-foreground">{farmer.location.district}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" className="bg-success hover:bg-success/90 h-8 text-xs" onClick={() => void vm.handleKycApprove(farmer.id)}>
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="h-8 text-xs"
                    onClick={() => {
                      vm.setKycRejectTarget({ id: farmer.id, name: farmer.name });
                      vm.setKycRejectReason('');
                    }}
                  >
                    <XCircle className="w-3 h-3 mr-1" />
                    Reject
                  </Button>
                </div>
              </div>
            ))}
            {vm.overviewPendingKycFarmers.length === 0 && (
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
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-success" />
                Recent Orders
              </CardTitle>
              <CardDescription>
                Latest linked orders — click a row for quick view (timeline + summary).
              </CardDescription>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="shrink-0"
              disabled={vm.csvExporting === 'orders'}
              onClick={() => void vm.handleExportOrdersCsv()}
            >
              {vm.csvExporting === 'orders' ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Download className="w-4 h-4 mr-2" />
              )}
              Export filtered (CSV)
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-3">
            {vm.overviewRecentOrders.map((order) => (
              <button
                key={order.id}
                type="button"
                onClick={() => vm.setAdminOrderPreviewId(order.id)}
                className="w-full flex items-center justify-between p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors border border-border text-left cursor-pointer"
              >
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
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  </AnimateOnScroll>

  {/* Notifications broadcast (maintenance announcements) */}
  <AnimateOnScroll animation="slide-up" delay={0.45}>
    <Card className="border-2 shadow-lg">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Megaphone className="w-5 h-5 text-primary" />
          Broadcast notification
        </CardTitle>
        <CardDescription>
          Send an in-app announcement to all farmers, all buyers, or one user
          (title, message, optional link).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 space-y-1.5 min-w-[200px]">
            <Label htmlFor="broadcast-audience" className="text-xs text-muted-foreground">
              Audience
            </Label>
            <Select
              value={vm.notifAudience}
              onValueChange={(v) => vm.setNotifAudience(v as any)}
            >
              <SelectTrigger id="broadcast-audience" className="w-full lg:w-[240px]">
                <SelectValue placeholder="Audience" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all_farmers">All farmers</SelectItem>
                <SelectItem value="all_buyers">All buyers</SelectItem>
                <SelectItem value="user">One user</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {vm.notifAudience === 'user' && (
            <div className="flex-1 space-y-1.5 min-w-[220px]">
              <Label htmlFor="broadcast-user-id" className="text-xs text-muted-foreground">
                Recipient user id
              </Label>
              <Input
                id="broadcast-user-id"
                value={vm.notifRecipientUserId}
                onChange={(e) => vm.setNotifRecipientUserId(e.target.value)}
                placeholder="e.g. 6642…"
              />
            </div>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="broadcast-title" className="text-xs text-muted-foreground">
            Title
          </Label>
          <Input
            id="broadcast-title"
            value={vm.notifTitle}
            onChange={(e) => vm.setNotifTitle(e.target.value)}
            placeholder="Maintenance / announcement title"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="broadcast-message" className="text-xs text-muted-foreground">
            Message
          </Label>
          <Textarea
            id="broadcast-message"
            value={vm.notifMessage}
            onChange={(e) => vm.setNotifMessage(e.target.value)}
            placeholder="Your message…"
            rows={4}
            className="resize-none"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="broadcast-link" className="text-xs text-muted-foreground">
            Link (optional)
          </Label>
          <Input
            id="broadcast-link"
            value={vm.notifLink}
            onChange={(e) => vm.setNotifLink(e.target.value)}
            placeholder="e.g. /orders or https://…"
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <Button
            type="button"
            className="btn-primary-gradient"
            disabled={vm.notifBroadcastBusy}
            onClick={() => void vm.handleBroadcastNotifications()}
          >
            {vm.notifBroadcastBusy ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Sending…
              </>
            ) : (
              <>
                <Bell className="w-4 h-4 mr-2" />
                Send announcement
              </>
            )}
          </Button>

          {vm.notifLastRecipients !== null && (
            <p className="text-sm text-muted-foreground">
              Created for <span className="font-semibold text-foreground">{vm.notifLastRecipients}</span> user
              {vm.notifLastRecipients === 1 ? '' : 's'}.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  </AnimateOnScroll>
    </div>
  );
}
