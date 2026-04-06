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
    <Card className="border-2 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-accent/10 to-primary/5 border-b">
        <CardTitle className="flex items-center gap-2">
          <Wallet className="w-5 h-5 text-accent" />
          Farmer vm.withdrawals
        </CardTitle>
        <CardDescription>
          Mark requests as processing, completed (paid), or rejected. Farmers are notified automatically.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-4 mb-6 items-center">
          <Select value={vm.withdrawalFilter} onValueChange={vm.setWithdrawalFilter}>
            <SelectTrigger className="w-48">
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
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
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
                    className="card-elevated p-5 border-2 border-border rounded-xl space-y-3"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-lg">{w.farmerName}</p>
                        <p className="text-sm text-muted-foreground">
                          {w.farmerPhone || '—'} · {w.farmerEmail || '—'}
                        </p>
                        <p className="text-xl font-bold text-primary mt-2">
                          ₹{w.amount.toLocaleString('en-IN')}
                        </p>
                      </div>
                      <Badge
                        className={
                          w.status === 'completed'
                            ? 'bg-success/15 text-success'
                            : w.status === 'rejected'
                              ? 'bg-destructive/15 text-destructive'
                              : w.status === 'processing'
                                ? 'bg-primary/15 text-primary'
                                : 'bg-warning/15 text-warning'
                        }
                      >
                        {w.status}
                      </Badge>
                    </div>
                    <div className="text-sm rounded-lg bg-muted/50 p-3 space-y-1">
                      <p>
                        <span className="text-muted-foreground">Bank:</span>{' '}
                        {w.bankAccount.bankName || '—'}
                      </p>
                      <p>
                        <span className="text-muted-foreground">Account:</span>{' '}
                        {w.bankAccount.accountHolderName || '—'} · ****
                        {w.bankAccount.accountNumber?.slice(-4) || '—'}
                      </p>
                      <p>
                        <span className="text-muted-foreground">IFSC:</span>{' '}
                        {w.bankAccount.ifscCode || '—'}
                      </p>
                      <p className="text-xs text-muted-foreground pt-1">
                        Requested {new Date(w.requestedAt).toLocaleString()}
                        {w.processedAt &&
                          ` · Processed ${new Date(w.processedAt).toLocaleString()}`}
                      </p>
                      {w.rejectionReason && (
                        <p className="text-xs text-destructive pt-1">{w.rejectionReason}</p>
                      )}
                    </div>
                    {canAct && (
                      <div className="flex flex-wrap gap-2">
                        {w.status === 'pending' && (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={busy}
                            onClick={() => void vm.handleWithdrawalStatus(w, 'processing')}
                          >
                            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Processing'}
                          </Button>
                        )}
                        <Button
                          size="sm"
                          className="bg-success hover:bg-success/90"
                          disabled={busy}
                          onClick={() => void vm.handleWithdrawalStatus(w, 'completed')}
                        >
                          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Mark paid'}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
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
              <Wallet className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No vm.withdrawals in this filter</p>
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
