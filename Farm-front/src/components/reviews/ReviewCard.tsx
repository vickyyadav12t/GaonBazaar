import { Review } from '@/types';
import { Star, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ReviewCardProps {
  review: Review;
  showReply?: boolean;
  onReply?: () => void;
}

const ReviewCard = ({ review, showReply = false, onReply }: ReviewCardProps) => {
  return (
    <div className="card-elevated p-4">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <h4 className="font-semibold text-foreground">{review.reviewerName}</h4>
            <span className="text-xs text-muted-foreground">•</span>
            <span className="text-xs text-muted-foreground">
              {new Date(review.createdAt).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </span>
          </div>
          <p className="text-sm text-muted-foreground mb-2">{review.productName}</p>
        </div>
        <div className="flex items-center gap-1 bg-primary/10 px-2 py-1 rounded-full">
          <Star className="w-4 h-4 text-secondary fill-secondary" />
          <span className="text-sm font-semibold text-foreground">{review.rating}</span>
        </div>
      </div>

      <p className="text-foreground mt-3">{review.comment}</p>

      {review.reply && (
        <div className="mt-4 pl-4 border-l-2 border-primary/30 bg-muted/30 rounded-r-lg p-3">
          <p className="text-sm font-medium text-primary mb-1">Reply from {review.targetName}</p>
          <p className="text-sm text-foreground">{review.reply}</p>
          {review.replyDate && (
            <p className="text-xs text-muted-foreground mt-2">
              {new Date(review.replyDate).toLocaleDateString('en-IN')}
            </p>
          )}
        </div>
      )}

      {showReply && !review.reply && (
        <Button variant="ghost" size="sm" onClick={onReply} className="mt-3 text-primary">
          <MessageCircle className="w-4 h-4 mr-1" />
          Reply to Review
        </Button>
      )}
    </div>
  );
};

export default ReviewCard;
