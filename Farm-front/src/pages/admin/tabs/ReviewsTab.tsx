import { Star, Loader2, CheckCircle, Trash2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AnimateOnScroll } from '@/components/animations';
import { useAdminDashboard } from '../adminDashboardContext';
import { AdminPager, REVIEWS_PAGE_SIZE } from '../adminShared';


export default function AdminReviewsTab() {
  const vm = useAdminDashboard();
  return (
    <div className="space-y-6">
  <AnimateOnScroll animation="slide-up">
    <Card className="border-[#d7c7a8] bg-[#fffaf0] shadow-[0_16px_40px_rgba(95,70,40,0.08)]">
      <CardHeader className="border-b border-[#e2d4b7] bg-[#f6eddc]">
        <CardTitle className="flex items-center gap-2">
          <Star className="w-5 h-5 text-[#d89b2b]" />
          Review Management
        </CardTitle>
        <CardDescription className="text-[#6f6552]">
          Pending reviews must be approved before farmers and the public see them.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        {vm.reviewsLoading && (
          <div className="flex items-center gap-2 text-sm text-[#6f6552]">
            <Loader2 className="h-4 w-4 animate-spin shrink-0" />
            Loading reviews…
          </div>
        )}

        <div className="space-y-3">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-[#2f3a2f]">
              Moderation queue
              <Badge className="border border-[#e8cf96] bg-[#fff4dd] text-[#9a6b12]">
                {vm.pendingReviewsTotal} pending (total)
              </Badge>
            </h3>
            {!vm.reviewsLoading && vm.pendingReviewQueue.length === 0 && (
              <p className="py-2 text-sm text-[#6f6552]">
                No pending reviews on this page.
              </p>
            )}
            <div className="space-y-4">
              {vm.pendingReviewQueue.map((review) => (
                <Card key={review.id} className="border-[#e8cf96] bg-[#fffdf7] transition-all hover:border-[#d9bf7d] hover:shadow-[0_16px_40px_rgba(95,70,40,0.12)]">
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <p className="font-semibold text-base">{review.reviewerName}</p>
                          <span className="text-[#6f6552]">→</span>
                          <p className="font-medium">{review.targetName}</p>
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 fill-[#d89b2b] text-[#d89b2b]" />
                            <span className="font-semibold">{review.rating}</span>
                          </div>
                          <Badge className="bg-[#fff4dd] text-[#9a6b12]">Pending</Badge>
                        </div>
                        <p className="mb-2 text-sm text-[#6f6552]">{review.productName}</p>
                        <p className="mb-2 leading-relaxed text-[#2f3a2f]">{review.comment}</p>
                        <p className="text-xs text-[#6f6552]">{review.createdAt}</p>
                      </div>
                      <div className="flex flex-col gap-2">
                        <Button size="sm" className="border border-[#315f3b] bg-[#315f3b] text-[#fffaf0] hover:bg-[#284e31]" onClick={() => vm.handleReviewAction(review.id, 'approve')}>
                          <CheckCircle className="w-4 h-4 mr-1" /> Approve
                        </Button>
                        <Button size="sm" className="bg-[#8a4f2a] text-[#fffaf0] hover:bg-[#784223]" onClick={() => vm.handleReviewAction(review.id, 'remove')}>
                          <Trash2 className="w-4 h-4 mr-1" /> Remove
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            <AdminPager
              skip={vm.pendingReviewsSkip}
              limit={REVIEWS_PAGE_SIZE}
              total={vm.pendingReviewsTotal}
              busy={vm.reviewsLoading}
              onPrev={() =>
                vm.setPendingReviewsSkip((s) => Math.max(0, s - REVIEWS_PAGE_SIZE))
              }
              onNext={() => vm.setPendingReviewsSkip((s) => s + REVIEWS_PAGE_SIZE)}
            />
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-[#6f6552]">
            Published ({vm.publishedReviewsTotal} total)
          </h3>
          {!vm.reviewsLoading && vm.publishedReviews.length === 0 ? (
            <p className="py-4 text-sm text-[#6f6552]">No published reviews on this page.</p>
          ) : (
            <div className="space-y-4">
              {vm.publishedReviews.map((review) => (
                <Card key={review.id} className="border-[#d7c7a8] bg-[#fffdf7] transition-all hover:border-[#c8b38b] hover:shadow-[0_16px_40px_rgba(95,70,40,0.12)]">
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <p className="font-semibold text-base">{review.reviewerName}</p>
                          <span className="text-[#6f6552]">→</span>
                          <p className="font-medium">{review.targetName}</p>
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 fill-[#d89b2b] text-[#d89b2b]" />
                            <span className="font-semibold">{review.rating}</span>
                          </div>
                          <Badge className="bg-[#eaf5ec] text-[#315f3b]">Approved</Badge>
                        </div>
                        <p className="mb-2 text-sm text-[#6f6552]">{review.productName}</p>
                        <p className="mb-2 leading-relaxed text-[#2f3a2f]">{review.comment}</p>
                        <p className="text-xs text-[#6f6552]">{review.createdAt}</p>
                      </div>
                      <div className="flex flex-col gap-2">
                        <Button size="sm" className="bg-[#8a4f2a] text-[#fffaf0] hover:bg-[#784223]" onClick={() => vm.handleReviewAction(review.id, 'remove')}>
                          <Trash2 className="w-4 h-4 mr-1" /> Remove
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
          <AdminPager
            skip={vm.publishedReviewsSkip}
            limit={REVIEWS_PAGE_SIZE}
            total={vm.publishedReviewsTotal}
            busy={vm.reviewsLoading}
            onPrev={() =>
              vm.setPublishedReviewsSkip((s) => Math.max(0, s - REVIEWS_PAGE_SIZE))
            }
            onNext={() => vm.setPublishedReviewsSkip((s) => s + REVIEWS_PAGE_SIZE)}
          />
        </div>
      </CardContent>
    </Card>
  </AnimateOnScroll>
    </div>
  );
}
