import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  MapPin,
  MessageCircle,
  Star,
  Check,
  X,
  Truck,
  Loader2,
} from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAppSelector } from '@/hooks/useRedux';
import { apiService } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import type { OrderDetail } from '@/types';
import { mapApiOrderToDetail } from '@/lib/mapOrderFromApi';
import { OrderStatusTimeline } from '@/components/orders/OrderStatusTimeline';
import { payAppOrderWithRazorpay } from '@/lib/razorpay';
import {
  paymentLineLabel,
  paymentMethodLabel,
  paymentStatusLabel,
} from '@/lib/orderPaymentCopy';
import { useCopilot } from '@/context/CopilotContext';

const RETURN_WINDOW_DAYS = 7;

const RETURN_REASON_OPTIONS: { value: string; en: string; hi: string }[] = [
  { value: 'quality_defective', en: 'Poor quality / defective', hi: 'खराब गुणवत्ता / दोषपूर्ण' },
  { value: 'wrong_item', en: 'Wrong item received', hi: 'गलत वस्तु मिली' },
  { value: 'damaged', en: 'Damaged in transit', hi: 'ट्रांजिट में क्षतिग्रस्त' },
  { value: 'not_as_described', en: 'Not as described', hi: 'विवरण के अनुसार नहीं' },
  { value: 'other', en: 'Other', hi: 'अन्य' },
];

function deliveredAtMs(o: OrderDetail): number {
  if (o.deliveredAt) return new Date(o.deliveredAt).getTime();
  if (o.status === 'delivered') return new Date(o.updatedAt).getTime();
  return 0;
}

function canBuyerRequestReturn(o: OrderDetail): boolean {
  if (o.status !== 'delivered' || o.paymentStatus !== 'paid') return false;
  if (o.returnRequest) return false;
  const t = deliveredAtMs(o);
  if (!t) return false;
  return Date.now() <= t + RETURN_WINDOW_DAYS * 86400000;
}

