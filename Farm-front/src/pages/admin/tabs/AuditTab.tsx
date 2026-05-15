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
    <Card className="border-[#d7c7a8] bg-[#fffaf0] shadow-[0_16px_40px_rgba(95,70,40,0.08)]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="w-5 h-5 text-[#315f3b]" />
          Audit log
        </CardTitle>
        <CardDescription className="text-[#6f6552]">
          Filter by resource type, exact action, or search within action text. Newest first.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex flex-col lg:flex-row flex-wrap gap-4 lg:items-end">
            <div className="space-y-1.5 min-w-[180px]">
              <Label htmlFor="audit-resource-type" className="text-xs text-[#6f6552]">
                Resource type
              </Label>
              <Select
                value={vm.auditResourceFilter || AUDIT_FILTER_ALL}
                onValueChange={(v) =>
                  vm.setAuditResourceFilter(v === AUDIT_FILTER_ALL ? '' : v)
                }
              >
                <SelectTrigger id="audit-resource-type" className="w-full border-[#d7c7a8] bg-[#fffdf7] text-[#2f3a2f] lg:w-[200px]">
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
              <Label htmlFor="audit-action" className="text-xs text-[#6f6552]">
                Action
              </Label>
              <Select
                value={vm.auditActionFilter || AUDIT_FILTER_ALL}
                onValueChange={(v) =>
                  vm.setAuditActionFilter(v === AUDIT_FILTER_ALL ? '' : v)
                }
              >
                <SelectTrigger id="audit-action" className="w-full border-[#d7c7a8] bg-[#fffdf7] text-[#2f3a2f] lg:w-[220px]">
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
              <Label htmlFor="audit-action-search" className="text-xs text-[#6f6552]">
                Search in action
              </Label>
              <Input
                id="audit-action-search"
                placeholder="e.g. kyc, listing, review…"
                value={vm.auditActionSearchInput}
                onChange={(e) => vm.setAuditActionSearchInput(e.target.value)}
                disabled={Boolean(vm.auditActionFilter)}
                className="w-full border-[#d7c7a8] bg-[#fffdf7] text-[#2f3a2f] placeholder:text-[#8b816f] focus-visible:ring-[#315f3b]"
              />
              {vm.auditActionFilter ? (
                <p className="text-[11px] text-[#6f6552]">
                  Clear “Action” to use text search.
                </p>
              ) : (
                <p className="text-[11px] text-[#6f6552]">
                  Case-insensitive substring when no specific action is selected.
                </p>
              )}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="shrink-0 border-[#d7c7a8] bg-[#fffdf7] text-[#315f3b] hover:bg-[#f3ebdd] hover:text-[#315f3b] lg:mb-0.5"
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
          <div className="mb-4 flex items-center gap-2 text-sm text-[#6f6552]">
            <Loader2 className="h-4 w-4 animate-spin shrink-0" />
            Loading…
          </div>
        )}
        <div className="overflow-hidden rounded-xl border border-[#d7c7a8] bg-[#fffdf7]">
          <div className="overflow-x-auto max-h-[min(70vh,560px)] overflow-y-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="sticky top-0 z-10 border-b border-[#e2d4b7] bg-[#f6eddc] text-left">
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
                    <tr key={row.id} className="align-top border-b border-[#eee2c8] hover:bg-[#f6eddc]">
                      <td className="p-3 whitespace-nowrap text-xs text-[#6f6552]">
                        {row.createdAt
                          ? new Date(row.createdAt).toLocaleString('en-IN', {
                              dateStyle: 'short',
                              timeStyle: 'short',
                            })
                          : '—'}
                      </td>
                      <td className="p-3">
                        <p className="font-medium">{row.actor?.name || '—'}</p>
                        <p className="break-all text-xs text-[#6f6552]">{row.actor?.email || ''}</p>
                      </td>
                      <td className="p-3 font-mono text-xs">{row.action}</td>
                      <td className="p-3">
                        <span className="text-xs text-[#6f6552]">{row.resourceType}</span>
                        <p className="font-mono text-[11px] break-all mt-0.5">{row.resourceId}</p>
                      </td>
                      <td className="p-3 text-xs">
                        {row.targetUser ? (
                          <>
                            <p className="font-medium">{row.targetUser.name}</p>
                            <p className="break-all text-[#6f6552]">{row.targetUser.email}</p>
                          </>
                        ) : (
                          <span className="text-[#6f6552]">—</span>
                        )}
                      </td>
                      <td className="p-3 break-all font-mono text-xs text-[#6f6552]">
                        {detailsStr || '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {!vm.auditLoading && vm.auditLogs.length === 0 && (
            <p className="border-t border-[#e2d4b7] py-10 text-center text-sm text-[#6f6552]">
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
