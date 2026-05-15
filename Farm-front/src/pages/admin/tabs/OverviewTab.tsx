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
      <Card className="border-[#d7c7a8] bg-[#fffaf0] shadow-[0_16px_40px_rgba(95,70,40,0.08)]">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-[#8a4f2a]" />
            Order fulfilment mix
          </CardTitle>
          <CardDescription className="text-[#6f6552]">
            Linked orders only (same total as the KPI above). Segment width ∝ count.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex h-3 overflow-hidden rounded-full bg-[#f3ebdd]">
            {(
              [
                { key: 'pending', n: vm.stats.orderStatusBreakdown.pending, cls: 'bg-[#d89b2b]' },
                {
                  key: 'processing',
                  n: vm.stats.orderStatusBreakdown.processing,
                  cls: 'bg-[#58774e]',
                },
                { key: 'shipped', n: vm.stats.orderStatusBreakdown.shipped, cls: 'bg-[#6c5a3d]' },
                { key: 'delivered', n: vm.stats.orderStatusBreakdown.delivered, cls: 'bg-[#315f3b]' },
                {
                  key: 'cancelled',
                  n: vm.stats.orderStatusBreakdown.cancelled,
                  cls: 'bg-[#8a4f2a]',
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
          <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-[#6f6552]">
            <span>
              <span className="mr-1 inline-block h-2 w-2 align-middle rounded-full bg-[#d89b2b]" />
              Pending {vm.stats.orderStatusBreakdown.pending}
            </span>
            <span>
              <span className="mr-1 inline-block h-2 w-2 align-middle rounded-full bg-[#58774e]" />
              Processing {vm.stats.orderStatusBreakdown.processing}
            </span>
            <span>
              <span className="mr-1 inline-block h-2 w-2 align-middle rounded-full bg-[#6c5a3d]" />
              Shipped {vm.stats.orderStatusBreakdown.shipped}
            </span>
            <span>
              <span className="mr-1 inline-block h-2 w-2 align-middle rounded-full bg-[#315f3b]" />
              Delivered {vm.stats.orderStatusBreakdown.delivered}
            </span>
            <span>
              <span className="mr-1 inline-block h-2 w-2 align-middle rounded-full bg-[#8a4f2a]" />
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
      <Card className="border-[#d7c7a8] bg-[#fffaf0] shadow-[0_16px_40px_rgba(95,70,40,0.08)]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[#315f3b]" />
            Orders & Revenue Trend
          </CardTitle>
          <CardDescription className="text-[#6f6552]">
            Linked orders only (buyer and farmer accounts exist), by month placed — same scope as
            the Total Orders KPI.
          </CardDescription>
        </CardHeader>
        <CardContent className="min-w-0">
          <div className="h-64 min-w-0 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={vm.chartData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="name" className="text-xs" />
                <YAxis className="text-xs" allowDecimals={false} />
                <Tooltip
                  formatter={(value: number | string) => [Number(value).toLocaleString('en-IN'), 'Orders']}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #d7c7a8', backgroundColor: '#fffaf0' }}
                />
                <Area type="monotone" dataKey="orders" stroke="#315f3b" fill="rgba(49,95,59,0.16)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
      <Card className="border-[#d7c7a8] bg-[#fffaf0] shadow-[0_16px_40px_rgba(95,70,40,0.08)]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[#d89b2b]" />
            Revenue (₹)
          </CardTitle>
          <CardDescription className="text-[#6f6552]">
            Paid linked orders — produce subtotal per month; aligns with Revenue KPI (paid, linked
            only).
          </CardDescription>
        </CardHeader>
        <CardContent className="min-w-0">
          <div className="h-64 min-w-0 w-full">
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
                  contentStyle={{ borderRadius: '8px', border: '1px solid #d7c7a8', backgroundColor: '#fffaf0' }}
                />
                <Bar dataKey="revenue" fill="#d89b2b" radius={[4, 4, 0, 0]} />
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
      <Card className="border-[#d7c7a8] bg-[#fffaf0] shadow-[0_16px_40px_rgba(95,70,40,0.08)]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-[#8a4f2a]" />
            User Growth
          </CardTitle>
          <CardDescription className="text-[#6f6552]">New accounts per month (last 6 months)</CardDescription>
        </CardHeader>
        <CardContent className="min-w-0">
          <div className="h-48 min-w-0 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={vm.chartData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="name" className="text-xs" />
                <YAxis className="text-xs" allowDecimals={false} />
                <Tooltip
                  formatter={(value: number | string) => [Number(value).toLocaleString('en-IN'), 'New users']}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #d7c7a8', backgroundColor: '#fffaf0' }}
                />
                <Line type="monotone" dataKey="users" stroke="#8a4f2a" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
      <Card className="border-[#d7c7a8] bg-[#fffaf0] shadow-[0_16px_40px_rgba(95,70,40,0.08)]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5 text-[#6c5a3d]" />
            Category Distribution
          </CardTitle>
          <CardDescription className="text-[#6f6552]">All vm.listings by category (current)</CardDescription>
        </CardHeader>
        <CardContent className="min-w-0">
          <div className="h-48 min-w-0 w-full">
            {vm.categoryChartData.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-[#6f6552]">
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
                  <Tooltip formatter={(value: number | string) => [Number(value).toLocaleString('en-IN'), 'Listings']} contentStyle={{ borderRadius: '8px', border: '1px solid #d7c7a8', backgroundColor: '#fffaf0' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </CardContent>
      </Card>
      <Card className="border-[#d7c7a8] bg-[#fffaf0] shadow-[0_16px_40px_rgba(95,70,40,0.08)]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-[#315f3b]" />
            Quick Stats
          </CardTitle>
          <CardDescription className="text-[#6f6552]">Platform at a glance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border border-[#e2d4b7] bg-[#fffdf7] p-3">
              <span className="text-sm font-medium text-[#6f6552]">Farmers</span>
              <span className="text-lg font-bold text-[#2f3a2f]">{vm.stats?.totalFarmers ?? 0}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-[#e2d4b7] bg-[#fffdf7] p-3">
              <span className="text-sm font-medium text-[#6f6552]">Buyers</span>
              <span className="text-lg font-bold text-[#2f3a2f]">{vm.stats?.totalBuyers ?? 0}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-[#e8cf96] bg-[#fff4dd] p-3">
              <span className="text-sm font-medium text-[#9a6b12]">Pending KYC</span>
              <span className="text-lg font-bold text-[#9a6b12]">{vm.pendingKYC}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-[#bfd2bf] bg-[#eaf5ec] p-3">
              <span className="text-sm font-medium text-[#315f3b]">Active Listings</span>
              <span className="text-lg font-bold text-[#315f3b]">{vm.activeListings}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  </AnimateOnScroll>

  {/* Recent Activity */}
  <AnimateOnScroll animation="slide-up" delay={0.4}>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="border-[#d7c7a8] bg-[#fffaf0] shadow-[0_16px_40px_rgba(95,70,40,0.08)]">
        <CardHeader className="border-b border-[#e2d4b7] bg-[#f6eddc]">
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-[#d89b2b]" />
            Pending KYC
          </CardTitle>
          <CardDescription className="text-[#6f6552]">Requires immediate attention</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-3">
            {vm.overviewPendingKycFarmers.slice(0, 3).map((farmer) => (
              <div key={farmer.id} className="flex items-center justify-between rounded-lg border border-[#e2d4b7] bg-[#fffdf7] p-4 transition-colors hover:bg-[#f6eddc]">
                <div className="flex items-center gap-3">
                  <img
                    src={resolveBackendAssetUrl(farmer.avatar)}
                    alt={farmer.name}
                    className="h-12 w-12 rounded-full border-2 border-[#e8cf96] object-cover"
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
                    <p className="text-xs text-[#6f6552]">{farmer.location.district}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" className="h-8 border border-[#315f3b] bg-[#315f3b] text-xs text-[#fffaf0] hover:bg-[#284e31]" onClick={() => void vm.handleKycApprove(farmer.id)}>
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    className="h-8 bg-[#8a4f2a] text-xs text-[#fffaf0] hover:bg-[#784223]"
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
                <CheckCircle className="mx-auto mb-2 h-12 w-12 text-[#315f3b]" />
                <p className="text-[#6f6552]">All KYC requests processed</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="border-[#d7c7a8] bg-[#fffaf0] shadow-[0_16px_40px_rgba(95,70,40,0.08)]">
        <CardHeader className="border-b border-[#e2d4b7] bg-[#f6eddc]">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-[#315f3b]" />
                Recent Orders
              </CardTitle>
              <CardDescription className="text-[#6f6552]">
                Latest linked orders — click a row for quick view (timeline + summary).
              </CardDescription>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="shrink-0 border-[#d7c7a8] bg-[#fffdf7] text-[#315f3b] hover:bg-[#f3ebdd] hover:text-[#315f3b]"
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
                className="flex w-full cursor-pointer items-center justify-between rounded-lg border border-[#e2d4b7] bg-[#fffdf7] p-4 text-left transition-colors hover:bg-[#f6eddc]"
              >
                <div className="flex-1">
                  <p className="font-semibold text-sm mb-1">{order.productName}</p>
                  <p className="text-xs text-[#6f6552]">{order.buyerName} → {order.farmerName}</p>
                </div>
                <div className="text-right ml-4">
                  <p className="font-bold text-sm mb-1">₹{order.totalAmount.toLocaleString()}</p>
                  <Badge className={order.status === 'delivered' ? 'bg-[#eaf5ec] text-[#315f3b]' : 'bg-[#fff4dd] text-[#9a6b12]'}>
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
    <Card className="border-[#d7c7a8] bg-[#fffaf0] shadow-[0_16px_40px_rgba(95,70,40,0.08)]">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Megaphone className="w-5 h-5 text-[#315f3b]" />
          Broadcast notification
        </CardTitle>
        <CardDescription className="text-[#6f6552]">
          Send an in-app announcement to all farmers, all buyers, or one user
          (title, message, optional link).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex min-w-0 flex-col gap-4 lg:flex-row">
          <div className="min-w-0 flex-1 space-y-1.5">
            <Label htmlFor="broadcast-audience" className="text-xs text-[#6f6552]">
              Audience
            </Label>
            <Select
              value={vm.notifAudience}
              onValueChange={(v) => vm.setNotifAudience(v as any)}
            >
              <SelectTrigger id="broadcast-audience" className="w-full border-[#d7c7a8] bg-[#fffdf7] text-[#2f3a2f] lg:w-[240px]">
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
            <div className="min-w-0 flex-1 space-y-1.5">
              <Label htmlFor="broadcast-user-id" className="text-xs text-[#6f6552]">
                Recipient user id
              </Label>
              <Input
                id="broadcast-user-id"
                value={vm.notifRecipientUserId}
                onChange={(e) => vm.setNotifRecipientUserId(e.target.value)}
                placeholder="e.g. 6642…"
                className="border-[#d7c7a8] bg-[#fffdf7] text-[#2f3a2f] placeholder:text-[#8b816f] focus-visible:ring-[#315f3b]"
              />
            </div>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="broadcast-title" className="text-xs text-[#6f6552]">
            Title
          </Label>
          <Input
            id="broadcast-title"
            value={vm.notifTitle}
            onChange={(e) => vm.setNotifTitle(e.target.value)}
            placeholder="Maintenance / announcement title"
            className="border-[#d7c7a8] bg-[#fffdf7] text-[#2f3a2f] placeholder:text-[#8b816f] focus-visible:ring-[#315f3b]"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="broadcast-message" className="text-xs text-[#6f6552]">
            Message
          </Label>
          <Textarea
            id="broadcast-message"
            value={vm.notifMessage}
            onChange={(e) => vm.setNotifMessage(e.target.value)}
            placeholder="Your message…"
            rows={4}
            className="resize-none border-[#d7c7a8] bg-[#fffdf7] text-[#2f3a2f] placeholder:text-[#8b816f] focus-visible:ring-[#315f3b]"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="broadcast-link" className="text-xs text-[#6f6552]">
            Link (optional)
          </Label>
          <Input
            id="broadcast-link"
            value={vm.notifLink}
            onChange={(e) => vm.setNotifLink(e.target.value)}
            placeholder="e.g. /orders or https://…"
            className="border-[#d7c7a8] bg-[#fffdf7] text-[#2f3a2f] placeholder:text-[#8b816f] focus-visible:ring-[#315f3b]"
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <Button
            type="button"
            className="border border-[#b68222] bg-[#d89b2b] text-[#2f2416] hover:bg-[#c88d22]"
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
            <p className="text-sm text-[#6f6552]">
              Created for <span className="font-semibold text-[#2f3a2f]">{vm.notifLastRecipients}</span> user
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
