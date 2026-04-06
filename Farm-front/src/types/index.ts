// User types
export type UserRole = 'farmer' | 'buyer' | 'admin';

export type KycDocType = 'aadhaar' | 'kisan' | 'bank';

export interface KycDocumentItem {
  id?: string;
  docType: KycDocType;
  fileUrl: string;
  originalName?: string;
  uploadedAt?: string;
  reviewStatus: 'pending' | 'approved' | 'rejected';
}

export type BuyerBusinessType = 'retailer' | 'wholesaler' | 'processor' | 'individual';

/** Persisted on the server; controls in-app notifications, negotiation emails, and admin broadcasts. */
export interface NotificationPreferences {
  emailNotifications: boolean;
  pushNotifications: boolean;
  orderUpdates: boolean;
  messageNotifications: boolean;
  reviewNotifications: boolean;
  promotionalEmails: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  /** Omitted for Google-only accounts until the user adds a phone in settings */
  phone?: string;
  role: UserRole;
  avatar?: string;
  isVerified: boolean;
  kycStatus: 'pending' | 'approved' | 'rejected';
  location: {
    state: string;
    district: string;
    village?: string;
  };
  createdAt: string;
  /** Persisted for buyers only */
  businessName?: string;
  businessType?: BuyerBusinessType;
  gstNumber?: string;
  businessAddress?: string;
  /** Persisted for farmers only */
  farmSize?: string;
  /** Comma-separated or free text, e.g. "Wheat, Rice" */
  crops?: string;
  /** Farmer: category ids for seasonal guide highlights when they have no active listings */
  calendarHighlightCategories?: CropCategory[];
  bio?: string;
  /** Farmer KYC files (metadata + URLs) */
  kycDocuments?: KycDocumentItem[];
  /** Server: active users can use the app; suspended users are blocked on API calls */
  accountStatus?: 'active' | 'suspended';
  /** Set when admin rejects farmer KYC */
  kycRejectionReason?: string;
  notificationPreferences?: NotificationPreferences;
}

export interface Farmer extends User {
  role: 'farmer';
  farmSize?: string;
  crops?: string;
  rating: number;
  totalSales: number;
  aadhaarNumber?: string;
  kisanId?: string;
}

export interface Buyer extends User {
  role: 'buyer';
  businessName?: string;
  businessType?: BuyerBusinessType;
  totalOrders: number;
}

// Product types
export type CropCategory = 
  | 'vegetables'
  | 'fruits'
  | 'grains'
  | 'pulses'
  | 'spices'
  | 'dairy'
  | 'other';

export interface Product {
  id: string;
  farmerId: string;
  farmerName: string;
  farmerAvatar?: string;
  /** Populated on admin listing API when available */
  farmerPhone?: string;
  farmerEmail?: string;
  farmerKycStatus?: string;
  farmerRating: number;
  farmerLocation: string;
  name: string;
  nameHindi?: string;
  category: CropCategory;
  description: string;
  images: string[];
  price: number;
  unit: 'kg' | 'quintal' | 'ton' | 'piece' | 'dozen';
  minOrderQuantity: number;
  availableQuantity: number;
  harvestDate: string;
  isOrganic: boolean;
  isNegotiable: boolean;
  status: 'active' | 'sold_out' | 'hidden';
  createdAt: string;
  views: number;
  inquiries: number;
  /** Delivered orders containing this product (from API on product detail). */
  successfulSalesCount?: number;
}

// Order types
export type OrderStatus =
  | 'pending'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled';

export interface OrderLineItem {
  productId: string;
  name: string;
  image: string;
  unit: string;
  quantity: number;
  pricePerUnit: number;
  lineTotal: number;
}

export interface Order {
  id: string;
  productId: string;
  productName: string;
  productImage: string;
  farmerId: string;
  farmerName: string;
  buyerId: string;
  buyerName: string;
  quantity: number;
  unit: string;
  pricePerUnit: number;
  totalAmount: number;
  /** 2% platform fee on subtotal; buyer pays totalAmount + platformFee online. */
  platformFee?: number;
  status: OrderStatus;
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  paymentMethod: 'razorpay' | 'cod' | 'bank_transfer';
  deliveryAddress: string;
  expectedDelivery?: string;
  createdAt: string;
  updatedAt: string;
  /** Set when API embeds product on the first line item (category signals for buyers). */
  productCategory?: CropCategory;
}

/** Full order from API with every line item (detail view). */
export interface OrderDetail extends Order {
  items: OrderLineItem[];
  negotiatedPricePerUnit?: number;
}

