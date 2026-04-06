import type { Order } from '@/types';

/** Short label for lists (buyer / farmer). */
export function paymentLineLabel(
  paymentStatus: Order['paymentStatus'],
  paymentMethod: Order['paymentMethod'],
  en: boolean
): string {
  if (paymentStatus === 'paid') return en ? 'Paid' : 'भुगतान पूर्ण';
  if (paymentMethod === 'razorpay') return en ? 'Online — pending' : 'ऑनलाइन — लंबित';
  if (paymentMethod === 'cod') return en ? 'COD — pay on delivery' : 'COD — डिलीवरी पर';
  return en ? 'Bank transfer — pending' : 'बैंक ट्रांसफर — लंबित';
}

export function paymentMethodLabel(method: Order['paymentMethod'], en: boolean): string {
  switch (method) {
    case 'razorpay':
      return en ? 'Razorpay (UPI / card)' : 'Razorpay (UPI / कार्ड)';
    case 'cod':
      return en ? 'Cash on delivery' : 'डिलीवरी पर नकद';
    case 'bank_transfer':
      return en ? 'Bank transfer' : 'बैंक ट्रांसफर';
    default:
      return method;
  }
}

export function paymentStatusLabel(status: Order['paymentStatus'], en: boolean): string {
  switch (status) {
    case 'paid':
      return en ? 'Paid' : 'भुगतान पूर्ण';
    case 'failed':
      return en ? 'Failed' : 'विफल';
    case 'refunded':
      return en ? 'Refunded' : 'रिफंड';
    default:
      return en ? 'Pending' : 'लंबित';
  }
}
