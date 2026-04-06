import { MessageCircle, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AnimateOnScroll } from '@/components/animations';
import { useAdminDashboard } from '../adminDashboardContext';
import { AdminPager, SUPPORT_TICKETS_PAGE_SIZE } from '../adminShared';


export default function AdminSupportTab() {
  const vm = useAdminDashboard();
  return (
    <div className="space-y-6">
  <AnimateOnScroll animation="slide-up">
    <Card className="border-2 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-primary" />
          Support tickets
        </CardTitle>
        <CardDescription>
          Search by subject or message, filter by status, open a row to reply and update status. Tickets are
          stored in the database; email to users works when SMTP is configured.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex flex-col lg:flex-row flex-wrap gap-4 lg:items-end">
            <div className="space-y-1.5 min-w-[160px]">
              <Label htmlFor="support-status" className="text-xs text-muted-foreground">
                Status
              </Label>
              <Select
                value={vm.supportStatusFilter}
                onValueChange={(v) => vm.setSupportStatusFilter(v)}
              >
                <SelectTrigger id="support-status" className="w-full lg:w-[180px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in_progress">In progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 flex-1 min-w-[200px] max-w-md">
              <Label htmlFor="support-search" className="text-xs text-muted-foreground">
                Search
              </Label>
              <Input
                id="support-search"
                placeholder="Subject or message…"
                value={vm.supportSearchInput}
                onChange={(e) => vm.setSupportSearchInput(e.target.value)}
                className="w-full"
              />
            </div>
          </div>
        </div>
        <div className="rounded-lg border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="p-3 font-medium">Updated</th>
                  <th className="p-3 font-medium">Subject</th>
                  <th className="p-3 font-medium">From</th>
                  <th className="p-3 font-medium">Status</th>
                  <th className="p-3 font-medium w-20">Replies</th>
                </tr>
              </thead>
              <tbody>
                {vm.supportTickets.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-border/80 align-top hover:bg-muted/20 cursor-pointer"
                    onClick={() => vm.openSupportTicketSheet(row.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        vm.openSupportTicketSheet(row.id);
                      }
                    }}
                    tabIndex={0}
                    role="button"
                  >
                    <td className="p-3 whitespace-nowrap text-muted-foreground text-xs">
                      {row.updatedAt
                        ? new Date(row.updatedAt).toLocaleString('en-IN', {
                            dateStyle: 'short',
                            timeStyle: 'short',
                          })
                        : '—'}
                    </td>
                    <td className="p-3">
                      <p className="font-medium line-clamp-2">{row.subject}</p>
                      <p className="text-[11px] text-muted-foreground font-mono mt-0.5">
                        {row.id.slice(-8)}
                      </p>
                    </td>
                    <td className="p-3 text-xs">
                      {row.user ? (
                        <>
                          <p className="font-medium">{row.user.name || 'User'}</p>
                          <p className="text-muted-foreground break-all">{row.user.email}</p>
                        </>
                      ) : row.guestEmail ? (
                        <span className="text-muted-foreground break-all">{row.guestEmail}</span>
                      ) : (
                        <span className="text-muted-foreground">Guest</span>
                      )}
                    </td>
                    <td className="p-3">
                      <Badge variant="outline" className={vm.supportStatusBadgeClass(row.status)}>
                        {row.status.replace('_', ' ')}
                      </Badge>
                    </td>
                    <td className="p-3 text-muted-foreground">{row.replyCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!vm.supportTicketsLoading && vm.supportTickets.length === 0 && (
            <p className="text-sm text-muted-foreground py-10 text-center border-t">
              No tickets match the current filters.
            </p>
          )}
        </div>
        <AdminPager
          skip={vm.supportTicketsSkip}
          limit={SUPPORT_TICKETS_PAGE_SIZE}
          total={vm.supportTicketsTotal}
          busy={vm.supportTicketsLoading}
          onPrev={() => vm.setSupportTicketsSkip((s) => Math.max(0, s - SUPPORT_TICKETS_PAGE_SIZE))}
          onNext={() => vm.setSupportTicketsSkip((s) => s + SUPPORT_TICKETS_PAGE_SIZE)}
        />
      </CardContent>
    </Card>
  </AnimateOnScroll>
    </div>
  );
}
