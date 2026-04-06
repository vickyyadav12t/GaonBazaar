/**
 * Application Constants
 * 
 * Centralized constants used throughout the application
 */

// User Roles
export const USER_ROLES = {
  FARMER: 'farmer',
  BUYER: 'buyer',
  ADMIN: 'admin',
} as const;

// Order Status
export const ORDER_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
} as const;

// Product Status
export const PRODUCT_STATUS = {
  ACTIVE: 'active',
  SOLD_OUT: 'sold_out',
  HIDDEN: 'hidden',
} as const;

// KYC Status
export const KYC_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
} as const;

// Payment Status
export const PAYMENT_STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
  REFUNDED: 'refunded',
} as const;

// Payment Methods
export const PAYMENT_METHODS = {
  RAZORPAY: 'razorpay',
  COD: 'cod',
  BANK_TRANSFER: 'bank_transfer',
} as const;

// Crop Categories
export const CROP_CATEGORIES = {
  VEGETABLES: 'vegetables',
  FRUITS: 'fruits',
  GRAINS: 'grains',
  PULSES: 'pulses',
  SPICES: 'spices',
  DAIRY: 'dairy',
  OTHER: 'other',
} as const;

// Price Units
export const PRICE_UNITS = {
  KG: 'kg',
  QUINTAL: 'quintal',
  TON: 'ton',
  PIECE: 'piece',
  DOZEN: 'dozen',
} as const;

// Chat Message Types
export const MESSAGE_TYPES = {
  TEXT: 'text',
  OFFER: 'offer',
  COUNTER_OFFER: 'counter_offer',
  DEAL_ACCEPTED: 'deal_accepted',
  DEAL_REJECTED: 'deal_rejected',
} as const;

// Negotiation Status
export const NEGOTIATION_STATUS = {
  ONGOING: 'ongoing',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
  COMPLETED: 'completed',
} as const;

// Notification Types
export const NOTIFICATION_TYPES = {
  ORDER: 'order',
  MESSAGE: 'message',
  REVIEW: 'review',
  SYSTEM: 'system',
  PAYMENT: 'payment',
} as const;

// Support Ticket Categories
export const TICKET_CATEGORIES = {
  PAYMENT: 'payment',
  ORDER: 'order',
  TECHNICAL: 'technical',
  ACCOUNT: 'account',
  OTHER: 'other',
} as const;

// Support Ticket Status
export const TICKET_STATUS = {
  OPEN: 'open',
  IN_PROGRESS: 'in_progress',
  RESOLVED: 'resolved',
  CLOSED: 'closed',
} as const;

// Support Ticket Priority
export const TICKET_PRIORITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
} as const;

// Languages
export const LANGUAGES = {
  ENGLISH: 'en',
  HINDI: 'hi',
} as const;

// App Configuration
export const APP_CONFIG = {
  MIN_ORDER_QUANTITY: 1,
  MAX_UPLOAD_SIZE: 5 * 1024 * 1024, // 5MB
  SUPPORTED_IMAGE_FORMATS: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  SUPPORTED_DOCUMENT_FORMATS: ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'],
  PLATFORM_FEE_PERCENTAGE: 2, // 2%
  PHONE_LENGTH: 10,
  PINCODE_LENGTH: 6,
  AADHAAR_LENGTH: 12,
} as const;

// Routes
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  MARKETPLACE: '/marketplace',
  SUPPORT: '/support',
  FARMER_DASHBOARD: '/farmer/dashboard',
  BUYER_DASHBOARD: '/buyer/dashboard',
  /** Admin shell: use ?tab=overview | orders | users | kyc | payouts | listings | reviews | audit */
  ADMIN_DASHBOARD: '/admin?tab=overview',
  ADMIN_PANEL: '/admin',
} as const;

/** Valid `tab` query values for `/admin?tab=…` (admin dashboard). */
export const ADMIN_PANEL_TABS = [
  'overview',
  'orders',
  'users',
  'kyc',
  'payouts',
  'listings',
  'reviews',
  'support',
  'audit',
] as const;

export type AdminPanelTab = (typeof ADMIN_PANEL_TABS)[number];

export function adminPanelHref(tab: AdminPanelTab): string {
  return `/admin?tab=${encodeURIComponent(tab)}`;
}

// Date Formats
export const DATE_FORMATS = {
  DISPLAY: 'dd MMM yyyy',
  FULL: 'dd MMMM yyyy',
  TIME: 'hh:mm a',
  DATETIME: 'dd MMM yyyy, hh:mm a',
} as const;

// Currency
export const CURRENCY = {
  SYMBOL: '₹',
  CODE: 'INR',
  LOCALE: 'en-IN',
} as const;

/** Window event: chat unread / list should refresh (e.g. new message for current user). */
export const FARM_CHAT_UNREAD_CHANGED_EVENT = 'farm:chat-unread-changed';

/** Window event: in-app notification read state changed (mark read / delete / clear). */
export const FARM_NOTIFICATION_UNREAD_CHANGED_EVENT = 'farm:notification-unread-changed';







