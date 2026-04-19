import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Users,
  Package,
  ShoppingCart,
  TrendingUp,
  Calendar,
  Activity,
  Wallet,
  Loader2,
  ClipboardList,
  ExternalLink,
  Star,
  Shield,
  Trash2,
  History,
  MessageCircle,
  Send,
  RefreshCw,
} from 'lucide-react';
import Layout from '@/components/layout/Layout';
import StatCard from '@/components/dashboard/StatCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAppSelector } from '@/hooks/useRedux';
import { AnimateOnScroll } from '@/components/animations';
import { Skeleton } from '@/components/ui/skeleton';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { apiService } from '@/services/api';
import { saveCsvFromApi } from '@/lib/downloadCsv';
import { Order, OrderDetail, Product } from '@/types';
import { mapApiOrderToOrder, mapApiOrderToDetail } from '@/lib/mapOrderFromApi';
import { OrderStatusTimeline } from '@/components/orders/OrderStatusTimeline';
import { ADMIN_PANEL_TABS, type AdminPanelTab } from '@/constants';
import { resolveFarmerAvatarUrl } from '@/lib/farmerAvatarUrl';
import {
  LISTING_IMAGE_PLACEHOLDER,
  optimizeListingImageUrl,
  sanitizeImageUrlList,
} from '@/lib/productImageUrl';
import { AdminDashboardProvider, type AdminDashboardModel } from './adminDashboardContext';
import type { OverviewMonthlyRow, OverviewCategoryRow, AdminWithdrawalRow, AdminSupportTicketRow, AuditLogRow } from './adminShared';
import {
  formatInrAdmin,
  buildEmptyMonthlyOverview,
  ADMIN_TAB_SET,
  mapBackendUserToFarmer,
  mapBackendUserToBuyer,
  USER_SEARCH_DEBOUNCE_MS,
  USERS_PAGE_SIZE,
  KYC_PAGE_SIZE,
  LISTINGS_PAGE_SIZE,
  WITHDRAWALS_PAGE_SIZE,
  REVIEWS_PAGE_SIZE,
  AUDIT_PAGE_SIZE,
  ADMIN_ORDERS_PAGE_SIZE,
  SUPPORT_TICKETS_PAGE_SIZE,
  SUPPORT_SEARCH_DEBOUNCE_MS,
  AUDIT_SEARCH_DEBOUNCE_MS,
} from './adminShared';

const LazyOverviewTab = lazy(() => import('./tabs/OverviewTab'));
const LazyOrdersTab = lazy(() => import('./tabs/OrdersTab'));
const LazyUsersTab = lazy(() => import('./tabs/UsersTab'));
const LazyPayoutsTab = lazy(() => import('./tabs/PayoutsTab'));
const LazyKycTab = lazy(() => import('./tabs/KycTab'));
const LazyListingsTab = lazy(() => import('./tabs/ListingsTab'));
const LazyReviewsTab = lazy(() => import('./tabs/ReviewsTab'));
const LazySupportTab = lazy(() => import('./tabs/SupportTab'));
const LazyAuditTab = lazy(() => import('./tabs/AuditTab'));

function AdminTabSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <Skeleton className="h-40 w-full rounded-xl" />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
      <Skeleton className="h-48 w-full rounded-xl" />
    </div>
  );
}

function AdminDashboardShellSkeleton() {
  return (
    <>
      <div className="mb-8 space-y-3">
        <Skeleton className="h-9 w-52 rounded-full" />
        <Skeleton className="h-12 w-full max-w-md" />
        <Skeleton className="h-5 w-80" />
      </div>
      <div className="mb-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-28 rounded-2xl" />
        ))}
      </div>
      <Skeleton className="mb-6 h-12 w-full rounded-lg" />
      <AdminTabSkeleton />
    </>
  );
}

