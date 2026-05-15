import { Link } from 'react-router-dom';
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
  pending: { label: 'Pending', color: 'border border-[#dfbc73] bg-[#f8ecd0] text-[#8a5b22]', icon: Clock },
  processing: { label: 'Processing', color: 'border border-[#d3a58a] bg-[#f5e2d6] text-[#8a4f2a]', icon: Package },
  shipped: { label: 'Shipped', color: 'border border-[#d2b06b] bg-[#efe2bc] text-[#315f3b]', icon: Truck },
  delivered: { label: 'Delivered', color: 'border border-[#afc7a6] bg-[#e5efe4] text-[#315f3b]', icon: CheckCircle },
  cancelled: { label: 'Cancelled', color: 'border border-[#d8b19f] bg-[#f6e1d8] text-[#8a4f2a]', icon: XCircle },
};

const OrderCard = ({ order, userRole, onAccept, onReject, onViewDetails }: OrderCardProps) => {
  const config =
    statusConfig[order.status as keyof typeof statusConfig] ?? statusConfig.pending;
  const StatusIcon = config.icon;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="card-elevated border-[#d7c7a8] bg-[#fffaf0] p-4">
      <div className="flex gap-4">
        {/* Product Image */}
        <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-[#d7c7a8] bg-[#f7eddc]">
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
              <h4 className="line-clamp-1 font-semibold text-[#2c4632]">{order.productName}</h4>
              <p className="text-sm text-[#6c5a3d]">
                {userRole === 'farmer' ? `Buyer: ${order.buyerName}` : `Seller: ${order.farmerName}`}
              </p>
            </div>
            <Badge className={config.color}>
              <StatusIcon className="w-3 h-3 mr-1" />
              {config.label}
            </Badge>
          </div>

          <div className="flex items-center gap-4 mt-2 text-sm">
            <span className="text-[#7a6a4f]">
              {order.quantity} {order.unit}
            </span>
            <span className="font-semibold text-[#315f3b]">
              {formatPrice(order.totalAmount)}
            </span>
          </div>

          {/* Actions */}
          {order.status === 'pending' && userRole === 'farmer' && onAccept && onReject && (
            <div className="flex gap-2 mt-3">
              <Button size="sm" onClick={onAccept} className="border border-[#c89b3a] bg-[#d89b2b] text-[#2f2513] hover:bg-[#c98c1d]">
                Accept
              </Button>
              <Button size="sm" variant="outline" onClick={onReject} className="border-[#d8b19f] text-[#8a4f2a] hover:bg-[#f6e1d8]">
                Reject
              </Button>
            </div>
          )}

          <Button size="sm" variant="ghost" asChild className="mt-2 px-0 text-[#315f3b] hover:bg-transparent hover:text-[#274631]">
            <Link to={`/${userRole}/orders/${order.id}`}>
              View order →
            </Link>
          </Button>
        </div>
      </div>

      {/* Order Info */}
      <div className="mt-4 flex items-center justify-between border-t border-[#eadfc8] pt-4 text-sm">
        <span className="text-[#8a7a5b]">Order #{order.id.slice(-6)}</span>
        <span className="text-[#8a7a5b]">
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
