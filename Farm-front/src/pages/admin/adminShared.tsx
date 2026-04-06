import { useRef } from 'react';
import {
  MoreVertical,
  Mail,
  Ban,
  BadgeCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { apiService } from '@/services/api';
import { ADMIN_PANEL_TABS } from '@/constants';
import { resolveFarmerAvatarUrl } from '@/lib/farmerAvatarUrl';

export function formatInrAdmin(n: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(n);
}

export type OverviewMonthlyRow = {
  key: string;
  label: string;
  name: string;
  orders: number;
  revenue: number;
  users: number;
};

export type OverviewCategoryRow = {
  category: string;
  count: number;
  value: number;
  name: string;
  color: string;
};

export function buildEmptyMonthlyOverview(): OverviewMonthlyRow[] {
  const now = new Date();
  const out: OverviewMonthlyRow[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const y = d.getFullYear();
    const m = d.getMonth() + 1;
    const key = `${y}-${String(m).padStart(2, '0')}`;
    const label = d.toLocaleString('en-IN', { month: 'short' });
    out.push({ key, label, name: label, orders: 0, revenue: 0, users: 0 });
  }
  return out;
}

export type AdminWithdrawalRow = {
  id: string;
  farmerId: string;
  farmerName: string;
  farmerPhone: string;
  farmerEmail: string;
  amount: number;
  bankAccount: {
    accountNumber: string;
    ifscCode: string;
    bankName: string;
    accountHolderName: string;
  };
  status: string;
  requestedAt: string;
  processedAt?: string;
  rejectionReason?: string;
};

export type AdminSupportTicketReply = {
  id: string;
  fromRole: 'user' | 'admin';
  body: string;
  authorName: string;
  createdAt: string;
};

export type AdminSupportTicketRow = {
  id: string;
  subject: string;
  message: string;
  status: string;
  guestEmail: string;
  user: { id: string; name: string; email: string; phone?: string; role?: string } | null;
  replies: AdminSupportTicketReply[];
  replyCount: number;
  emailNotified: boolean;
  createdAt: string;
  updatedAt: string;
  lastReplyAt?: string;
};

export function AdminKycPreview({ url }: { url: string }) {
  const clean = url.split('?')[0].toLowerCase();
  const isPdf = clean.endsWith('.pdf');
  if (isPdf) {
    return (
      <p className="text-sm text-muted-foreground py-6 text-center border rounded-lg bg-background">
        PDF file — open in a new tab to view or download.
      </p>
    );
  }
  return (
    <img
      src={url}
      alt="KYC document"
      className="max-h-56 w-full object-contain rounded-lg border bg-background"
    />
  );
}

export const ADMIN_TAB_SET = new Set<string>(ADMIN_PANEL_TABS);

export function adminUserAvatarUrl(u: { avatar?: string | null; name?: string }, fallbackLabel: string) {
  return (
    resolveFarmerAvatarUrl(u.avatar) ||
    'https://ui-avatars.com/api/?name=' + encodeURIComponent(u.name || fallbackLabel)
  );
}

export function mapBackendUserToFarmer(u: any) {
  const avg =
    u.avgRating != null && Number.isFinite(Number(u.avgRating))
      ? Math.round(Number(u.avgRating) * 10) / 10
      : null;
  const reviewCount = Number(u.reviewCount) || 0;
  return {
    id: u._id || u.id,
    name: u.name,
    email: u.email,
    phone: u.phone,
    location: u.location || {},
    rating: avg,
    reviewCount,
    totalSales: Number(u.deliveredOrderCount) || 0,
    farmSize: u.farmSize || 'N/A',
    crops: u.crops || '',
    kycStatus: u.kycStatus || 'pending',
    kycRejectionReason: u.kycRejectionReason || '',
    isVerified: u.kycStatus === 'approved',
    avatar: adminUserAvatarUrl(u, 'Farmer'),
    kycDocuments: u.kycDocuments || [],
    role: 'farmer' as const,
    accountStatus: u.accountStatus || 'active',
    emailVerified: !!u.emailVerified,
  };
}

export function mapBackendUserToBuyer(u: any) {
  return {
    id: u._id || u.id,
    name: u.name,
    email: u.email,
    phone: u.phone,
    location: u.location || {},
    kycStatus: u.kycStatus || 'pending',
    avatar: adminUserAvatarUrl(u, 'Buyer'),
    businessName: u.name,
    businessType: 'Buyer',
    totalOrders: Number(u.orderCount) || 0,
    role: 'buyer' as const,
    accountStatus: u.accountStatus || 'active',
    emailVerified: !!u.emailVerified,
  };
}

export const USER_SEARCH_DEBOUNCE_MS = 400;
export const USERS_PAGE_SIZE = 10;
export const KYC_PAGE_SIZE = 6;
export const LISTINGS_PAGE_SIZE = 12;
export const WITHDRAWALS_PAGE_SIZE = 25;
export const REVIEWS_PAGE_SIZE = 12;
export const AUDIT_PAGE_SIZE = 25;
export const ADMIN_ORDERS_PAGE_SIZE = 25;
export const SUPPORT_TICKETS_PAGE_SIZE = 25;
export const SUPPORT_SEARCH_DEBOUNCE_MS = 350;
export const AUDIT_SEARCH_DEBOUNCE_MS = 350;

export const AUDIT_FILTER_ALL = 'all';

export const AUDIT_RESOURCE_TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: 'user', label: 'User' },
  { value: 'product', label: 'Product / listing' },
  { value: 'review', label: 'Review' },
  { value: 'withdrawal', label: 'Withdrawal' },
  { value: 'support_ticket', label: 'Support ticket' },
  { value: 'notification_broadcast', label: 'Notification broadcast' },
];

