import { History, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AnimateOnScroll } from '@/components/animations';
import { useAdminDashboard } from '../adminDashboardContext';
import {
  AdminPager,
  AUDIT_PAGE_SIZE,
  AUDIT_FILTER_ALL,
  AUDIT_RESOURCE_TYPE_OPTIONS,
  AUDIT_ACTION_OPTIONS,
} from '../adminShared';


export default function AdminAuditTab() {
  const vm = useAdminDashboard();
  return (
    <div className="space-y-6">
  <AnimateOnScroll animation="slide-up">
    <Card className="border-2 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="w-5 h-5 text-primary" />
          Audit log
        </CardTitle>
        <CardDescription>
          Filter by resource type, exact action, or search within action text. Newest first.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex flex-col lg:flex-row flex-wrap gap-4 lg:items-end">
            <div className="space-y-1.5 min-w-[180px]">
              <Label htmlFor="audit-resource-type" className="text-xs text-muted-foreground">
                Resource type
              </Label>
              <Select
                value={vm.auditResourceFilter || AUDIT_FILTER_ALL}
                onValueChange={(v) =>
                  vm.setAuditResourceFilter(v === AUDIT_FILTER_ALL ? '' : v)
                }
              >
                <SelectTrigger id="audit-resource-type" className="w-full lg:w-[200px]">
                  <SelectValue placeholder="Resource" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={AUDIT_FILTER_ALL}>All resources</SelectItem>
                  {AUDIT_RESOURCE_TYPE_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 min-w-[200px]">
              <Label htmlFor="audit-action" className="text-xs text-muted-foreground">
                Action
              </Label>
              <Select
                value={vm.auditActionFilter || AUDIT_FILTER_ALL}
                onValueChange={(v) =>
                  vm.setAuditActionFilter(v === AUDIT_FILTER_ALL ? '' : v)
                }
              >
                <SelectTrigger id="audit-action" className="w-full lg:w-[220px]">
                  <SelectValue placeholder="Action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={AUDIT_FILTER_ALL}>All actions</SelectItem>
                  {AUDIT_ACTION_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 flex-1 min-w-[200px] max-w-md">
              <Label htmlFor="audit-action-search" className="text-xs text-muted-foreground">
                Search in action
              </Label>
              <Input
                id="audit-action-search"
                placeholder="e.g. kyc, listing, review…"
                value={vm.auditActionSearchInput}
                onChange={(e) => vm.setAuditActionSearchInput(e.target.value)}
                disabled={Boolean(vm.auditActionFilter)}
                className="w-full"
              />
              {vm.auditActionFilter ? (
                <p className="text-[11px] text-muted-foreground">
                  Clear “Action” to use text search.
                </p>
              ) : (
                <p className="text-[11px] text-muted-foreground">
                  Case-insensitive substring when no specific action is selected.
                </p>
              )}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="lg:mb-0.5 shrink-0"
              disabled={
                !vm.auditResourceFilter && !vm.auditActionFilter && !vm.auditActionSearchInput
              }
              onClick={() => {
                vm.setAuditResourceFilter('');
                vm.setAuditActionFilter('');
                vm.setAuditActionSearchInput('');
                vm.setDebouncedAuditActionSearch('');
                vm.setAuditSkip(0);
              }}
            >
              Clear filters
            </Button>
          </div>
        </div>
        {vm.auditLoading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
            <Loader2 className="h-4 w-4 animate-spin shrink-0" />
            Loading…
          </div>
        )}
        <div className="rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto max-h-[min(70vh,560px)] overflow-y-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 border-b text-left sticky top-0 z-10">
                  <th className="p-3 font-semibold whitespace-nowrap">When</th>
                  <th className="p-3 font-semibold whitespace-nowrap">Actor</th>
                  <th className="p-3 font-semibold whitespace-nowrap">Action</th>
                  <th className="p-3 font-semibold whitespace-nowrap">Resource</th>
                  <th className="p-3 font-semibold min-w-[140px]">Target user</th>
                  <th className="p-3 font-semibold min-w-[180px]">Details</th>
                </tr>
              </thead>
              <tbody>
                {vm.auditLogs.map((row) => {
                  let detailsStr = '';
                  try {
                    const s = JSON.stringify(row.details || {});
                    detailsStr = s.length > 120 ? `${s.slice(0, 117)}…` : s;
                  } catch {
                    detailsStr = '';
                  }
                  return (
                    <tr key={row.id} className="border-b border-border/80 align-top hover:bg-muted/20">
                      <td className="p-3 whitespace-nowrap text-muted-foreground text-xs">
                        {row.createdAt
                          ? new Date(row.createdAt).toLocaleString('en-IN', {
                              dateStyle: 'short',
                              timeStyle: 'short',
                            })
                          : '—'}
                      </td>
                      <td className="p-3">
                        <p className="font-medium">{row.actor?.name || '—'}</p>
                        <p className="text-xs text-muted-foreground break-all">{row.actor?.email || ''}</p>
                      </td>
                      <td className="p-3 font-mono text-xs">{row.action}</td>
                      <td className="p-3">
                        <span className="text-xs text-muted-foreground">{row.resourceType}</span>
                        <p className="font-mono text-[11px] break-all mt-0.5">{row.resourceId}</p>
                      </td>
                      <td className="p-3 text-xs">
                        {row.targetUser ? (
                          <>
                            <p className="font-medium">{row.targetUser.name}</p>
                            <p className="text-muted-foreground break-all">{row.targetUser.email}</p>
                          </>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="p-3 text-xs text-muted-foreground font-mono break-all">
                        {detailsStr || '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {!vm.auditLoading && vm.auditLogs.length === 0 && (
            <p className="text-sm text-muted-foreground py-10 text-center border-t">
              {vm.auditFiltersActive
                ? 'No audit entries match the current filters.'
                : 'No audit entries yet. Actions you take (KYC, vm.listings, etc.) will appear here.'}
            </p>
          )}
        </div>
        <AdminPager
          skip={vm.auditSkip}
          limit={AUDIT_PAGE_SIZE}
          total={vm.auditTotal}
          busy={vm.auditLoading}
          onPrev={() => vm.setAuditSkip((s) => Math.max(0, s - AUDIT_PAGE_SIZE))}
          onNext={() => vm.setAuditSkip((s) => s + AUDIT_PAGE_SIZE)}
        />
      </CardContent>
    </Card>
  </AnimateOnScroll>
    </div>
  );
}
