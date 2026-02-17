import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Send, DollarSign, Check, X, Info, Package } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAppSelector } from '@/hooks/useRedux';
import { mockChats, mockProducts } from '@/data/mockData';
import { ChatMessage, Chat } from '@/types';
import { useToast } from '@/hooks/use-toast';

const NegotiationChat = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { currentLanguage } = useAppSelector((state) => state.language);
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Get product from query parameter if it's a new chat
  const productIdFromQuery = searchParams.get('product');
  const isNewChat = id === 'new' || productIdFromQuery !== null;
  
  // Find or create chat
  let chat: Chat;
  let product;
  
  if (isNewChat && productIdFromQuery) {
    // Create a new chat for the product
    product = mockProducts.find(p => p.id === productIdFromQuery);
    if (!product) {
      toast({
        title: 'Product not found',
        description: 'The product you are trying to negotiate for does not exist.',
        variant: 'destructive',
      });
      navigate('/marketplace');
      return null;
    }
    
    // Check if user is authenticated
    if (!isAuthenticated || !user) {
      toast({
        title: 'Please Login',
        description: 'You need to login to start negotiation.',
        variant: 'destructive',
      });
      navigate('/login');
      return null;
    }
    
    // Check if user is a buyer
    if (user.role !== 'buyer') {
      toast({
        title: 'Access Denied',
        description: 'Only buyers can negotiate prices.',
        variant: 'destructive',
      });
      navigate(-1);
      return null;
    }
    
    // Create a new chat object
    chat = {
      id: `chat-new-${Date.now()}`,
      productId: product.id,
      productName: product.name,
      productImage: product.images[0],
      farmerId: product.farmerId,
      farmerName: product.farmerName,
      buyerId: user.id,
      buyerName: user.name || 'Buyer',
      lastMessage: '',
      lastMessageTime: new Date().toISOString(),
      unreadCount: 0,
      negotiationStatus: 'ongoing',
      currentOffer: null,
      originalPrice: product.price,
      messages: [],
    };
  } else {
    // Find existing chat
    chat = mockChats.find(c => c.id === id) || mockChats[0];
    product = mockProducts.find(p => p.id === chat.productId);
  }
  
  if (!product) {
    toast({
      title: 'Product not found',
      description: 'The product for this chat does not exist.',
      variant: 'destructive',
    });
    navigate('/marketplace');
    return null;
  }

  const [messages, setMessages] = useState<ChatMessage[]>(chat.messages || []);
  const [newMessage, setNewMessage] = useState('');
  const [isOfferMode, setIsOfferMode] = useState(false);
  const [offerPrice, setOfferPrice] = useState('');
  const [negotiationStatus, setNegotiationStatus] = useState(chat.negotiationStatus || 'ongoing');
  const [currentOffer, setCurrentOffer] = useState<number | null>(chat.currentOffer || null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;

    const message: ChatMessage = {
      id: `msg-${Date.now()}`,
      senderId: user?.id || 'buyer-1',
      senderName: user?.name || 'Amit Sharma',
      senderRole: user?.role || 'buyer',
      receiverId: chat.farmerId,
      content: newMessage,
      type: 'text',
      timestamp: new Date().toISOString(),
      isRead: false,
    };

    setMessages(prev => [...prev, message]);
    setNewMessage('');

    // Simulate reply after 1.5 seconds
    setTimeout(() => {
      const reply: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        senderId: chat.farmerId,
        senderName: chat.farmerName,
        senderRole: 'farmer',
        receiverId: user?.id || 'buyer-1',
        content: currentLanguage === 'en' 
          ? 'Thank you for your message. Let me check and get back to you.' 
          : 'आपके संदेश के लिए धन्यवाद। मुझे जांचने दें और आपको वापस मिलता हूं।',
        type: 'text',
        timestamp: new Date().toISOString(),
        isRead: false,
      };
      setMessages(prev => [...prev, reply]);
    }, 1500);
  };

  const handleSendOffer = () => {
    const price = parseFloat(offerPrice);
    if (!price || price <= 0) {
      toast({
        title: currentLanguage === 'en' ? 'Invalid Price' : 'अमान्य कीमत',
        description: currentLanguage === 'en' 
          ? 'Please enter a valid price greater than 0.' 
          : 'कृपया 0 से अधिक एक वैध कीमत दर्ज करें।',
        variant: 'destructive',
      });
      return;
    }

    if (price > chat.originalPrice) {
      toast({
        title: currentLanguage === 'en' ? 'Invalid Offer' : 'अमान्य प्रस्ताव',
        description: currentLanguage === 'en' 
          ? `Your offer cannot be higher than the original price (₹${chat.originalPrice.toLocaleString()}).` 
          : `आपका प्रस्ताव मूल कीमत (₹${chat.originalPrice.toLocaleString()}) से अधिक नहीं हो सकता।`,
        variant: 'destructive',
      });
      return;
    }

    const message: ChatMessage = {
      id: `msg-${Date.now()}`,
      senderId: user?.id || 'buyer-1',
      senderName: user?.name || 'Amit Sharma',
      senderRole: user?.role || 'buyer',
      receiverId: chat.farmerId,
      content: currentLanguage === 'en' 
        ? `I would like to offer ₹${price.toLocaleString()} per ${product?.unit || 'unit'}` 
        : `मैं ₹${price.toLocaleString()} प्रति ${product?.unit || 'यूनिट'} की पेशकश करना चाहूंगा`,
      type: 'offer',
      offerPrice: price,
      timestamp: new Date().toISOString(),
      isRead: false,
    };

    setMessages(prev => [...prev, message]);
    setCurrentOffer(price);
    setIsOfferMode(false);
    setOfferPrice('');

    toast({
      title: currentLanguage === 'en' ? 'Offer Sent' : 'प्रस्ताव भेजा गया',
      description: currentLanguage === 'en' 
        ? `Your offer of ₹${price.toLocaleString()} has been sent to ${chat.farmerName}.` 
        : `₹${price.toLocaleString()} का आपका प्रस्ताव ${chat.farmerName} को भेजा गया है।`,
    });

    // Simulate counter offer
    setTimeout(() => {
      const counterPrice = Math.round((price + (product?.price || price)) / 2);
      const reply: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        senderId: chat.farmerId,
        senderName: chat.farmerName,
        senderRole: 'farmer',
        receiverId: user?.id || 'buyer-1',
        content: currentLanguage === 'en' 
          ? `I can offer ₹${counterPrice.toLocaleString()} per ${product?.unit}. This is my best price.` 
          : `मैं ₹${counterPrice.toLocaleString()} प्रति ${product?.unit} की पेशकश कर सकता हूं। यह मेरी सबसे अच्छी कीमत है।`,
        type: 'counter_offer',
        offerPrice: counterPrice,
        timestamp: new Date().toISOString(),
        isRead: false,
      };
      setMessages(prev => [...prev, reply]);
      setCurrentOffer(counterPrice);
    }, 2000);
  };

  const handleAcceptOffer = () => {
    if (!currentOffer) return;
    
    const message: ChatMessage = {
      id: `msg-${Date.now()}`,
      senderId: user?.id || 'buyer-1',
      senderName: user?.name || 'Amit Sharma',
      senderRole: user?.role || 'buyer',
      receiverId: chat.farmerId,
      content: currentLanguage === 'en' 
        ? `Deal accepted! ₹${currentOffer.toLocaleString()} per ${product?.unit}` 
        : `सौदा मंजूर! ₹${currentOffer.toLocaleString()} प्रति ${product?.unit}`,
      type: 'deal_accepted',
      offerPrice: currentOffer,
      timestamp: new Date().toISOString(),
      isRead: false,
    };

    setMessages(prev => [...prev, message]);
    setNegotiationStatus('accepted');
    toast({
      title: currentLanguage === 'en' ? 'Deal Accepted!' : 'सौदा स्वीकृत!',
      description: currentLanguage === 'en' 
        ? 'You can now proceed to checkout.' 
        : 'अब आप चेकआउट कर सकते हैं।',
    });
  };

  const getMessageBubble = (msg: ChatMessage) => {
    const isOwn = msg.senderRole === (user?.role || 'buyer');
    
    if (msg.type === 'offer' || msg.type === 'counter_offer') {
      return (
        <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-4`}>
          <div className={`max-w-[85%] rounded-2xl p-4 ${isOwn ? 'bg-primary text-primary-foreground' : 'bg-accent/20 border border-accent'}`}>
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-4 h-4" />
              <span className="text-sm font-medium">
                {msg.type === 'offer' 
                  ? (currentLanguage === 'en' ? 'Price Offer' : 'कीमत प्रस्ताव')
                  : (currentLanguage === 'en' ? 'Counter Offer' : 'प्रति प्रस्ताव')}
              </span>
            </div>
            <p className="text-2xl font-bold">₹{msg.offerPrice?.toLocaleString()}</p>
            <p className="text-sm opacity-80 mt-1">per {product?.unit}</p>
            <p className="text-sm mt-2">{msg.content}</p>
          </div>
        </div>
      );
    }

    if (msg.type === 'deal_accepted') {
      return (
        <div className="flex justify-center mb-4">
          <div className="bg-success/10 border border-success text-success rounded-2xl px-6 py-3 flex items-center gap-2">
            <Check className="w-5 h-5" />
            <span className="font-medium">{msg.content}</span>
          </div>
        </div>
      );
    }

    return (
      <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-4`}>
        <div className={`max-w-[75%] rounded-2xl px-4 py-3 ${isOwn ? 'bg-primary text-primary-foreground rounded-br-md' : 'bg-muted rounded-bl-md'}`}>
          {!isOwn && (
            <p className="text-xs font-medium mb-1 opacity-70">{msg.senderName}</p>
          )}
          <p className="text-sm">{msg.content}</p>
          <p className="text-xs opacity-60 mt-1 text-right">
            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      </div>
    );
  };

  return (
    <Layout>
      <div className="h-[calc(100vh-140px)] flex flex-col">
        {/* Chat Header */}
        <div className="border-b border-border p-4 bg-card">
          <div className="container mx-auto flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="p-2 hover:bg-muted rounded-lg">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <img
              src={product?.images[0]}
              alt={product?.name}
              className="w-12 h-12 rounded-lg object-cover"
            />
            <div className="flex-1 min-w-0">
              <h2 className="font-semibold truncate">{chat.farmerName}</h2>
              <p className="text-sm text-muted-foreground truncate">{product?.name}</p>
            </div>
            <Badge className={negotiationStatus === 'accepted' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}>
              {negotiationStatus === 'accepted' 
                ? (currentLanguage === 'en' ? 'Deal Done' : 'सौदा हुआ')
                : (currentLanguage === 'en' ? 'Negotiating' : 'बातचीत जारी')}
            </Badge>
          </div>
        </div>

        {/* Product Info Bar */}
        <div className="bg-muted/50 border-b border-border p-3">
          <div className="container mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Package className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm">
                {currentLanguage === 'en' ? 'Original Price:' : 'मूल कीमत:'}{' '}
                <span className="font-semibold">₹{chat.originalPrice.toLocaleString()}/{product?.unit}</span>
              </span>
            </div>
            {currentOffer && (
              <div className="flex items-center gap-3">
                <span className="text-sm">
                  {currentLanguage === 'en' ? 'Current Offer:' : 'वर्तमान प्रस्ताव:'}{' '}
                  <span className="font-semibold text-primary">₹{currentOffer.toLocaleString()}/{product?.unit}</span>
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 container mx-auto">
          {messages.length === 0 && isNewChat ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="bg-muted/50 rounded-2xl p-6 max-w-md">
                <Package className="w-12 h-12 text-primary mx-auto mb-4" />
                <h3 className="font-semibold text-lg mb-2">
                  {currentLanguage === 'en' ? 'Start Negotiation' : 'बातचीत शुरू करें'}
                </h3>
                <p className="text-muted-foreground text-sm mb-4">
                  {currentLanguage === 'en' 
                    ? `You're negotiating for ${product?.name} with ${chat.farmerName}. Send a message or make an offer to get started.`
                    : `आप ${product?.name} के लिए ${chat.farmerName} के साथ बातचीत कर रहे हैं। शुरू करने के लिए एक संदेश भेजें या प्रस्ताव दें।`}
                </p>
                <div className="bg-card rounded-lg p-4 mt-4">
                  <p className="text-xs text-muted-foreground mb-1">
                    {currentLanguage === 'en' ? 'Original Price' : 'मूल कीमत'}
                  </p>
                  <p className="text-2xl font-bold text-primary">
                    ₹{chat.originalPrice.toLocaleString()}/{product?.unit}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <>
              {messages.map((msg) => (
                <div key={msg.id}>{getMessageBubble(msg)}</div>
              ))}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Accept Offer Banner */}
        {currentOffer && negotiationStatus === 'ongoing' && (
          <div className="border-t border-border p-3 bg-accent/5">
            <div className="container mx-auto flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-accent" />
                <span className="text-sm">
                  {currentLanguage === 'en' ? 'Accept the offer to proceed?' : 'आगे बढ़ने के लिए प्रस्ताव स्वीकार करें?'}
                </span>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="gap-1">
                  <X className="w-4 h-4" />
                  {currentLanguage === 'en' ? 'Decline' : 'अस्वीकार'}
                </Button>
                <Button size="sm" onClick={handleAcceptOffer} className="gap-1 bg-success hover:bg-success/90">
                  <Check className="w-4 h-4" />
                  {currentLanguage === 'en' ? 'Accept' : 'स्वीकार'}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="border-t border-border p-4 bg-card">
          <div className="container mx-auto">
            {isOfferMode ? (
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
                  <Input
                    type="number"
                    value={offerPrice}
                    onChange={(e) => setOfferPrice(e.target.value)}
                    placeholder={currentLanguage === 'en' ? 'Enter your offer price' : 'अपनी प्रस्तावित कीमत दर्ज करें'}
                    className="pl-8"
                    autoFocus
                  />
                </div>
                <Button variant="outline" onClick={() => setIsOfferMode(false)}>
                  {currentLanguage === 'en' ? 'Cancel' : 'रद्द'}
                </Button>
                <Button onClick={handleSendOffer} className="btn-primary-gradient">
                  {currentLanguage === 'en' ? 'Send Offer' : 'प्रस्ताव भेजें'}
                </Button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder={currentLanguage === 'en' ? 'Type a message...' : 'संदेश लिखें...'}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                />
                {product?.isNegotiable && negotiationStatus === 'ongoing' && (
                  <Button
                    variant="outline"
                    onClick={() => setIsOfferMode(true)}
                    className="gap-2"
                  >
                    <DollarSign className="w-4 h-4" />
                    <span className="hidden sm:inline">{currentLanguage === 'en' ? 'Make Offer' : 'प्रस्ताव दें'}</span>
                  </Button>
                )}
                <Button onClick={handleSendMessage} className="btn-primary-gradient">
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default NegotiationChat;