export const AUDIT_ACTION_OPTIONS: { value: string; label: string }[] = [
  { value: 'kyc.approve', label: 'KYC approve' },
  { value: 'kyc.reject', label: 'KYC reject' },
  { value: 'listing.activate', label: 'Listing activate' },
  { value: 'listing.remove', label: 'Listing remove' },
  { value: 'listing.suspend', label: 'Listing suspend' },
  { value: 'review.approve', label: 'Review approve' },
  { value: 'review.remove', label: 'Review remove' },
  { value: 'user.patch', label: 'User update' },
  { value: 'user.password_reset_email', label: 'Password reset email' },
  { value: 'withdrawal.update', label: 'Withdrawal update' },
  { value: 'support_ticket_status', label: 'Support ticket status' },
  { value: 'support_ticket_reply', label: 'Support ticket reply' },
  { value: 'notifications.broadcast', label: 'Notifications broadcast' },
].sort((a, b) => a.label.localeCompare(b.label));

export type AuditLogRow = {
  id: string;
  createdAt: string;
  action: string;
  resourceType: string;
  resourceId: string;
  details: Record<string, unknown>;
  actor: { id: string; name?: string; email?: string; role?: string } | null;
  targetUser: { id: string; name?: string; email?: string } | null;
};

export function AdminPager(props: {
  skip: number;
  limit: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
  busy?: boolean;
}) {
  const { skip, limit, total, onPrev, onNext, busy } = props;
  const start = total === 0 ? 0 : skip + 1;
  const end = Math.min(skip + limit, total);
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between pt-4 text-sm text-muted-foreground">
      <span>
        {start}–{end} of {total}
      </span>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" disabled={busy || skip <= 0} onClick={onPrev}>
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={busy || skip + limit >= total}
          onClick={onNext}
        >
          Next
        </Button>
      </div>
    </div>
  );
}

export function AdminUserActionsMenu(props: {
  user: {
    id: string;
    role: string;
    accountStatus?: string;
    emailVerified?: boolean;
    email?: string;
  };
  onPatched: () => void;
}) {
  const { toast } = useToast();
  const { user, onPatched } = props;
  const busy = useRef(false);

  if (user.role === 'admin') {
    return null;
  }

  const run = async (fn: () => Promise<void>) => {
    if (busy.current) return;
    busy.current = true;
    try {
      await fn();
      onPatched();
    } catch (error: unknown) {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (error as Error)?.message ||
        'Action failed';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    } finally {
      busy.current = false;
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="outline" size="icon" className="shrink-0 h-9 w-9" aria-label="User actions">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        {user.accountStatus === 'suspended' ? (
          <DropdownMenuItem
            onClick={() =>
              void run(async () => {
                await apiService.admin.patchUser(user.id, { accountStatus: 'active' });
                toast({ title: 'Account activated' });
              })
            }
          >
            <BadgeCheck className="mr-2 h-4 w-4" />
            Activate account
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem
            onClick={() =>
              void run(async () => {
                await apiService.admin.patchUser(user.id, { accountStatus: 'suspended' });
                toast({ title: 'Account suspended' });
              })
            }
          >
            <Ban className="mr-2 h-4 w-4" />
            Suspend account
          </DropdownMenuItem>
        )}
        <DropdownMenuItem
          onClick={() =>
            void run(async () => {
              await apiService.admin.patchUser(user.id, { emailVerified: !user.emailVerified });
              toast({
                title: user.emailVerified ? 'Email marked unverified' : 'Email marked verified',
              });
            })
          }
        >
          <Mail className="mr-2 h-4 w-4" />
          {user.emailVerified ? 'Mark email unverified' : 'Mark email verified'}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() =>
            void run(async () => {
              await apiService.admin.sendPasswordResetEmail(user.id);
              toast({ title: 'Reset email sent', description: 'Check SMTP logs if mail is not delivered.' });
            })
          }
          disabled={!user.email?.trim()}
        >
          <Mail className="mr-2 h-4 w-4" />
          Send password reset email
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
