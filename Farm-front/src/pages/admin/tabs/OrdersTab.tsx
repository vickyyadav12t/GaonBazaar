import { Link } from 'react-router-dom';
import { ClipboardList, Loader2, Download, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { AnimateOnScroll } from '@/components/animations';
import { useAdminDashboard } from '../adminDashboardContext';
import { AdminPager, ADMIN_ORDERS_PAGE_SIZE } from '../adminShared';


export default function AdminOrdersTab() {
  const vm = useAdminDashboard();
  return (
    <div className="space-y-6">
  <AnimateOnScroll animation="slide-up">
    <Card className="border-[#d7c7a8] bg-[#fffaf0] shadow-[0_16px_40px_rgba(95,70,40,0.08)]">
      <CardHeader className="flex flex-col gap-4 border-b border-[#e2d4b7] bg-[#f6eddc] sm:flex-row sm:items-start sm:justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-[#315f3b]" />
            All orders
          </CardTitle>
          <CardDescription className="text-[#6f6552]">
            Click a row for a quick view (timeline + summary). Full page has admin actions. Filters
            and CSV export match the list.
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
          Export CSV
        </Button>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:flex-wrap xl:items-end">
          <div className="space-y-2 min-w-[160px]">
            <Label className="text-xs text-[#6f6552]">Order status</Label>
            <Select
              value={vm.orderStatusFilter}
              onValueChange={(v) => {
                vm.setOrderStatusFilter(v);
                vm.setAdminOrdersSkip(0);
              }}
            >
              <SelectTrigger className="border-[#d7c7a8] bg-[#fffdf7] text-[#2f3a2f]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="shipped">Shipped</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 min-w-[160px]">
            <Label className="text-xs text-[#6f6552]">Payment status</Label>
            <Select
              value={vm.orderPaymentFilter}
              onValueChange={(v) => {
                vm.setOrderPaymentFilter(v);
                vm.setAdminOrdersSkip(0);
              }}
            >
              <SelectTrigger className="border-[#d7c7a8] bg-[#fffdf7] text-[#2f3a2f]">
                <SelectValue placeholder="Payment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All payments</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="refunded">Refunded</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 min-w-[180px]">
            <Label className="text-xs text-[#6f6552]">Placed in</Label>
            <Select
              value={vm.orderDatePreset}
              onValueChange={(v) => {
                vm.setOrderDatePreset(v as typeof vm.orderDatePreset);
                vm.setAdminOrdersSkip(0);
              }}
            >
              <SelectTrigger className="border-[#d7c7a8] bg-[#fffdf7] text-[#2f3a2f]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any time</SelectItem>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
                <SelectItem value="custom">Custom range…</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {vm.orderDatePreset === 'custom' && (
            <>
              <div className="space-y-2 min-w-[160px]">
                <Label className="text-xs text-[#6f6552]">From</Label>
                <Input
                  type="date"
                  value={vm.orderDateFrom}
                  onChange={(e) => {
                    vm.setOrderDateFrom(e.target.value);
                    vm.setAdminOrdersSkip(0);
                  }}
                  className="border-[#d7c7a8] bg-[#fffdf7] text-[#2f3a2f] focus-visible:ring-[#315f3b]"
                />
              </div>
              <div className="space-y-2 min-w-[160px]">
                <Label className="text-xs text-[#6f6552]">To</Label>
                <Input
                  type="date"
                  value={vm.orderDateTo}
                  onChange={(e) => {
                    vm.setOrderDateTo(e.target.value);
                    vm.setAdminOrdersSkip(0);
                  }}
                  className="border-[#d7c7a8] bg-[#fffdf7] text-[#2f3a2f] focus-visible:ring-[#315f3b]"
                />
              </div>
            </>
          )}
        </div>

        {vm.ordersTabLoading && (
          <div className="flex items-center gap-2 text-sm text-[#6f6552]">
            <Loader2 className="h-4 w-4 animate-spin shrink-0" />
            Loading orders…
          </div>
        )}

        <div className="overflow-hidden rounded-xl border border-[#d7c7a8] bg-[#fffdf7]">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#e2d4b7] bg-[#f6eddc] text-left">
                  <th className="p-3 font-semibold whitespace-nowrap">Placed</th>
                  <th className="p-3 font-semibold whitespace-nowrap">Order</th>
                  <th className="p-3 font-semibold min-w-[200px]">Parties</th>
                  <th className="p-3 font-semibold whitespace-nowrap">Amount</th>
                  <th className="p-3 font-semibold whitespace-nowrap">Status</th>
                  <th className="p-3 font-semibold whitespace-nowrap">Payment</th>
                  <th className="p-3 font-semibold whitespace-nowrap text-right">Full page</th>
                </tr>
              </thead>
              <tbody>
                {vm.adminOrders.map((o) => (
                  <tr
                    key={o.id}
                    role="button"
                    tabIndex={0}
                    title="Click for quick view (timeline)"
                    className="cursor-pointer border-b border-[#eee2c8] hover:bg-[#f6eddc]"
                    onClick={() => vm.setAdminOrderPreviewId(o.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        vm.setAdminOrderPreviewId(o.id);
                      }
                    }}
                  >
                    <td className="whitespace-nowrap p-3 text-[#6f6552]">
                      {new Date(o.createdAt).toLocaleString('en-IN', {
                        dateStyle: 'short',
                        timeStyle: 'short',
                      })}
                    </td>
                    <td className="p-3 font-mono text-xs">#{o.id.slice(-8)}</td>
                    <td className="p-3">
                      <span className="text-[#2f3a2f]">{o.buyerName}</span>
                      <span className="mx-1 text-[#6f6552]">→</span>
                      <span className="text-[#2f3a2f]">{o.farmerName}</span>
                      <p className="mt-0.5 line-clamp-1 text-xs text-[#6f6552]">
                        {o.productName}
                        {o.quantity > 1 ? ` × ${o.quantity} ${o.unit}` : ''}
                      </p>
                    </td>
                    <td className="p-3 font-semibold whitespace-nowrap">
                      ₹{o.totalAmount.toLocaleString('en-IN')}
                    </td>
                    <td className="p-3">
                      <Badge
                        className={
                          o.status === 'delivered'
                            ? 'bg-[#eaf5ec] text-[#315f3b]'
                            : o.status === 'cancelled'
                              ? 'bg-[#f6e5dc] text-[#8a4f2a]'
                              : 'bg-[#fff4dd] text-[#9a6b12]'
                        }
                      >
                        {o.status}
                      </Badge>
                    </td>
                    <td className="p-3">
                      <Badge variant="outline" className="capitalize border-[#d7c7a8] bg-[#fffaf0] text-[#6c5a3d]">
                        {o.paymentStatus}
                      </Badge>
                    </td>
                    <td className="p-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="sm" className="text-[#315f3b] hover:bg-[#f3ebdd] hover:text-[#315f3b]" asChild>
                        <Link to={`/admin/orders/${o.id}`}>
                          <ExternalLink className="w-4 h-4 mr-1" />
                          Open
                        </Link>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!vm.ordersTabLoading && vm.adminOrders.length === 0 && (
            <div className="p-12 text-center text-[#6f6552]">
              No orders match these filters.
            </div>
          )}
        </div>
        <AdminPager
          skip={vm.adminOrdersSkip}
          limit={ADMIN_ORDERS_PAGE_SIZE}
          total={vm.adminOrdersTotal}
          busy={vm.ordersTabLoading}
          onPrev={() => vm.setAdminOrdersSkip((s) => Math.max(0, s - ADMIN_ORDERS_PAGE_SIZE))}
          onNext={() =>
            vm.setAdminOrdersSkip((s) => s + ADMIN_ORDERS_PAGE_SIZE)
          }
        />
      </CardContent>
    </Card>
  </AnimateOnScroll>
    </div>
  );
}
