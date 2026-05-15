import { Wallet, Loader2, Download } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AnimateOnScroll } from '@/components/animations';
import { useAdminDashboard } from '../adminDashboardContext';
import { AdminPager, WITHDRAWALS_PAGE_SIZE } from '../adminShared';


export default function AdminPayoutsTab() {
  const vm = useAdminDashboard();
  return (
    <div className="space-y-6">
  <AnimateOnScroll animation="slide-up">
    <Card className="border-[#d7c7a8] bg-[#fffaf0] shadow-[0_16px_40px_rgba(95,70,40,0.08)]">
      <CardHeader className="border-b border-[#e2d4b7] bg-[#f6eddc]">
        <CardTitle className="flex items-center gap-2">
          <Wallet className="w-5 h-5 text-[#8a4f2a]" />
          Farmer vm.withdrawals
        </CardTitle>
        <CardDescription className="text-[#6f6552]">
          Mark requests as processing, completed (paid), or rejected. Farmers are notified automatically.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-4 mb-6 items-center">
          <Select value={vm.withdrawalFilter} onValueChange={vm.setWithdrawalFilter}>
            <SelectTrigger className="w-48 border-[#d7c7a8] bg-[#fffdf7] text-[#2f3a2f]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="border-[#d7c7a8] bg-[#fffdf7] text-[#315f3b] hover:bg-[#f3ebdd] hover:text-[#315f3b]"
            disabled={vm.csvExporting === 'payouts'}
            onClick={() => void vm.handleExportWithdrawalsCsv()}
          >
            {vm.csvExporting === 'payouts' ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Download className="w-4 h-4 mr-2" />
            )}
            Export payouts (CSV)
          </Button>
        </div>

        {vm.payoutsLoading && (
          <div className="mb-4 flex items-center gap-2 text-sm text-[#6f6552]">
            <Loader2 className="h-4 w-4 animate-spin shrink-0" />
            Loading vm.withdrawals…
          </div>
        )}

        <div className="space-y-4">
          {vm.withdrawals.length > 0 ? (
            vm.withdrawals.map((w) => {
                const busy = vm.withdrawalActionId === w.id;
                const canAct = w.status === 'pending' || w.status === 'processing';
                return (
                  <div
                    key={w.id}
                    className="space-y-3 rounded-xl border border-[#d7c7a8] bg-[#fffdf7] p-5"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-lg">{w.farmerName}</p>
                        <p className="text-sm text-[#6f6552]">
                          {w.farmerPhone || '—'} · {w.farmerEmail || '—'}
                        </p>
                        <p className="mt-2 text-xl font-bold text-[#315f3b]">
                          ₹{w.amount.toLocaleString('en-IN')}
                        </p>
                      </div>
                      <Badge
                        className={
                          w.status === 'completed'
                            ? 'bg-[#eaf5ec] text-[#315f3b]'
                            : w.status === 'rejected'
                              ? 'bg-[#f6e5dc] text-[#8a4f2a]'
                              : w.status === 'processing'
                                ? 'bg-[#eef5ee] text-[#58774e]'
                                : 'bg-[#fff4dd] text-[#9a6b12]'
                        }
                      >
                        {w.status}
                      </Badge>
                    </div>
                    <div className="space-y-1 rounded-lg bg-[#f3ebdd] p-3 text-sm">
                      <p>
                        <span className="text-[#6f6552]">Bank:</span>{' '}
                        {w.bankAccount.bankName || '—'}
                      </p>
                      <p>
                        <span className="text-[#6f6552]">Account:</span>{' '}
                        {w.bankAccount.accountHolderName || '—'} · ****
                        {w.bankAccount.accountNumber?.slice(-4) || '—'}
                      </p>
                      <p>
                        <span className="text-[#6f6552]">IFSC:</span>{' '}
                        {w.bankAccount.ifscCode || '—'}
                      </p>
                      <p className="pt-1 text-xs text-[#6f6552]">
                        Requested {new Date(w.requestedAt).toLocaleString()}
                        {w.processedAt &&
                          ` · Processed ${new Date(w.processedAt).toLocaleString()}`}
                      </p>
                      {w.rejectionReason && (
                        <p className="pt-1 text-xs text-[#8a4f2a]">{w.rejectionReason}</p>
                      )}
                    </div>
                    {canAct && (
                      <div className="flex flex-wrap gap-2">
                        {w.status === 'pending' && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-[#d7c7a8] bg-[#fffaf0] text-[#315f3b] hover:bg-[#f3ebdd] hover:text-[#315f3b]"
                            disabled={busy}
                            onClick={() => void vm.handleWithdrawalStatus(w, 'processing')}
                          >
                            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Processing'}
                          </Button>
                        )}
                        <Button
                          size="sm"
                          className="border border-[#315f3b] bg-[#315f3b] text-[#fffaf0] hover:bg-[#284e31]"
                          disabled={busy}
                          onClick={() => void vm.handleWithdrawalStatus(w, 'completed')}
                        >
                          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Mark paid'}
                        </Button>
                        <Button
                          size="sm"
                          className="bg-[#8a4f2a] text-[#fffaf0] hover:bg-[#784223]"
                          disabled={busy}
                          onClick={() => vm.setRejectTarget(w)}
                        >
                          Reject
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })
          ) : (
            <div className="text-center py-12">
              <Wallet className="mx-auto mb-4 h-16 w-16 text-[#8b816f]" />
              <p className="text-[#6f6552]">No vm.withdrawals in this filter</p>
            </div>
          )}
        </div>

        <AdminPager
          skip={vm.withdrawalsSkip}
          limit={WITHDRAWALS_PAGE_SIZE}
          total={vm.withdrawalsTotal}
          busy={vm.payoutsLoading}
          onPrev={() =>
            vm.setWithdrawalsSkip((s) => Math.max(0, s - WITHDRAWALS_PAGE_SIZE))
          }
          onNext={() => vm.setWithdrawalsSkip((s) => s + WITHDRAWALS_PAGE_SIZE)}
        />
      </CardContent>
    </Card>
  </AnimateOnScroll>
    </div>
  );
}
