import { Order, OrderDetail, OrderLineItem } from '@/types';

const PLACEHOLDER_IMG =
  'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=600';

export function mapOrderStatusFromApi(status: string | undefined): Order['status'] {
  if (status === 'confirmed') return 'processing';
  return (status as Order['status']) || 'pending';
}

function productIdFromItem(item: any): string {
  const p = item?.product;
  if (p && typeof p === 'object' && p._id) return String(p._id);
  if (p) return String(p);
  return '';
}

function mapApiLineItem(item: any): OrderLineItem {
  const prod = item?.product && typeof item.product === 'object' ? item.product : null;
  const img = prod?.images?.[0] || PLACEHOLDER_IMG;
  const qty = Number(item?.quantity) || 0;
  const price = Number(item?.price) || 0;
  const lineTotal =
    item?.totalPrice != null ? Number(item.totalPrice) : qty * price;
  return {
    productId: productIdFromItem(item),
    name: item?.name || prod?.name || 'Product',
    image: img,
    unit: item?.unit || prod?.unit || 'kg',
    quantity: qty,
    pricePerUnit: price,
    lineTotal,
  };
}

export function mapApiOrderToOrder(o: any): Order {
  const first = o.items?.[0];
  const firstProd = first?.product && typeof first.product === 'object' ? first.product : null;
  const firstImage = firstProd?.images?.[0] || first?.image || PLACEHOLDER_IMG;
  return {
    id: o._id || o.id,
    buyerId: o.buyer?._id || o.buyer,
    buyerName: o.buyer?.name || 'Buyer',
    farmerId: o.farmer?._id || o.farmer,
    farmerName: o.farmer?.name || 'Farmer',
    productId: productIdFromItem(first) || '',
    productName: first?.name || firstProd?.name || 'Product',
    productImage: firstImage,
    quantity: first?.quantity || 1,
    unit: first?.unit || firstProd?.unit || 'kg',
    pricePerUnit: first?.price ?? firstProd?.price ?? 0,
    totalAmount: o.totalAmount || 0,
    platformFee: Number(o.platformFee) || 0,
    status: mapOrderStatusFromApi(o.status),
    paymentStatus: (o.paymentStatus || 'pending') as Order['paymentStatus'],
    paymentMethod: (o.paymentMethod as Order['paymentMethod']) || 'cod',
    deliveryAddress: o.shippingAddress || '',
    createdAt: o.createdAt || new Date().toISOString(),
    updatedAt: o.updatedAt || o.createdAt || new Date().toISOString(),
    expectedDelivery: undefined,
    productCategory: firstProd?.category,
  };
}

export function mapApiOrderToDetail(o: any): OrderDetail {
  const base = mapApiOrderToOrder(o);
  const rawItems = Array.isArray(o.items) ? o.items : [];
  let items: OrderLineItem[] = rawItems.map(mapApiLineItem);
  if (items.length === 0) {
    items = [
      {
        productId: base.productId,
        name: base.productName,
        image: base.productImage,
        unit: base.unit,
        quantity: base.quantity,
        pricePerUnit: base.pricePerUnit,
        lineTotal: base.quantity * base.pricePerUnit || base.totalAmount,
      },
    ];
  }
  const negotiated =
    o.negotiatedPrice != null && Number.isFinite(Number(o.negotiatedPrice))
      ? Number(o.negotiatedPrice)
      : undefined;
  return {
    ...base,
    items,
    negotiatedPricePerUnit: negotiated,
  };
}
