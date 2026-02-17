// User types
export type UserRole = 'farmer' | 'buyer' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
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
}

export interface Farmer extends User {
  role: 'farmer';
  farmSize: string;
  crops: string[];
  rating: number;
  totalSales: number;
  aadhaarNumber?: string;
  kisanId?: string;
}

export interface Buyer extends User {
  role: 'buyer';
  businessName?: string;
  businessType: 'retailer' | 'wholesaler' | 'processor' | 'individual';
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
}

// Order types
export type OrderStatus = 
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled';

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
  status: OrderStatus;
  paymentStatus: 'pending' | 'paid' | 'refunded';
  paymentMethod: 'razorpay' | 'cod' | 'bank_transfer';
  deliveryAddress: string;
  expectedDelivery?: string;
  createdAt: string;
  updatedAt: string;
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
}

// Language type
export type Language = 'en' | 'hi';