// Chat types
export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  receiverId: string;
  content: string;
  type: 'text' | 'offer' | 'counter_offer' | 'deal_accepted' | 'deal_rejected';
  offerPrice?: number;
  timestamp: string;
  isRead: boolean;
}

export interface Chat {
  id: string;
  productId: string;
  productName: string;
  productImage: string;
  farmerId: string;
  farmerName: string;
  buyerId: string;
  buyerName: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  messages: ChatMessage[];
  negotiationStatus: 'ongoing' | 'accepted' | 'rejected' | 'completed';
  currentOffer?: number;
  originalPrice: number;
}

// Review types
export interface Review {
  id: string;
  orderId: string;
  productId: string;
  productName: string;
  reviewerId: string;
  reviewerName: string;
  reviewerRole: UserRole;
  targetId: string;
  targetName: string;
  rating: number;
  comment: string;
  reply?: string;
  replyDate?: string;
  createdAt: string;
  isApproved: boolean;
}

// Notification types
export interface Notification {
  id: string;
  userId: string;
  type: 'order' | 'message' | 'review' | 'system' | 'payment';
  title: string;
  message: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
}

// Support types
export interface SupportTicket {
  id: string;
  userId: string;
  userName: string;
  subject: string;
  description: string;
  category: 'payment' | 'order' | 'technical' | 'account' | 'other';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
  updatedAt: string;
}

// Analytics types
export interface DashboardStats {
  totalUsers: number;
  totalFarmers: number;
  totalBuyers: number;
  totalListings: number;
  activeListings: number;
  totalOrders: number;
  totalRevenue: number;
  pendingKYC: number;
}

// Earnings & Wallet types
export type TransactionType = 'order_payment' | 'withdrawal' | 'refund' | 'platform_fee' | 'bonus';
export type TransactionStatus = 'completed' | 'pending' | 'failed';
export type WithdrawalStatus = 'pending' | 'processing' | 'completed' | 'rejected';

export interface Transaction {
  id: string;
  orderId?: string;
  type: TransactionType;
  amount: number;
  status: TransactionStatus;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface Withdrawal {
  id: string;
  amount: number;
  bankAccount: {
    accountNumber: string;
    ifscCode: string;
    bankName: string;
    accountHolderName: string;
  };
  status: WithdrawalStatus;
  requestedAt: string;
  processedAt?: string;
  rejectionReason?: string;
}

export interface EarningsSummary {
  totalEarnings: number;
  availableBalance: number;
  pendingPayments: number;
  withdrawnAmount: number;
  thisMonth: number;
  lastMonth: number;
  growth: number; // percentage
}

// Crop Calendar types
export type Season = 'spring' | 'summer' | 'monsoon' | 'winter';
export type CropActivity = 'planting' | 'growing' | 'harvesting' | 'available';

export interface CropCalendarReferenceLink {
  href: string;
  labelEn: string;
  labelHi: string;
}

export interface CropCalendarEntry {
  id: string;
  cropName: string;
  cropNameHindi: string;
  category: CropCategory;
  season: Season;
  plantingMonths: number[]; // 1-12 (Jan-Dec)
  harvestingMonths: number[]; // 1-12 (Jan-Dec)
  growingPeriod: number; // days
  description: string;
  descriptionHindi: string;
  tips: string[];
  tipsHindi: string[];
  icon: string;
  /** Backend: optional agro scope; empty = all zones (client may still apply offsets). */
  region?: '' | 'north' | 'central' | 'south' | string;
  /** From API when provided; UI falls back to static links per crop id. */
  referenceLinks?: CropCalendarReferenceLink[];
}

/** Optional UI snapshot sent with unified AI Copilot (server sanitizes further). */
export type CopilotPage =
  | 'marketplace'
  | 'product'
  | 'listing'
  | 'order'
  | 'chat'
  | 'dashboard'
  | 'other';

export interface CopilotContextPayload {
  page?: CopilotPage;
  product?: {
    name?: string;
    category?: string;
    unit?: string;
    price?: number;
    organic?: boolean;
    negotiable?: boolean;
    description?: string;
  };
  listing?: {
    title?: string;
    description?: string;
    category?: string;
    unit?: string;
    notes?: string;
  };
  order?: {
    status?: string;
    paymentStatus?: string;
    paymentMethod?: string;
    totalText?: string;
    itemsSummary?: string;
    roleView?: 'farmer' | 'buyer';
  };
  chat?: {
    productName?: string;
    excerpt?: string;
    negotiationStatus?: string;
  };
  harvest?: {
    crop?: string;
    storage?: string;
    district?: string;
    state?: string;
    notes?: string;
  };
}

// Language type
export type Language = 'en' | 'hi';
