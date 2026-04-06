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
    <Card className="border-2 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-warning/10 to-warning/5 border-b">
        <CardTitle className="flex items-center gap-2">
          <Star className="w-5 h-5 text-warning" />
          Review Management
        </CardTitle>
        <CardDescription>
          Pending reviews must be approved before farmers and the public see them.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        {vm.reviewsLoading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin shrink-0" />
            Loading reviews…
          </div>
        )}

        <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              Moderation queue
              <Badge className="bg-warning/15 text-warning border-warning/30">
                {vm.pendingReviewsTotal} pending (total)
              </Badge>
            </h3>
            {!vm.reviewsLoading && vm.pendingReviewQueue.length === 0 && (
              <p className="text-sm text-muted-foreground py-2">
                No pending reviews on this page.
              </p>
            )}
            <div className="space-y-4">
              {vm.pendingReviewQueue.map((review) => (
                <Card key={review.id} className="border-2 border-warning/40 hover:shadow-lg transition-shadow">
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <p className="font-semibold text-base">{review.reviewerName}</p>
                          <span className="text-muted-foreground">→</span>
                          <p className="font-medium">{review.targetName}</p>
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-warning fill-warning" />
                            <span className="font-semibold">{review.rating}</span>
                          </div>
                          <Badge className="bg-warning/10 text-warning">Pending</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{review.productName}</p>
                        <p className="text-foreground mb-2 leading-relaxed">{review.comment}</p>
                        <p className="text-xs text-muted-foreground">{review.createdAt}</p>
                      </div>
                      <div className="flex flex-col gap-2">
                        <Button size="sm" onClick={() => vm.handleReviewAction(review.id, 'approve')}>
                          <CheckCircle className="w-4 h-4 mr-1" /> Approve
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => vm.handleReviewAction(review.id, 'remove')}>
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
          <h3 className="text-sm font-semibold text-muted-foreground">
            Published ({vm.publishedReviewsTotal} total)
          </h3>
          {!vm.reviewsLoading && vm.publishedReviews.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">No published reviews on this page.</p>
          ) : (
            <div className="space-y-4">
              {vm.publishedReviews.map((review) => (
                <Card key={review.id} className="border-2 border-border hover:shadow-lg transition-shadow">
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <p className="font-semibold text-base">{review.reviewerName}</p>
                          <span className="text-muted-foreground">→</span>
                          <p className="font-medium">{review.targetName}</p>
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-warning fill-warning" />
                            <span className="font-semibold">{review.rating}</span>
                          </div>
                          <Badge className="bg-success/10 text-success">Approved</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{review.productName}</p>
                        <p className="text-foreground mb-2 leading-relaxed">{review.comment}</p>
                        <p className="text-xs text-muted-foreground">{review.createdAt}</p>
                      </div>
                      <div className="flex flex-col gap-2">
                        <Button size="sm" variant="destructive" onClick={() => vm.handleReviewAction(review.id, 'remove')}>
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
