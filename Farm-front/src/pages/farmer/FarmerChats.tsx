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

const FarmerChats = () => {
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
          c.buyerName.toLowerCase().includes(q) ||
          c.productName.toLowerCase().includes(q) ||
          c.lastMessage.toLowerCase().includes(q)
        );
      }),
    [chats, searchQuery]
  );

  return (
    <Layout>
      <div className="min-h-screen bg-[linear-gradient(rgba(251,247,235,0.97),rgba(251,247,235,0.97)),linear-gradient(rgba(138,79,42,0.07)_1px,transparent_1px),linear-gradient(90deg,rgba(138,79,42,0.07)_1px,transparent_1px)] bg-[size:auto,24px_24px,24px_24px]">
        <div className="container mx-auto min-w-0 px-3 py-5 sm:px-4 sm:py-6">
        <div className="flex items-center gap-4 mb-2">
          <button
            onClick={() => navigate(-1)}
            className="rounded-lg border border-[#d7c7a8] bg-[#fffaf0] p-2 text-[#315f3b] transition hover:bg-[#f6eddc]"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold text-[#2f3a2f]">
            {currentLanguage === 'en' ? 'Farmer Chats' : 'किसान चैट'}
          </h1>
        </div>
        <p className="mb-4 text-sm text-[#6f6552]">
          {currentLanguage === 'en'
            ? 'Buyer conversations for your listings'
            : 'आपकी लिस्टिंग के लिए खरीदार बातचीत'}
        </p>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8b816f]" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={currentLanguage === 'en' ? 'Search chats...' : 'चैट खोजें...'}
            className="border-[#d7c7a8] bg-[#fffaf0] pl-9 text-[#2f3a2f] placeholder:text-[#8b816f] focus-visible:ring-[#315f3b]"
          />
        </div>

        <div className="space-y-3">
          {isLoading ? (
            <div className="py-12 text-center text-[#6f6552]">
              {currentLanguage === 'en' ? 'Loading chats...' : 'चैट लोड हो रही हैं...'}
            </div>
          ) : filteredChats.length === 0 ? (
            <div className="rounded-2xl border border-[#d7c7a8] bg-[#fffaf0] py-12 text-center shadow-[0_16px_40px_rgba(95,70,40,0.08)]">
              <MessageCircle className="mx-auto mb-3 h-12 w-12 text-[#b8ad97]" />
              <p className="text-[#6f6552]">
                {currentLanguage === 'en' ? 'No chats found.' : 'कोई चैट नहीं मिली।'}
              </p>
            </div>
          ) : (
            filteredChats.map((chat) => (
              <Link key={chat.id} to={`/chat/${chat.id}`} className="block rounded-2xl border border-[#d7c7a8] border-l-4 border-l-[#315f3b] bg-[#fffaf0] p-4 shadow-[0_16px_40px_rgba(95,70,40,0.08)] transition hover:shadow-[0_18px_42px_rgba(95,70,40,0.12)]">
                <div className="flex items-start gap-3">
                  <img
                    src={chat.productImage}
                    alt={chat.productName}
                    width={56}
                    height={56}
                    loading="lazy"
                    decoding="async"
                    className="h-14 w-14 rounded-lg border border-[#e2d4b7] bg-[#f3ebdd] object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="truncate font-semibold text-[#2f3a2f]">{chat.buyerName}</h3>
                      {chat.unreadCount > 0 && (
                        <Badge className="bg-[#d89b2b] text-[#2f2416]">{chat.unreadCount}</Badge>
                      )}
                    </div>
                    <p className="truncate text-sm text-[#6f6552]">{chat.productName}</p>
                    <p className="mt-1 truncate text-sm text-[#2f3a2f]">{chat.lastMessage || '-'}</p>
                    <p className="mt-1 text-xs text-[#6f6552]">
                      {new Date(chat.lastMessageTime).toLocaleString()}
                    </p>
                  </div>
                  <Button size="sm" variant="outline" className="border-[#d7c7a8] bg-[#fffdf7] text-[#315f3b] hover:bg-[#f3ebdd] hover:text-[#315f3b]">
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
              className="border-[#d7c7a8] bg-[#fffdf7] text-[#315f3b] hover:bg-[#f3ebdd] hover:text-[#315f3b]"
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
      </div>
    </Layout>
  );
};

export default FarmerChats;
