import { Package, Truck, CheckCircle, Clock, XCircle } from 'lucide-react';
import type { Order } from '@/types';

type Step = {
  key: string;
  label: string;
  icon: typeof Package;
  completed: boolean;
  current: boolean;
};

const enLabels: Record<string, string> = {
  pending: 'Order placed',
  processing: 'Processing',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Order cancelled',
};

const hiLabels: Record<string, string> = {
  pending: 'ऑर्डर दिया गया',
  processing: 'प्रोसेसिंग',
  shipped: 'भेज दिया',
  delivered: 'पहुंचा दिया',
  cancelled: 'ऑर्डर रद्द',
};

export function buildOrderTimelineSteps(
  status: Order['status'],
  lang: 'en' | 'hi'
): Step[] {
  const L = lang === 'hi' ? hiLabels : enLabels;

  if (status === 'cancelled') {
    return [
      {
        key: 'cancelled',
        label: L.cancelled,
        icon: XCircle,
        completed: true,
        current: true,
      },
    ];
  }

  const flow: Order['status'][] = ['pending', 'processing', 'shipped', 'delivered'];
  const icons = {
    pending: Package,
    processing: Clock,
    shipped: Truck,
    delivered: CheckCircle,
  } as const;

  let currentIndex = flow.indexOf(status);
  if (currentIndex < 0) currentIndex = 0;

  return flow.map((key, index) => ({
    key,
    label: L[key],
    icon: icons[key],
    completed: index <= currentIndex,
    current: index === currentIndex,
  }));
}

type OrderStatusTimelineProps = {
  status: Order['status'];
  currentLanguage: string;
  paymentPendingNote?: boolean;
  paymentMethod?: Order['paymentMethod'];
  paymentStatus?: Order['paymentStatus'];
};

function paymentPendingCopy(
  lang: 'en' | 'hi',
  method?: Order['paymentMethod'],
  pStatus?: Order['paymentStatus']
): string {
  if (pStatus === 'paid') return '';
  if (method === 'razorpay') {
    return lang === 'en'
      ? 'Complete payment with Razorpay from this page (Pay now) or at checkout. The farmer is notified when payment succeeds.'
      : 'इस पेज से Razorpay से भुगतान पूरा करें। भुगतान होने पर किसान को सूचना मिलती है।';
  }
  if (method === 'cod') {
    return lang === 'en'
      ? 'Cash on delivery: pay the farmer when you receive the order. The farmer can mark payment as received after delivery.'
      : 'COD: सामान मिलने पर किसान को भुगतान करें। डिलीवरी के बाद किसान भुगतान दर्ज कर सकता है।';
  }
  if (method === 'bank_transfer') {
    return lang === 'en'
      ? 'Bank transfer: pay using details shared by the farmer. They will mark the order as paid when funds are received.'
      : 'बैंक ट्रांसफर: किसान द्वारा दिए गए विवरण से भुगतान करें। राशि मिलने पर वे भुगतान दर्ज करेंगे।';
  }
  return lang === 'en'
    ? 'Payment is still pending for this order.'
    : 'इस ऑर्डर का भुगतान अभी लंबित है।';
}

export function OrderStatusTimeline({
  status,
  currentLanguage,
  paymentPendingNote,
  paymentMethod,
  paymentStatus,
}: OrderStatusTimelineProps) {
  const lang = currentLanguage === 'hi' ? 'hi' : 'en';
  const steps = buildOrderTimelineSteps(status, lang);
  const payNote =
    paymentPendingNote && status !== 'cancelled'
      ? paymentPendingCopy(lang, paymentMethod, paymentStatus)
      : '';

  return (
    <div className="card-elevated p-6">
      <h2 className="text-lg font-semibold mb-6">
        {lang === 'en' ? 'Order timeline' : 'ऑर्डर समयरेखा'}
      </h2>
      {payNote && (
        <p className="text-sm text-muted-foreground mb-4">
          {payNote}
        </p>
      )}
      <div className="relative">
        {steps.map((step, index, arr) => (
          <div key={step.key} className="flex gap-4 pb-8 last:pb-0">
            <div className="relative flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                  step.completed ? 'bg-success text-white' : 'bg-muted text-muted-foreground'
                }`}
              >
                <step.icon className="w-5 h-5" />
              </div>
              {index < arr.length - 1 && (
                <div
                  className={`w-0.5 flex-1 min-h-[1.5rem] mt-2 ${
                    step.completed && arr[index + 1]?.completed ? 'bg-success' : 'bg-muted'
                  }`}
                />
              )}
            </div>
            <div className="flex-1 pt-2">
              <p
                className={`font-medium ${
                  step.completed ? 'text-foreground' : 'text-muted-foreground'
                }`}
              >
                {step.label}
              </p>
              {step.current && (
                <p className="text-sm text-muted-foreground mt-1">
                  {lang === 'en' ? 'Current status' : 'वर्तमान स्थिति'}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
