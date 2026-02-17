import { Order } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Package, Truck, CheckCircle, Clock, XCircle } from 'lucide-react';

interface OrderCardProps {
  order: Order;
  userRole: 'farmer' | 'buyer';
  onAccept?: () => void;
  onReject?: () => void;
  onViewDetails?: () => void;
}

const statusConfig = {
  pending: { label: 'Pending', color: 'bg-warning/10 text-warning', icon: Clock },
  confirmed: { label: 'Confirmed', color: 'bg-info/10 text-info', icon: CheckCircle },
  processing: { label: 'Processing', color: 'bg-secondary/10 text-secondary', icon: Package },
  shipped: { label: 'Shipped', color: 'bg-primary/10 text-primary', icon: Truck },
  delivered: { label: 'Delivered', color: 'bg-success/10 text-success', icon: CheckCircle },
  cancelled: { label: 'Cancelled', color: 'bg-destructive/10 text-destructive', icon: XCircle },
};

const OrderCard = ({ order, userRole, onAccept, onReject, onViewDetails }: OrderCardProps) => {
  const config = statusConfig[order.status];
  const StatusIcon = config.icon;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="card-elevated p-4">
      <div className="flex gap-4">
        {/* Product Image */}
        <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0">
          <img 
            src={order.productImage} 
            alt={order.productName}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h4 className="font-semibold text-foreground line-clamp-1">{order.productName}</h4>
              <p className="text-sm text-muted-foreground">
                {userRole === 'farmer' ? `Buyer: ${order.buyerName}` : `Seller: ${order.farmerName}`}
              </p>
            </div>
            <Badge className={config.color}>
              <StatusIcon className="w-3 h-3 mr-1" />
              {config.label}
            </Badge>
          </div>

          <div className="flex items-center gap-4 mt-2 text-sm">
            <span className="text-muted-foreground">
              {order.quantity} {order.unit}
            </span>
            <span className="font-semibold text-foreground">
              {formatPrice(order.totalAmount)}
            </span>
          </div>

          {/* Actions */}
          {order.status === 'pending' && userRole === 'farmer' && (
            <div className="flex gap-2 mt-3">
              <Button size="sm" onClick={onAccept} className="bg-success hover:bg-success/90">
                Accept
              </Button>
              <Button size="sm" variant="outline" onClick={onReject} className="text-destructive border-destructive hover:bg-destructive/10">
                Reject
              </Button>
            </div>
          )}

          {order.status !== 'pending' && (
            <Button size="sm" variant="ghost" onClick={onViewDetails} className="mt-2 text-primary">
              View Details →
            </Button>
          )}
        </div>
      </div>

      {/* Order Info */}
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-border text-sm">
        <span className="text-muted-foreground">Order #{order.id.slice(-6)}</span>
        <span className="text-muted-foreground">
          {new Date(order.createdAt).toLocaleDateString('en-IN', { 
            day: 'numeric', 
            month: 'short', 
            year: 'numeric' 
          })}
        </span>
      </div>
    </div>
  );
};

export default OrderCard;
