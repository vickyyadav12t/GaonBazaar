import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Bell, Check, CheckCheck, Trash2, Filter, Search, MessageCircle, ShoppingCart, Star, CreditCard, AlertCircle, Package, X } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAppSelector } from '@/hooks/useRedux';
import { Notification } from '@/types';
import { formatRelativeTime } from '@/lib/format';
import { apiService } from '@/services/api';
import { FARM_NOTIFICATION_UNREAD_CHANGED_EVENT } from '@/constants';
import { enHi, scriptFontClass, toNewsApiLang } from '@/lib/i18n';

const NOTIF_PAGE = 40;

function notifyNotificationUnreadChanged(unreadCount?: number) {
  window.dispatchEvent(
    new CustomEvent(FARM_NOTIFICATION_UNREAD_CHANGED_EVENT, {
      detail: typeof unreadCount === 'number' ? { unreadCount } : undefined,
    })
  );
}

const Notifications = () => {
  const navigate = useNavigate();
  const { currentLanguage } = useAppSelector((state) => state.language);
  const { user } = useAppSelector((state) => state.auth);
  
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [notifTotal, setNotifTotal] = useState<number | null>(null);
  const [loadingMoreNotif, setLoadingMoreNotif] = useState(false);
  const [hasMoreNotifs, setHasMoreNotifs] = useState(true);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await apiService.notifications.getAll({
          limit: NOTIF_PAGE,
          skip: 0,
          includeTotal: true,
        });
        const backend: any[] = res.data?.notifications || [];
        const mapped: Notification[] = backend.map((n) => ({
          id: n.id,
          userId: n.userId || n.userId, // backend sends user as userId field in mapper
          type: n.type,
          title: n.title,
          message: n.message,
          link: n.link,
          isRead: n.isRead,
          createdAt: n.createdAt,
        }));
        setNotifications(mapped);
        const tot = typeof res.data?.total === 'number' ? res.data.total : null;
        setNotifTotal(tot);
        setHasMoreNotifs(
          mapped.length === NOTIF_PAGE && (tot == null || mapped.length < tot)
        );
      } catch (error) {
        console.error('Failed to load notifications', error);
      }
    };

    if (user) {
      fetchNotifications();
    }
  }, [user]);

  const loadMoreNotifications = async () => {
    if (loadingMoreNotif || !hasMoreNotifs) return;
    setLoadingMoreNotif(true);
    const skip = notifications.length;
    try {
      const res = await apiService.notifications.getAll({
        limit: NOTIF_PAGE,
        skip,
        includeTotal: false,
      });
      const backend: any[] = res.data?.notifications || [];
      const mapped: Notification[] = backend.map((n) => ({
        id: n.id,
        userId: n.userId || n.userId,
        type: n.type,
        title: n.title,
        message: n.message,
        link: n.link,
        isRead: n.isRead,
        createdAt: n.createdAt,
      }));
      const mergedLen = skip + mapped.length;
      setNotifications((prev) => [...prev, ...mapped]);
      setHasMoreNotifs(
        mapped.length === NOTIF_PAGE &&
          (notifTotal == null || mergedLen < notifTotal)
      );
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingMoreNotif(false);
    }
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'order':
        return <ShoppingCart className="w-5 h-5 text-[#315f3b]" />;
      case 'message':
        return <MessageCircle className="w-5 h-5 text-[#8a4f2a]" />;
      case 'review':
        return <Star className="w-5 h-5 text-[#d89b2b]" />;
      case 'payment':
        return <CreditCard className="w-5 h-5 text-[#58774e]" />;
      case 'system':
        return <AlertCircle className="w-5 h-5 text-[#8b816f]" />;
      default:
        return <Bell className="w-5 h-5 text-[#315f3b]" />;
    }
  };

  const getNotificationBadge = (type: Notification['type']) => {
    const badges: Record<string, { label: string; labelHi: string; className: string }> = {
      order: { label: 'Order', labelHi: 'ऑर्डर', className: 'bg-[#eaf5ec] text-[#315f3b]' },
      message: { label: 'Message', labelHi: 'संदेश', className: 'bg-[#f6e5dc] text-[#8a4f2a]' },
      review: { label: 'Review', labelHi: 'समीक्षा', className: 'bg-[#fff4dd] text-[#9a6b12]' },
      payment: { label: 'Payment', labelHi: 'भुगतान', className: 'bg-[#eef5ee] text-[#58774e]' },
      system: { label: 'System', labelHi: 'सिस्टम', className: 'bg-[#f3ebdd] text-[#6c5a3d]' },
    };
    const badge = badges[type] || badges.system;
    return (
      <Badge className={badge.className}>
        {enHi(currentLanguage, badge.label, badge.labelHi)}
      </Badge>
    );
  };

  const filteredNotifications = notifications.filter(notif => {
    const matchesType = filterType === 'all' || notif.type === filterType;
    const matchesSearch = 
      notif.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notif.message.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleMarkAsRead = (id: string) => {
    const next = notifications.map(n => (n.id === id ? { ...n, isRead: true } : n));
    setNotifications(next);
    apiService.notifications.markAsRead(id).catch(() => {});
    notifyNotificationUnreadChanged(next.filter(n => !n.isRead).length);
  };

  const handleMarkAllAsRead = () => {
    const next = notifications.map(n => ({ ...n, isRead: true }));
    setNotifications(next);
    apiService.notifications.markAllAsRead().catch(() => {});
    notifyNotificationUnreadChanged(0);
  };

  const handleDelete = (id: string) => {
    const next = notifications.filter(n => n.id !== id);
    setNotifications(next);
    apiService.notifications.delete(id).catch(() => {});
    notifyNotificationUnreadChanged(next.filter(n => !n.isRead).length);
  };

  const handleClearAll = () => {
    setNotifications([]);
    apiService.notifications.clearAll().catch(() => {});
    notifyNotificationUnreadChanged(0);
  };

  const handleViewNotification = async (notif: Notification) => {
    if (!notif.isRead) {
      handleMarkAsRead(notif.id);
    }

    // Backward compatibility for older message notifications that were linked
    // to role dashboards instead of a specific chat route.
    if (
      notif.type === 'message' &&
      (notif.link === '/farmer/chats' || notif.link === '/buyer/chats')
    ) {
      try {
        const res = await apiService.chats.getAll({ limit: 10, skip: 0 });
        const chats: any[] = res.data?.chats || [];
        if (chats.length > 0) {
          navigate(`/chat/${chats[0].id}`);
          return;
        }
      } catch {
        // fall through to default link/navigation
      }
    }

    if (notif.link) {
      navigate(notif.link);
    }
  };

  const groupedNotifications = filteredNotifications.reduce((acc, notif) => {
    const date = new Date(notif.createdAt).toDateString();
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(notif);
    return acc;
  }, {} as Record<string, Notification[]>);

  const content = {
    en: {
      title: 'Notifications',
      subtitle: 'Stay updated with all your activities',
      all: 'All',
      unread: 'Unread',
      markAllRead: 'Mark All as Read',
      clearAll: 'Clear All',
      noNotifications: 'No notifications found',
      search: 'Search notifications...',
      filterBy: 'Filter By',
      order: 'Order',
      message: 'Message',
      review: 'Review',
      payment: 'Payment',
      system: 'System',
      today: 'Today',
      yesterday: 'Yesterday',
      delete: 'Delete',
    },
    hi: {
      title: 'सूचनाएं',
      subtitle: 'अपनी सभी गतिविधियों से अपडेट रहें',
      all: 'सभी',
      unread: 'अनपढ़',
      markAllRead: 'सभी को पढ़ा हुआ मार्क करें',
      clearAll: 'सभी साफ करें',
      noNotifications: 'कोई सूचना नहीं मिली',
      search: 'सूचनाएं खोजें...',
      filterBy: 'फ़िल्टर करें',
      order: 'ऑर्डर',
      message: 'संदेश',
      review: 'समीक्षा',
      payment: 'भुगतान',
      system: 'सिस्टम',
      today: 'आज',
      yesterday: 'कल',
      delete: 'हटाएं',
    },
  };

  const t = content[toNewsApiLang(currentLanguage)];

  const getDateLabel = (dateString: string) => {
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    
    if (dateString === today) return t.today;
    if (dateString === yesterday) return t.yesterday;
    return new Date(dateString).toLocaleDateString(toNewsApiLang(currentLanguage) === 'hi' ? 'hi-IN' : 'en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <Layout>
      <div className="min-h-screen bg-[#f6f1e7] bg-[linear-gradient(rgba(138,79,42,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(138,79,42,0.05)_1px,transparent_1px)] bg-[size:24px_24px]">
        <div className="container mx-auto min-w-0 px-3 py-5 sm:px-4 sm:py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="rounded-lg border border-[#d7c7a8] bg-[#fffaf0] p-2 text-[#315f3b] transition hover:bg-[#f6eddc]"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className={`text-2xl font-bold text-[#2f3a2f] ${scriptFontClass(currentLanguage)}`}>
                {t.title}
              </h1>
              <p className={`text-[#6f6552] ${scriptFontClass(currentLanguage)}`}>
                {t.subtitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button
                variant="outline"
                onClick={handleMarkAllAsRead}
                className="border-[#d7c7a8] bg-[#fffaf0] text-[#315f3b] hover:bg-[#f3ebdd] hover:text-[#315f3b]"
              >
                <CheckCheck className="w-4 h-4 mr-2" />
                {t.markAllRead}
              </Button>
            )}
            {notifications.length > 0 && (
              <Button
                variant="outline"
                onClick={handleClearAll}
                className="border-[#d7c7a8] bg-[#fffaf0] text-[#8a4f2a] hover:bg-[#f6e5dc] hover:text-[#8a4f2a]"
              >
                <X className="w-4 h-4 mr-2" />
                {t.clearAll}
              </Button>
            )}
          </div>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#8b816f]" />
            <Input
              placeholder={t.search}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="border-[#d7c7a8] bg-[#fffaf0] pl-12 text-[#2f3a2f] placeholder:text-[#8b816f] focus-visible:ring-[#315f3b]"
            />
          </div>
          
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-full border-[#d7c7a8] bg-[#fffaf0] text-[#2f3a2f] md:w-48">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t.all}</SelectItem>
              <SelectItem value="order">{t.order}</SelectItem>
              <SelectItem value="message">{t.message}</SelectItem>
              <SelectItem value="review">{t.review}</SelectItem>
              <SelectItem value="payment">{t.payment}</SelectItem>
              <SelectItem value="system">{t.system}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="all" className="space-y-4">
          <TabsList className="border border-[#d7c7a8] bg-[#f4ead7] p-1">
            <TabsTrigger
              value="all"
              className="text-[#6c5a3d] data-[state=active]:bg-[#fffaf0] data-[state=active]:text-[#315f3b]"
            >
              {t.all}
              {notifications.length > 0 && (
                <Badge className="ml-2 bg-[#f3ebdd] text-[#6c5a3d] hover:bg-[#f3ebdd]">
                  {notifications.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="unread"
              className="text-[#6c5a3d] data-[state=active]:bg-[#fffaf0] data-[state=active]:text-[#315f3b]"
            >
              {t.unread}
              {unreadCount > 0 && (
                <Badge className="ml-2 bg-[#fff4dd] text-[#9a6b12] hover:bg-[#fff4dd]">
                  {unreadCount}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            {filteredNotifications.length > 0 ? (
              <div className="space-y-6">
                {Object.entries(groupedNotifications).map(([date, dateNotifications]) => (
                  <div key={date}>
                    <h3 className={`mb-3 text-sm font-medium text-[#6f6552] ${scriptFontClass(currentLanguage)}`}>
                      {getDateLabel(date)}
                    </h3>
                    <div className="space-y-2">
                      {dateNotifications.map((notif) => (
                        <div
                          key={notif.id}
                          className={`rounded-lg border border-[#d7c7a8] bg-[#fffaf0] p-4 shadow-[0_16px_40px_rgba(95,70,40,0.08)] transition-all hover:bg-[#fffdf7] ${
                            !notif.isRead ? 'border-l-4 border-l-[#315f3b] bg-[#f7f2e8]' : ''
                          }`}
                        >
                          <div className="flex items-start gap-4">
                            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-[#f3ebdd]">
                              {getNotificationIcon(notif.type)}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2 mb-1">
                                <div className="flex-1">
                                  <h4
                                    className={`font-medium text-[#2f3a2f] ${!notif.isRead ? 'font-semibold' : ''} ${scriptFontClass(currentLanguage)}`}
                                  >
                                    {notif.title}
                                  </h4>
                                  <p className={`mt-1 text-sm text-[#6f6552] ${scriptFontClass(currentLanguage)}`}>
                                    {notif.message}
                                  </p>
                                </div>
                                {!notif.isRead && (
                                  <div className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-[#d89b2b]" />
                                )}
                              </div>
                              
                              <div className="flex items-center justify-between mt-2">
                                <div className="flex items-center gap-2">
                                  {getNotificationBadge(notif.type)}
                                  <span className="text-xs text-[#6f6552]">
                                    {formatRelativeTime(notif.createdAt)}
                                  </span>
                                </div>
                                
                                <div className="flex items-center gap-2">
                                  {!notif.isRead && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleMarkAsRead(notif.id)}
                                      className="h-7 text-[#315f3b] hover:bg-[#f3ebdd] hover:text-[#315f3b]"
                                    >
                                      <Check className="w-3 h-3 mr-1" />
                                      {enHi(currentLanguage, 'Mark read', 'पढ़ा हुआ')}
                                    </Button>
                                  )}
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDelete(notif.id)}
                                    className="h-7 text-[#8a4f2a] hover:bg-[#f6e5dc] hover:text-[#8a4f2a]"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                  {notif.link && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="h-7 border-[#d7c7a8] bg-[#fffdf7] text-[#315f3b] hover:bg-[#f3ebdd] hover:text-[#315f3b]"
                                      onClick={() => handleViewNotification(notif)}
                                    >
                                      {enHi(currentLanguage, 'View', 'देखें')}
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-[#d7c7a8] bg-[#fffaf0] py-16 text-center shadow-[0_16px_40px_rgba(95,70,40,0.08)]">
                <Bell className="mx-auto mb-4 h-16 w-16 text-[#b8ad97]" />
                <p className={`text-[#6f6552] ${scriptFontClass(currentLanguage)}`}>
                  {t.noNotifications}
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="unread" className="space-y-4">
            {filteredNotifications.filter(n => !n.isRead).length > 0 ? (
              <div className="space-y-6">
                {Object.entries(
                  filteredNotifications
                    .filter(n => !n.isRead)
                    .reduce((acc, notif) => {
                      const date = new Date(notif.createdAt).toDateString();
                      if (!acc[date]) acc[date] = [];
                      acc[date].push(notif);
                      return acc;
                    }, {} as Record<string, Notification[]>)
                ).map(([date, dateNotifications]) => (
                  <div key={date}>
                    <h3 className={`mb-3 text-sm font-medium text-[#6f6552] ${scriptFontClass(currentLanguage)}`}>
                      {getDateLabel(date)}
                    </h3>
                    <div className="space-y-2">
                      {dateNotifications.map((notif) => (
                        <div
                          key={notif.id}
                          className="rounded-lg border border-[#d7c7a8] border-l-4 border-l-[#315f3b] bg-[#f7f2e8] p-4 shadow-[0_16px_40px_rgba(95,70,40,0.08)]"
                        >
                          <div className="flex items-start gap-4">
                            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-[#f3ebdd]">
                              {getNotificationIcon(notif.type)}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2 mb-1">
                                <div className="flex-1">
                                  <h4 className={`font-semibold text-[#2f3a2f] ${scriptFontClass(currentLanguage)}`}>
                                    {notif.title}
                                  </h4>
                                  <p className={`mt-1 text-sm text-[#6f6552] ${scriptFontClass(currentLanguage)}`}>
                                    {notif.message}
                                  </p>
                                </div>
                                <div className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-[#d89b2b]" />
                              </div>
                              
                              <div className="flex items-center justify-between mt-2">
                                <div className="flex items-center gap-2">
                                  {getNotificationBadge(notif.type)}
                                  <span className="text-xs text-[#6f6552]">
                                    {formatRelativeTime(notif.createdAt)}
                                  </span>
                                </div>
                                
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleMarkAsRead(notif.id)}
                                    className="h-7 text-[#315f3b] hover:bg-[#f3ebdd] hover:text-[#315f3b]"
                                  >
                                    <Check className="w-3 h-3 mr-1" />
                                    {enHi(currentLanguage, 'Mark read', 'पढ़ा हुआ')}
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDelete(notif.id)}
                                    className="h-7 text-[#8a4f2a] hover:bg-[#f6e5dc] hover:text-[#8a4f2a]"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                  {notif.link && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="h-7 border-[#d7c7a8] bg-[#fffdf7] text-[#315f3b] hover:bg-[#f3ebdd] hover:text-[#315f3b]"
                                      onClick={() => handleViewNotification(notif)}
                                    >
                                      {enHi(currentLanguage, 'View', 'देखें')}
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-[#d7c7a8] bg-[#fffaf0] py-16 text-center shadow-[0_16px_40px_rgba(95,70,40,0.08)]">
                <CheckCheck className="mx-auto mb-4 h-16 w-16 text-[#b8ad97]" />
                <p className={`text-[#6f6552] ${scriptFontClass(currentLanguage)}`}>
                  {enHi(currentLanguage, 'All caught up! No unread notifications.', 'सभी अपडेट! कोई अनपढ़ सूचना नहीं।')}
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {notifications.length > 0 && hasMoreNotifs && (
          <div className="flex justify-center mt-8 pb-8">
            <Button
              type="button"
              variant="outline"
              disabled={loadingMoreNotif}
              onClick={() => void loadMoreNotifications()}
              className="border-[#d7c7a8] bg-[#fffaf0] text-[#315f3b] hover:bg-[#f3ebdd] hover:text-[#315f3b]"
            >
              {loadingMoreNotif
                ? enHi(currentLanguage, 'Loading…', 'लोड हो रहा है…')
                : enHi(currentLanguage, 'Load more', 'और लोड करें')}
            </Button>
          </div>
        )}
        </div>
      </div>
    </Layout>
  );
};

export default Notifications;






