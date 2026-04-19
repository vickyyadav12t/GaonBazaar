import { Order, OrderDetail, OrderLineItem, OrderReturnRequest } from '@/types';
import { listingHeroImageUrlFromList } from '@/lib/productImageUrl';

export function mapOrderStatusFromApi(status: string | undefined): Order['status'] {
  if (status === 'confirmed') return 'processing';
  return (status as Order['status']) || 'pending';
}

function mapReturnRequest(raw: unknown): OrderReturnRequest | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const r = raw as Record<string, unknown>;
  const st = String(r.status || 'none') as OrderReturnRequest['status'];
  if (!st || st === 'none') return undefined;
  const toIso = (d: unknown) =>
    d instanceof Date ? d.toISOString() : typeof d === 'string' ? d : undefined;
  return {
    status: st,
    reason: typeof r.reason === 'string' ? r.reason : undefined,
    details: typeof r.details === 'string' ? r.details : undefined,
    requestedAt: toIso(r.requestedAt),
    resolvedAt: toIso(r.resolvedAt),
    resolutionNote: typeof r.resolutionNote === 'string' ? r.resolutionNote : undefined,
    refundAmount: typeof r.refundAmount === 'number' ? r.refundAmount : undefined,
    razorpayRefundId: typeof r.razorpayRefundId === 'string' ? r.razorpayRefundId : undefined,
  };
}

function productIdFromItem(item: any): string {
  const p = item?.product;
  if (p && typeof p === 'object' && p._id) return String(p._id);
  if (p) return String(p);
  return '';
}

function mapApiLineItem(item: any): OrderLineItem {
  const prod = item?.product && typeof item.product === 'object' ? item.product : null;
  const imgCandidates: unknown[] = [];
  if (item?.image) imgCandidates.push(item.image);
  if (Array.isArray(prod?.images)) imgCandidates.push(...prod.images);
  const img = listingHeroImageUrlFromList(imgCandidates, 640);
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
  const firstImgCandidates: unknown[] = [];
  if (first?.image) firstImgCandidates.push(first.image);
  if (Array.isArray(firstProd?.images)) firstImgCandidates.push(...firstProd.images);
  const firstImage = listingHeroImageUrlFromList(firstImgCandidates, 640);
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
    deliveredAt:
      o.deliveredAt instanceof Date
        ? o.deliveredAt.toISOString()
        : typeof o.deliveredAt === 'string'
          ? o.deliveredAt
          : undefined,
    returnRequest: mapReturnRequest(o.returnRequest),
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