const AdminDashboard = () => {
  const { toast } = useToast();
  const { currentLanguage } = useAppSelector((s) => s.language);
  const [searchParams, setSearchParams] = useSearchParams();

  const rawTab = searchParams.get('tab');
  const adminTab: AdminPanelTab = useMemo(() => {
    if (rawTab && ADMIN_TAB_SET.has(rawTab)) return rawTab as AdminPanelTab;
    return 'overview';
  }, [rawTab]);

  const tabInUrl = searchParams.get('tab');
  useEffect(() => {
    if (tabInUrl === adminTab) return;
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set('tab', adminTab);
        return next;
      },
      { replace: true }
    );
  }, [tabInUrl, adminTab, setSearchParams]);

  const handleAdminTabChange = useCallback(
    (value: string) => {
      if (!ADMIN_TAB_SET.has(value)) return;
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.set('tab', value);
          return next;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );
  const [kycFilter, setKycFilter] = useState('pending');
  const [searchQuery, setSearchQuery] = useState('');

  const [overviewPendingKycFarmers, setOverviewPendingKycFarmers] = useState<any[]>([]);
  const [pageFarmers, setPageFarmers] = useState<any[]>([]);
  const [pageBuyers, setPageBuyers] = useState<any[]>([]);
  const [skipFarmers, setSkipFarmers] = useState(0);
  const [skipBuyers, setSkipBuyers] = useState(0);
  const [totalFarmersUsers, setTotalFarmersUsers] = useState(0);
  const [totalBuyersUsers, setTotalBuyersUsers] = useState(0);
  const [usersTabLoading, setUsersTabLoading] = useState(false);

  const [kycFarmersPage, setKycFarmersPage] = useState<any[]>([]);
  const [kycTotal, setKycTotal] = useState(0);
  const [kycSkip, setKycSkip] = useState(0);
  const [kycLoading, setKycLoading] = useState(false);

  const [listings, setListings] = useState<Product[]>([]);
  const [listingsSkip, setListingsSkip] = useState(0);
  const [listingsTotalCount, setListingsTotalCount] = useState(0);
  const [listingSearch, setListingSearch] = useState('');
  const [debouncedListingSearch, setDebouncedListingSearch] = useState('');
  const [listingsLoading, setListingsLoading] = useState(false);
  const [listingDrawerProduct, setListingDrawerProduct] = useState<Product | null>(null);
  const [listingDrawerImageIndex, setListingDrawerImageIndex] = useState(0);

  const [pendingReviewsList, setPendingReviewsList] = useState<any[]>([]);
  const [pendingReviewsTotal, setPendingReviewsTotal] = useState(0);
  const [pendingReviewsSkip, setPendingReviewsSkip] = useState(0);
  const [publishedReviewsList, setPublishedReviewsList] = useState<any[]>([]);
  const [publishedReviewsTotal, setPublishedReviewsTotal] = useState(0);
  const [publishedReviewsSkip, setPublishedReviewsSkip] = useState(0);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [auditLogs, setAuditLogs] = useState<AuditLogRow[]>([]);
  const [auditTotal, setAuditTotal] = useState(0);
  const [auditSkip, setAuditSkip] = useState(0);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditResourceFilter, setAuditResourceFilter] = useState('');
  const [auditActionFilter, setAuditActionFilter] = useState('');
  const [auditActionSearchInput, setAuditActionSearchInput] = useState('');
  const [debouncedAuditActionSearch, setDebouncedAuditActionSearch] = useState('');
  const [supportTickets, setSupportTickets] = useState<AdminSupportTicketRow[]>([]);
  const [supportTicketsTotal, setSupportTicketsTotal] = useState(0);
  const [supportTicketsSkip, setSupportTicketsSkip] = useState(0);
  const [supportTicketsLoading, setSupportTicketsLoading] = useState(false);
  const [supportStatusFilter, setSupportStatusFilter] = useState<string>('all');
  const [supportSearchInput, setSupportSearchInput] = useState('');
  const [debouncedSupportSearch, setDebouncedSupportSearch] = useState('');
  const [supportSheetOpen, setSupportSheetOpen] = useState(false);
  const [supportSheetId, setSupportSheetId] = useState<string | null>(null);
  const [supportSheetTicket, setSupportSheetTicket] = useState<AdminSupportTicketRow | null>(null);
  const [supportSheetLoading, setSupportSheetLoading] = useState(false);
  const [supportReplyText, setSupportReplyText] = useState('');
  const [supportReplySubmitting, setSupportReplySubmitting] = useState(false);
  const [supportStatusPatching, setSupportStatusPatching] = useState(false);

  // Admin notification broadcast / targeted announcements
  const [notifAudience, setNotifAudience] = useState<'all_farmers' | 'all_buyers' | 'user'>('all_farmers');
  const [notifRecipientUserId, setNotifRecipientUserId] = useState('');
  const [notifTitle, setNotifTitle] = useState('');
  const [notifMessage, setNotifMessage] = useState('');
  const [notifLink, setNotifLink] = useState('');
  const [notifBroadcastBusy, setNotifBroadcastBusy] = useState(false);
  const [notifLastRecipients, setNotifLastRecipients] = useState<number | null>(null);

  const [overviewRecentOrders, setOverviewRecentOrders] = useState<Order[]>([]);
  const [adminOrders, setAdminOrders] = useState<Order[]>([]);
  const [adminOrdersTotal, setAdminOrdersTotal] = useState(0);
  const [adminOrdersSkip, setAdminOrdersSkip] = useState(0);
  const [ordersTabLoading, setOrdersTabLoading] = useState(false);
  const [adminOrderPreviewId, setAdminOrderPreviewId] = useState<string | null>(null);
  const [adminOrderPreviewDetail, setAdminOrderPreviewDetail] = useState<OrderDetail | null>(null);
  const [adminOrderPreviewLoading, setAdminOrderPreviewLoading] = useState(false);
  const [withdrawals, setWithdrawals] = useState<AdminWithdrawalRow[]>([]);
  const [withdrawalsTotal, setWithdrawalsTotal] = useState(0);
  const [withdrawalsSkip, setWithdrawalsSkip] = useState(0);
  const [payoutsLoading, setPayoutsLoading] = useState(false);
  const [withdrawalFilter, setWithdrawalFilter] = useState<string>('all');
  const [withdrawalActionId, setWithdrawalActionId] = useState<string | null>(null);
  const [rejectTarget, setRejectTarget] = useState<AdminWithdrawalRow | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [kycRejectTarget, setKycRejectTarget] = useState<{ id: string; name: string } | null>(null);
  const [kycRejectReason, setKycRejectReason] = useState('');
  const [kycRejectSubmitting, setKycRejectSubmitting] = useState(false);
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('all');
  const [orderPaymentFilter, setOrderPaymentFilter] = useState<string>('all');
  const [orderDatePreset, setOrderDatePreset] = useState<'all' | '7d' | '30d' | '90d' | 'custom'>('all');
  const [orderDateFrom, setOrderDateFrom] = useState('');
  const [orderDateTo, setOrderDateTo] = useState('');
  const [stats, setStats] = useState<any | null>(null);
  const [overviewAnalytics, setOverviewAnalytics] = useState<{
    monthly: OverviewMonthlyRow[];
    categories: OverviewCategoryRow[];
  } | null>(null);
  const firstFetchDoneRef = useRef(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [csvExporting, setCsvExporting] = useState<'orders' | 'payouts' | null>(null);
  const [debouncedUserSearch, setDebouncedUserSearch] = useState('');
  const [searchFarmers, setSearchFarmers] = useState<any[]>([]);
  const [searchBuyers, setSearchBuyers] = useState<any[]>([]);
  const [isUserSearchLoading, setIsUserSearchLoading] = useState(false);
  const [usersRefreshKey, setUsersRefreshKey] = useState(0);

  useEffect(() => {
    const t = window.setTimeout(() => {
      setDebouncedUserSearch(searchQuery.trim());
    }, USER_SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(t);
  }, [searchQuery]);

  useEffect(() => {
    if (!debouncedUserSearch) {
      setSearchFarmers([]);
      setSearchBuyers([]);
      setIsUserSearchLoading(false);
      return;
    }

    let cancelled = false;
    setIsUserSearchLoading(true);
    setSearchFarmers([]);
    setSearchBuyers([]);

    (async () => {
      try {
        const res = await apiService.admin.getUsers({
          search: debouncedUserSearch,
          limit: 50,
          skip: 0,
        });
        const users = (res.data?.users || []).filter(
          (u: any) => !/^StockTest\s+(Buyer\s+[AB]|Farmer)\b/i.test(String(u?.name || ''))
        );
        if (cancelled) return;
        setSearchFarmers(
          users.filter((u: any) => u.role === 'farmer').map(mapBackendUserToFarmer)
        );
        setSearchBuyers(users.filter((u: any) => u.role === 'buyer').map(mapBackendUserToBuyer));
      } catch {
        if (!cancelled) {
          setSearchFarmers([]);
          setSearchBuyers([]);
          toast({
            title: 'User search failed',
            description: 'Could not load matching users. Try again.',
            variant: 'destructive',
          });
        }
      } finally {
        if (!cancelled) setIsUserSearchLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [debouncedUserSearch, toast]);

  useEffect(() => {
    const t = window.setTimeout(() => {
      setDebouncedListingSearch(listingSearch.trim());
    }, 400);
    return () => window.clearTimeout(t);
  }, [listingSearch]);

  useEffect(() => {
    setListingsSkip(0);
  }, [debouncedListingSearch]);

  useEffect(() => {
    setKycSkip(0);
  }, [kycFilter]);

  useEffect(() => {
    setWithdrawalsSkip(0);
  }, [withdrawalFilter]);

  useEffect(() => {
    const t = window.setTimeout(() => {
      setDebouncedAuditActionSearch(auditActionSearchInput.trim());
    }, AUDIT_SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(t);
  }, [auditActionSearchInput]);

  useEffect(() => {
    setAuditSkip(0);
  }, [auditResourceFilter, auditActionFilter, debouncedAuditActionSearch]);

  useEffect(() => {
    const t = window.setTimeout(() => {
      setDebouncedSupportSearch(supportSearchInput.trim());
    }, SUPPORT_SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(t);
  }, [supportSearchInput]);

  useEffect(() => {
    setSupportTicketsSkip(0);
  }, [supportStatusFilter, debouncedSupportSearch]);

  const mapProductFromApi = useCallback((p: any): Product => {
    return {
      id: p._id || p.id,
      farmerId: p.farmer?._id || p.farmer || '',
      farmerName: p.farmer?.name || 'Farmer',
      farmerAvatar: resolveFarmerAvatarUrl(p.farmer?.avatar),
      farmerPhone: p.farmer?.phone || undefined,
      farmerEmail: p.farmer?.email || undefined,
      farmerKycStatus: p.farmer?.kycStatus || undefined,
      farmerRating:
        p.farmerAvgRating != null && Number.isFinite(Number(p.farmerAvgRating))
          ? Math.round(Number(p.farmerAvgRating) * 10) / 10
          : 0,
      farmerLocation: p.farmer?.location
        ? `${p.farmer.location.district}, ${p.farmer.location.state}`
        : '',
      name: p.name,
      nameHindi: p.nameHindi,
      category: p.category,
      description: p.description || '',
      images: sanitizeImageUrlList(p.images),
      price: p.price,
      unit: p.unit,
      minOrderQuantity: p.minOrderQuantity || 1,
      availableQuantity: p.availableQuantity,
      harvestDate: p.harvestDate || new Date().toISOString(),
      isOrganic: !!p.isOrganic,
      isNegotiable: !!p.isNegotiable,
      status: (p.status as Product['status']) || 'active',
      createdAt: p.createdAt || new Date().toISOString(),
      views: p.views || 0,
      inquiries: 0,
    };
  }, []);

  const mapReviewRow = useCallback((r: any) => {
    return {
      id: r._id || r.id,
      reviewerName: r.reviewer?.name || 'User',
      targetName: r.target?.name || 'Farmer',
      rating: r.rating,
      productName: r.product?.name || 'Product',
      comment: r.comment,
      createdAt: r.createdAt || new Date().toISOString(),
      isApproved: r.isApproved,
    };
  }, []);

  const mapWithdrawalRow = useCallback((w: any): AdminWithdrawalRow => {
    return {
      id: w.id,
      farmerId: w.farmerId,
      farmerName: w.farmerName || 'Farmer',
      farmerPhone: w.farmerPhone || '',
      farmerEmail: w.farmerEmail || '',
      amount: w.amount,
      bankAccount: w.bankAccount || {
        accountNumber: '',
        ifscCode: '',
        bankName: '',
        accountHolderName: '',
      },
      status: w.status,
      requestedAt: w.requestedAt,
      processedAt: w.processedAt,
      rejectionReason: w.rejectionReason,
    };
  }, []);

  const buildAdminOrdersApiParams = useCallback((): {
    status?: string;
    paymentStatus?: string;
    dateFrom?: string;
    dateTo?: string;
  } => {
    const out: {
      status?: string;
      paymentStatus?: string;
      dateFrom?: string;
      dateTo?: string;
    } = {};
    if (orderStatusFilter !== 'all') out.status = orderStatusFilter;
    if (orderPaymentFilter !== 'all') out.paymentStatus = orderPaymentFilter;
    const end = new Date();
    if (orderDatePreset === '7d' || orderDatePreset === '30d' || orderDatePreset === '90d') {
      const days = orderDatePreset === '7d' ? 7 : orderDatePreset === '30d' ? 30 : 90;
      const start = new Date();
      start.setDate(start.getDate() - days);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      out.dateFrom = start.toISOString();
      out.dateTo = end.toISOString();
    } else if (orderDatePreset === 'custom') {
      if (orderDateFrom) {
        const s = new Date(`${orderDateFrom}T00:00:00`);
        if (!Number.isNaN(s.getTime())) out.dateFrom = s.toISOString();
      }
      if (orderDateTo) {
        const e = new Date(`${orderDateTo}T23:59:59.999`);
        if (!Number.isNaN(e.getTime())) out.dateTo = e.toISOString();
      }
    }
    return out;
  }, [
    orderStatusFilter,
    orderPaymentFilter,
    orderDatePreset,
    orderDateFrom,
    orderDateTo,
  ]);

  useEffect(() => {
    if (adminTab !== 'orders') return;
    let cancelled = false;
    (async () => {
      setOrdersTabLoading(true);
      try {
        const filterParams = buildAdminOrdersApiParams();
        const res = await apiService.orders.getAll({
          limit: ADMIN_ORDERS_PAGE_SIZE,
          skip: adminOrdersSkip,
          ...filterParams,
        });
        if (cancelled) return;
        const list = (res.data?.orders || []).map((o: any) => mapApiOrderToOrder(o));
        setAdminOrders(list);
        setAdminOrdersTotal(Number(res.data?.total) || 0);
      } catch {
        if (!cancelled) {
          setAdminOrders([]);
          setAdminOrdersTotal(0);
          toast({
            title: 'Failed to load orders',
            description: 'Could not load this page. Try again.',
            variant: 'destructive',
          });
        }
      } finally {
        if (!cancelled) setOrdersTabLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [adminTab, adminOrdersSkip, buildAdminOrdersApiParams, toast]);

  useEffect(() => {
    if (!adminOrderPreviewId) {
      setAdminOrderPreviewDetail(null);
      return;
    }
    let cancelled = false;
    (async () => {
      setAdminOrderPreviewLoading(true);
      try {
        const res = await apiService.orders.getById(adminOrderPreviewId);
        const raw = res.data?.order;
        if (cancelled) return;
        setAdminOrderPreviewDetail(raw ? mapApiOrderToDetail(raw) : null);
        if (!raw && !cancelled) {
          toast({
            title: 'Order not found',
            description: 'This order could not be loaded.',
            variant: 'destructive',
          });
        }
      } catch {
        if (!cancelled) {
          setAdminOrderPreviewDetail(null);
          toast({
            title: 'Could not load order',
            description: 'Try again or open the full page.',
            variant: 'destructive',
          });
        }
      } finally {
        if (!cancelled) setAdminOrderPreviewLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [adminOrderPreviewId, toast]);

  const loadAdminShellData = useCallback(async () => {
    if (firstFetchDoneRef.current) setIsRefreshing(true);
    try {
      const [statsRes, overviewRes, pendingKycRes, recentOrdersRes] = await Promise.all([
        apiService.admin.getStats(),
        apiService.admin.getOverviewAnalytics().catch((err) => {
          console.error('Admin overview analytics failed', err);
          return { data: null };
        }),
        apiService.admin.getUsers({
          role: 'farmer',
          kycStatus: 'pending',
          limit: 3,
          skip: 0,
        }),
        apiService.orders.getAll({ limit: 5, skip: 0 }),
      ]);

      const backendStats = statsRes.data?.stats || null;
      const recentRaw = recentOrdersRes.data?.orders || [];
      const mappedRecent: Order[] = recentRaw.map((o: any) => mapApiOrderToOrder(o));

      const pendingUsers = pendingKycRes.data?.users || [];
      setOverviewPendingKycFarmers(pendingUsers.map(mapBackendUserToFarmer));

      setStats(backendStats);
      const ov = overviewRes.data;
      if (ov?.monthly?.length) {
        setOverviewAnalytics({
          monthly: ov.monthly,
          categories: Array.isArray(ov.categories) ? ov.categories : [],
        });
      } else {
        setOverviewAnalytics(null);
      }
      setOverviewRecentOrders(mappedRecent);
    } catch (error: any) {
      console.error('Failed to load admin dashboard data', error);
      toast({
        title: 'Failed to load dashboard',
        description: error?.response?.data?.message || 'Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setIsRefreshing(false);
      setInitialLoading(false);
      firstFetchDoneRef.current = true;
    }
  }, [toast]);

  useEffect(() => {
    void loadAdminShellData();
  }, [loadAdminShellData]);

  usePullToRefresh(
    useCallback(() => {
      void loadAdminShellData();
    }, [loadAdminShellData]),
    { enabled: !initialLoading }
  );

  useEffect(() => {
    if (adminTab !== 'users' || debouncedUserSearch) return;
    let cancelled = false;
    (async () => {
      setUsersTabLoading(true);
      try {
        const [fRes, bRes] = await Promise.all([
          apiService.admin.getUsers({
            role: 'farmer',
            limit: USERS_PAGE_SIZE,
            skip: skipFarmers,
          }),
          apiService.admin.getUsers({
            role: 'buyer',
            limit: USERS_PAGE_SIZE,
            skip: skipBuyers,
          }),
        ]);
        if (cancelled) return;
        setPageFarmers((fRes.data?.users || []).map(mapBackendUserToFarmer));
        setTotalFarmersUsers(Number(fRes.data?.total) || 0);
        setPageBuyers((bRes.data?.users || []).map(mapBackendUserToBuyer));
        setTotalBuyersUsers(Number(bRes.data?.total) || 0);
      } catch {
        if (!cancelled) {
          toast({
            title: 'Failed to load users',
            description: 'Try another page or refresh.',
            variant: 'destructive',
          });
        }
      } finally {
        if (!cancelled) setUsersTabLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [adminTab, debouncedUserSearch, skipFarmers, skipBuyers, usersRefreshKey, toast]);

  useEffect(() => {
    if (adminTab !== 'kyc') return;
    let cancelled = false;
    (async () => {
      setKycLoading(true);
      try {
        const params: Record<string, string | number> = {
          role: 'farmer',
          limit: KYC_PAGE_SIZE,
          skip: kycSkip,
        };
        if (kycFilter !== 'all') params.kycStatus = kycFilter;
        const res = await apiService.admin.getUsers(params);
        if (cancelled) return;
        setKycFarmersPage((res.data?.users || []).map(mapBackendUserToFarmer));
        setKycTotal(Number(res.data?.total) || 0);
      } catch {
        if (!cancelled) {
          toast({
            title: 'Failed to load KYC list',
            variant: 'destructive',
          });
        }
      } finally {
        if (!cancelled) setKycLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [adminTab, kycFilter, kycSkip, toast]);

  useEffect(() => {
    if (adminTab !== 'listings') return;
    let cancelled = false;
    (async () => {
      setListingsLoading(true);
      try {
        const res = await apiService.products.getAll({
          limit: LISTINGS_PAGE_SIZE,
          skip: listingsSkip,
          includeTotal: true,
          ...(debouncedListingSearch ? { search: debouncedListingSearch } : {}),
        });
        if (cancelled) return;
        const raw = res.data?.products || [];
        const tot = res.data?.total;
        setListingsTotalCount(typeof tot === 'number' ? tot : raw.length);
        setListings(raw.map(mapProductFromApi));
      } catch {
        if (!cancelled) {
          toast({
            title: 'Failed to load listings',
            variant: 'destructive',
          });
        }
      } finally {
        if (!cancelled) setListingsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [adminTab, listingsSkip, debouncedListingSearch, mapProductFromApi, toast]);

  useEffect(() => {
    if (adminTab !== 'reviews') return;
    let cancelled = false;
    (async () => {
      setReviewsLoading(true);
      try {
        const [pRes, pubRes] = await Promise.all([
          apiService.admin.listReviews({
            isApproved: 'false',
            limit: REVIEWS_PAGE_SIZE,
            skip: pendingReviewsSkip,
          }),
          apiService.admin.listReviews({
            isApproved: 'true',
            limit: REVIEWS_PAGE_SIZE,
            skip: publishedReviewsSkip,
          }),
        ]);
        if (cancelled) return;
        setPendingReviewsList((pRes.data?.reviews || []).map(mapReviewRow));
        setPendingReviewsTotal(Number(pRes.data?.total) || 0);
        setPublishedReviewsList((pubRes.data?.reviews || []).map(mapReviewRow));
        setPublishedReviewsTotal(Number(pubRes.data?.total) || 0);
      } catch {
        if (!cancelled) {
          toast({
            title: 'Failed to load reviews',
            variant: 'destructive',
          });
        }
      } finally {
        if (!cancelled) setReviewsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [adminTab, pendingReviewsSkip, publishedReviewsSkip, mapReviewRow, toast]);

  useEffect(() => {
    if (adminTab !== 'payouts') return;
    let cancelled = false;
    (async () => {
      setPayoutsLoading(true);
      try {
        const params: Record<string, string | number> = {
          limit: WITHDRAWALS_PAGE_SIZE,
          skip: withdrawalsSkip,
        };
        if (withdrawalFilter !== 'all') params.status = withdrawalFilter;
        const res = await apiService.admin.listWithdrawals(params);
        if (cancelled) return;
        setWithdrawals((res.data?.withdrawals || []).map(mapWithdrawalRow));
        setWithdrawalsTotal(Number(res.data?.total) || 0);
      } catch {
        if (!cancelled) {
          toast({
            title: 'Failed to load withdrawals',
            variant: 'destructive',
          });
        }
      } finally {
        if (!cancelled) setPayoutsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [adminTab, withdrawalFilter, withdrawalsSkip, mapWithdrawalRow, toast]);

  useEffect(() => {
    if (adminTab !== 'audit') return;
    let cancelled = false;
    (async () => {
      setAuditLoading(true);
      try {
        const params: {
          limit: number;
          skip: number;
          resourceType?: string;
          action?: string;
          actionSearch?: string;
        } = {
          limit: AUDIT_PAGE_SIZE,
          skip: auditSkip,
        };
        if (auditResourceFilter) params.resourceType = auditResourceFilter;
        if (auditActionFilter) params.action = auditActionFilter;
        else if (debouncedAuditActionSearch) params.actionSearch = debouncedAuditActionSearch;

        const res = await apiService.admin.listAuditLogs(params);
        if (cancelled) return;
        setAuditLogs(res.data?.entries || []);
        setAuditTotal(Number(res.data?.total) || 0);
      } catch {
        if (!cancelled) {
          toast({
            title: 'Failed to load audit log',
            variant: 'destructive',
          });
        }
      } finally {
        if (!cancelled) setAuditLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [
    adminTab,
    auditSkip,
    auditResourceFilter,
    auditActionFilter,
    debouncedAuditActionSearch,
    toast,
  ]);

  useEffect(() => {
    if (adminTab !== 'support') return;
    let cancelled = false;
    (async () => {
      setSupportTicketsLoading(true);
      try {
        const params: Record<string, string | number> = {
          limit: SUPPORT_TICKETS_PAGE_SIZE,
          skip: supportTicketsSkip,
        };
        if (supportStatusFilter !== 'all') params.status = supportStatusFilter;
        if (debouncedSupportSearch) params.search = debouncedSupportSearch;
        const res = await apiService.admin.listSupportTickets(params);
        if (cancelled) return;
        setSupportTickets((res.data?.tickets || []) as AdminSupportTicketRow[]);
        setSupportTicketsTotal(Number(res.data?.total) || 0);
      } catch {
        if (!cancelled) {
          toast({
            title: 'Failed to load support tickets',
            variant: 'destructive',
          });
          setSupportTickets([]);
          setSupportTicketsTotal(0);
        }
      } finally {
        if (!cancelled) setSupportTicketsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [adminTab, supportTicketsSkip, supportStatusFilter, debouncedSupportSearch, toast]);

  useEffect(() => {
    if (!supportSheetOpen || !supportSheetId) return;
    let cancelled = false;
    (async () => {
      setSupportSheetLoading(true);
      try {
        const res = await apiService.admin.getSupportTicket(supportSheetId);
        if (cancelled) return;
        setSupportSheetTicket((res.data?.ticket || null) as AdminSupportTicketRow | null);
      } catch {
        if (!cancelled) {
          setSupportSheetTicket(null);
          toast({
            title: 'Failed to load ticket',
            description: 'Try closing and opening again.',
            variant: 'destructive',
          });
        }
      } finally {
        if (!cancelled) setSupportSheetLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [supportSheetOpen, supportSheetId, toast]);

  const chartData = useMemo(() => {
    if (overviewAnalytics?.monthly?.length) return overviewAnalytics.monthly;
    return buildEmptyMonthlyOverview();
  }, [overviewAnalytics]);

  const categoryChartData = useMemo(() => overviewAnalytics?.categories ?? [], [overviewAnalytics]);

  const auditFiltersActive =
    Boolean(auditResourceFilter) ||
    Boolean(auditActionFilter) ||
    Boolean(debouncedAuditActionSearch);

  const orderStatCardSubtitle = useMemo(() => {
    const ob = stats?.orderStatusBreakdown as
      | {
          pending: number;
          processing: number;
          shipped: number;
          delivered: number;
          cancelled: number;
        }
      | undefined;
    if (!ob) {
      return `${Number(stats?.deliveredOrders) || 0} delivered`;
    }
    return (
      <div className="space-y-1 text-xs leading-snug">
        <p className="text-muted-foreground">
          <span className="text-warning font-medium">Pending {ob.pending}</span>
          {' · '}
          <span>Processing {ob.processing}</span>
          {' · '}
          <span>Shipped {ob.shipped}</span>
        </p>
        <p className="text-muted-foreground">
          <span className="text-success font-medium">Delivered {ob.delivered}</span>
          {' · '}
          <span className="text-destructive font-medium">Cancelled {ob.cancelled}</span>
        </p>
      </div>
    );
  }, [stats?.orderStatusBreakdown, stats?.deliveredOrders]);

  const handleKycApprove = async (farmerId: string) => {
    try {
      const response = await apiService.admin.approveKYC(farmerId);
      const updated = response.data?.user;

      const patchKyc = (f: any) =>
        f.id === farmerId
          ? {
              ...f,
              kycStatus: updated?.kycStatus || 'approved',
              isVerified: updated?.kycStatus === 'approved',
              kycDocuments: updated?.kycDocuments ?? f.kycDocuments,
              kycRejectionReason: '',
            }
          : f;

      try {
        const top = await apiService.admin.getUsers({
          role: 'farmer',
          kycStatus: 'pending',
          limit: 3,
          skip: 0,
        });
        setOverviewPendingKycFarmers((top.data?.users || []).map(mapBackendUserToFarmer));
      } catch {
        setOverviewPendingKycFarmers((prev) => prev.filter((f) => f.id !== farmerId));
      }
      setKycFarmersPage((prev) => prev.map(patchKyc));
      setSearchFarmers((prev) => prev.map(patchKyc));
      setPageFarmers((prev) => prev.map(patchKyc));

      const statsRes = await apiService.admin.getStats();
      setStats(statsRes.data?.stats ?? null);

      toast({
        title: 'KYC Approved',
        description: 'Farmer has been verified.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description:
          error?.response?.data?.message || error?.message || 'Failed to approve KYC.',
        variant: 'destructive',
      });
    }
  };

  const handleKycRejectSubmit = async () => {
    if (!kycRejectTarget) return;
    try {
      setKycRejectSubmitting(true);
      const trimmed = kycRejectReason.trim();
      const response = await apiService.admin.rejectKYC(kycRejectTarget.id, {
        reason: trimmed || undefined,
      });
      const updated = response.data?.user;
      const fid = kycRejectTarget.id;

      const patchKyc = (f: any) =>
        f.id === fid
          ? {
              ...f,
              kycStatus: 'rejected',
              isVerified: false,
              kycDocuments: updated?.kycDocuments ?? f.kycDocuments,
              kycRejectionReason: updated?.kycRejectionReason ?? trimmed,
            }
          : f;

      try {
        const top = await apiService.admin.getUsers({
          role: 'farmer',
          kycStatus: 'pending',
          limit: 3,
          skip: 0,
        });
        setOverviewPendingKycFarmers((top.data?.users || []).map(mapBackendUserToFarmer));
      } catch {
        setOverviewPendingKycFarmers((prev) => prev.filter((f) => f.id !== fid));
      }
      setKycFarmersPage((prev) => prev.map(patchKyc));
      setSearchFarmers((prev) => prev.map(patchKyc));
      setPageFarmers((prev) => prev.map(patchKyc));

      const statsRes = await apiService.admin.getStats();
      setStats(statsRes.data?.stats ?? null);

      setKycRejectTarget(null);
      setKycRejectReason('');
      toast({
        title: 'KYC Rejected',
        description: 'The farmer has been notified.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description:
          error?.response?.data?.message || error?.message || 'Failed to reject KYC.',
        variant: 'destructive',
      });
    } finally {
      setKycRejectSubmitting(false);
    }
  };

  const openListingDrawer = useCallback((p: Product) => {
    setListingDrawerImageIndex(0);
    setListingDrawerProduct(p);
  }, []);

  const handleListingAction = async (
    listingId: string,
    action: 'suspend' | 'activate' | 'remove'
  ) => {
    try {
      await apiService.admin.moderateListing(listingId, action);

      if (action === 'remove') {
        setListings((prev) => prev.filter((l) => l.id !== listingId));
        setListingsTotalCount((t) => Math.max(0, t - 1));
      } else {
        setListings((prev) =>
          prev.map((l) =>
            l.id === listingId
              ? { ...l, status: action === 'activate' ? ('active' as const) : ('hidden' as const) }
              : l
          )
        );
      }

      setListingDrawerProduct((cur) => {
        if (!cur || cur.id !== listingId) return cur;
        if (action === 'remove') return null;
        return {
          ...cur,
          status: action === 'activate' ? ('active' as const) : ('hidden' as const),
        };
      });

      toast({
        title:
          action === 'remove'
            ? 'Listing Removed'
            : action === 'activate'
              ? 'Listing Activated'
              : 'Listing Suspended',
        variant: action === 'remove' ? 'destructive' : 'default',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description:
          error?.response?.data?.message || error?.message || 'Failed to moderate listing.',
        variant: 'destructive',
      });
    }
  };

  const handleWithdrawalStatus = async (
    row: AdminWithdrawalRow,
    status: 'processing' | 'completed' | 'rejected',
    rejectionReason?: string
  ) => {
    try {
      setWithdrawalActionId(row.id);
      await apiService.admin.updateWithdrawal(row.id, {
        status,
        ...(status === 'rejected' ? { rejectionReason: rejectionReason?.trim() } : {}),
      });
      setWithdrawals((prev) =>
        prev.map((w) =>
          w.id === row.id
            ? {
                ...w,
                status,
                processedAt:
                  status === 'completed' || status === 'rejected'
                    ? new Date().toISOString()
                    : w.processedAt,
                rejectionReason:
                  status === 'rejected'
                    ? rejectionReason?.trim() || 'Rejected by admin'
                    : undefined,
              }
            : w
        )
      );
      setRejectTarget(null);
      setRejectReason('');
      toast({
        title: 'Withdrawal updated',
        description:
          status === 'completed'
            ? 'Marked as paid out.'
            : status === 'rejected'
              ? 'Farmer has been notified.'
              : 'Status set to processing.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description:
          error?.response?.data?.message || error?.message || 'Failed to update withdrawal.',
        variant: 'destructive',
      });
    } finally {
      setWithdrawalActionId(null);
    }
  };

  const handleExportOrdersCsv = async () => {
    try {
      setCsvExporting('orders');
      const filterParams = buildAdminOrdersApiParams();
      await saveCsvFromApi(
        () => apiService.orders.exportCsv(filterParams),
        'orders.csv'
      );
      toast({
        title: 'Orders exported',
        description: 'CSV uses the same filters as the list (up to the server row limit).',
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Could not download CSV.';
      toast({ title: 'Export failed', description: msg, variant: 'destructive' });
    } finally {
      setCsvExporting(null);
    }
  };

  const handleExportWithdrawalsCsv = async () => {
    try {
      setCsvExporting('payouts');
      const params =
        withdrawalFilter !== 'all' ? { status: withdrawalFilter } : undefined;
      await saveCsvFromApi(
        () => apiService.admin.exportWithdrawalsCsv(params),
        'withdrawals.csv'
      );
      toast({ title: 'Payouts exported', description: 'CSV download started.' });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Could not download CSV.';
      toast({ title: 'Export failed', description: msg, variant: 'destructive' });
    } finally {
      setCsvExporting(null);
    }
  };

  const handleReviewAction = async (reviewId: string, action: 'approve' | 'remove') => {
    try {
      await apiService.admin.moderateReview(reviewId, action);

      if (action === 'remove') {
        setPendingReviewsList((prev) => prev.filter((r) => r.id !== reviewId));
        setPublishedReviewsList((prev) => prev.filter((r) => r.id !== reviewId));
        toast({ title: 'Review Removed', variant: 'destructive' });
      } else {
        setPendingReviewsList((prev) => {
          const approved = prev.find((r) => r.id === reviewId);
          const next = prev.filter((r) => r.id !== reviewId);
          if (approved) {
            setPublishedReviewsList((pub) => [{ ...approved, isApproved: true }, ...pub]);
          }
          return next;
        });
        toast({ title: 'Review Approved' });
      }
      const statsRes = await apiService.admin.getStats();
      setStats(statsRes.data?.stats ?? null);
    } catch (error: any) {
      toast({
        title: 'Error',
        description:
          error?.response?.data?.message || error?.message || 'Failed to moderate review.',
        variant: 'destructive',
      });
    }
  };

  const getKycBadge = (status: string) => {
    switch (status) {
      case 'approved': return <Badge className="bg-success/10 text-success">Verified</Badge>;
      case 'rejected': return <Badge className="bg-destructive/10 text-destructive">Rejected</Badge>;
      default: return <Badge className="bg-warning/10 text-warning">Pending</Badge>;
    }
  };

  const supportStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'resolved':
        return 'bg-success/10 text-success border-success/20';
      case 'closed':
        return 'bg-muted text-muted-foreground';
      case 'in_progress':
        return 'bg-primary/10 text-primary border-primary/20';
      default:
        return 'bg-warning/10 text-warning border-warning/20';
    }
  };

  const openSupportTicketSheet = (id: string) => {
    setSupportSheetId(id);
    setSupportSheetOpen(true);
    setSupportReplyText('');
  };

  const refreshSupportTicketsAndStats = useCallback(async () => {
    if (adminTab !== 'support') return;
    setSupportTicketsLoading(true);
    try {
      const params: Record<string, string | number> = {
        limit: SUPPORT_TICKETS_PAGE_SIZE,
        skip: supportTicketsSkip,
      };
      if (supportStatusFilter !== 'all') params.status = supportStatusFilter;
      if (debouncedSupportSearch) params.search = debouncedSupportSearch;
      const res = await apiService.admin.listSupportTickets(params);
      setSupportTickets((res.data?.tickets || []) as AdminSupportTicketRow[]);
      setSupportTicketsTotal(Number(res.data?.total) || 0);
    } catch {
      toast({ title: 'Failed to refresh tickets', variant: 'destructive' });
    } finally {
      setSupportTicketsLoading(false);
    }
    try {
      const statsRes = await apiService.admin.getStats();
      setStats(statsRes.data?.stats ?? null);
    } catch {
      /* keep existing stats */
    }
  }, [
    adminTab,
    supportTicketsSkip,
    supportStatusFilter,
    debouncedSupportSearch,
    toast,
  ]);

  const handleSupportTicketReply = async () => {
    if (!supportSheetId || !supportReplyText.trim()) return;
    setSupportReplySubmitting(true);
    try {
      const res = await apiService.admin.replySupportTicket(supportSheetId, {
        message: supportReplyText.trim(),
      });
      setSupportSheetTicket((res.data?.ticket || null) as AdminSupportTicketRow | null);
      setSupportReplyText('');
      toast({ title: 'Reply sent', description: 'User is emailed when mail is configured.' });
      await refreshSupportTicketsAndStats();
    } catch (error: any) {
      toast({
        title: 'Reply failed',
        description: error?.response?.data?.message || error?.message || 'Could not send reply.',
        variant: 'destructive',
      });
    } finally {
      setSupportReplySubmitting(false);
    }
  };

  const handleSupportTicketStatusChange = async (next: string) => {
    if (!supportSheetId || !next) return;
    setSupportStatusPatching(true);
    try {
      const res = await apiService.admin.patchSupportTicket(supportSheetId, { status: next });
      setSupportSheetTicket((res.data?.ticket || null) as AdminSupportTicketRow | null);
      toast({ title: 'Status updated' });
      await refreshSupportTicketsAndStats();
    } catch (error: any) {
      toast({
        title: 'Update failed',
        description: error?.response?.data?.message || error?.message || 'Could not update status.',
        variant: 'destructive',
      });
    } finally {
      setSupportStatusPatching(false);
    }
  };

  const handleBroadcastNotifications = async () => {
    if (notifBroadcastBusy) return;

    const audience = notifAudience;
    const recipientUserId =
      audience === 'user' ? notifRecipientUserId.trim() : undefined;
    const title = notifTitle.trim();
    const message = notifMessage.trim();
    const link = notifLink.trim() || undefined;

    if (!title || !message) {
      toast({
        title: 'Missing fields',
        description: 'Title and message are required.',
        variant: 'destructive',
      });
      return;
    }
    if (audience === 'user' && !recipientUserId) {
      toast({
        title: 'Recipient required',
        description: 'Enter a user id when audience is “one user”.',
        variant: 'destructive',
      });
      return;
    }

    setNotifBroadcastBusy(true);
    setNotifLastRecipients(null);
    try {
      const res = await apiService.admin.broadcastNotifications({
        audience,
        recipientUserId,
        title,
        message,
        link,
      });
      const recipients = Number(res.data?.recipients ?? 0);
      setNotifLastRecipients(recipients);
      toast({
        title: 'Announcement sent',
        description:
          recipients > 0
            ? `Notification created for ${recipients} user${recipients === 1 ? '' : 's'}.`
            : 'No recipients matched the audience.',
      });
      setNotifTitle('');
      setNotifMessage('');
      setNotifLink('');
      setNotifRecipientUserId('');
    } catch (error: any) {
      toast({
        title: 'Broadcast failed',
        description:
          error?.response?.data?.message ||
          error?.message ||
          'Could not create notifications.',
        variant: 'destructive',
      });
    } finally {
      setNotifBroadcastBusy(false);
    }
  };

  const pendingKYC = stats?.pendingKYC ?? 0;
  const pendingWithdrawals = stats?.pendingWithdrawals ?? 0;
  const openSupportTickets = stats?.openSupportTickets ?? 0;
  const pendingReviewsCount = stats?.pendingReviews ?? 0;
  const pendingReviewQueue = pendingReviewsList;
  const publishedReviews = publishedReviewsList;
  const activeListings = stats?.activeListings ?? 0;
  const totalRevenue = Number(stats?.totalRevenue) || 0;
  const platformFeeTotal = Number((stats as any)?.platformFeeTotal) || 0;
  const adminFeePercent =
    totalRevenue > 0 ? Math.round((platformFeeTotal / totalRevenue) * 1000) / 10 : 0;

  const usersTabFarmers = debouncedUserSearch ? searchFarmers : pageFarmers;
  const usersTabBuyers = debouncedUserSearch ? searchBuyers : pageBuyers;
  const usersSearchActive = debouncedUserSearch.length > 0;
  const usersSearchEmpty =
    usersSearchActive &&
    !isUserSearchLoading &&
    usersTabFarmers.length === 0 &&
    usersTabBuyers.length === 0;

  const dashboardModel: AdminDashboardModel = {
    stats,
    chartData,
    categoryChartData,
    pendingKYC,
    activeListings,
    overviewPendingKycFarmers,
    handleKycApprove,
    setKycRejectTarget,
    setKycRejectReason,
    overviewRecentOrders,
    setAdminOrderPreviewId,
    csvExporting,
    handleExportOrdersCsv,
    notifAudience,
    setNotifAudience,
    notifRecipientUserId,
    setNotifRecipientUserId,
    notifTitle,
    setNotifTitle,
    notifMessage,
    setNotifMessage,
    notifLink,
    setNotifLink,
    notifBroadcastBusy,
    handleBroadcastNotifications,
    notifLastRecipients,
    orderStatusFilter,
    setOrderStatusFilter,
    orderPaymentFilter,
    setOrderPaymentFilter,
    orderDatePreset,
    setOrderDatePreset,
    orderDateFrom,
    setOrderDateFrom,
    orderDateTo,
    setOrderDateTo,
    adminOrders,
    adminOrdersTotal,
    adminOrdersSkip,
    setAdminOrdersSkip,
    ordersTabLoading,
    buildAdminOrdersApiParams,
    searchQuery,
    setSearchQuery,
    debouncedUserSearch,
    isUserSearchLoading,
    usersTabFarmers,
    usersTabBuyers,
    usersSearchActive,
    usersSearchEmpty,
    skipFarmers,
    setSkipFarmers,
    skipBuyers,
    setSkipBuyers,
    totalFarmersUsers,
    totalBuyersUsers,
    usersTabLoading,
    setUsersRefreshKey,
    getKycBadge,
    withdrawalFilter,
    setWithdrawalFilter,
    withdrawalsSkip,
    setWithdrawalsSkip,
    withdrawals,
    withdrawalsTotal,
    payoutsLoading,
    withdrawalActionId,
    setWithdrawalActionId,
    setRejectTarget,
    handleWithdrawalStatus,
    handleExportWithdrawalsCsv,
    kycFilter,
    setKycFilter,
    kycSkip,
    setKycSkip,
    kycFarmersPage,
    kycTotal,
    kycLoading,
    listings,
    listingsSkip,
    listingsTotalCount,
    listingsLoading,
    listingSearch,
    setListingSearch,
    debouncedListingSearch,
    openListingDrawer,
    pendingReviewsList,
    pendingReviewsTotal,
    pendingReviewsSkip,
    setPendingReviewsSkip,
    publishedReviewsList,
    publishedReviewsTotal,
    publishedReviewsSkip,
    setPublishedReviewsSkip,
    reviewsLoading,
    handleReviewAction,
    pendingReviewQueue,
    publishedReviews,
    supportTickets,
    supportTicketsTotal,
    supportTicketsSkip,
    setSupportTicketsSkip,
    supportTicketsLoading,
    supportStatusFilter,
    setSupportStatusFilter,
    supportSearchInput,
    setSupportSearchInput,
    debouncedSupportSearch,
    openSupportTicketSheet,
    supportStatusBadgeClass,
    auditLogs,
    auditTotal,
    auditSkip,
    setAuditSkip,
    auditLoading,
    auditResourceFilter,
    setAuditResourceFilter,
    auditActionFilter,
    setAuditActionFilter,
    auditActionSearchInput,
    setAuditActionSearchInput,
    debouncedAuditActionSearch,
    auditFiltersActive,
    setDebouncedAuditActionSearch,
  };

  return (
    <Layout showMobileNav={false}>
      <div className="min-h-screen min-w-0 overflow-x-hidden bg-gradient-to-b from-background to-muted/20">
        <div className="container mx-auto min-w-0 px-3 py-6 sm:px-4 sm:py-8">
          {!initialLoading ? (
            <div className="mb-6 flex flex-col gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 md:hidden">
              <p className="text-sm text-muted-foreground">
                Pull down from the top of the page to refresh, or tap Refresh.
              </p>
              <Button
                type="button"
                variant="secondary"
                className="w-full gap-2 sm:w-auto"
                onClick={() => void loadAdminShellData()}
                disabled={isRefreshing}
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh dashboard
              </Button>
            </div>
          ) : null}

          {initialLoading ? (
            <AdminDashboardShellSkeleton />
          ) : (
            <>
              <AnimateOnScroll animation="fade-in">
                <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="inline-flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full mb-4">
                      <Calendar className="w-4 h-4 text-primary" />
                      <span className="text-sm font-semibold text-primary">
                        {new Date().toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-extrabold text-foreground mb-2">Admin Dashboard</h1>
                    <p className="text-lg text-muted-foreground">Platform overview and management</p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-12 w-12 shrink-0 rounded-xl"
                    onClick={() => void loadAdminShellData()}
                    disabled={isRefreshing}
                    title="Refresh dashboard"
                  >
                    <RefreshCw className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
              </AnimateOnScroll>

              <AnimateOnScroll animation="slide-up" delay={0.1}>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                  <StatCard
                    title="Total Users"
                    value={stats?.totalUsers ?? 0}
                    icon={Users}
                    variant="primary"
                    subtitle={`${stats?.totalFarmers ?? 0} farmers, ${stats?.totalBuyers ?? 0} buyers`}
                  />
                  <StatCard
                    title="Active Listings"
                    value={activeListings}
                    icon={Package}
                    variant="success"
                    subtitle={`${stats?.totalProducts ?? 0} total products`}
                  />
                  <StatCard
                    title="Total Orders"
                    value={stats?.totalOrders ?? 0}
                    icon={ShoppingCart}
                    variant="accent"
                    subtitle={orderStatCardSubtitle}
                  />
                  <StatCard
                    title="Revenue"
                    value={`₹${totalRevenue.toLocaleString()}`}
                    icon={TrendingUp}
                    variant="warning"
                    subtitle={`Admin earning: ₹${platformFeeTotal.toLocaleString('en-IN')} (${adminFeePercent}% of revenue)`}
                  />
                </div>
              </AnimateOnScroll>

              <AdminDashboardProvider value={dashboardModel}>
          <Tabs value={adminTab} onValueChange={handleAdminTabChange} className="space-y-6">
            <TabsList className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-9 w-full bg-muted/50 p-1 rounded-lg h-auto gap-1">
              <TabsTrigger value="overview" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">
                <Activity className="w-4 h-4 mr-2 shrink-0" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="orders" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">
                <ClipboardList className="w-4 h-4 mr-2 shrink-0" />
                Orders
              </TabsTrigger>
              <TabsTrigger value="users" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">
                <Users className="w-4 h-4 mr-2 shrink-0" />
                Users
              </TabsTrigger>
              <TabsTrigger value="kyc" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">
                <Shield className="w-4 h-4 mr-2 shrink-0" />
                KYC
                {pendingKYC > 0 && (
                  <Badge className="ml-2 bg-warning text-warning-foreground">{pendingKYC}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="payouts" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">
                <Wallet className="w-4 h-4 mr-2 shrink-0" />
                Payouts
                {pendingWithdrawals > 0 && (
                  <Badge className="ml-2 bg-accent text-accent-foreground">{pendingWithdrawals}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="listings" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">
                <Package className="w-4 h-4 mr-2 shrink-0" />
                Listings
              </TabsTrigger>
              <TabsTrigger value="reviews" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">
                <Star className="w-4 h-4 mr-2 shrink-0" />
                Reviews
                {pendingReviewsCount > 0 && (
                  <Badge className="ml-2 bg-warning text-warning-foreground">{pendingReviewsCount}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="support" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">
                <MessageCircle className="w-4 h-4 mr-2 shrink-0" />
                Support
                {openSupportTickets > 0 && (
                  <Badge className="ml-2 bg-accent text-accent-foreground">{openSupportTickets}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="audit" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">
                <History className="w-4 h-4 mr-2 shrink-0" />
                Audit log
              </TabsTrigger>
            </TabsList>

            <Dialog
              open={!!rejectTarget}
              onOpenChange={(open) => {
                if (!open) {
                  setRejectTarget(null);
                  setRejectReason('');
                }
              }}
            >
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Reject withdrawal</DialogTitle>
                </DialogHeader>
                <div className="space-y-2 py-2">
                  <p className="text-sm text-muted-foreground">
                    Farmer: <span className="font-medium text-foreground">{rejectTarget?.farmerName}</span> — ₹
                    {rejectTarget?.amount.toLocaleString('en-IN')}
                  </p>
                  <Label htmlFor="reject-reason">Reason (optional)</Label>
                  <Textarea
                    id="reject-reason"
                    placeholder="Shown to the farmer in their notification"
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    rows={3}
                  />
                </div>
                <DialogFooter className="gap-2 sm:gap-0">
                  <Button variant="outline" onClick={() => setRejectTarget(null)}>
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    disabled={!rejectTarget || withdrawalActionId === rejectTarget.id}
                    onClick={() =>
                      rejectTarget &&
                      void handleWithdrawalStatus(rejectTarget, 'rejected', rejectReason)
                    }
                  >
                    {withdrawalActionId === rejectTarget?.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      'Confirm reject'
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog
              open={!!kycRejectTarget}
              onOpenChange={(open) => {
                if (!open) {
                  setKycRejectTarget(null);
                  setKycRejectReason('');
                }
              }}
            >
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Reject KYC</DialogTitle>
                </DialogHeader>
                <div className="space-y-2 py-2">
                  <p className="text-sm text-muted-foreground">
                    Farmer:{' '}
                    <span className="font-medium text-foreground">{kycRejectTarget?.name}</span>
                  </p>
                  <Label htmlFor="kyc-reject-reason">Reason (optional)</Label>
                  <Textarea
                    id="kyc-reject-reason"
                    placeholder="Shown to the farmer in their notification"
                    value={kycRejectReason}
                    onChange={(e) => setKycRejectReason(e.target.value)}
                    rows={4}
                  />
                </div>
                <DialogFooter className="gap-2 sm:gap-0">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setKycRejectTarget(null);
                      setKycRejectReason('');
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    disabled={!kycRejectTarget || kycRejectSubmitting}
                    onClick={() => void handleKycRejectSubmit()}
                  >
                    {kycRejectSubmitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      'Confirm reject'
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <TabsContent value="overview" className="space-y-6">
              <Suspense fallback={<AdminTabSkeleton />}>
                <LazyOverviewTab />
              </Suspense>
            </TabsContent>

            <TabsContent value="orders" className="space-y-6">
              <Suspense fallback={<AdminTabSkeleton />}>
                <LazyOrdersTab />
              </Suspense>
            </TabsContent>

            <TabsContent value="users" className="space-y-6">
              <Suspense fallback={<AdminTabSkeleton />}>
                <LazyUsersTab />
              </Suspense>
            </TabsContent>

            <TabsContent value="payouts" className="space-y-6">
              <Suspense fallback={<AdminTabSkeleton />}>
                <LazyPayoutsTab />
              </Suspense>
            </TabsContent>

            <TabsContent value="kyc" className="space-y-6">
              <Suspense fallback={<AdminTabSkeleton />}>
                <LazyKycTab />
              </Suspense>
            </TabsContent>

            <TabsContent value="listings" className="space-y-6">
              <Suspense fallback={<AdminTabSkeleton />}>
                <LazyListingsTab />
              </Suspense>
            </TabsContent>

            <TabsContent value="reviews" className="space-y-6">
              <Suspense fallback={<AdminTabSkeleton />}>
                <LazyReviewsTab />
              </Suspense>
            </TabsContent>

            <TabsContent value="support" className="space-y-6">
              <Suspense fallback={<AdminTabSkeleton />}>
                <LazySupportTab />
              </Suspense>
            </TabsContent>

            <TabsContent value="audit" className="space-y-6">
              <Suspense fallback={<AdminTabSkeleton />}>
                <LazyAuditTab />
              </Suspense>
            </TabsContent>
          </Tabs>
              </AdminDashboardProvider>
            </>
          )}
        </div>
      </div>

      <Sheet
        open={listingDrawerProduct !== null}
        onOpenChange={(open) => {
          if (!open) setListingDrawerProduct(null);
        }}
      >
        <SheetContent
          side="right"
          className="flex w-full flex-col gap-0 overflow-y-auto p-0 sm:max-w-lg"
        >
          {listingDrawerProduct ? (
            <>
              <div className="space-y-4 p-6 pb-4">
                <SheetHeader className="space-y-1 text-left">
                  <SheetTitle className="pr-8 text-xl leading-tight">
                    {listingDrawerProduct.name}
                  </SheetTitle>
                  <SheetDescription className="sr-only">
                    Product images, farmer details, and moderation actions.
                  </SheetDescription>
                  {listingDrawerProduct.nameHindi ? (
                    <p className="text-base text-muted-foreground">{listingDrawerProduct.nameHindi}</p>
                  ) : null}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <Badge
                      variant="outline"
                      className={
                        listingDrawerProduct.status === 'active'
                          ? 'border-success/50 bg-success/10 text-success'
                          : ''
                      }
                    >
                      {listingDrawerProduct.status}
                    </Badge>
                    {listingDrawerProduct.isOrganic ? (
                      <Badge variant="secondary">Organic</Badge>
                    ) : null}
                    {listingDrawerProduct.isNegotiable ? (
                      <Badge variant="secondary">Negotiable</Badge>
                    ) : null}
                  </div>
                </SheetHeader>

                {(() => {
                  const raw = sanitizeImageUrlList(listingDrawerProduct.images);
                  const imgs =
                    raw.length > 0
                      ? raw.map((u) => optimizeListingImageUrl(u, 800))
                      : [LISTING_IMAGE_PLACEHOLDER];
                  const safeIdx = Math.min(listingDrawerImageIndex, imgs.length - 1);
                  const mainSrc = imgs[safeIdx] ?? imgs[0];
                  return (
                    <div className="space-y-2">
                      <div className="overflow-hidden rounded-xl border bg-muted">
                        <img
                          src={mainSrc}
                          alt={listingDrawerProduct.name}
                          className="aspect-[4/3] w-full object-cover"
                          onError={(e) => {
                            const el = e.currentTarget;
                            el.onerror = null;
                            el.src = LISTING_IMAGE_PLACEHOLDER;
                          }}
                        />
                      </div>
                      {imgs.length > 1 ? (
                        <div className="flex gap-2 overflow-x-auto pb-1">
                          {imgs.map((src, i) => (
                            <button
                              key={`${src}-${i}`}
                              type="button"
                              onClick={() => setListingDrawerImageIndex(i)}
                              className={`h-16 w-16 shrink-0 overflow-hidden rounded-md border-2 transition-colors ${
                                i === safeIdx ? 'border-primary' : 'border-transparent opacity-80'
                              }`}
                            >
                              <img
                                src={src}
                                alt=""
                                className="h-full w-full object-cover"
                                onError={(e) => {
                                  const el = e.currentTarget;
                                  el.onerror = null;
                                  el.src = LISTING_IMAGE_PLACEHOLDER;
                                }}
                              />
                            </button>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  );
                })()}
              </div>

              <Separator />

              <div className="space-y-3 p-6">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Farmer
                </h3>
                <div className="flex gap-4 rounded-xl border bg-muted/40 p-4">
                  <img
                    src={
                      listingDrawerProduct.farmerAvatar ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(listingDrawerProduct.farmerName)}`
                    }
                    alt=""
                    className="h-16 w-16 rounded-full object-cover border-2 border-border shrink-0"
                  />
                  <div className="min-w-0 flex-1 space-y-1 text-sm">
                    <p className="font-semibold text-base">{listingDrawerProduct.farmerName}</p>
                    <p className="text-muted-foreground font-mono text-xs break-all">
                      ID: {listingDrawerProduct.farmerId}
                    </p>
                    {listingDrawerProduct.farmerLocation ? (
                      <p className="text-muted-foreground">{listingDrawerProduct.farmerLocation}</p>
                    ) : null}
                    {listingDrawerProduct.farmerRating > 0 ? (
                      <p className="text-muted-foreground flex items-center gap-1">
                        <Star className="h-3.5 w-3.5 text-warning fill-warning shrink-0" />
                        {listingDrawerProduct.farmerRating} avg (approved reviews)
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground">No review average yet</p>
                    )}
                    {listingDrawerProduct.farmerPhone ? (
                      <p className="text-muted-foreground">{listingDrawerProduct.farmerPhone}</p>
                    ) : null}
                    {listingDrawerProduct.farmerEmail ? (
                      <p className="text-muted-foreground break-all">{listingDrawerProduct.farmerEmail}</p>
                    ) : null}
                    {listingDrawerProduct.farmerKycStatus ? (
                      <Badge variant="outline" className="capitalize mt-1">
                        KYC: {listingDrawerProduct.farmerKycStatus}
                      </Badge>
                    ) : null}
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-3 p-6">
                <h3 className="text-sm font-semibold">Listing</h3>
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {listingDrawerProduct.description || 'No description.'}
                </p>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  <dt className="text-muted-foreground">Price</dt>
                  <dd className="font-medium">
                    ₹{listingDrawerProduct.price}/{listingDrawerProduct.unit}
                  </dd>
                  <dt className="text-muted-foreground">Available</dt>
                  <dd className="font-medium">{listingDrawerProduct.availableQuantity}</dd>
                  <dt className="text-muted-foreground">Min order</dt>
                  <dd className="font-medium">{listingDrawerProduct.minOrderQuantity}</dd>
                  <dt className="text-muted-foreground">Category</dt>
                  <dd className="font-medium capitalize">
                    {String(listingDrawerProduct.category).replace(/_/g, ' ')}
                  </dd>
                  <dt className="text-muted-foreground">Views</dt>
                  <dd className="font-medium">{listingDrawerProduct.views}</dd>
                </dl>
                <Button variant="outline" size="sm" className="w-full sm:w-auto" asChild>
                  <Link to={`/product/${listingDrawerProduct.id}`} target="_blank" rel="noreferrer">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Open public product page
                  </Link>
                </Button>
              </div>

              <Separator />

              <SheetFooter className="flex-col gap-2 border-t bg-muted/30 p-6 sm:flex-col">
                <p className="w-full text-left text-xs text-muted-foreground">
                  Suspend hides the listing from buyers. Remove deletes it permanently.
                </p>
                <div className="flex w-full flex-col gap-2 sm:flex-row sm:flex-wrap">
                  {listingDrawerProduct.status === 'hidden' ? (
                    <Button
                      className="flex-1 sm:flex-none"
                      onClick={() =>
                        void handleListingAction(listingDrawerProduct.id, 'activate')
                      }
                    >
                      Activate listing
                    </Button>
                  ) : (
                    <Button
                      variant="secondary"
                      className="flex-1 sm:flex-none"
                      onClick={() =>
                        void handleListingAction(listingDrawerProduct.id, 'suspend')
                      }
                    >
                      Suspend listing
                    </Button>
                  )}
                  <Button
                    variant="destructive"
                    className="flex-1 sm:flex-none"
                    onClick={() =>
                      void handleListingAction(listingDrawerProduct.id, 'remove')
                    }
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Remove listing
                  </Button>
                </div>
              </SheetFooter>
            </>
          ) : null}
        </SheetContent>
      </Sheet>

      <Sheet
        open={adminOrderPreviewId !== null}
        onOpenChange={(open) => {
          if (!open) {
            setAdminOrderPreviewId(null);
            setAdminOrderPreviewDetail(null);
          }
        }}
      >
        <SheetContent
          side="right"
          className="flex w-full flex-col gap-0 overflow-y-auto p-0 sm:max-w-lg"
        >
          <div className="space-y-4 p-6 pb-2">
            <SheetHeader className="space-y-1 text-left">
              <SheetTitle className="pr-8">
                Order #{adminOrderPreviewDetail?.id.slice(-8) ?? adminOrderPreviewId?.slice(-8) ?? '—'}
              </SheetTitle>
              <SheetDescription>
                Quick view — timeline and summary. Use full page to change status or payment.
              </SheetDescription>
            </SheetHeader>
            {adminOrderPreviewLoading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground py-6">
                <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                Loading order…
              </div>
            )}
            {!adminOrderPreviewLoading && adminOrderPreviewDetail && (
              <div className="space-y-3 text-sm">
                <p className="text-muted-foreground">
                  Placed{' '}
                  <span className="text-foreground font-medium">
                    {new Date(adminOrderPreviewDetail.createdAt).toLocaleString('en-IN', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </span>
                </p>
                <div>
                  <p className="font-medium text-foreground">
                    {adminOrderPreviewDetail.buyerName}
                    <span className="text-muted-foreground font-normal mx-1">→</span>
                    {adminOrderPreviewDetail.farmerName}
                  </p>
                </div>
                <div className="rounded-lg border bg-muted/40 p-3 space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Line items
                  </p>
                  <ul className="space-y-2">
                    {adminOrderPreviewDetail.items.map((it, idx) => (
                      <li key={`${it.productId}-${idx}`} className="flex justify-between gap-2 text-xs">
                        <span className="min-w-0 truncate">
                          {it.name} × {it.quantity} {it.unit}
                        </span>
                        <span className="shrink-0 font-medium">{formatInrAdmin(it.lineTotal)}</span>
                      </li>
                    ))}
                  </ul>
                  <Separator />
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-semibold">{formatInrAdmin(adminOrderPreviewDetail.totalAmount)}</span>
                  </div>
                  {(adminOrderPreviewDetail.platformFee ?? 0) > 0 && (
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Platform fee</span>
                      <span>{formatInrAdmin(adminOrderPreviewDetail.platformFee ?? 0)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm pt-1 border-t border-border">
                    <span className="font-medium">Buyer pays</span>
                    <span className="font-bold text-primary">
                      {formatInrAdmin(
                        adminOrderPreviewDetail.totalAmount + (adminOrderPreviewDetail.platformFee ?? 0)
                      )}
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                    Delivery
                  </p>
                  <p className="text-sm whitespace-pre-wrap text-foreground">
                    {adminOrderPreviewDetail.deliveryAddress || '—'}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge
                    className={
                      adminOrderPreviewDetail.status === 'delivered'
                        ? 'bg-success/10 text-success'
                        : adminOrderPreviewDetail.status === 'cancelled'
                          ? 'bg-destructive/10 text-destructive'
                          : 'bg-warning/10 text-warning'
                    }
                  >
                    {adminOrderPreviewDetail.status}
                  </Badge>
                  <Badge variant="outline" className="capitalize">
                    Payment: {adminOrderPreviewDetail.paymentStatus}
                  </Badge>
                </div>
              </div>
            )}
          </div>

          {!adminOrderPreviewLoading && adminOrderPreviewDetail && (
            <>
              <Separator />
              <div className="px-4 py-2">
                <OrderStatusTimeline
                  status={adminOrderPreviewDetail.status}
                  currentLanguage={currentLanguage}
                  paymentPendingNote={adminOrderPreviewDetail.paymentStatus === 'pending'}
                  paymentMethod={adminOrderPreviewDetail.paymentMethod}
                  paymentStatus={adminOrderPreviewDetail.paymentStatus}
                />
              </div>
              <SheetFooter className="flex-col gap-2 border-t bg-muted/30 p-6 sm:flex-col">
                <Button className="w-full" asChild>
                  <Link to={`/admin/orders/${adminOrderPreviewDetail.id}`}>
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Open full page (actions)
                  </Link>
                </Button>
              </SheetFooter>
            </>
          )}
        </SheetContent>
      </Sheet>

      <Sheet
        open={supportSheetOpen}
        onOpenChange={(open) => {
          setSupportSheetOpen(open);
          if (!open) {
            setSupportSheetId(null);
            setSupportSheetTicket(null);
            setSupportReplyText('');
          }
        }}
      >
        <SheetContent
          side="right"
          className="flex w-full flex-col gap-0 overflow-y-auto p-0 sm:max-w-lg"
        >
          <div className="space-y-4 p-6 pb-2">
            <SheetHeader className="space-y-1 text-left">
              <SheetTitle className="pr-8 leading-tight">
                {supportSheetTicket?.subject || 'Support ticket'}
              </SheetTitle>
              <SheetDescription className="text-left">
                {supportSheetTicket?.id ? (
                  <span className="font-mono text-xs">#{supportSheetTicket.id.slice(-12)}</span>
                ) : (
                  'Loading…'
                )}
              </SheetDescription>
            </SheetHeader>

            {supportSheetLoading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground py-6">
                <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                Loading ticket…
              </div>
            )}

            {!supportSheetLoading && supportSheetTicket && (
              <div className="space-y-4 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <Label className="text-xs text-muted-foreground shrink-0">Status</Label>
                  <Select
                    value={supportSheetTicket.status}
                    disabled={supportStatusPatching}
                    onValueChange={(v) => void handleSupportTicketStatusChange(v)}
                  >
                    <SelectTrigger className="h-9 w-full min-w-0 max-w-[220px] sm:w-[200px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="in_progress">In progress</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                  {supportStatusPatching && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                </div>

                <div className="rounded-lg border bg-muted/30 p-3 space-y-1">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Requester</p>
                  {supportSheetTicket.user ? (
                    <>
                      <p className="font-medium">{supportSheetTicket.user.name || 'User'}</p>
                      <p className="text-xs text-muted-foreground break-all">{supportSheetTicket.user.email}</p>
                      {supportSheetTicket.user.phone ? (
                        <p className="text-xs text-muted-foreground">{supportSheetTicket.user.phone}</p>
                      ) : null}
                    </>
                  ) : supportSheetTicket.guestEmail ? (
                    <p className="text-sm break-all">{supportSheetTicket.guestEmail}</p>
                  ) : (
                    <p className="text-muted-foreground">Guest (no email on file)</p>
                  )}
                  <p className="text-[11px] text-muted-foreground pt-1">
                    Email to inbox: {supportSheetTicket.emailNotified ? 'Notified on create' : 'Not sent (mail off or failed)'}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                    Original message
                  </p>
                  <p className="whitespace-pre-wrap text-foreground">{supportSheetTicket.message}</p>
                </div>

                <Separator />

                <div className="space-y-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Thread</p>
                  {supportSheetTicket.replies.length === 0 ? (
                    <p className="text-muted-foreground text-sm">No replies yet.</p>
                  ) : (
                    <ul className="space-y-3">
                      {supportSheetTicket.replies.map((r) => (
                        <li
                          key={r.id}
                          className={`rounded-lg border p-3 text-sm ${
                            r.fromRole === 'admin' ? 'bg-primary/5 border-primary/20' : 'bg-background'
                          }`}
                        >
                          <div className="flex justify-between gap-2 text-xs text-muted-foreground mb-1">
                            <span className="font-medium text-foreground">
                              {r.authorName || (r.fromRole === 'admin' ? 'Admin' : 'User')}
                            </span>
                            <span>
                              {r.createdAt
                                ? new Date(r.createdAt).toLocaleString('en-IN', {
                                    dateStyle: 'short',
                                    timeStyle: 'short',
                                  })
                                : ''}
                            </span>
                          </div>
                          <p className="whitespace-pre-wrap">{r.body}</p>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}
          </div>

          {!supportSheetLoading && supportSheetTicket && supportSheetTicket.status !== 'closed' && (
            <>
              <Separator />
              <div className="space-y-3 p-6 pt-4">
                <Label htmlFor="support-admin-reply">Admin reply</Label>
                <Textarea
                  id="support-admin-reply"
                  placeholder="Type a reply to the user (sent by email when configured)…"
                  value={supportReplyText}
                  onChange={(e) => setSupportReplyText(e.target.value)}
                  rows={4}
                  className="resize-none"
                />
              </div>
              <SheetFooter className="border-t bg-muted/30 p-6 sm:flex-col gap-2">
                <Button
                  className="w-full"
                  disabled={supportReplySubmitting || !supportReplyText.trim()}
                  onClick={() => void handleSupportTicketReply()}
                >
                  {supportReplySubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending…
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Send reply
                    </>
                  )}
                </Button>
              </SheetFooter>
            </>
          )}
        </SheetContent>
      </Sheet>
    </Layout>
  );
};

export default AdminDashboard;