const formatInr = (n: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(n);

const OrderDetailPage = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAppSelector((s) => s.auth);
  const { currentLanguage } = useAppSelector((s) => s.language);
  const en = currentLanguage === 'en';

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [payingOnline, setPayingOnline] = useState(false);
  const [returnDialogOpen, setReturnDialogOpen] = useState(false);
  const [returnReason, setReturnReason] = useState('quality_defective');
  const [returnDetails, setReturnDetails] = useState('');
  const [returnBusy, setReturnBusy] = useState(false);
  const [respondOpen, setRespondOpen] = useState<'approve' | 'reject' | null>(null);
  const [respondNote, setRespondNote] = useState('');
  const [adminOrderStatus, setAdminOrderStatus] = useState<string>('');
  const [adminPaymentStatus, setAdminPaymentStatus] = useState<string>('');
  const { setCopilotContext } = useCopilot();

  const listPath =
    user?.role === 'admin'
      ? '/admin?tab=orders'
      : user?.role === 'farmer'
        ? '/farmer/orders'
        : '/buyer/orders';

  const loadOrder = useCallback(async () => {
    if (!orderId) return;
    try {
      setLoading(true);
      const res = await apiService.orders.getById(orderId);
      const raw = res.data?.order;
      if (!raw) {
        setOrder(null);
        return;
      }
      setOrder(mapApiOrderToDetail(raw));
    } catch (error: any) {
      console.error('Order detail load failed', error);
      setOrder(null);
      toast({
        title: en ? 'Error' : 'त्रुटि',
        description:
          error?.response?.data?.message ||
          error?.message ||
          (en ? 'Could not load this order.' : 'ऑर्डर लोड नहीं हो सका।'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [orderId, en, toast]);

  useEffect(() => {
    if (user && orderId) {
      void loadOrder();
    }
  }, [user, orderId, loadOrder]);

  useEffect(() => {
    if (order && user?.role === 'admin') {
      setAdminOrderStatus(order.status);
      setAdminPaymentStatus(order.paymentStatus);
    }
  }, [order?.id, order?.status, order?.paymentStatus, user?.role]);

  useEffect(() => {
    if (!order || (user?.role !== 'farmer' && user?.role !== 'buyer')) {
      setCopilotContext(null);
      return;
    }
    const itemsSummary =
      order.items?.length > 0
        ? order.items.map((i) => `${i.name} × ${i.quantity} ${i.unit}`).join('; ')
        : `${order.productName} × ${order.quantity} ${order.unit}`;
    const fee = order.platformFee ?? 0;
    const totalText =
      fee > 0
        ? `${formatInr(order.totalAmount)} + fee ${formatInr(fee)}`
        : formatInr(order.totalAmount);
    setCopilotContext({
      page: 'order',
      order: {
        status: order.status,
        paymentStatus: order.paymentStatus,
        paymentMethod: order.paymentMethod,
        totalText,
        itemsSummary,
        roleView: user.role,
      },
    });
    return () => setCopilotContext(null);
  }, [order, user?.role, setCopilotContext]);

  const refreshAfterAction = async () => {
    await loadOrder();
  };

  const handleFarmerAccept = async () => {
    if (!order) return;
    try {
      setActing(true);
      await apiService.orders.update(order.id, { status: 'processing' });
      toast({ title: en ? 'Order accepted' : 'ऑर्डर स्वीकृत' });
      await refreshAfterAction();
    } catch (error: any) {
      toast({
        title: en ? 'Error' : 'त्रुटि',
        description: error?.response?.data?.message || error?.message,
        variant: 'destructive',
      });
    } finally {
      setActing(false);
    }
  };

  const handleFarmerReject = async () => {
    if (!order) return;
    try {
      setActing(true);
      await apiService.orders.cancel(order.id);
      toast({
        title: en ? 'Order cancelled' : 'ऑर्डर रद्द',
        variant: 'destructive',
      });
      await refreshAfterAction();
    } catch (error: any) {
      toast({
        title: en ? 'Error' : 'त्रुटि',
        description: error?.response?.data?.message || error?.message,
        variant: 'destructive',
      });
    } finally {
      setActing(false);
    }
  };

  const handleStatus = async (status: string) => {
    if (!order) return;
    try {
      setActing(true);
      await apiService.orders.update(order.id, { status });
      toast({ title: en ? 'Updated' : 'अपडेट' });
      await refreshAfterAction();
    } catch (error: any) {
      toast({
        title: en ? 'Error' : 'त्रुटि',
        description: error?.response?.data?.message || error?.message,
        variant: 'destructive',
      });
    } finally {
      setActing(false);
    }
  };

  const handlePayOnline = async () => {
    if (!order || !user) return;
    try {
      setPayingOnline(true);
      const r = await payAppOrderWithRazorpay(
        order.id,
        { name: user.name, email: user.email, phone: user.phone },
        en ? `Order #${order.id.slice(-8)}` : `ऑर्डर #${order.id.slice(-8)}`
      );
      if (r === 'paid') {
        toast({
          title: en ? 'Payment received' : 'भुगतान प्राप्त',
          description: en ? 'The farmer has been notified.' : 'किसान को सूचित किया गया।',
        });
        await refreshAfterAction();
      } else if (r === 'skipped') {
        toast({
          title: en ? 'Online payment unavailable' : 'ऑनलाइन भुगतान उपलब्ध नहीं',
          description: en
            ? 'Razorpay keys are not set on the server.'
            : 'सर्वर पर Razorpay कुंजी सेट नहीं हैं।',
          variant: 'destructive',
        });
      } else if (r === 'aborted') {
        toast({ title: en ? 'Payment window closed' : 'भुगतान विंडो बंद' });
      } else {
        toast({
          title: en ? 'Could not verify payment' : 'भुगतान पुष्टि नहीं हो सकी',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      toast({
        title: en ? 'Error' : 'त्रुटि',
        description: error?.response?.data?.message || error?.message,
        variant: 'destructive',
      });
    } finally {
      setPayingOnline(false);
    }
  };

  const handleFarmerMarkPaid = async () => {
    if (!order) return;
    try {
      setActing(true);
      await apiService.orders.update(order.id, { paymentStatus: 'paid' });
      toast({
        title: en ? 'Marked as paid' : 'भुगतान दर्ज किया',
        description: en
          ? 'The buyer has been notified.'
          : 'खरीदार को सूचित किया गया।',
      });
      await refreshAfterAction();
    } catch (error: any) {
      toast({
        title: en ? 'Error' : 'त्रुटि',
        description: error?.response?.data?.message || error?.message,
        variant: 'destructive',
      });
    } finally {
      setActing(false);
    }
  };

  const handleAdminSaveOrder = async () => {
    if (!order || user?.role !== 'admin') return;
    const nextStatus = adminOrderStatus || order.status;
    const nextPay = adminPaymentStatus || order.paymentStatus;
    const payload: { status?: string; paymentStatus?: string } = {};
    if (nextStatus !== order.status) payload.status = nextStatus;
    if (nextPay !== order.paymentStatus) payload.paymentStatus = nextPay;
    if (Object.keys(payload).length === 0) return;
    try {
      setActing(true);
      await apiService.orders.update(order.id, payload);
      toast({
        title: en ? 'Order updated' : 'अपडेट',
        description: en ? 'Changes saved.' : 'परिवर्तन सहेजे गए।',
      });
      await refreshAfterAction();
    } catch (error: any) {
      toast({
        title: en ? 'Error' : 'त्रुटि',
        description: error?.response?.data?.message || error?.message,
        variant: 'destructive',
      });
    } finally {
      setActing(false);
    }
  };

  const handleRequestReturn = async () => {
    if (!order) return;
    try {
      setReturnBusy(true);
      await apiService.orders.requestReturn(order.id, {
        reason: returnReason,
        details: returnDetails.trim() || undefined,
      });
      toast({
        title: en ? 'Return requested' : 'वापसी अनुरोध',
        description: en
          ? 'The seller will review your request.'
          : 'विक्रेता आपके अनुरोध की समीक्षा करेगा।',
      });
      setReturnDialogOpen(false);
      setReturnDetails('');
      await refreshAfterAction();
    } catch (error: any) {
      toast({
        title: en ? 'Error' : 'त्रुटि',
        description: error?.response?.data?.message || error?.message,
        variant: 'destructive',
      });
    } finally {
      setReturnBusy(false);
    }
  };

  const handleRespondReturn = async () => {
    if (!order || !respondOpen) return;
    try {
      setReturnBusy(true);
      await apiService.orders.respondReturn(order.id, {
        decision: respondOpen,
        note: respondNote.trim() || undefined,
      });
      toast({
        title: en ? 'Updated' : 'अपडेट',
        description:
          respondOpen === 'approve'
            ? en
              ? 'Return response saved.'
              : 'वापसी प्रतिक्रिया सहेजी गई।'
            : en
              ? 'Return request was declined.'
              : 'वापसी अस्वीकृत।',
      });
      setRespondOpen(null);
      setRespondNote('');
      await refreshAfterAction();
    } catch (error: any) {
      toast({
        title: en ? 'Error' : 'त्रुटि',
        description: error?.response?.data?.message || error?.message,
        variant: 'destructive',
      });
    } finally {
      setReturnBusy(false);
    }
  };

  const handleConfirmCodReturn = async () => {
    if (!order) return;
    try {
      setReturnBusy(true);
      await apiService.orders.confirmCodReturnRefunded(order.id);
      toast({
        title: en ? 'Refund recorded' : 'रिफंड दर्ज',
        description: en ? 'The buyer has been notified.' : 'खरीदार को सूचित किया गया।',
      });
      await refreshAfterAction();
    } catch (error: any) {
      toast({
        title: en ? 'Error' : 'त्रुटि',
        description: error?.response?.data?.message || error?.message,
        variant: 'destructive',
      });
    } finally {
      setReturnBusy(false);
    }
  };

  const handleBuyerCancel = async () => {
    if (!order) return;
    try {
      setActing(true);
      await apiService.orders.cancel(order.id);
      toast({
        title: en ? 'Order cancelled' : 'ऑर्डर रद्द',
        variant: 'destructive',
      });
      await refreshAfterAction();
    } catch (error: any) {
      toast({
        title: en ? 'Error' : 'त्रुटि',
        description: error?.response?.data?.message || error?.message,
        variant: 'destructive',
      });
    } finally {
      setActing(false);
    }
  };

  const statusBadgeClass = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'border border-[#a9c8ae] bg-[#eaf5ec] text-[#315f3b]';
      case 'shipped':
        return 'border border-[#c8d8cb] bg-[#edf4ee] text-[#315f3b]';
      case 'cancelled':
        return 'border border-[#dfc0af] bg-[#f6e5dc] text-[#8a4f2a]';
      default:
        return 'border border-[#ead5a6] bg-[#fff4dd] text-[#9a6b12]';
    }
  };

  if (!user || !orderId) {
    return null;
  }

  return (
    <Layout>
      <div className="min-h-screen bg-[linear-gradient(rgba(251,247,235,0.97),rgba(251,247,235,0.97)),linear-gradient(rgba(138,79,42,0.07)_1px,transparent_1px),linear-gradient(90deg,rgba(138,79,42,0.07)_1px,transparent_1px)] bg-[size:auto,24px_24px,24px_24px]">
        <div className="container mx-auto min-w-0 max-w-4xl px-3 py-5 sm:px-4 sm:py-6">
        <div className="flex items-center gap-4 mb-6">
          <button
            type="button"
            onClick={() => navigate(listPath)}
            className="rounded-lg border border-[#d7c7a8] bg-[#fffaf0] p-2 text-[#315f3b] transition hover:bg-[#f6eddc]"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-[#2f3a2f]">
              {en ? 'Order details' : 'ऑर्डर विवरण'}
            </h1>
            <p className="font-mono text-sm text-[#6f6552]">#{orderId.slice(-8)}</p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center gap-2 py-20 text-[#6f6552]">
            <Loader2 className="w-6 h-6 animate-spin" />
            {en ? 'Loading…' : 'लोड हो रहा है…'}
          </div>
        ) : !order ? (
          <div className="rounded-2xl border border-[#d7c7a8] bg-[#fffaf0] p-8 text-center text-[#6f6552] shadow-[0_16px_40px_rgba(95,70,40,0.08)]">
            {en ? 'Order not found or you do not have access.' : 'ऑर्डर नहीं मिला या पहुंच नहीं है।'}
            <div className="mt-4">
              <Button
                variant="outline"
                className="border-[#d7c7a8] bg-[#fffdf7] text-[#315f3b] hover:bg-[#f3ebdd] hover:text-[#315f3b]"
                onClick={() => navigate(listPath)}
              >
                {en ? 'Back to orders' : 'ऑर्डर पर वापस'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-4 rounded-2xl border border-[#d7c7a8] bg-[#fffaf0] p-6 shadow-[0_16px_40px_rgba(95,70,40,0.08)]">
              <div>
                <p className="text-sm text-[#6f6552]">
                  {en ? 'Placed on' : 'दिनांक'}
                </p>
                <p className="font-medium text-[#2f3a2f]">
                  {new Date(order.createdAt).toLocaleString(
                    en ? 'en-IN' : 'hi-IN',
                    { dateStyle: 'medium', timeStyle: 'short' }
                  )}
                </p>
                {order.updatedAt !== order.createdAt && (
                  <p className="mt-1 text-xs text-[#6f6552]">
                    {en ? 'Updated' : 'अपडेट'}:{' '}
                    {new Date(order.updatedAt).toLocaleString(en ? 'en-IN' : 'hi-IN', {
                      dateStyle: 'short',
                      timeStyle: 'short',
                    })}
                  </p>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${statusBadgeClass(order.status)}`}
                >
                  {order.status}
                </span>
                <span className="rounded-full border border-[#d7c7a8] bg-[#fffdf7] px-3 py-1 text-sm font-medium text-[#6f6552]">
                  {paymentLineLabel(order.paymentStatus, order.paymentMethod, en)}
                </span>
                <span className="rounded-full border border-[#e2d4b7] bg-[#f9f2e6] px-3 py-1 text-sm font-medium text-[#6f6552]">
                  {paymentMethodLabel(order.paymentMethod, en)} ·{' '}
                  {paymentStatusLabel(order.paymentStatus, en)}
                </span>
              </div>
            </div>

            <div className="rounded-2xl border border-[#d7c7a8] bg-[#fffaf0] p-6 shadow-[0_16px_40px_rgba(95,70,40,0.08)]">
              <h2 className="mb-4 text-lg font-semibold text-[#2f3a2f]">
                {en ? 'Items' : 'वस्तुएँ'} ({order.items.length})
              </h2>
              {order.negotiatedPricePerUnit != null && (
                <p className="mb-4 text-sm text-[#6f6552]">
                  {en ? 'Negotiated price per unit' : 'प्रति इकाई सौदा मूल्य'}:{' '}
                  {formatInr(order.negotiatedPricePerUnit)}
                </p>
              )}
              <ul className="space-y-4">
                {order.items.map((line, i) => (
                  <li
                    key={`${line.productId}-${i}`}
                    className="flex gap-4 rounded-xl border border-[#e2d4b7] bg-[#fffdf7] p-4"
                  >
                    <img
                      src={line.image}
                      alt=""
                      className="h-20 w-20 shrink-0 rounded-lg border border-[#eadfc8] object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-[#2f3a2f]">{line.name}</p>
                      <p className="text-sm text-[#6f6552]">
                        {line.quantity} {line.unit} × {formatInr(line.pricePerUnit)}
                      </p>
                    </div>
                    <p className="shrink-0 font-bold text-[#315f3b]">{formatInr(line.lineTotal)}</p>
                  </li>
                ))}
              </ul>
              <div className="mt-6 space-y-2 border-t border-[#e2d4b7] pt-4 text-sm">
                <div className="flex justify-between text-[#6f6552]">
                  <span>{en ? 'Items subtotal' : 'वस्तुओं का योग'}</span>
                  <span>{formatInr(order.totalAmount)}</span>
                </div>
                {(order.platformFee ?? 0) > 0 && (
                  <div className="flex justify-between text-[#6f6552]">
                    <span>{en ? 'Platform fee (2%)' : 'प्लेटफॉर्म शुल्क (2%)'}</span>
                    <span>{formatInr(order.platformFee ?? 0)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between border-t border-[#e2d4b7] pt-2">
                  <span className="text-lg font-semibold text-[#2f3a2f]">
                    {en ? 'Buyer pays' : 'खरीदार कुल'}
                  </span>
                  <span className="text-xl font-bold text-[#315f3b]">
                    {formatInr(order.totalAmount + (order.platformFee ?? 0))}
                  </span>
                </div>
              </div>
            </div>

            <OrderStatusTimeline
              status={order.status}
              currentLanguage={currentLanguage}
              paymentPendingNote={order.paymentStatus === 'pending'}
              paymentMethod={order.paymentMethod}
              paymentStatus={order.paymentStatus}
            />

            {(order.returnRequest ||
              (user.role === 'buyer' && canBuyerRequestReturn(order)) ||
              (user.role === 'farmer' && order.returnRequest?.status === 'requested') ||
              (user.role === 'farmer' &&
                order.returnRequest?.status === 'approved' &&
                (order.paymentMethod === 'cod' || order.paymentMethod === 'bank_transfer')) ||
              (user.role === 'admin' && order.returnRequest)) && (
              <div className="rounded-2xl border-2 border-[#ead5a6] bg-[#fff7e8] p-6 shadow-[0_12px_30px_rgba(138,79,42,0.06)]">
                <h2 className="mb-2 text-lg font-semibold text-[#2f3a2f]">
                  {en ? 'Return & refund' : 'वापसी और रिफंड'}
                </h2>
                <p className="mb-4 text-sm text-[#6f6552]">
                  {en
                    ? `If the item is not satisfactory, you can request a return within ${RETURN_WINDOW_DAYS} days of delivery (paid orders only). The seller approves or declines; online payments are refunded automatically when approved.`
                    : `डिलीवरी के ${RETURN_WINDOW_DAYS} दिनों के भीतर (केवल भुगतान किए ऑर्डर) वापसी का अनुरोध करें। विक्रेता स्वीकार/अस्वीकार करता है; ऑनलाइन भुगतान स्वीकृति पर स्वतः रिफंड होता है।`}
                </p>
                {order.returnRequest ? (
                  <div className="space-y-2 text-sm">
                    <div className="flex flex-wrap gap-2 items-center">
                      <span className="font-medium">{en ? 'Status' : 'स्थिति'}:</span>
                      <Badge variant="secondary" className="capitalize bg-[#f3ebdd] text-[#6c5a3d] hover:bg-[#f3ebdd]">
                        {order.returnRequest.status.replace(/_/g, ' ')}
                      </Badge>
                    </div>
                    {order.returnRequest.reason ? (
                      <p>
                        <span className="font-medium">{en ? 'Reason' : 'कारण'}: </span>
                        {RETURN_REASON_OPTIONS.find((r) => r.value === order.returnRequest?.reason)?.[
                          en ? 'en' : 'hi'
                        ] || order.returnRequest.reason}
                      </p>
                    ) : null}
                    {order.returnRequest.details ? (
                      <p className="whitespace-pre-wrap">
                        <span className="font-medium">{en ? 'Details' : 'विवरण'}: </span>
                        {order.returnRequest.details}
                      </p>
                    ) : null}
                    {order.returnRequest.requestedAt ? (
                      <p className="text-xs text-[#6f6552]">
                        {en ? 'Requested' : 'अनुरोध'}:{' '}
                        {new Date(order.returnRequest.requestedAt).toLocaleString(
                          en ? 'en-IN' : 'hi-IN',
                          { dateStyle: 'medium', timeStyle: 'short' }
                        )}
                      </p>
                    ) : null}
                    {order.returnRequest.resolutionNote ? (
                      <p className="border-t border-[#e2d4b7] pt-2">
                        <span className="font-medium">{en ? 'Note' : 'टिप्पणी'}: </span>
                        {order.returnRequest.resolutionNote}
                      </p>
                    ) : null}
                    {order.returnRequest.refundAmount != null &&
                    order.returnRequest.status === 'refunded' ? (
                      <p className="font-medium text-[#315f3b]">
                        {en ? 'Refund amount' : 'रिफंड राशि'}: {formatInr(order.returnRequest.refundAmount)}
                      </p>
                    ) : null}
                  </div>
                ) : null}
                <div className="mt-4 flex flex-wrap gap-2">
                  {user.role === 'buyer' && canBuyerRequestReturn(order) ? (
                    <Button
                      variant="outline"
                      className="border-[#d7c7a8] bg-[#fffdf7] text-[#315f3b] hover:bg-[#f3ebdd] hover:text-[#315f3b]"
                      onClick={() => setReturnDialogOpen(true)}
                    >
                      {en ? 'Request return / refund' : 'वापसी / रिफंड अनुरोध'}
                    </Button>
                  ) : null}
                  {user.role === 'farmer' && order.returnRequest?.status === 'requested' ? (
                    <>
                      <Button
                        className="bg-[#315f3b] text-white hover:bg-[#274d30]"
                        disabled={returnBusy}
                        onClick={() => setRespondOpen('approve')}
                      >
                        {en ? 'Approve return' : 'वापसी स्वीकारें'}
                      </Button>
                      <Button
                        className="bg-[#8a4f2a] text-[#fffaf0] hover:bg-[#784223]"
                        disabled={returnBusy}
                        onClick={() => setRespondOpen('reject')}
                      >
                        {en ? 'Reject' : 'अस्वीकार'}
                      </Button>
                    </>
                  ) : null}
                  {user.role === 'farmer' &&
                  order.returnRequest?.status === 'approved' &&
                  (order.paymentMethod === 'cod' || order.paymentMethod === 'bank_transfer') ? (
                    <Button
                      className="border border-[#b68222] bg-[#d89b2b] text-[#2f2416] hover:bg-[#c88d22]"
                      disabled={returnBusy}
                      onClick={() => void handleConfirmCodReturn()}
                    >
                      {en ? 'Confirm refund given to buyer' : 'खरीदार को रिफंड की पुष्टि'}
                    </Button>
                  ) : null}
                </div>
              </div>
            )}

            <Dialog open={returnDialogOpen} onOpenChange={setReturnDialogOpen}>
              <DialogContent className="border-[#d7c7a8] bg-[#fffaf0]">
                <DialogHeader>
                  <DialogTitle>{en ? 'Request return' : 'वापसी अनुरोध'}</DialogTitle>
                  <DialogDescription>
                    {en
                      ? 'Tell us what went wrong. The seller will respond soon.'
                      : 'बताएं क्या समस्या है। विक्रेता जल्द जवाब देगा।'}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-3 py-2">
                  <div className="space-y-2">
                    <Label>{en ? 'Reason' : 'कारण'}</Label>
                    <Select value={returnReason} onValueChange={setReturnReason}>
                      <SelectTrigger className="border-[#d7c7a8] bg-[#fffdf7] text-[#2f3a2f]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {RETURN_REASON_OPTIONS.map((r) => (
                          <SelectItem key={r.value} value={r.value}>
                            {en ? r.en : r.hi}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>{en ? 'More details (optional)' : 'अधिक विवरण (वैकल्पिक)'}</Label>
                    <Textarea
                      className="border-[#d7c7a8] bg-[#fffdf7] text-[#2f3a2f] placeholder:text-[#8b816f] focus-visible:ring-[#315f3b]"
                      value={returnDetails}
                      onChange={(e) => setReturnDetails(e.target.value)}
                      rows={4}
                      maxLength={2000}
                      placeholder={en ? 'Describe the issue…' : 'समस्या लिखें…'}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    className="border-[#d7c7a8] bg-[#fffdf7] text-[#315f3b] hover:bg-[#f3ebdd] hover:text-[#315f3b]"
                    onClick={() => setReturnDialogOpen(false)}
                  >
                    {en ? 'Cancel' : 'रद्द'}
                  </Button>
                  <Button
                    className="border border-[#b68222] bg-[#d89b2b] text-[#2f2416] hover:bg-[#c88d22]"
                    disabled={returnBusy}
                    onClick={() => void handleRequestReturn()}
                  >
                    {returnBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    {en ? 'Submit' : 'जमा करें'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={respondOpen !== null} onOpenChange={(o) => !o && setRespondOpen(null)}>
              <DialogContent className="border-[#d7c7a8] bg-[#fffaf0]">
                <DialogHeader>
                  <DialogTitle>
                    {respondOpen === 'approve'
                      ? en
                        ? 'Approve this return?'
                        : 'वापसी स्वीकार करें?'
                      : en
                        ? 'Reject this return?'
                        : 'वापसी अस्वीकार करें?'}
                  </DialogTitle>
                  <DialogDescription>
                    {respondOpen === 'approve'
                      ? en
                        ? 'Online orders: refund is started automatically. COD / bank transfer: you must refund the buyer offline, then tap “Confirm refund given”.'
                        : 'ऑनलाइन: रिफंड स्वचालित। COD: पहले नकद लौटाएं, फिर पुष्टि करें।'
                      : en
                        ? 'Optional message to the buyer.'
                        : 'खरीदार के लिए संदेश (वैकल्पिक)।'}
                  </DialogDescription>
                </DialogHeader>
                <div className="py-2">
                  <Label>{en ? 'Note to buyer (optional)' : 'खरीदार को नोट'}</Label>
                  <Textarea
                    className="mt-2 border-[#d7c7a8] bg-[#fffdf7] text-[#2f3a2f] focus-visible:ring-[#315f3b]"
                    value={respondNote}
                    onChange={(e) => setRespondNote(e.target.value)}
                    rows={3}
                    maxLength={1000}
                  />
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    className="border-[#d7c7a8] bg-[#fffdf7] text-[#315f3b] hover:bg-[#f3ebdd] hover:text-[#315f3b]"
                    onClick={() => setRespondOpen(null)}
                  >
                    {en ? 'Back' : 'वापस'}
                  </Button>
                  <Button
                    variant={respondOpen === 'reject' ? 'default' : 'default'}
                    className={
                      respondOpen === 'reject'
                        ? 'bg-[#8a4f2a] text-[#fffaf0] hover:bg-[#784223]'
                        : 'border border-[#b68222] bg-[#d89b2b] text-[#2f2416] hover:bg-[#c88d22]'
                    }
                    disabled={returnBusy}
                    onClick={() => void handleRespondReturn()}
                  >
                    {returnBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    {respondOpen === 'approve' ? (en ? 'Approve' : 'स्वीकार') : (en ? 'Reject' : 'अस्वीकार')}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <div className="rounded-2xl border border-[#d7c7a8] bg-[#fffaf0] p-6 shadow-[0_16px_40px_rgba(95,70,40,0.08)]">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-[#2f3a2f]">
                <MapPin className="w-5 h-5 text-[#315f3b]" />
                {en ? 'Delivery' : 'डिलीवरी'}
              </h2>
              <p className="whitespace-pre-wrap text-[#2f3a2f]">
                {order.deliveryAddress || (en ? 'No address on file.' : 'पता उपलब्ध नहीं।')}
              </p>
              <div className="mt-4 space-y-1 text-sm text-[#6f6552]">
                {user.role === 'admin' ? (
                  <>
                    <div>
                      <span className="font-medium text-[#2f3a2f]">{en ? 'Buyer' : 'खरीदार'}: </span>
                      {order.buyerName}
                    </div>
                    <div>
                      <span className="font-medium text-[#2f3a2f]">{en ? 'Farmer' : 'किसान'}: </span>
                      {order.farmerName}
                    </div>
                  </>
                ) : user.role === 'buyer' ? (
                  <>
                    <span className="font-medium text-[#2f3a2f]">{en ? 'Seller' : 'विक्रेता'}: </span>
                    {order.farmerName}
                  </>
                ) : (
                  <>
                    <span className="font-medium text-[#2f3a2f]">{en ? 'Buyer' : 'खरीदार'}: </span>
                    {order.buyerName}
                  </>
                )}
              </div>
            </div>

            {user.role === 'admin' && order && (
              <div className="rounded-2xl border border-[#d7c7a8] bg-[#fffaf0] p-6 shadow-[0_16px_40px_rgba(95,70,40,0.08)]">
                <h2 className="mb-4 text-lg font-semibold text-[#2f3a2f]">
                  {en ? 'Admin actions' : 'एडमिन कार्रवाई'}
                </h2>
                <p className="mb-4 text-sm text-[#6f6552]">
                  {en
                    ? 'Update fulfilment or payment status. Buyers and farmers are notified when status changes.'
                    : 'पूर्ति या भुगतान स्थिति अपडेट करें।'}
                </p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>{en ? 'Order status' : 'ऑर्डर स्थिति'}</Label>
                    <Select value={adminOrderStatus || order.status} onValueChange={setAdminOrderStatus}>
                      <SelectTrigger className="border-[#d7c7a8] bg-[#fffdf7] text-[#2f3a2f]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="processing">Processing</SelectItem>
                        <SelectItem value="shipped">Shipped</SelectItem>
                        <SelectItem value="delivered">Delivered</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>{en ? 'Payment status' : 'भुगतान स्थिति'}</Label>
                    <Select
                      value={adminPaymentStatus || order.paymentStatus}
                      onValueChange={setAdminPaymentStatus}
                    >
                      <SelectTrigger className="border-[#d7c7a8] bg-[#fffdf7] text-[#2f3a2f]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                        <SelectItem value="failed">Failed</SelectItem>
                        <SelectItem value="refunded">Refunded</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button
                  className="mt-4 border border-[#b68222] bg-[#d89b2b] text-[#2f2416] hover:bg-[#c88d22]"
                  disabled={
                    acting ||
                    (adminOrderStatus || order.status) === order.status &&
                      (adminPaymentStatus || order.paymentStatus) === order.paymentStatus
                  }
                  onClick={() => void handleAdminSaveOrder()}
                >
                  {acting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  {en ? 'Save changes' : 'सहेजें'}
                </Button>
              </div>
            )}

            {user.role === 'buyer' &&
              order.paymentMethod === 'razorpay' &&
              order.paymentStatus === 'pending' &&
              order.status !== 'cancelled' && (
                <Button
                  className="border border-[#b68222] bg-[#d89b2b] text-[#2f2416] hover:bg-[#c88d22]"
                  disabled={payingOnline}
                  onClick={() => void handlePayOnline()}
                >
                  {payingOnline ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : null}
                  {en ? 'Pay now (Razorpay)' : 'अभी भुगतान करें (Razorpay)'}
                </Button>
              )}

            {user.role === 'farmer' &&
              (order.paymentMethod === 'cod' || order.paymentMethod === 'bank_transfer') &&
              order.paymentStatus === 'pending' &&
              order.status !== 'cancelled' && (
                <Button
                  variant="secondary"
                  className="border border-[#c8d8cb] bg-[#eef5ee] text-[#315f3b] hover:bg-[#e3eee4]"
                  disabled={acting}
                  onClick={() => void handleFarmerMarkPaid()}
                >
                  {en ? 'Mark cash / transfer received' : 'नकद/ट्रांसफर प्राप्त दर्ज करें'}
                </Button>
              )}

            {user.role === 'farmer' && order.status === 'pending' && (
              <div className="flex flex-wrap gap-2">
                <Button
                  className="bg-[#315f3b] text-white hover:bg-[#274d30]"
                  disabled={acting}
                  onClick={() => void handleFarmerAccept()}
                >
                  <Check className="w-4 h-4 mr-1" />
                  {en ? 'Accept order' : 'ऑर्डर स्वीकारें'}
                </Button>
                <Button
                  variant="outline"
                  className="border-[#dfc0af] bg-[#fff8f4] text-[#8a4f2a] hover:bg-[#f6e5dc] hover:text-[#8a4f2a]"
                  disabled={acting}
                  onClick={() => void handleFarmerReject()}
                >
                  <X className="w-4 h-4 mr-1" />
                  {en ? 'Reject' : 'अस्वीकार'}
                </Button>
              </div>
            )}

            {user.role === 'farmer' && order.status === 'processing' && (
              <Button
                className="border border-[#b68222] bg-[#d89b2b] text-[#2f2416] hover:bg-[#c88d22]"
                disabled={acting}
                onClick={() => void handleStatus('shipped')}
              >
                <Truck className="w-4 h-4 mr-1" />
                {en ? 'Mark shipped' : 'भेजा गया'}
              </Button>
            )}

            {user.role === 'farmer' && order.status === 'shipped' && (
              <Button
                className="bg-[#315f3b] text-white hover:bg-[#274d30]"
                disabled={acting}
                onClick={() => void handleStatus('delivered')}
              >
                <Check className="w-4 h-4 mr-1" />
                {en ? 'Mark delivered' : 'पहुंचा दिया'}
              </Button>
            )}

            {user.role === 'buyer' &&
              order.status === 'pending' &&
              order.paymentStatus === 'pending' && (
                <Button variant="destructive" disabled={acting} onClick={() => void handleBuyerCancel()}>
                  {en ? 'Cancel order' : 'ऑर्डर रद्द करें'}
                </Button>
              )}

            {user.role !== 'admin' && (
              <div className="flex flex-wrap gap-3">
                <Link
                  to={user.role === 'farmer' ? '/farmer/chats' : '/buyer/chats'}
                  className="flex-1 min-w-[140px]"
                >
                  <Button variant="outline" className="w-full border-[#d7c7a8] bg-[#fffdf7] text-[#315f3b] hover:bg-[#f3ebdd] hover:text-[#315f3b]">
                    <MessageCircle className="w-4 h-4 mr-2" />
                    {en ? 'Chats' : 'चैट'}
                  </Button>
                </Link>
                {user.role === 'buyer' && order.status === 'delivered' && (
                  <Link to="/buyer/reviews" className="flex-1 min-w-[140px]">
                    <Button className="w-full border border-[#b68222] bg-[#d89b2b] text-[#2f2416] hover:bg-[#c88d22]">
                      <Star className="w-4 h-4 mr-2" />
                      {en ? 'Reviews' : 'समीक्षा'}
                    </Button>
                  </Link>
                )}
              </div>
            )}
          </div>
        )}
      </div>
      </div>
    </Layout>
  );
};

export default OrderDetailPage;
