import { Shield, Loader2, CheckCircle, XCircle, Eye } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AnimateOnScroll } from '@/components/animations';
import { useAdminDashboard } from '../adminDashboardContext';
import { AdminKycPreview, AdminPager, KYC_PAGE_SIZE } from '../adminShared';
import { resolveBackendAssetUrl } from '@/lib/productImageUrl';


export default function AdminKycTab() {
  const vm = useAdminDashboard();
  return (
    <div className="space-y-6">
  <AnimateOnScroll animation="slide-up">
    <Card className="border-2 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-warning/10 to-warning/5 border-b">
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-warning" />
          KYC Management
        </CardTitle>
        <CardDescription>
          Approve when the farmer has uploaded at least one of Aadhaar or Kisan ID (bank statement not required).
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4 mb-6">
          <Select value={vm.kycFilter} onValueChange={vm.setKycFilter}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {vm.kycLoading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
            <Loader2 className="h-4 w-4 animate-spin shrink-0" />
            Loading farmers…
          </div>
        )}

        <div className="space-y-4">
          {vm.kycFarmersPage.length > 0 ? (
            vm.kycFarmersPage.map((farmer) => (
              <div key={farmer.id} className="card-elevated p-6 border-2 border-border hover:shadow-lg transition-shadow">
                <div className="flex items-start gap-4">
                  <img
                    src={resolveBackendAssetUrl(farmer.avatar)}
                    alt={farmer.name}
                    className="w-20 h-20 rounded-full object-cover border-2 border-warning/20"
                    loading="lazy"
                    decoding="async"
                    onError={(e) => {
                      const el = e.currentTarget;
                      el.onerror = null;
                      el.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(farmer.name || 'Farmer')}&size=160`;
                    }}
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <p className="font-semibold text-lg">{farmer.name}</p>
                      {vm.getKycBadge(farmer.kycStatus)}
                    </div>
                    <p className="text-sm text-muted-foreground mb-1">{farmer.email}</p>
                    <p className="text-sm text-muted-foreground mb-1">{farmer.phone}</p>
                    <p className="text-sm mb-3">
                      {[farmer.location?.village, farmer.location?.district, farmer.location?.state]
                        .filter(Boolean)
                        .join(', ') || '—'}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline" className="bg-muted">Farm: {farmer.farmSize}</Badge>
                      <Badge variant="outline" className="bg-muted">Crops: {farmer.crops || '—'}</Badge>
                    </div>
                    {farmer.kycStatus === 'rejected' && farmer.kycRejectionReason ? (
                      <p className="text-sm text-destructive mt-3 rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2">
                        <span className="font-semibold">Rejection reason: </span>
                        {farmer.kycRejectionReason}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex flex-col gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="outline">
                          <Eye className="w-4 h-4 mr-1" /> View Docs
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>KYC Documents — {farmer.name}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          {(
                            [
                              { type: 'aadhaar', title: 'Aadhaar Card', color: 'text-primary' },
                              { type: 'kisan', title: 'Kisan ID / PM-KISAN', color: 'text-success' },
                            ] as const
                          ).map(({ type, title, color }) => {
                            const doc = (farmer.kycDocuments || []).find(
                              (d: { docType: string }) => d.docType === type
                            );
                            return (
                              <div
                                key={type}
                                className="p-4 bg-muted rounded-lg border-2 border-border"
                              >
                                <div className="flex items-center gap-3 mb-3">
                                  <Shield className={`w-5 h-5 ${color}`} />
                                  <p className="font-semibold">{title}</p>
                                  {doc?.reviewStatus && (
                                    <Badge variant="outline" className="capitalize">
                                      {doc.reviewStatus}
                                    </Badge>
                                  )}
                                </div>
                                {doc?.fileUrl ? (
                                  <div className="space-y-2">
                                    <p className="text-xs text-muted-foreground">
                                      {doc.originalName || 'Uploaded file'}
                                    </p>
                                    <AdminKycPreview url={doc.fileUrl} />
                                    <a
                                      href={doc.fileUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-sm text-primary font-medium inline-block"
                                    >
                                      Open in new tab
                                    </a>
                                  </div>
                                ) : (
                                  <p className="text-sm text-muted-foreground py-4 text-center border border-dashed rounded-lg">
                                    Not uploaded
                                  </p>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </DialogContent>
                    </Dialog>
                    {farmer.kycStatus === 'pending' && (
                      <>
                        <Button size="sm" className="bg-success hover:bg-success/90" onClick={() => void vm.handleKycApprove(farmer.id)}>
                          <CheckCircle className="w-4 h-4 mr-1" /> Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            vm.setKycRejectTarget({ id: farmer.id, name: farmer.name });
                            vm.setKycRejectReason('');
                          }}
                        >
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
              <p className="text-muted-foreground">
                {vm.kycFilter === 'all'
                  ? 'No farmers match this view.'
                  : `No ${vm.kycFilter} KYC requests`}
              </p>
            </div>
          )}
        </div>

        <AdminPager
          skip={vm.kycSkip}
          limit={KYC_PAGE_SIZE}
          total={vm.kycTotal}
          busy={vm.kycLoading}
          onPrev={() => vm.setKycSkip((s) => Math.max(0, s - KYC_PAGE_SIZE))}
          onNext={() => vm.setKycSkip((s) => s + KYC_PAGE_SIZE)}
        />
      </CardContent>
    </Card>
  </AnimateOnScroll>
    </div>
  );
}
