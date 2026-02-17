import { Notification } from '@/types';
import { Bell, Package, MessageCircle, Star, CreditCard, Info } from 'lucide-react';

interface NotificationItemProps {
  notification: Notification;
  onClick?: () => void;
}

const iconMap = {
  order: Package,
  message: MessageCircle,
  review: Star,
  payment: CreditCard,
  system: Info,
};

const NotificationItem = ({ notification, onClick }: NotificationItemProps) => {
  const Icon = iconMap[notification.type] || Bell;

  return (
    <button
      onClick={onClick}
      className={`w-full p-4 flex items-start gap-3 hover:bg-muted/50 transition-colors text-left ${
        !notification.isRead ? 'bg-primary/5' : ''
      }`}
    >
      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
        !notification.isRead ? 'bg-primary/10' : 'bg-muted'
      }`}>
        <Icon className={`w-5 h-5 ${!notification.isRead ? 'text-primary' : 'text-muted-foreground'}`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h4 className={`text-sm font-medium ${!notification.isRead ? 'text-foreground' : 'text-muted-foreground'}`}>
            {notification.title}
          </h4>
          {!notification.isRead && (
            <span className="w-2 h-2 bg-primary rounded-full shrink-0 mt-1.5" />
          )}
        </div>
        <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">{notification.message}</p>
        <p className="text-xs text-muted-foreground mt-1">
          {new Date(notification.createdAt).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
      </div>
    </button>
  );
};

export default NotificationItem;
