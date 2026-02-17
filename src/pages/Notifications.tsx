import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Bell, Check, CheckCheck, Trash2, Filter, Search, MessageCircle, ShoppingCart, Star, CreditCard, AlertCircle, Package, X } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAppSelector } from '@/hooks/useRedux';
import { mockNotifications } from '@/data/mockData';
import { Notification } from '@/types';
import { formatRelativeTime } from '@/lib/format';
import { Link } from 'react-router-dom';

const Notifications = () => {
  const navigate = useNavigate();
  const { currentLanguage } = useAppSelector((state) => state.language);
  const { user } = useAppSelector((state) => state.auth);
  
  const [notifications, setNotifications] = useState<Notification[]>(
    mockNotifications.filter(n => n.userId === 'farmer-1' || n.userId === 'buyer-1')
  );
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'order':
        return <ShoppingCart className="w-5 h-5 text-primary" />;
      case 'message':
        return <MessageCircle className="w-5 h-5 text-accent" />;
      case 'review':
        return <Star className="w-5 h-5 text-warning" />;
      case 'payment':
        return <CreditCard className="w-5 h-5 text-success" />;
      case 'system':
        return <AlertCircle className="w-5 h-5 text-muted-foreground" />;
      default:
        return <Bell className="w-5 h-5 text-primary" />;
    }
  };

  const getNotificationBadge = (type: Notification['type']) => {
    const badges: Record<string, { label: string; labelHi: string; className: string }> = {
      order: { label: 'Order', labelHi: 'ऑर्डर', className: 'bg-primary/10 text-primary' },
      message: { label: 'Message', labelHi: 'संदेश', className: 'bg-accent/10 text-accent' },
      review: { label: 'Review', labelHi: 'समीक्षा', className: 'bg-warning/10 text-warning' },
      payment: { label: 'Payment', labelHi: 'भुगतान', className: 'bg-success/10 text-success' },
      system: { label: 'System', labelHi: 'सिस्टम', className: 'bg-muted text-muted-foreground' },
    };
    const badge = badges[type] || badges.system;
    return (
      <Badge className={badge.className}>
        {currentLanguage === 'en' ? badge.label : badge.labelHi}
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
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, isRead: true } : n)
    );
  };

  const handleMarkAllAsRead = () => {
    setNotifications(prev =>
      prev.map(n => ({ ...n, isRead: true }))
    );
  };

  const handleDelete = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const handleClearAll = () => {
    setNotifications([]);
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

  const t = content[currentLanguage];

  const getDateLabel = (dateString: string) => {
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    
    if (dateString === today) return t.today;
    if (dateString === yesterday) return t.yesterday;
    return new Date(dateString).toLocaleDateString(currentLanguage === 'en' ? 'en-IN' : 'hi-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="p-2 hover:bg-muted rounded-lg">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className={`text-2xl font-bold ${currentLanguage === 'hi' ? 'font-hindi' : ''}`}>
                {t.title}
              </h1>
              <p className={`text-muted-foreground ${currentLanguage === 'hi' ? 'font-hindi' : ''}`}>
                {t.subtitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button variant="outline" onClick={handleMarkAllAsRead}>
                <CheckCheck className="w-4 h-4 mr-2" />
                {t.markAllRead}
              </Button>
            )}
            {notifications.length > 0 && (
              <Button variant="outline" onClick={handleClearAll}>
                <X className="w-4 h-4 mr-2" />
                {t.clearAll}
              </Button>
            )}
          </div>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder={t.search}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12"
            />
          </div>
          
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-full md:w-48">
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
          <TabsList>
            <TabsTrigger value="all">
              {t.all}
              {notifications.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {notifications.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="unread">
              {t.unread}
              {unreadCount > 0 && (
                <Badge variant="secondary" className="ml-2 bg-accent text-accent-foreground">
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
                    <h3 className={`text-sm font-medium text-muted-foreground mb-3 ${currentLanguage === 'hi' ? 'font-hindi' : ''}`}>
                      {getDateLabel(date)}
                    </h3>
                    <div className="space-y-2">
                      {dateNotifications.map((notif) => (
                        <div
                          key={notif.id}
                          className={`card-elevated p-4 transition-all hover:shadow-md ${
                            !notif.isRead ? 'bg-primary/5 border-l-4 border-l-primary' : ''
                          }`}
                        >
                          <div className="flex items-start gap-4">
                            <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                              {getNotificationIcon(notif.type)}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2 mb-1">
                                <div className="flex-1">
                                  <h4 className={`font-medium ${!notif.isRead ? 'font-semibold' : ''} ${currentLanguage === 'hi' ? 'font-hindi' : ''}`}>
                                    {notif.title}
                                  </h4>
                                  <p className={`text-sm text-muted-foreground mt-1 ${currentLanguage === 'hi' ? 'font-hindi' : ''}`}>
                                    {notif.message}
                                  </p>
                                </div>
                                {!notif.isRead && (
                                  <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-1" />
                                )}
                              </div>
                              
                              <div className="flex items-center justify-between mt-2">
                                <div className="flex items-center gap-2">
                                  {getNotificationBadge(notif.type)}
                                  <span className="text-xs text-muted-foreground">
                                    {formatRelativeTime(notif.createdAt)}
                                  </span>
                                </div>
                                
                                <div className="flex items-center gap-2">
                                  {!notif.isRead && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleMarkAsRead(notif.id)}
                                      className="h-7"
                                    >
                                      <Check className="w-3 h-3 mr-1" />
                                      {currentLanguage === 'en' ? 'Mark read' : 'पढ़ा हुआ'}
                                    </Button>
                                  )}
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDelete(notif.id)}
                                    className="h-7 text-destructive hover:text-destructive"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                  {notif.link && (
                                    <Link to={notif.link}>
                                      <Button variant="outline" size="sm" className="h-7">
                                        {currentLanguage === 'en' ? 'View' : 'देखें'}
                                      </Button>
                                    </Link>
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
              <div className="card-elevated py-16 text-center">
                <Bell className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <p className={`text-muted-foreground ${currentLanguage === 'hi' ? 'font-hindi' : ''}`}>
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
                    <h3 className={`text-sm font-medium text-muted-foreground mb-3 ${currentLanguage === 'hi' ? 'font-hindi' : ''}`}>
                      {getDateLabel(date)}
                    </h3>
                    <div className="space-y-2">
                      {dateNotifications.map((notif) => (
                        <div
                          key={notif.id}
                          className="card-elevated p-4 bg-primary/5 border-l-4 border-l-primary"
                        >
                          <div className="flex items-start gap-4">
                            <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                              {getNotificationIcon(notif.type)}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2 mb-1">
                                <div className="flex-1">
                                  <h4 className={`font-semibold ${currentLanguage === 'hi' ? 'font-hindi' : ''}`}>
                                    {notif.title}
                                  </h4>
                                  <p className={`text-sm text-muted-foreground mt-1 ${currentLanguage === 'hi' ? 'font-hindi' : ''}`}>
                                    {notif.message}
                                  </p>
                                </div>
                                <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-1" />
                              </div>
                              
                              <div className="flex items-center justify-between mt-2">
                                <div className="flex items-center gap-2">
                                  {getNotificationBadge(notif.type)}
                                  <span className="text-xs text-muted-foreground">
                                    {formatRelativeTime(notif.createdAt)}
                                  </span>
                                </div>
                                
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleMarkAsRead(notif.id)}
                                    className="h-7"
                                  >
                                    <Check className="w-3 h-3 mr-1" />
                                    {currentLanguage === 'en' ? 'Mark read' : 'पढ़ा हुआ'}
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDelete(notif.id)}
                                    className="h-7 text-destructive hover:text-destructive"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                  {notif.link && (
                                    <Link to={notif.link}>
                                      <Button variant="outline" size="sm" className="h-7">
                                        {currentLanguage === 'en' ? 'View' : 'देखें'}
                                      </Button>
                                    </Link>
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
              <div className="card-elevated py-16 text-center">
                <CheckCheck className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <p className={`text-muted-foreground ${currentLanguage === 'hi' ? 'font-hindi' : ''}`}>
                  {currentLanguage === 'en' ? 'All caught up! No unread notifications.' : 'सभी अपडेट! कोई अनपढ़ सूचना नहीं।'}
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Notifications;







