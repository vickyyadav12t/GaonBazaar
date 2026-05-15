import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Star, Send, MessageCircle, ThumbsUp } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAppSelector } from '@/hooks/useRedux';
import { useToast } from '@/hooks/use-toast';
import { apiService } from '@/services/api';
import { fetchAllOrdersForCurrentUser } from '@/lib/fetchAllPaginated';
import { mapApiOrderToOrder } from '@/lib/mapOrderFromApi';
import { Order } from '@/types';

const Reviews = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { currentLanguage } = useAppSelector((state) => state.language);
  const { user } = useAppSelector((state) => state.auth);
  
  const [reviews, setReviews] = useState<any[]>([]);
  const [replyText, setReplyText] = useState<Record<string, string>>({});
  const [showReplyInput, setShowReplyInput] = useState<Record<string, boolean>>({});
  const [newReviewRating, setNewReviewRating] = useState(0);
  const [newReviewComment, setNewReviewComment] = useState('');
  const [selectedOrder, setSelectedOrder] = useState('');
  const [pendingReviewOrders, setPendingReviewOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Determine if user is farmer or buyer based on route or user role
  const isFarmer = user?.role === 'farmer';
  const reviewRowId = (r: { _id?: string; id?: string }) => String(r._id || r.id || '');
  const userReviews = isFarmer 
    ? reviews.filter((r) => r.target?._id === user?.id || r.target === user?.id)
    : reviews.filter((r) => r.reviewer?._id === user?.id || r.reviewer === user?.id);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      try {
        setIsLoading(true);

        // Load reviews for this user
        const reviewsRes = await apiService.reviews.getAll();
        const backendReviews = reviewsRes.data?.reviews || [];
        setReviews(backendReviews);

        // For buyers, load delivered orders without reviews
        if (!isFarmer) {
          const backendOrders = await fetchAllOrdersForCurrentUser({
            status: 'delivered',
          });

          const mappedOrders: Order[] = backendOrders.map((o: any) =>
            mapApiOrderToOrder(o)
          );

          const deliveredOrders = mappedOrders.filter(
            (o) => o.status === 'delivered'
          );

          const ordersWithoutReview = deliveredOrders.filter(
            (o) =>
              !backendReviews.find(
                (r: any) =>
                  String(r.order?._id || r.order) === o.id &&
                  String(r.reviewer?._id || r.reviewer) === user.id
              )
          );

          setPendingReviewOrders(ordersWithoutReview);
        }
      } catch (error: any) {
        console.error('Failed to load reviews/orders', error);
        toast({
          title: currentLanguage === 'en' ? 'Error' : 'त्रुटि',
          description:
            error?.response?.data?.message ||
            error?.message ||
            (currentLanguage === 'en'
              ? 'Failed to load reviews.'
              : 'समीक्षाएं लोड करने में विफल।'),
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user, isFarmer, currentLanguage, toast]);

  // Convenience: if there's exactly one pending order, preselect it.
  useEffect(() => {
    if (isFarmer) return;
    if (selectedOrder) return;
    if (pendingReviewOrders.length === 1) {
      setSelectedOrder(pendingReviewOrders[0].id);
    }
  }, [isFarmer, pendingReviewOrders, selectedOrder]);

  const handleReply = async (reviewId: string) => {
    const reply = replyText[reviewId];
    if (!reply?.trim()) return;

    try {
      const res = await apiService.reviews.reply(reviewId, reply);
      const updated = res.data?.review;

      setReviews((prev) =>
        prev.map((r) =>
          (r._id || r.id) === (updated._id || updated.id) ? updated : r
        )
      );
      setReplyText((prev) => ({ ...prev, [reviewId]: '' }));
      setShowReplyInput((prev) => ({ ...prev, [reviewId]: false }));
      toast({
        title: currentLanguage === 'en' ? 'Reply Posted' : 'जवाब पोस्ट किया गया',
      });
    } catch (error: any) {
      toast({
        title: currentLanguage === 'en' ? 'Error' : 'त्रुटि',
        description:
          error?.response?.data?.message ||
          error?.message ||
          (currentLanguage === 'en'
            ? 'Failed to post reply.'
            : 'जवाब पोस्ट करने में विफल।'),
        variant: 'destructive',
      });
    }
  };

  const handleSubmitReview = async () => {
    const orderId =
      selectedOrder ||
      (pendingReviewOrders.length === 1 ? pendingReviewOrders[0].id : '');
    const rating = Number(newReviewRating) || 0;
    const comment = String(newReviewComment || '').trim();

    if (!orderId || rating <= 0 || !comment) {
      toast({
        title: currentLanguage === 'en' ? 'Please fill all fields' : 'कृपया सभी फ़ील्ड भरें',
        variant: 'destructive',
      });
      return;
    }

    const order = pendingReviewOrders.find((o) => o.id === orderId);
    if (!order) return;

    try {
      const res = await apiService.reviews.create({
        orderId: order.id,
        rating,
        comment,
      });
      const created = res.data?.review;

      setReviews((prev) => [created, ...prev]);
      setNewReviewRating(0);
      setNewReviewComment('');
      setSelectedOrder('');
      setPendingReviewOrders((prev) =>
        prev.filter((o) => o.id !== order.id)
      );
      toast({
        title:
          currentLanguage === 'en'
            ? 'Review Submitted!'
            : 'समीक्षा सबमिट!',
        description:
          currentLanguage === 'en'
            ? 'It will appear publicly after a moderator approves it.'
            : 'मॉडरेटर के अनुमोदन के बाद यह सार्वजनिक रूप से दिखाई देगी।',
      });
    } catch (error: any) {
      toast({
        title: currentLanguage === 'en' ? 'Error' : 'त्रुटि',
        description:
          error?.response?.data?.message ||
          error?.message ||
          (currentLanguage === 'en'
            ? 'Failed to submit review.'
            : 'समीक्षा सबमिट करने में विफल।'),
        variant: 'destructive',
      });
    }
  };

  const renderStars = (rating: number, interactive = false, onSelect?: (r: number) => void) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={!interactive}
            onClick={() => onSelect?.(star)}
            className={`${interactive ? 'cursor-pointer hover:scale-110 transition-transform' : ''}`}
          >
            <Star
              className={`h-5 w-5 ${star <= rating ? 'fill-[#d89b2b] text-[#d89b2b]' : 'text-[#b8ad97]'}`}
            />
          </button>
        ))}
      </div>
    );
  };

  return (
    <Layout>
      <div className="min-h-screen bg-[linear-gradient(rgba(251,247,235,0.97),rgba(251,247,235,0.97)),linear-gradient(rgba(138,79,42,0.07)_1px,transparent_1px),linear-gradient(90deg,rgba(138,79,42,0.07)_1px,transparent_1px)] bg-[size:auto,24px_24px,24px_24px]">
        <div className="container mx-auto min-w-0 px-3 py-5 sm:px-4 sm:py-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="rounded-lg border border-[#d7c7a8] bg-[#fffaf0] p-2 text-[#315f3b] transition hover:bg-[#f6eddc]"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-[#2f3a2f]">
              {currentLanguage === 'en' ? 'Reviews & Ratings' : 'समीक्षाएं और रेटिंग'}
            </h1>
            <p className="text-[#6f6552]">
              {isFarmer 
                ? (currentLanguage === 'en' ? 'See what buyers say about you' : 'देखें खरीदार आपके बारे में क्या कहते हैं')
                : (currentLanguage === 'en' ? 'Your reviews for farmers' : 'किसानों के लिए आपकी समीक्षाएं')}
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="rounded-2xl border border-[#d7c7a8] bg-[#fffaf0] p-4 text-center shadow-[0_16px_40px_rgba(95,70,40,0.08)]">
            <p className="text-3xl font-bold text-[#315f3b]">{userReviews.length}</p>
            <p className="text-sm text-[#6f6552]">
              {currentLanguage === 'en' ? 'Total Reviews' : 'कुल समीक्षाएं'}
            </p>
          </div>
          <div className="rounded-2xl border border-[#d7c7a8] bg-[#fffaf0] p-4 text-center shadow-[0_16px_40px_rgba(95,70,40,0.08)]">
            <div className="flex items-center justify-center gap-1">
              <p className="text-3xl font-bold text-[#d89b2b]">
                {userReviews.length > 0 
                  ? (userReviews.reduce((sum, r) => sum + r.rating, 0) / userReviews.length).toFixed(1)
                  : '0'}
              </p>
              <Star className="h-6 w-6 fill-[#d89b2b] text-[#d89b2b]" />
            </div>
            <p className="text-sm text-[#6f6552]">
              {currentLanguage === 'en' ? 'Avg Rating' : 'औसत रेटिंग'}
            </p>
          </div>
          <div className="rounded-2xl border border-[#d7c7a8] bg-[#fffaf0] p-4 text-center shadow-[0_16px_40px_rgba(95,70,40,0.08)]">
            <p className="text-3xl font-bold text-[#315f3b]">
              {userReviews.filter(r => r.rating >= 4).length}
            </p>
            <p className="text-sm text-[#6f6552]">
              {currentLanguage === 'en' ? 'Positive' : 'सकारात्मक'}
            </p>
          </div>
        </div>

        <Tabs defaultValue="reviews" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 border border-[#d7c7a8] bg-[#f4ead7] p-1">
            <TabsTrigger value="reviews">
              {currentLanguage === 'en' ? 'All Reviews' : 'सभी समीक्षाएं'}
            </TabsTrigger>
            {!isFarmer && (
              <TabsTrigger value="write">
                {currentLanguage === 'en' ? 'Write Review' : 'समीक्षा लिखें'}
              </TabsTrigger>
            )}
            {isFarmer && (
              <TabsTrigger value="pending">
                {currentLanguage === 'en' ? 'Pending Reply' : 'लंबित जवाब'}
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="reviews" className="space-y-4">
            {isLoading ? (
              <div className="text-center py-12">
                <Star className="mx-auto mb-4 h-12 w-12 text-[#b8ad97]" />
                <p className="text-[#6f6552]">
                  {currentLanguage === 'en'
                    ? 'Loading reviews...'
                    : 'समीक्षाएं लोड हो रही हैं...'}
                </p>
              </div>
            ) : userReviews.map((review: any) => (
              <div
                key={reviewRowId(review)}
                className="rounded-2xl border border-[#d7c7a8] bg-[#fffaf0] p-4 shadow-[0_16px_40px_rgba(95,70,40,0.08)]"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[#d7c7a8] bg-[#eef5ee]">
                    <span className="text-lg font-bold text-[#315f3b]">
                      {(review.reviewer?.name || review.reviewerName || '?').charAt(0)}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-semibold text-[#2f3a2f]">
                          {review.reviewer?.name || review.reviewerName}
                        </p>
                        <p className="text-sm text-[#6f6552]">
                          {review.product?.name || review.productName}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="flex flex-col items-end gap-1">
                          {renderStars(review.rating)}
                          {!isFarmer && review.isApproved === false && (
                            <Badge variant="outline" className="border-[#ead5a6] text-[#9a6b12]">
                              {currentLanguage === 'en' ? 'Pending moderation' : 'मॉडरेशन लंबित'}
                            </Badge>
                          )}
                        </div>
                        <p className="mt-1 text-xs text-[#6f6552]">
                          {new Date(review.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <p className="text-[#2f3a2f]">{review.comment}</p>

                    {/* Reply Section */}
                    {review.reply && (
                      <div className="mt-4 border-l-2 border-[#c8d8cb] pl-4">
                        <p className="mb-1 text-sm font-medium text-[#315f3b]">
                          {currentLanguage === 'en' ? 'Farmer Reply:' : 'किसान का जवाब:'}
                        </p>
                        <p className="text-sm text-[#6f6552]">{review.reply}</p>
                        <p className="mt-1 text-xs text-[#6f6552]">
                          {review.replyDate
                            ? new Date(review.replyDate).toLocaleDateString()
                            : null}
                        </p>
                      </div>
                    )}

                    {/* Reply Input (for farmers) */}
                    {isFarmer && !review.reply && (
                      <div className="mt-4">
                        {showReplyInput[reviewRowId(review)] ? (
                          <div className="space-y-2">
                            <Textarea
                              className="border-[#d7c7a8] bg-[#fffdf7] text-[#2f3a2f] placeholder:text-[#8b816f] focus-visible:ring-[#315f3b]"
                              placeholder={currentLanguage === 'en' ? 'Write your reply...' : 'अपना जवाब लिखें...'}
                              value={replyText[reviewRowId(review)] || ''}
                              onChange={(e) => setReplyText(prev => ({ ...prev, [reviewRowId(review)]: e.target.value }))}
                              rows={2}
                            />
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                className="border border-[#b68222] bg-[#d89b2b] text-[#2f2416] hover:bg-[#c88d22]"
                                onClick={() => handleReply(reviewRowId(review))}
                              >
                                <Send className="w-4 h-4 mr-1" />
                                {currentLanguage === 'en' ? 'Send' : 'भेजें'}
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                className="border-[#d7c7a8] bg-[#fffdf7] text-[#315f3b] hover:bg-[#f3ebdd] hover:text-[#315f3b]"
                                onClick={() => setShowReplyInput(prev => ({ ...prev, [reviewRowId(review)]: false }))}
                              >
                                {currentLanguage === 'en' ? 'Cancel' : 'रद्द'}
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-[#d7c7a8] bg-[#fffdf7] text-[#315f3b] hover:bg-[#f3ebdd] hover:text-[#315f3b]"
                            onClick={() => setShowReplyInput(prev => ({ ...prev, [reviewRowId(review)]: true }))}
                          >
                            <MessageCircle className="w-4 h-4 mr-1" />
                            {currentLanguage === 'en' ? 'Reply' : 'जवाब दें'}
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {userReviews.length === 0 && (
              <div className="text-center py-12">
                <Star className="mx-auto mb-4 h-12 w-12 text-[#b8ad97]" />
                <h3 className="mb-2 text-lg font-medium text-[#2f3a2f]">
                  {currentLanguage === 'en' ? 'No reviews yet' : 'अभी तक कोई समीक्षा नहीं'}
                </h3>
              </div>
            )}
          </TabsContent>

          {!isFarmer && (
            <TabsContent value="write" className="space-y-6">
              <div className="rounded-2xl border border-[#d7c7a8] bg-[#fffaf0] p-6 shadow-[0_16px_40px_rgba(95,70,40,0.08)]">
                <h3 className="mb-4 font-semibold text-[#2f3a2f]">
                  {currentLanguage === 'en' ? 'Write a Review' : 'समीक्षा लिखें'}
                </h3>

                {pendingReviewOrders.length > 0 ? (
                  <div className="space-y-4">
                    <div>
                      <p className="mb-2 text-sm text-[#6f6552]">
                        {currentLanguage === 'en' ? 'Select an order to review:' : 'समीक्षा के लिए ऑर्डर चुनें:'}
                      </p>
                      <div className="space-y-2">
                        {pendingReviewOrders.map((order) => (
                          <button
                            key={order.id}
                            type="button"
                            onClick={() => setSelectedOrder(order.id)}
                            className={`flex w-full items-center gap-3 rounded-xl border-2 p-3 text-left transition-all ${
                              selectedOrder === order.id
                                ? 'border-[#315f3b] bg-[#eef5ee]'
                                : 'border-[#d7c7a8] bg-[#fffdf7] hover:border-[#315f3b]/55'
                            }`}
                          >
                            <img
                              src={order.productImage}
                              alt={order.productName}
                              className="h-12 w-12 rounded-lg border border-[#e2d4b7] object-cover"
                            />
                            <div className="text-left">
                              <p className="font-medium text-[#2f3a2f]">{order.productName}</p>
                              <p className="text-sm text-[#6f6552]">
                                {currentLanguage === 'en' ? 'from' : 'से'} {order.farmerName}
                              </p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="mb-2 text-sm text-[#6f6552]">
                        {currentLanguage === 'en' ? 'Your Rating:' : 'आपकी रेटिंग:'}
                      </p>
                      {renderStars(newReviewRating, true, setNewReviewRating)}
                    </div>

                    <div>
                      <p className="mb-2 text-sm text-[#6f6552]">
                        {currentLanguage === 'en' ? 'Your Review:' : 'आपकी समीक्षा:'}
                      </p>
                      <Textarea
                        className="border-[#d7c7a8] bg-[#fffdf7] text-[#2f3a2f] placeholder:text-[#8b816f] focus-visible:ring-[#315f3b]"
                        placeholder={currentLanguage === 'en' ? 'Share your experience...' : 'अपना अनुभव साझा करें...'}
                        value={newReviewComment}
                        onChange={(e) => setNewReviewComment(e.target.value)}
                        rows={4}
                      />
                    </div>

                    <Button onClick={handleSubmitReview} className="border border-[#b68222] bg-[#d89b2b] text-[#2f2416] hover:bg-[#c88d22]">
                      <ThumbsUp className="w-4 h-4 mr-2" />
                      {currentLanguage === 'en' ? 'Submit Review' : 'समीक्षा सबमिट करें'}
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Star className="mx-auto mb-4 h-12 w-12 text-[#b8ad97]" />
                    <p className="text-[#6f6552]">
                      {currentLanguage === 'en' 
                        ? 'No delivered orders pending review.' 
                        : 'समीक्षा के लिए कोई डिलीवर ऑर्डर नहीं है।'}
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>
          )}

          {isFarmer && (
            <TabsContent value="pending" className="space-y-4">
              {userReviews.filter(r => !r.reply).map((review) => (
                <div
                  key={reviewRowId(review)}
                  className="rounded-2xl border border-[#ead5a6] border-l-4 bg-[#fff7e8] p-4 shadow-[0_14px_34px_rgba(95,70,40,0.07)]"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-semibold text-[#2f3a2f]">{review.reviewerName}</p>
                        {renderStars(review.rating)}
                      </div>
                      <p className="mb-2 text-sm text-[#6f6552]">{review.productName}</p>
                      <p className="text-[#2f3a2f]">{review.comment}</p>
                      <div className="mt-3">
                        <Textarea
                          className="border-[#d7c7a8] bg-[#fffdf7] text-[#2f3a2f] placeholder:text-[#8b816f] focus-visible:ring-[#315f3b]"
                          placeholder={currentLanguage === 'en' ? 'Write your reply...' : 'अपना जवाब लिखें...'}
                          value={replyText[reviewRowId(review)] || ''}
                          onChange={(e) => setReplyText(prev => ({ ...prev, [reviewRowId(review)]: e.target.value }))}
                          rows={2}
                        />
                        <Button
                          size="sm"
                          className="mt-2 border border-[#b68222] bg-[#d89b2b] text-[#2f2416] hover:bg-[#c88d22]"
                          onClick={() => handleReply(reviewRowId(review))}
                        >
                          <Send className="w-4 h-4 mr-1" />
                          {currentLanguage === 'en' ? 'Reply' : 'जवाब दें'}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {userReviews.filter(r => !r.reply).length === 0 && (
                <div className="text-center py-12">
                  <ThumbsUp className="mx-auto mb-4 h-12 w-12 text-[#315f3b]" />
                  <h3 className="mb-2 text-lg font-medium text-[#2f3a2f]">
                    {currentLanguage === 'en' ? 'All caught up!' : 'सब हो गया!'}
                  </h3>
                  <p className="text-[#6f6552]">
                    {currentLanguage === 'en' ? 'You have replied to all reviews.' : 'आपने सभी समीक्षाओं का जवाब दे दिया है।'}
                  </p>
                </div>
              )}
            </TabsContent>
          )}
        </Tabs>
      </div>
      </div>
    </Layout>
  );
};

export default Reviews;
