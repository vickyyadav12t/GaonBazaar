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
    <div className="card-elevated border-[#d7c7a8] bg-[#fffaf0] p-4">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <h4 className="font-semibold text-[#2c4632]">{review.reviewerName}</h4>
            <span className="text-xs text-[#8a7a5b]">•</span>
            <span className="text-xs text-[#8a7a5b]">
              {new Date(review.createdAt).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </span>
          </div>
          <p className="mb-2 text-sm text-[#6c5a3d]">{review.productName}</p>
        </div>
        <div className="flex items-center gap-1 rounded-full border border-[#d2b06b] bg-[#efe2bc] px-2 py-1">
          <Star className="h-4 w-4 fill-[#d89b2b] text-[#d89b2b]" />
          <span className="text-sm font-semibold text-[#2c4632]">{review.rating}</span>
        </div>
      </div>

      <p className="mt-3 text-[#314837]">{review.comment}</p>

      {review.reply && (
        <div className="mt-4 rounded-r-lg border-l-2 border-[#d2b06b] bg-[#f7eddc] p-3 pl-4">
          <p className="mb-1 text-sm font-medium text-[#315f3b]">Reply from {review.targetName}</p>
          <p className="text-sm text-[#314837]">{review.reply}</p>
          {review.replyDate && (
            <p className="mt-2 text-xs text-[#8a7a5b]">
              {new Date(review.replyDate).toLocaleDateString('en-IN')}
            </p>
          )}
        </div>
      )}

      {showReply && !review.reply && (
        <Button variant="ghost" size="sm" onClick={onReply} className="mt-3 text-[#315f3b] hover:bg-[#f3e7cd] hover:text-[#274631]">
          <MessageCircle className="w-4 h-4 mr-1" />
          Reply to Review
        </Button>
      )}
    </div>
  );
};

export default ReviewCard;
