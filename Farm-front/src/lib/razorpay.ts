/**
 * Razorpay Checkout — amounts are in paise from the API; signature verification is server-side.
 */

import { apiService } from '@/services/api';

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => {
      open: () => void;
      on: (event: string, handler: (payload: unknown) => void) => void;
    };
  }
}

export interface RazorpaySuccessPayload {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

export function loadRazorpayScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window.Razorpay !== 'undefined') {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Razorpay script'));
    document.body.appendChild(script);
  });
}

function openRazorpayModal(opts: {
  keyId: string;
  amountPaise: number;
  razorpayOrderId: string;
  description: string;
  user: { name?: string; email?: string; phone?: string };
  onSuccess: (response: RazorpaySuccessPayload) => void;
  onDismiss: () => void;
  onPaymentFailed: (err: unknown) => void;
}): void {
  const rzp = new window.Razorpay({
    key: opts.keyId,
    amount: opts.amountPaise,
    currency: 'INR',
    order_id: opts.razorpayOrderId,
    name: 'GaonBazaar',
    description: opts.description,
    prefill: {
      name: opts.user.name,
      email: opts.user.email,
      contact: opts.user.phone,
    },
    theme: { color: '#22c55e' },
    handler: (response: RazorpaySuccessPayload) => opts.onSuccess(response),
    modal: {
      ondismiss: () => opts.onDismiss(),
    },
  });

  rzp.on('payment.failed', (response: { error?: unknown }) => {
    opts.onPaymentFailed(response?.error ?? response);
  });

  rzp.open();
}

/** Start Razorpay for an existing app order (buyer JWT). */
export async function payAppOrderWithRazorpay(
  orderId: string,
  user: { name?: string; email?: string; phone?: string },
  description: string
): Promise<'paid' | 'aborted' | 'failed' | 'skipped'> {
  let keyId: string;
  let rzOrderId: string;
  let amountPaise: number;

  try {
    const res = await apiService.payments.createOrder({ orderId });
    const data = res.data as {
      keyId?: string;
      orderId?: string;
      amount?: number;
    };
    keyId = data.keyId || '';
    rzOrderId = data.orderId || '';
    amountPaise = Number(data.amount) || 0;
    if (!keyId || !rzOrderId || !amountPaise) {
      return 'skipped';
    }
  } catch (err: unknown) {
    const status = (err as { response?: { status?: number } })?.response?.status;
    if (status === 503) return 'skipped';
    throw err;
  }

  await loadRazorpayScript();

  return new Promise((resolve) => {
    let settled = false;
    const done = (v: 'paid' | 'aborted' | 'failed') => {
      if (settled) return;
      settled = true;
      resolve(v);
    };

    openRazorpayModal({
      keyId,
      amountPaise,
      razorpayOrderId: rzOrderId,
      description,
      user,
      onSuccess: async (response) => {
        try {
          await apiService.payments.verifyPayment({
            orderId,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
          });
          done('paid');
        } catch {
          done('failed');
        }
      },
      onDismiss: () => done('aborted'),
      onPaymentFailed: () => done('failed'),
    });
  });
}
