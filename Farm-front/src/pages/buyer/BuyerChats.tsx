import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, MessageCircle, Search } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAppSelector } from '@/hooks/useRedux';
import { useToast } from '@/hooks/use-toast';
import { Chat } from '@/types';
import { apiService } from '@/services/api';
import { FARM_CHAT_UNREAD_CHANGED_EVENT } from '@/constants';

const CHAT_PAGE = 30;

const BuyerChats = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { currentLanguage } = useAppSelector((state) => state.language);
  const [searchQuery, setSearchQuery] = useState('');
  const [chats, setChats] = useState<Chat[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const chatsRef = useRef<Chat[]>([]);
  chatsRef.current = chats;
  const chatTotalRef = useRef<number | null>(null);

  const loadChats = useCallback(
    async (opts?: { silent?: boolean; append?: boolean }) => {
      const append = opts?.append === true;
      if (append) setLoadingMore(true);
      else if (!opts?.silent) setIsLoading(true);
      try {
        const skip = append ? chatsRef.current.length : 0;
        const res = await apiService.chats.getAll({
          limit: CHAT_PAGE,
          skip,
          includeTotal: !append,
        });
        const backendChats = res.data?.chats || [];
        if (!append) {
          chatTotalRef.current =
            typeof res.data?.total === 'number' ? res.data.total : null;
        }
        const t = chatTotalRef.current;
        if (append) {
          const prevLen = chatsRef.current.length;
          setChats((prev) => [...prev, ...backendChats]);
          const mergedLen = prevLen + backendChats.length;
          setHasMore(
            backendChats.length === CHAT_PAGE &&
              (t == null || mergedLen < t)
          );
        } else {
          setChats(backendChats);
          setHasMore(
            backendChats.length === CHAT_PAGE &&
              (t == null || backendChats.length < (t ?? Infinity))
          );
        }
      } catch (error: any) {
        if (!opts?.silent) {
          toast({
            title: currentLanguage === 'en' ? 'Error' : 'त्रुटि',
            description:
              error?.response?.data?.message ||
              error?.message ||
              (currentLanguage === 'en'
                ? 'Failed to load chats.'
                : 'चैट लोड करने में विफल।'),
            variant: 'destructive',
          });
        }
      } finally {
        if (append) setLoadingMore(false);
        else if (!opts?.silent) setIsLoading(false);
      }
    },
    [currentLanguage, toast]
  );

  useEffect(() => {
    void loadChats();
  }, [loadChats]);

  useEffect(() => {
    const onRemoteMessage = () => {
      void loadChats({ silent: true });
    };
    window.addEventListener(FARM_CHAT_UNREAD_CHANGED_EVENT, onRemoteMessage);
    return () => window.removeEventListener(FARM_CHAT_UNREAD_CHANGED_EVENT, onRemoteMessage);
  }, [loadChats]);

  const filteredChats = useMemo(
    () =>
      chats.filter((c) => {
        const q = searchQuery.trim().toLowerCase();
        if (!q) return true;
        return (
          c.farmerName.toLowerCase().includes(q) ||
          c.productName.toLowerCase().includes(q) ||
          c.lastMessage.toLowerCase().includes(q)
        );
      }),
    [chats, searchQuery]
  );

  return (
    <Layout>
      <div className="container mx-auto min-w-0 px-3 py-5 sm:px-4 sm:py-6">
        <div className="flex items-center gap-4 mb-2">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-muted rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold">
            {currentLanguage === 'en' ? 'Buyer Chats' : 'खरीदार चैट'}
          </h1>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          {currentLanguage === 'en'
            ? 'Negotiation chats with farmers'
            : 'किसानों के साथ मोलभाव चैट'}
        </p>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={currentLanguage === 'en' ? 'Search chats...' : 'चैट खोजें...'}
            className="pl-9"
          />
        </div>

        <div className="space-y-3">
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">
              {currentLanguage === 'en' ? 'Loading chats...' : 'चैट लोड हो रही हैं...'}
            </div>
          ) : filteredChats.length === 0 ? (
            <div className="text-center py-12 card-elevated">
              <MessageCircle className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">
                {currentLanguage === 'en' ? 'No chats found.' : 'कोई चैट नहीं मिली।'}
              </p>
            </div>
          ) : (
            filteredChats.map((chat) => (
              <Link
                key={chat.id}
                to={`/chat/${chat.id}`}
                className="block card-elevated p-4 hover:shadow-md border-l-4 border-l-blue-500"
              >
                <div className="flex items-start gap-3">
                  <img
                    src={chat.productImage}
                    alt={chat.productName}
                    width={56}
                    height={56}
                    loading="lazy"
                    decoding="async"
                    className="w-14 h-14 rounded-lg object-cover bg-muted"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-semibold truncate">{chat.farmerName}</h3>
                      {chat.unreadCount > 0 && (
                        <Badge className="bg-accent text-accent-foreground">{chat.unreadCount}</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{chat.productName}</p>
                    <p className="text-sm truncate mt-1">{chat.lastMessage || '-'}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(chat.lastMessageTime).toLocaleString()}
                    </p>
                  </div>
                  <Button size="sm" variant="outline">
                    {currentLanguage === 'en' ? 'Open' : 'खोलें'}
                  </Button>
                </div>
              </Link>
            ))
          )}
        </div>

        {!isLoading && hasMore && chats.length > 0 && searchQuery.trim() === '' && (
          <div className="flex justify-center mt-6">
            <Button
              type="button"
              variant="outline"
              disabled={loadingMore}
              onClick={() => void loadChats({ silent: true, append: true })}
            >
              {loadingMore
                ? currentLanguage === 'en'
                  ? 'Loading…'
                  : 'लोड हो रहा है…'
                : currentLanguage === 'en'
                  ? 'Load more chats'
                  : 'और चैट लोड करें'}
            </Button>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default BuyerChats;

