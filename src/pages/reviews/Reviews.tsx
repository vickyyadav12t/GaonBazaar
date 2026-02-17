import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Star, Send, MessageCircle, ThumbsUp } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAppSelector } from '@/hooks/useRedux';
import { mockReviews, mockOrders } from '@/data/mockData';
import { useToast } from '@/hooks/use-toast';

const Reviews = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { currentLanguage } = useAppSelector((state) => state.language);
  const { user } = useAppSelector((state) => state.auth);
  
  const [reviews, setReviews] = useState(mockReviews);
  const [replyText, setReplyText] = useState<Record<string, string>>({});
  const [showReplyInput, setShowReplyInput] = useState<Record<string, boolean>>({});
  const [newReviewRating, setNewReviewRating] = useState(0);
  const [newReviewComment, setNewReviewComment] = useState('');
  const [selectedOrder, setSelectedOrder] = useState('');

  // Determine if user is farmer or buyer based on route or user role
  const isFarmer = user?.role === 'farmer';
  const userReviews = isFarmer 
    ? reviews.filter(r => r.targetId === 'farmer-1')
    : reviews.filter(r => r.reviewerId === 'buyer-1');

  const pendingReviewOrders = mockOrders.filter(o => 
    o.buyerId === 'buyer-1' && 
    o.status === 'delivered' && 
    !reviews.find(r => r.orderId === o.id)
  );

  const handleReply = (reviewId: string) => {
    const reply = replyText[reviewId];
    if (!reply?.trim()) return;

    setReviews(prev => prev.map(r => 
      r.id === reviewId 
        ? { ...r, reply, replyDate: new Date().toISOString().split('T')[0] }
        : r
    ));
    setReplyText(prev => ({ ...prev, [reviewId]: '' }));
    setShowReplyInput(prev => ({ ...prev, [reviewId]: false }));
    toast({
      title: currentLanguage === 'en' ? 'Reply Posted' : 'जवाब पोस्ट किया गया',
    });
  };

  const handleSubmitReview = () => {
    if (!selectedOrder || newReviewRating === 0 || !newReviewComment.trim()) {
      toast({
        title: currentLanguage === 'en' ? 'Please fill all fields' : 'कृपया सभी फ़ील्ड भरें',
        variant: 'destructive',
      });
      return;
    }

    const order = mockOrders.find(o => o.id === selectedOrder);
    if (!order) return;

    const newReview = {
      id: `review-${Date.now()}`,
      orderId: selectedOrder,
      productId: order.productId,
      productName: order.productName,
      reviewerId: 'buyer-1',
      reviewerName: 'Amit Sharma',
      reviewerRole: 'buyer' as const,
      targetId: order.farmerId,
      targetName: order.farmerName,
      rating: newReviewRating,
      comment: newReviewComment,
      createdAt: new Date().toISOString().split('T')[0],
      isApproved: true,
    };

    setReviews(prev => [newReview, ...prev]);
    setNewReviewRating(0);
    setNewReviewComment('');
    setSelectedOrder('');
    toast({
      title: currentLanguage === 'en' ? 'Review Submitted!' : 'समीक्षा सबमिट!',
      description: currentLanguage === 'en' ? 'Thank you for your feedback.' : 'आपकी प्रतिक्रिया के लिए धन्यवाद।',
    });
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
              className={`w-5 h-5 ${star <= rating ? 'text-warning fill-warning' : 'text-muted-foreground'}`}
            />
          </button>
        ))}
      </div>
    );
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-muted rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold">
              {currentLanguage === 'en' ? 'Reviews & Ratings' : 'समीक्षाएं और रेटिंग'}
            </h1>
            <p className="text-muted-foreground">
              {isFarmer 
                ? (currentLanguage === 'en' ? 'See what buyers say about you' : 'देखें खरीदार आपके बारे में क्या कहते हैं')
                : (currentLanguage === 'en' ? 'Your reviews for farmers' : 'किसानों के लिए आपकी समीक्षाएं')}
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="card-elevated p-4 text-center">
            <p className="text-3xl font-bold text-primary">{userReviews.length}</p>
            <p className="text-sm text-muted-foreground">
              {currentLanguage === 'en' ? 'Total Reviews' : 'कुल समीक्षाएं'}
            </p>
          </div>
          <div className="card-elevated p-4 text-center">
            <div className="flex items-center justify-center gap-1">
              <p className="text-3xl font-bold text-warning">
                {userReviews.length > 0 
                  ? (userReviews.reduce((sum, r) => sum + r.rating, 0) / userReviews.length).toFixed(1)
                  : '0'}
              </p>
              <Star className="w-6 h-6 text-warning fill-warning" />
            </div>
            <p className="text-sm text-muted-foreground">
              {currentLanguage === 'en' ? 'Avg Rating' : 'औसत रेटिंग'}
            </p>
          </div>
          <div className="card-elevated p-4 text-center">
            <p className="text-3xl font-bold text-success">
              {userReviews.filter(r => r.rating >= 4).length}
            </p>
            <p className="text-sm text-muted-foreground">
              {currentLanguage === 'en' ? 'Positive' : 'सकारात्मक'}
            </p>
          </div>
        </div>

        <Tabs defaultValue="reviews" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
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
            {userReviews.map((review) => (
              <div key={review.id} className="card-elevated p-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                    <span className="text-lg font-bold text-primary">
                      {review.reviewerName.charAt(0)}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-semibold">{review.reviewerName}</p>
                        <p className="text-sm text-muted-foreground">{review.productName}</p>
                      </div>
                      <div className="text-right">
                        {renderStars(review.rating)}
                        <p className="text-xs text-muted-foreground mt-1">{review.createdAt}</p>
                      </div>
                    </div>
                    <p className="text-foreground">{review.comment}</p>

                    {/* Reply Section */}
                    {review.reply && (
                      <div className="mt-4 pl-4 border-l-2 border-primary/30">
                        <p className="text-sm font-medium text-primary mb-1">
                          {currentLanguage === 'en' ? 'Farmer Reply:' : 'किसान का जवाब:'}
                        </p>
                        <p className="text-sm text-muted-foreground">{review.reply}</p>
                        <p className="text-xs text-muted-foreground mt-1">{review.replyDate}</p>
                      </div>
                    )}

                    {/* Reply Input (for farmers) */}
                    {isFarmer && !review.reply && (
                      <div className="mt-4">
                        {showReplyInput[review.id] ? (
                          <div className="space-y-2">
                            <Textarea
                              placeholder={currentLanguage === 'en' ? 'Write your reply...' : 'अपना जवाब लिखें...'}
                              value={replyText[review.id] || ''}
                              onChange={(e) => setReplyText(prev => ({ ...prev, [review.id]: e.target.value }))}
                              rows={2}
                            />
                            <div className="flex gap-2">
                              <Button size="sm" onClick={() => handleReply(review.id)}>
                                <Send className="w-4 h-4 mr-1" />
                                {currentLanguage === 'en' ? 'Send' : 'भेजें'}
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => setShowReplyInput(prev => ({ ...prev, [review.id]: false }))}
                              >
                                {currentLanguage === 'en' ? 'Cancel' : 'रद्द'}
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setShowReplyInput(prev => ({ ...prev, [review.id]: true }))}
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
                <Star className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">
                  {currentLanguage === 'en' ? 'No reviews yet' : 'अभी तक कोई समीक्षा नहीं'}
                </h3>
              </div>
            )}
          </TabsContent>

          {!isFarmer && (
            <TabsContent value="write" className="space-y-6">
              <div className="card-elevated p-6">
                <h3 className="font-semibold mb-4">
                  {currentLanguage === 'en' ? 'Write a Review' : 'समीक्षा लिखें'}
                </h3>

                {pendingReviewOrders.length > 0 ? (
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {currentLanguage === 'en' ? 'Select an order to review:' : 'समीक्षा के लिए ऑर्डर चुनें:'}
                      </p>
                      <div className="space-y-2">
                        {pendingReviewOrders.map((order) => (
                          <button
                            key={order.id}
                            onClick={() => setSelectedOrder(order.id)}
                            className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${selectedOrder === order.id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}
                          >
                            <img
                              src={order.productImage}
                              alt={order.productName}
                              className="w-12 h-12 rounded-lg object-cover"
                            />
                            <div className="text-left">
                              <p className="font-medium">{order.productName}</p>
                              <p className="text-sm text-muted-foreground">
                                {currentLanguage === 'en' ? 'from' : 'से'} {order.farmerName}
                              </p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {currentLanguage === 'en' ? 'Your Rating:' : 'आपकी रेटिंग:'}
                      </p>
                      {renderStars(newReviewRating, true, setNewReviewRating)}
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {currentLanguage === 'en' ? 'Your Review:' : 'आपकी समीक्षा:'}
                      </p>
                      <Textarea
                        placeholder={currentLanguage === 'en' ? 'Share your experience...' : 'अपना अनुभव साझा करें...'}
                        value={newReviewComment}
                        onChange={(e) => setNewReviewComment(e.target.value)}
                        rows={4}
                      />
                    </div>

                    <Button onClick={handleSubmitReview} className="btn-primary-gradient">
                      <ThumbsUp className="w-4 h-4 mr-2" />
                      {currentLanguage === 'en' ? 'Submit Review' : 'समीक्षा सबमिट करें'}
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Star className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
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
                <div key={review.id} className="card-elevated p-4 border-l-4 border-warning">
                  <div className="flex items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-semibold">{review.reviewerName}</p>
                        {renderStars(review.rating)}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{review.productName}</p>
                      <p className="text-foreground">{review.comment}</p>
                      <div className="mt-3">
                        <Textarea
                          placeholder={currentLanguage === 'en' ? 'Write your reply...' : 'अपना जवाब लिखें...'}
                          value={replyText[review.id] || ''}
                          onChange={(e) => setReplyText(prev => ({ ...prev, [review.id]: e.target.value }))}
                          rows={2}
                        />
                        <Button size="sm" className="mt-2" onClick={() => handleReply(review.id)}>
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
                  <ThumbsUp className="w-12 h-12 text-success mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">
                    {currentLanguage === 'en' ? 'All caught up!' : 'सब हो गया!'}
                  </h3>
                  <p className="text-muted-foreground">
                    {currentLanguage === 'en' ? 'You have replied to all reviews.' : 'आपने सभी समीक्षाओं का जवाब दे दिया है।'}
                  </p>
                </div>
              )}
            </TabsContent>
          )}
        </Tabs>
      </div>
    </Layout>
  );
};

export default Reviews;
