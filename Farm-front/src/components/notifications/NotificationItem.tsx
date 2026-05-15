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
      className={`flex w-full items-start gap-3 border-b border-[#eadfc8] p-4 text-left transition-colors hover:bg-[#f8f0df] ${
        !notification.isRead ? 'bg-[#fff8ea]' : ''
      }`}
    >
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border ${
        !notification.isRead ? 'border-[#d2b06b] bg-[#efe2bc]' : 'border-[#d7c7a8] bg-[#f1e7d1]'
      }`}>
        <Icon className={`h-5 w-5 ${!notification.isRead ? 'text-[#315f3b]' : 'text-[#6c5a3d]'}`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h4 className={`text-sm font-medium ${!notification.isRead ? 'text-[#2c4632]' : 'text-[#6c5a3d]'}`}>
            {notification.title}
          </h4>
          {!notification.isRead && (
            <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#d89b2b]" />
          )}
        </div>
        <p className="mt-0.5 line-clamp-2 text-sm text-[#7a6a4f]">{notification.message}</p>
        <p className="mt-1 text-xs text-[#8a7a5b]">
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
