/**
 * FRONTEND-ONLY: Razorpay Payment Client Integration
 * 
 * This is a frontend Razorpay payment client.
 * It provides the UI structure for Razorpay checkout.
 * 
 * No backend code is included - this is purely the client-side payment integration.
 * Payment verification should be done on your backend server (not included here).
 * 
 * For frontend-only demo, this provides the payment UI with mock fallback.
 */

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface RazorpayOptions {
  key: string;
  amount: number; // in paise
  currency: string;
  name: string;
  description: string;
  order_id?: string;
  handler: (response: RazorpayResponse) => void;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  theme?: {
    color?: string;
  };
  modal?: {
    ondismiss?: () => void;
  };
}

interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

/**
 * Initialize Razorpay payment
 * In production, replace with actual Razorpay key from environment
 */
export const initializeRazorpay = (options: {
  amount: number;
  orderId: string;
  description: string;
  user: { name?: string; email?: string; phone?: string };
  onSuccess: (response: RazorpayResponse) => void;
  onError: (error: any) => void;
}): void => {
  // Check if Razorpay script is loaded
  if (typeof window.Razorpay === 'undefined') {
    console.warn('Razorpay SDK not loaded. This is expected in frontend-only mode.');
    // In demo mode, simulate success after delay
    setTimeout(() => {
      options.onSuccess({
        razorpay_payment_id: `pay_demo_${Date.now()}`,
        razorpay_order_id: options.orderId,
        razorpay_signature: `sig_demo_${Date.now()}`,
      });
    }, 2000);
    return;
  }

  const razorpayOptions: RazorpayOptions = {
    key: import.meta.env.VITE_RAZORPAY_KEY || 'rzp_test_demo', // Replace with actual key
    amount: options.amount * 100, // Convert to paise
    currency: 'INR',
    name: 'Direct Access for Farmers',
    description: options.description,
    order_id: options.orderId,
    prefill: {
      name: options.user.name,
      email: options.user.email,
      contact: options.user.phone,
    },
    theme: {
      color: '#22c55e', // Primary green color
    },
    handler: options.onSuccess,
    modal: {
      ondismiss: () => options.onError(new Error('Payment cancelled')),
    },
  };

  const razorpay = new window.Razorpay(razorpayOptions);
  razorpay.on('payment.failed', (response: any) => {
    options.onError(response.error);
  });

  razorpay.open();
};

/**
 * Verify Razorpay payment signature
 * This should be done on the backend for security
 */
export const verifyPayment = async (
  orderId: string,
  paymentId: string,
  signature: string
): Promise<boolean> => {
  // In production, this should call your backend API
  // const response = await apiService.payments.verifyPayment({
  //   orderId,
  //   paymentId,
  //   signature,
  // });
  // return response.data.success;

  // For demo purposes
  return true;
};

/**
 * Load Razorpay script dynamically
 */
export const loadRazorpayScript = (): Promise<void> => {
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
};

