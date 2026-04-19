import { useState, useRef, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Send, Check, X, Info, Package, Scale, ImagePlus, Loader2 } from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAppDispatch, useAppSelector } from '@/hooks/useRedux';
import { ChatMessage, Chat, Product } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { apiService, getAuthToken } from '@/services/api';
import { addToCart, setNegotiatedPrice } from '@/store/slices/cartSlice';
import { resolveFarmerAvatarUrl } from '@/lib/farmerAvatarUrl';
import { FairDealHelperPanel } from '@/components/chat/FairDealHelperPanel';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { useCopilot } from '@/context/CopilotContext';
import { getSocketOrigin } from '@/lib/resolveApiBaseUrl';
import {
  LISTING_IMAGE_PLACEHOLDER,
  listingHeroImageUrl,
  listingHeroImageUrlFromList,
  sanitizeImageUrlList,
} from '@/lib/productImageUrl';

const NegotiationChat = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { currentLanguage } = useAppSelector((state) => state.language);
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();
  const isFarmer = user?.role === 'farmer';
  const isBuyer = user?.role === 'buyer';
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const productIdFromQuery = searchParams.get('product');
  const isNewChat = id === 'new' || productIdFromQuery !== null;

  const [chat, setChat] = useState<Chat | null>(null);
  const [product, setProduct] = useState<Product | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isOfferMode, setIsOfferMode] = useState(false);
  const [offerPrice, setOfferPrice] = useState('');
  const [imageUploading, setImageUploading] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [negotiationStatus, setNegotiationStatus] = useState<'ongoing' | 'accepted' | 'rejected' | 'completed'>('ongoing');
  const [currentOffer, setCurrentOffer] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [fairDealOpen, setFairDealOpen] = useState(false);
  const [isNarrowViewport, setIsNarrowViewport] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < 1024 : true
  );
  /** null = connecting; true = socket live; false = offline / reconnecting */
  const [realtimeOk, setRealtimeOk] = useState<boolean | null>(null);
  const syncPollMsRef = useRef(2000);
  /** Prevents re-adding the same accepted deal on every poll/socket update (and after user removes from cart). */
  const acceptedDealCartSyncKeyRef = useRef<string | null>(null);
  const { setCopilotContext } = useCopilot();

  const chatExcerpt = useMemo(() => {
    if (!messages.length) return '';
    const slice = messages.slice(-20);
    const lines = slice.map((m) => {
      const role =
        m.senderRole === 'farmer'
          ? 'Farmer'
          : m.senderRole === 'buyer'
            ? 'Buyer'
            : String(m.senderRole);
      let body = (m.content || '').trim();
      if (m.type === 'image') {
        body = '[Photo]';
      } else if (m.type !== 'text') {
        const o = m.offerPrice != null ? ` ₹${m.offerPrice}` : '';
        body = `[${m.type}]${o}${body ? ` ${body}` : ''}`.trim();
      }
      return `${role}: ${body}`;
    });
    let s = lines.join('\n');
    if (s.length > 2800) s = s.slice(-2800);
    return s;
  }, [messages]);

  useEffect(() => {
    const mql = window.matchMedia('(max-width: 1023px)');
    const onChange = () => setIsNarrowViewport(mql.matches);
    mql.addEventListener('change', onChange);
    onChange();
    return () => mql.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    const init = async () => {
      try {
        // Auth & role checks for new chat
        if (isNewChat) {
          if (!isAuthenticated || !user) {
            toast({
              title: 'Please Login',
              description: 'You need to login to start negotiation.',
              variant: 'destructive',
            });
            navigate('/login');
            return;
          }

          if (user.role !== 'buyer') {
            toast({
              title: 'Access Denied',
              description: 'Only buyers can negotiate prices.',
              variant: 'destructive',
            });
            navigate(-1);
            return;
          }
        }

        // Load product & chat
        if (isNewChat && productIdFromQuery) {
          const prodRes = await apiService.products.getById(productIdFromQuery);
          const backendProduct = prodRes.data?.product;
          if (!backendProduct) {
            throw new Error('Product not found');
          }

          const mappedProduct: Product = {
            id: backendProduct._id || backendProduct.id,
            farmerId: backendProduct.farmer?._id || backendProduct.farmer || '',
            farmerName: backendProduct.farmer?.name || 'Farmer',
            farmerAvatar: resolveFarmerAvatarUrl(backendProduct.farmer?.avatar),
            farmerRating: 4.8,
            farmerLocation: backendProduct.farmer?.location
              ? `${backendProduct.farmer.location.district}, ${backendProduct.farmer.location.state}`
              : '',
            name: backendProduct.name,
            nameHindi: backendProduct.nameHindi,
            category: backendProduct.category,
            description: backendProduct.description || '',
            images: sanitizeImageUrlList(backendProduct.images),
            price: backendProduct.price,
            unit: backendProduct.unit,
            minOrderQuantity: backendProduct.minOrderQuantity || 1,
            availableQuantity: backendProduct.availableQuantity,
            harvestDate: backendProduct.harvestDate || new Date().toISOString(),
            isOrganic: !!backendProduct.isOrganic,
            isNegotiable: !!backendProduct.isNegotiable,
            status: (backendProduct.status as Product['status']) || 'active',
            createdAt: backendProduct.createdAt || new Date().toISOString(),
            views: backendProduct.views || 0,
            inquiries: 0,
          };
          setProduct(mappedProduct);

          // Create or reuse chat for this product
          const chatRes = await apiService.chats.create({ productId: mappedProduct.id });
          const backendChat = chatRes.data?.chat as Chat;
          setChat(backendChat);
          setMessages(backendChat.messages || []);
          setNegotiationStatus(backendChat.negotiationStatus);
          setCurrentOffer(backendChat.currentOffer || null);
        } else if (id && id !== 'new') {
          const chatRes = await apiService.chats.getById(id);
          const backendChat = chatRes.data?.chat as Chat;
          if (!backendChat) {
            throw new Error('Chat not found');
          }
          setChat(backendChat);
          setMessages(backendChat.messages || []);
          setNegotiationStatus(backendChat.negotiationStatus);
          setCurrentOffer(backendChat.currentOffer || null);

          // Load product for header
          const prodRes = await apiService.products.getById(backendChat.productId);
          const backendProduct = prodRes.data?.product;
          if (backendProduct) {
            const mappedProduct: Product = {
              id: backendProduct._id || backendProduct.id,
              farmerId: backendProduct.farmer?._id || backendProduct.farmer || '',
              farmerName: backendProduct.farmer?.name || 'Farmer',
              farmerAvatar: resolveFarmerAvatarUrl(backendProduct.farmer?.avatar),
              farmerRating: 4.8,
              farmerLocation: backendProduct.farmer?.location
                ? `${backendProduct.farmer.location.district}, ${backendProduct.farmer.location.state}`
                : '',
              name: backendProduct.name,
              nameHindi: backendProduct.nameHindi,
              category: backendProduct.category,
              description: backendProduct.description || '',
              images: sanitizeImageUrlList(backendProduct.images),
              price: backendProduct.price,
              unit: backendProduct.unit,
              minOrderQuantity: backendProduct.minOrderQuantity || 1,
              availableQuantity: backendProduct.availableQuantity,
              harvestDate: backendProduct.harvestDate || new Date().toISOString(),
              isOrganic: !!backendProduct.isOrganic,
              isNegotiable: !!backendProduct.isNegotiable,
              status: (backendProduct.status as Product['status']) || 'active',
              createdAt: backendProduct.createdAt || new Date().toISOString(),
              views: backendProduct.views || 0,
              inquiries: 0,
            };
            setProduct(mappedProduct);
          }
        }
      } catch (error: any) {
        console.error('Failed to load chat', error);
        toast({
          title: 'Unable to open chat',
          description:
            error?.response?.data?.message ||
            error?.message ||
            'Please try again later.',
          variant: 'destructive',
        });
        navigate('/marketplace');
      } finally {
        setIsLoading(false);
      }
    };

    init();
  }, [id, isNewChat, productIdFromQuery, isAuthenticated, user, navigate, toast]);

  const insertFromFairDealHelper = (text: string, opts?: { append?: boolean }) => {
    if (opts?.append) {
      setNewMessage((prev) => {
        const p = prev.trim();
        return p ? `${p}\n${text}` : text;
      });
    } else {
      setNewMessage(text);
    }
    toast({
      title:
        currentLanguage === 'en' ? 'Message box updated' : 'मैसेज बॉक्स अपडेट',
    });
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Reset cart sync guard when negotiation opens a new round (so a re-accepted deal can sync again).
  useEffect(() => {
    if (negotiationStatus !== 'accepted') {
      acceptedDealCartSyncKeyRef.current = null;
    }
  }, [negotiationStatus]);

  // Buyer: add agreed line to cart once per accepted deal (chat + price). Covers farmer accepting on their device.
  // Buyer clicking Accept sets the same ref in handleAcceptOffer so we do not double-add.
  useEffect(() => {
    if (!isBuyer || !product?.id || !chat?.id) return;
    if (negotiationStatus !== 'accepted' || currentOffer == null) return;
    const key = `${chat.id}:${currentOffer}`;
    if (acceptedDealCartSyncKeyRef.current === key) return;
    acceptedDealCartSyncKeyRef.current = key;
    dispatch(
      addToCart({
        product,
        quantity: product.minOrderQuantity || 1,
        negotiatedPrice: currentOffer,
      })
    );
    dispatch(setNegotiatedPrice({ productId: product.id, negotiatedPrice: currentOffer }));
  }, [chat?.id, currentOffer, dispatch, isBuyer, negotiationStatus, product]);

  // Socket.IO + adaptive HTTP polling (backoff when errors; slower cadence when socket is up).
  useEffect(() => {
    if (!chat?.id || !isAuthenticated) return;

    const token = getAuthToken();
    if (!token) return;

    const socketBase = getSocketOrigin();

    const socket: Socket = io(socketBase, {
      auth: { token },
    });

    const handleChatUpdated = async (payload: { chatId?: string }) => {
      if (!payload?.chatId || payload.chatId !== chat.id) return;
      try {
        const res = await apiService.chats.getById(chat.id);
        const latest = res.data?.chat as Chat | undefined;
        if (!latest) return;
        setChat(latest);
        setMessages(latest.messages || []);
        setNegotiationStatus(latest.negotiationStatus);
        setCurrentOffer(latest.currentOffer || null);
      } catch {
        /* next event or poll */
      }
    };

    const onConnect = () => {
      setRealtimeOk(true);
      syncPollMsRef.current = 2000;
      socket.emit('chat:join', chat.id);
    };
    const onDisconnect = () => {
      setRealtimeOk(false);
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('connect_error', onDisconnect);
    socket.on('chat:updated', handleChatUpdated);

    return () => {
      socket.emit('chat:leave', chat.id);
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('connect_error', onDisconnect);
      socket.off('chat:updated', handleChatUpdated);
      socket.disconnect();
      setRealtimeOk(null);
    };
  }, [chat?.id, isAuthenticated]);

  useEffect(() => {
    if (!chat?.id || !isAuthenticated) return;

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;

    const mergeLatest = (latest: Chat) => {
      setChat((prev) => {
        if (!prev) return latest;
        const prevLen = prev.messages?.length || 0;
        const nextLen = latest.messages?.length || 0;
        if (
          prevLen !== nextLen ||
          prev.negotiationStatus !== latest.negotiationStatus ||
          prev.currentOffer !== latest.currentOffer
        ) {
          setMessages(latest.messages || []);
          setNegotiationStatus(latest.negotiationStatus);
          setCurrentOffer(latest.currentOffer || null);
          return latest;
        }
        return prev;
      });
    };

    const tick = async () => {
      if (cancelled) return;
      try {
        const res = await apiService.chats.getById(chat.id);
        const latest = res.data?.chat as Chat | undefined;
        if (latest) mergeLatest(latest);
        syncPollMsRef.current = 2000;
      } catch {
        syncPollMsRef.current = Math.min(syncPollMsRef.current * 2, 30000);
      }
      if (cancelled) return;
      const longPoll = realtimeOk === true;
      const nextMs = longPoll ? 45000 : syncPollMsRef.current;
      timer = setTimeout(tick, nextMs);
    };

    const initialDelay = realtimeOk === true ? 45000 : 2000;
    timer = setTimeout(tick, initialDelay);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [chat?.id, isAuthenticated, realtimeOk]);

  useEffect(() => {
    const status = chat?.negotiationStatus ?? negotiationStatus;
    const name = (product?.name || chat?.productName || '').trim();
    if (!name && !chatExcerpt) {
      setCopilotContext(null);
      return;
    }
    setCopilotContext({
      page: 'chat',
      chat: {
        productName: name || undefined,
        excerpt: chatExcerpt || undefined,
        negotiationStatus: status,
      },
      ...(product
        ? {
            product: {
              name: product.name,
              category: product.category,
              unit: product.unit,
              price: product.price,
              organic: product.isOrganic,
              negotiable: product.isNegotiable,
              description: product.description,
            },
          }
        : {}),
    });
    return () => setCopilotContext(null);
  }, [
    chat?.productName,
    chat?.negotiationStatus,
    negotiationStatus,
    product,
    chatExcerpt,
    setCopilotContext,
  ]);

  const handleSendPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !chat || !isFarmer) return;
    if (!file.type.startsWith('image/')) {
      toast({
        title: currentLanguage === 'en' ? 'Invalid file' : 'अमान्य फ़ाइल',
        description:
          currentLanguage === 'en' ? 'Please choose an image.' : 'कृपया एक छवि चुनें।',
        variant: 'destructive',
      });
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: currentLanguage === 'en' ? 'File too large' : 'फ़ाइल बहुत बड़ी',
        description:
          currentLanguage === 'en' ? 'Maximum size is 2MB.' : 'अधिकतम आकार 2MB है।',
        variant: 'destructive',
      });
      return;
    }
    try {
      setImageUploading(true);
      const up = await apiService.uploads.uploadImages([file]);
      const urls = (up.data?.urls || []) as string[];
      const url = urls[0];
      if (!url) throw new Error('No URL returned');
      const res = await apiService.chats.sendMessage(chat.id, {
        content: url,
        type: 'image',
      });
      const updated = res.data?.chat as Chat;
      if (updated) {
        setChat(updated);
        setMessages(updated.messages || []);
        setNegotiationStatus(updated.negotiationStatus);
        setCurrentOffer(updated.currentOffer || null);
      }
      toast({
        title: currentLanguage === 'en' ? 'Photo sent' : 'फोटो भेजा गया',
        description:
          currentLanguage === 'en'
            ? 'The buyer can see your product photo.'
            : 'खरीदार आपकी उत्पाद फोटो देख सकता है।',
      });
    } catch (error: any) {
      toast({
        title: currentLanguage === 'en' ? 'Upload failed' : 'अपलोड विफल',
        description:
          error?.response?.data?.message ||
          error?.message ||
          (currentLanguage === 'en' ? 'Could not send photo.' : 'फोटो नहीं भेजी जा सकी।'),
        variant: 'destructive',
      });
    } finally {
      setImageUploading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !chat) return;

    try {
      const res = await apiService.chats.sendMessage(chat.id, {
        content: newMessage,
        type: 'text',
      });
      const updated = res.data?.chat as Chat;
      if (updated) {
        setChat(updated);
        setMessages(updated.messages || []);
        setNegotiationStatus(updated.negotiationStatus);
        setCurrentOffer(updated.currentOffer || null);
      }
      setNewMessage('');
    } catch (error: any) {
      toast({
        title: 'Failed to send message',
        description:
          error?.response?.data?.message ||
          error?.message ||
          'Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleSendOffer = async () => {
    if (!chat) return;
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

    try {
      const res = await apiService.chats.sendMessage(chat.id, {
        content:
          currentLanguage === 'en'
            ? `I would like to offer ₹${price.toLocaleString()} per ${product?.unit || 'unit'}`
            : `मैं ₹${price.toLocaleString()} प्रति ${product?.unit || 'यूनिट'} की पेशकश करना चाहूंगा`,
        type: 'offer',
        offerPrice: price,
      });
      const updated = res.data?.chat as Chat;
      if (updated) {
        setChat(updated);
        setMessages(updated.messages || []);
        setNegotiationStatus(updated.negotiationStatus);
        setCurrentOffer(updated.currentOffer || null);
      }
      setIsOfferMode(false);
      setOfferPrice('');

      toast({
        title: currentLanguage === 'en' ? 'Offer Sent' : 'प्रस्ताव भेजा गया',
        description:
          currentLanguage === 'en'
            ? `Your offer of ₹${price.toLocaleString()} has been sent.`
            : `₹${price.toLocaleString()} का आपका प्रस्ताव भेजा गया है।`,
      });
    } catch (error: any) {
      toast({
        title: currentLanguage === 'en' ? 'Error' : 'त्रुटि',
        description:
          error?.response?.data?.message ||
          error?.message ||
          (currentLanguage === 'en'
            ? 'Failed to send offer.'
            : 'प्रस्ताव भेजने में विफल।'),
        variant: 'destructive',
      });
    }
  };

  const handleAcceptOffer = async () => {
    if (!currentOffer || !chat) return;
    
    try {
      const res = await apiService.chats.sendMessage(chat.id, {
        content:
          currentLanguage === 'en'
            ? `Deal accepted! ₹${currentOffer.toLocaleString()} per ${product?.unit}`
            : `सौदा मंजूर! ₹${currentOffer.toLocaleString()} प्रति ${product?.unit}`,
        type: 'deal_accepted',
        offerPrice: currentOffer,
      });
      const updated = res.data?.chat as Chat;
      if (updated) {
        setChat(updated);
        setMessages(updated.messages || []);
        setNegotiationStatus(updated.negotiationStatus);
      }
      if (isBuyer && product?.id && chat?.id) {
        acceptedDealCartSyncKeyRef.current = `${chat.id}:${currentOffer}`;
        dispatch(
          addToCart({
            product,
            quantity: product.minOrderQuantity || 1,
            negotiatedPrice: currentOffer,
          })
        );
        dispatch(setNegotiatedPrice({ productId: product.id, negotiatedPrice: currentOffer }));
      }
      toast({
        title: currentLanguage === 'en' ? 'Deal Accepted!' : 'सौदा स्वीकृत!',
        description:
          currentLanguage === 'en'
            ? 'You can now proceed to checkout.'
            : 'अब आप चेकआउट कर सकते हैं।',
      });
    } catch (error: any) {
      toast({
        title: currentLanguage === 'en' ? 'Error' : 'त्रुटि',
        description:
          error?.response?.data?.message ||
          error?.message ||
          (currentLanguage === 'en'
            ? 'Failed to accept deal.'
            : 'सौदा स्वीकार करने में विफल।'),
        variant: 'destructive',
      });
    }
  };

  const handleDeclineOffer = async () => {
    if (!currentOffer || !chat) return;

    try {
      const res = await apiService.chats.sendMessage(chat.id, {
        content:
          currentLanguage === 'en'
            ? `Offer declined for ₹${currentOffer.toLocaleString()} per ${product?.unit}`
            : `₹${currentOffer.toLocaleString()} प्रति ${product?.unit} का प्रस्ताव अस्वीकृत`,
        type: 'deal_rejected',
        offerPrice: currentOffer,
      });
      const updated = res.data?.chat as Chat;
      if (updated) {
        setChat(updated);
        setMessages(updated.messages || []);
        setNegotiationStatus(updated.negotiationStatus);
        setCurrentOffer(updated.currentOffer || null);
      }
      toast({
        title: currentLanguage === 'en' ? 'Offer Declined' : 'प्रस्ताव अस्वीकृत',
        description:
          currentLanguage === 'en'
            ? 'The buyer has been notified.'
            : 'खरीदार को सूचित कर दिया गया है।',
      });
    } catch (error: any) {
      toast({
        title: currentLanguage === 'en' ? 'Error' : 'त्रुटि',
        description:
          error?.response?.data?.message ||
          error?.message ||
          (currentLanguage === 'en'
            ? 'Failed to decline offer.'
            : 'प्रस्ताव अस्वीकार करने में विफल।'),
        variant: 'destructive',
      });
    }
  };

  const getMessageBubble = (msg: ChatMessage) => {
    const isOwn = msg.senderRole === (user?.role || 'buyer');
    const ownBubbleClass = isFarmer
      ? 'bg-secondary text-secondary-foreground rounded-br-md'
      : 'bg-primary text-primary-foreground rounded-br-md';
    
    if (msg.type === 'offer' || msg.type === 'counter_offer') {
      return (
        <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-4`}>
          <div className={`max-w-[85%] rounded-2xl p-4 ${isOwn ? 'bg-primary text-primary-foreground' : 'bg-accent/20 border border-accent'}`}>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-4 h-4 inline-flex items-center justify-center font-semibold">₹</span>
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

    if (msg.type === 'image') {
      const imgSrc = listingHeroImageUrl(msg.content.trim(), 720);
      return (
        <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-4`}>
          <div
            className={`max-w-[min(100%,20rem)] rounded-2xl overflow-hidden border shadow-sm ${
              isOwn ? 'border-secondary/40' : 'border-border'
            }`}
          >
            {!isOwn && (
              <p className="text-xs font-medium px-3 pt-2 bg-muted/50 text-muted-foreground">
                {msg.senderName}
              </p>
            )}
            <a href={imgSrc} target="_blank" rel="noopener noreferrer" className="block">
              <img
                src={imgSrc}
                alt={currentLanguage === 'en' ? 'Product photo from farmer' : 'किसान की उत्पाद फोटो'}
                className="w-full max-h-72 object-cover bg-muted"
                loading="lazy"
                onError={(ev) => {
                  const el = ev.currentTarget;
                  el.onerror = null;
                  el.src = LISTING_IMAGE_PLACEHOLDER;
                }}
              />
            </a>
            <p className="text-xs opacity-70 px-3 py-2 bg-muted/30 text-right">
              {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-4`}>
        <div className={`max-w-[75%] rounded-2xl px-4 py-3 ${isOwn ? ownBubbleClass : 'bg-muted rounded-bl-md'}`}>
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

  if (isLoading || !chat || !product) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold">
            {isLoading ? 'Loading chat...' : 'Chat not found'}
          </h1>
        </div>
      </Layout>
    );
  }

  /** Listing allows negotiation and chat is not blocked for new offers (backend resets to ongoing on new offer). */
  const canBuyerMakeOffer =
    isBuyer &&
    !!product.isNegotiable &&
    (negotiationStatus === 'ongoing' ||
      negotiationStatus === 'accepted' ||
      negotiationStatus === 'rejected' ||
      negotiationStatus === 'completed');

  const offerPriceLabel =
    negotiationStatus === 'ongoing'
      ? currentLanguage === 'en'
        ? 'Current offer:'
        : 'वर्तमान प्रस्ताव:'
      : negotiationStatus === 'accepted' || negotiationStatus === 'completed'
        ? currentLanguage === 'en'
          ? 'Last agreed:'
          : 'पिछला सौदा:'
        : negotiationStatus === 'rejected'
          ? currentLanguage === 'en'
            ? 'Previous offer:'
            : 'पिछला प्रस्ताव:'
          : currentLanguage === 'en'
            ? 'Offer:'
            : 'प्रस्ताव:';

  return (
    <Layout>
      <div className="h-[calc(100vh-140px)] flex flex-col min-h-0">
        {/* Chat Header */}
        <div className={`border-b border-border p-4 shrink-0 ${isFarmer ? 'bg-green-50/70 dark:bg-card' : 'bg-blue-50/70 dark:bg-card'}`}>
          <div className="container mx-auto flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="p-2 hover:bg-muted rounded-lg">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <img
              src={listingHeroImageUrlFromList(product?.images, 160)}
              alt={product?.name}
              className="w-12 h-12 rounded-lg object-cover"
              onError={(e) => {
                const el = e.currentTarget;
                el.onerror = null;
                el.src = LISTING_IMAGE_PLACEHOLDER;
              }}
            />
            <div className="flex-1 min-w-0">
              <h2 className="font-semibold truncate">{isFarmer ? chat.buyerName : chat.farmerName}</h2>
              <p className="text-sm text-muted-foreground truncate">{product?.name}</p>
            </div>
            {(isBuyer || isFarmer) && (
              <Button
                type="button"
                variant={fairDealOpen ? 'secondary' : 'outline'}
                size="sm"
                className="shrink-0 gap-1"
                onClick={() => setFairDealOpen((o) => !o)}
                title={
                  currentLanguage === 'en'
                    ? 'Fair deal helper (neutral wording, questions, terms)'
                    : 'सौदा सहायक'
                }
              >
                <Scale className="h-4 w-4" />
                <span className="hidden sm:inline">
                  {currentLanguage === 'en' ? 'Fair deal' : 'सौदा सहायक'}
                </span>
              </Button>
            )}
            <Badge
              className={
                negotiationStatus === 'accepted'
                  ? 'bg-success/10 text-success'
                  : negotiationStatus === 'rejected'
                    ? 'bg-destructive/10 text-destructive'
                    : negotiationStatus === 'completed'
                      ? 'bg-secondary/20 text-secondary-foreground'
                      : 'bg-warning/10 text-warning'
              }
            >
              {negotiationStatus === 'accepted'
                ? (currentLanguage === 'en' ? 'Deal Done' : 'सौदा हुआ')
                : negotiationStatus === 'rejected'
                  ? (currentLanguage === 'en' ? 'Rejected' : 'अस्वीकृत')
                  : negotiationStatus === 'completed'
                    ? (currentLanguage === 'en' ? 'Completed' : 'पूर्ण')
                    : (currentLanguage === 'en' ? 'Negotiating' : 'बातचीत जारी')}
            </Badge>
          </div>
        </div>

        <div className="flex flex-1 min-h-0 min-w-0">
          <div className="flex flex-1 flex-col min-h-0 min-w-0">
            {/* Product Info Bar */}
            <div className="bg-muted/50 border-b border-border p-3 shrink-0">
              <div className="container mx-auto flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Package className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">
                    {currentLanguage === 'en' ? 'Original Price:' : 'मूल कीमत:'}{' '}
                    <span className="font-semibold">₹{chat.originalPrice.toLocaleString()}/{product?.unit}</span>
                  </span>
                </div>
                {currentOffer != null && (
                  <div className="flex items-center gap-3 text-right">
                    <span className="text-sm">
                      {offerPriceLabel}{' '}
                      <span className="font-semibold text-primary">
                        ₹{currentOffer.toLocaleString()}/{product?.unit}
                      </span>
                    </span>
                  </div>
                )}
              </div>
              {canBuyerMakeOffer && negotiationStatus !== 'ongoing' && (
                <p className="text-xs text-muted-foreground mt-2 max-w-2xl">
                  {currentLanguage === 'en'
                    ? 'Buying again? Tap “New offer” to propose a fresh price — the farmer can accept or decline like before.'
                    : 'फिर से खरीदना है? “नया प्रस्ताव” से नई कीमत भेजें — किसान पहले जैसे मान या अस्वीकार कर सकते हैं।'}
                </p>
              )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 container mx-auto min-h-0">
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

            {/* Accept Offer Banner (farmer side) */}
            {isFarmer && currentOffer && negotiationStatus === 'ongoing' && (
              <div className="border-t border-border p-3 bg-accent/5 shrink-0">
                <div className="container mx-auto flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Info className="w-4 h-4 text-accent" />
                    <span className="text-sm">
                      {currentLanguage === 'en' ? 'Accept the offer to proceed?' : 'आगे बढ़ने के लिए प्रस्ताव स्वीकार करें?'}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="gap-1" onClick={handleDeclineOffer}>
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
            <div className="border-t border-border p-4 bg-card shrink-0">
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
                    <input
                      ref={imageInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      className="hidden"
                      onChange={(e) => void handleSendPhoto(e)}
                    />
                    <Input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder={currentLanguage === 'en' ? 'Type a message...' : 'संदेश लिखें...'}
                      onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    />
                    {isFarmer && (
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="shrink-0"
                        disabled={imageUploading}
                        title={
                          currentLanguage === 'en'
                            ? 'Send a product photo to the buyer'
                            : 'खरीदार को उत्पाद की फोटो भेजें'
                        }
                        onClick={() => imageInputRef.current?.click()}
                      >
                        {imageUploading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <ImagePlus className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                    {canBuyerMakeOffer && (
                      <Button
                        variant="outline"
                        onClick={() => setIsOfferMode(true)}
                        className="gap-2 shrink-0"
                      >
                        <span className="font-semibold">₹</span>
                        <span className="hidden sm:inline">
                          {negotiationStatus === 'ongoing'
                            ? currentLanguage === 'en'
                              ? 'Make offer'
                              : 'प्रस्ताव दें'
                            : currentLanguage === 'en'
                              ? 'New offer'
                              : 'नया प्रस्ताव'}
                        </span>
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

          {fairDealOpen && !isNarrowViewport && (
            <aside className="hidden lg:flex w-[min(100%,20rem)] shrink-0 border-l border-border flex-col min-h-0 bg-card">
              <FairDealHelperPanel
                chatId={chat.id}
                lang={currentLanguage === 'en' ? 'en' : 'hi'}
                onInsertIntoComposer={insertFromFairDealHelper}
                onClose={() => setFairDealOpen(false)}
                className="min-h-0 h-full"
              />
            </aside>
          )}
        </div>
      </div>

      <Sheet
        open={fairDealOpen && isNarrowViewport}
        onOpenChange={(open) => {
          if (isNarrowViewport) setFairDealOpen(open);
        }}
      >
        <SheetContent
          side="right"
          className="p-0 w-full sm:max-w-md flex flex-col h-[100dvh] max-h-[100dvh]"
        >
          <FairDealHelperPanel
            chatId={chat.id}
            lang={currentLanguage === 'en' ? 'en' : 'hi'}
            onInsertIntoComposer={insertFromFairDealHelper}
            onClose={() => setFairDealOpen(false)}
            className="min-h-0 flex-1"
          />
        </SheetContent>
      </Sheet>
    </Layout>
  );
};

export default NegotiationChat;
