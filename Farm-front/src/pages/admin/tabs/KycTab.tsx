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
    <Card className="border-[#d7c7a8] bg-[#fffaf0] shadow-[0_16px_40px_rgba(95,70,40,0.08)]">
      <CardHeader className="border-b border-[#e2d4b7] bg-[#f6eddc]">
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-[#d89b2b]" />
          KYC Management
        </CardTitle>
        <CardDescription className="text-[#6f6552]">
          Approve when the farmer has uploaded at least one of Aadhaar or Kisan ID (bank statement not required).
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4 mb-6">
          <Select value={vm.kycFilter} onValueChange={vm.setKycFilter}>
            <SelectTrigger className="w-48 border-[#d7c7a8] bg-[#fffdf7] text-[#2f3a2f]">
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
          <div className="mb-4 flex items-center gap-2 text-sm text-[#6f6552]">
            <Loader2 className="h-4 w-4 animate-spin shrink-0" />
            Loading farmers…
          </div>
        )}

        <div className="space-y-4">
          {vm.kycFarmersPage.length > 0 ? (
            vm.kycFarmersPage.map((farmer) => (
              <div key={farmer.id} className="rounded-lg border border-[#d7c7a8] bg-[#fffdf7] p-6 transition-all hover:border-[#c8b38b] hover:shadow-[0_16px_40px_rgba(95,70,40,0.12)]">
                <div className="flex items-start gap-4">
                  <img
                    src={resolveBackendAssetUrl(farmer.avatar)}
                    alt={farmer.name}
                    className="h-20 w-20 rounded-full border-2 border-[#e8cf96] object-cover"
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
                    <p className="mb-1 text-sm text-[#6f6552]">{farmer.email}</p>
                    <p className="mb-1 text-sm text-[#6f6552]">{farmer.phone}</p>
                    <p className="text-sm mb-3">
                      {[farmer.location?.village, farmer.location?.district, farmer.location?.state]
                        .filter(Boolean)
                        .join(', ') || '—'}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline" className="border-[#d7c7a8] bg-[#f3ebdd] text-[#6c5a3d]">Farm: {farmer.farmSize}</Badge>
                      <Badge variant="outline" className="border-[#d7c7a8] bg-[#f3ebdd] text-[#6c5a3d]">Crops: {farmer.crops || '—'}</Badge>
                    </div>
                    {farmer.kycStatus === 'rejected' && farmer.kycRejectionReason ? (
                      <p className="mt-3 rounded-md border border-[#d8b0a0] bg-[#f6e5dc] px-3 py-2 text-sm text-[#8a4f2a]">
                        <span className="font-semibold">Rejection reason: </span>
                        {farmer.kycRejectionReason}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex flex-col gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="outline" className="border-[#d7c7a8] bg-[#fffaf0] text-[#315f3b] hover:bg-[#f3ebdd] hover:text-[#315f3b]">
                          <Eye className="w-4 h-4 mr-1" /> View Docs
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto border-[#d7c7a8] bg-[#fffaf0]">
                        <DialogHeader>
                          <DialogTitle>KYC Documents — {farmer.name}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          {(
                            [
                              { type: 'aadhaar', title: 'Aadhaar Card', color: 'text-[#315f3b]' },
                              { type: 'kisan', title: 'Kisan ID / PM-KISAN', color: 'text-[#58774e]' },
                            ] as const
                          ).map(({ type, title, color }) => {
                            const doc = (farmer.kycDocuments || []).find(
                              (d: { docType: string }) => d.docType === type
                            );
                            return (
                              <div
                                key={type}
                                className="rounded-lg border border-[#e2d4b7] bg-[#fffdf7] p-4"
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
                                    <p className="text-xs text-[#6f6552]">
                                      {doc.originalName || 'Uploaded file'}
                                    </p>
                                    <AdminKycPreview url={doc.fileUrl} />
                                    <a
                                      href={doc.fileUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-block text-sm font-medium text-[#315f3b]"
                                    >
                                      Open in new tab
                                    </a>
                                  </div>
                                ) : (
                                  <p className="rounded-lg border border-dashed border-[#d7c7a8] py-4 text-center text-sm text-[#6f6552]">
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
                        <Button size="sm" className="border border-[#315f3b] bg-[#315f3b] text-[#fffaf0] hover:bg-[#284e31]" onClick={() => void vm.handleKycApprove(farmer.id)}>
                          <CheckCircle className="w-4 h-4 mr-1" /> Approve
                        </Button>
                        <Button
                          size="sm"
                          className="bg-[#8a4f2a] text-[#fffaf0] hover:bg-[#784223]"
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
            <div className="py-12 text-center">
              <Shield className="mx-auto mb-4 h-16 w-16 text-[#8b816f]" />
              <p className="text-[#6f6552]">
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
