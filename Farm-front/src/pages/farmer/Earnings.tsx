import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Wallet,
  TrendingUp,
  TrendingDown,
  Clock,
  ArrowDownToLine,
  Filter,
  IndianRupee,
  CheckCircle,
  Info,
  RefreshCw,
  Download,
  Loader2,
} from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAppSelector } from '@/hooks/useRedux';
import { useToast } from '@/hooks/use-toast';
import { Transaction, Withdrawal, EarningsSummary } from '@/types';
import { formatPrice, formatDate, formatRelativeTime } from '@/lib/format';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { apiService } from '@/services/api';
import { saveCsvFromApi } from '@/lib/downloadCsv';

const emptySummary: EarningsSummary = {
  totalEarnings: 0,
  availableBalance: 0,
  pendingPayments: 0,
  withdrawnAmount: 0,
  thisMonth: 0,
  lastMonth: 0,
  growth: 0,
};

type ChartRow = { month: string; earnings: number };
type MonthlyRow = { month: string; amount: number; orders: number };

const Earnings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { currentLanguage } = useAppSelector((state) => state.language);
  const { user } = useAppSelector((state) => state.auth);

  const [summary, setSummary] = useState<EarningsSummary>(emptySummary);
  const [chartByMonth, setChartByMonth] = useState<ChartRow[]>([]);
  const [monthlyBreakdown, setMonthlyBreakdown] = useState<MonthlyRow[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [filterPeriod, setFilterPeriod] = useState<'week' | 'month' | 'year' | 'all'>('month');
  const [withdrawalAmount, setWithdrawalAmount] = useState('');
  const [isWithdrawalDialogOpen, setIsWithdrawalDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmittingWithdrawal, setIsSubmittingWithdrawal] = useState(false);
  const [exportingPayoutsCsv, setExportingPayoutsCsv] = useState(false);
  const [bankForm, setBankForm] = useState({
    bankName: '',
    accountNumber: '',
    ifscCode: '',
    accountHolderName: '',
  });

  const loadEarnings = useCallback(async () => {
    if (!user || user.role !== 'farmer') return;
    try {
      setIsLoading(true);
      const res = await apiService.earnings.getDashboard();
      const data = res.data as {
        summary: EarningsSummary;
        chartByMonth: ChartRow[];
        monthlyBreakdown: MonthlyRow[];
        transactions: Transaction[];
        withdrawals: Withdrawal[];
      };
      if (data.summary) setSummary(data.summary);
      setChartByMonth(data.chartByMonth || []);
      setMonthlyBreakdown(data.monthlyBreakdown || []);
      setTransactions(data.transactions || []);
      setWithdrawals(data.withdrawals || []);
    } catch (error: any) {
      console.error('Failed to load earnings', error);
      toast({
        title: currentLanguage === 'en' ? 'Error' : 'त्रुटि',
        description:
          error?.response?.data?.message ||
          error?.message ||
          (currentLanguage === 'en'
            ? 'Failed to load earnings.'
            : 'कमाई लोड करने में विफल।'),
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [user, currentLanguage, toast]);

  useEffect(() => {
    loadEarnings();
  }, [loadEarnings]);

  const filteredTransactions = useMemo(() => {
    if (filterPeriod === 'all') return transactions;
    const now = Date.now();
    const days = filterPeriod === 'week' ? 7 : filterPeriod === 'month' ? 30 : 365;
    const ms = days * 86400000;
    return transactions.filter((t) => now - new Date(t.createdAt).getTime() <= ms);
  }, [transactions, filterPeriod]);

  const filteredWithdrawals = useMemo(() => {
    if (filterPeriod === 'all') return withdrawals;
    const now = Date.now();
    const days = filterPeriod === 'week' ? 7 : filterPeriod === 'month' ? 30 : 365;
    const ms = days * 86400000;
    return withdrawals.filter((w) => now - new Date(w.requestedAt).getTime() <= ms);
  }, [withdrawals, filterPeriod]);

  const handleWithdrawal = async () => {
    const amount = parseFloat(withdrawalAmount);

    if (!amount || amount <= 0) {
      toast({
        title: currentLanguage === 'en' ? 'Invalid Amount' : 'अमान्य राशि',
        description:
          currentLanguage === 'en' ? 'Please enter a valid amount' : 'कृपया एक वैध राशि दर्ज करें',
        variant: 'destructive',
      });
      return;
    }

    if (amount > summary.availableBalance) {
      toast({
        title: currentLanguage === 'en' ? 'Insufficient Balance' : 'अपर्याप्त शेष',
        description:
          currentLanguage === 'en'
            ? "You don't have enough available balance"
            : 'आपके पास पर्याप्त उपलब्ध शेष नहीं है',
        variant: 'destructive',
      });
      return;
    }

    if (amount < 1000) {
      toast({
        title: currentLanguage === 'en' ? 'Minimum Amount' : 'न्यूनतम राशि',
        description:
          currentLanguage === 'en'
            ? 'Minimum withdrawal amount is ₹1,000'
            : 'न्यूनतम निकासी राशि ₹1,000 है',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSubmittingWithdrawal(true);
      await apiService.earnings.requestWithdrawal({
        amount,
        bankName: bankForm.bankName.trim() || undefined,
        accountNumber: bankForm.accountNumber.trim() || undefined,
        ifscCode: bankForm.ifscCode.trim() || undefined,
        accountHolderName: bankForm.accountHolderName.trim() || undefined,
      });
      toast({
        title: currentLanguage === 'en' ? 'Withdrawal Requested' : 'निकासी अनुरोध',
        description:
          currentLanguage === 'en'
            ? `Request for ${formatPrice(amount)} submitted. It will be reviewed for payout.`
            : `${formatPrice(amount)} का अनुरोध जमा हुआ। भुगतान की समीक्षा होगी।`,
      });
      setWithdrawalAmount('');
      setIsWithdrawalDialogOpen(false);
      await loadEarnings();
    } catch (error: any) {
      toast({
        title: currentLanguage === 'en' ? 'Error' : 'त्रुटि',
        description:
          error?.response?.data?.message ||
          error?.message ||
          (currentLanguage === 'en'
            ? 'Could not submit withdrawal.'
            : 'निकासी जमा नहीं हो सकी।'),
        variant: 'destructive',
      });
    } finally {
      setIsSubmittingWithdrawal(false);
    }
  };

  const getTransactionIcon = (type: Transaction['type']) => {
    switch (type) {
      case 'order_payment':
        return <TrendingUp className="w-5 h-5 text-success" />;
      case 'withdrawal':
        return <ArrowDownToLine className="w-5 h-5 text-destructive" />;
      case 'platform_fee':
        return <IndianRupee className="w-5 h-5 text-muted-foreground" />;
      case 'bonus':
        return <CheckCircle className="w-5 h-5 text-accent" />;
      default:
        return <Wallet className="w-5 h-5 text-primary" />;
    }
  };

  const getTransactionBadge = (status: Transaction['status']) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-success/10 text-success">{currentLanguage === 'en' ? 'Completed' : 'पूर्ण'}</Badge>;
      case 'pending':
        return <Badge className="bg-warning/10 text-warning">{currentLanguage === 'en' ? 'Pending' : 'लंबित'}</Badge>;
      case 'failed':
        return <Badge className="bg-destructive/10 text-destructive">{currentLanguage === 'en' ? 'Failed' : 'असफल'}</Badge>;
    }
  };

  const getWithdrawalBadge = (status: Withdrawal['status']) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-success/10 text-success">{currentLanguage === 'en' ? 'Completed' : 'पूर्ण'}</Badge>;
      case 'pending':
        return <Badge className="bg-warning/10 text-warning">{currentLanguage === 'en' ? 'Pending' : 'लंबित'}</Badge>;
      case 'processing':
        return <Badge className="bg-primary/10 text-primary">{currentLanguage === 'en' ? 'Processing' : 'प्रसंस्करण'}</Badge>;
      case 'rejected':
        return <Badge className="bg-destructive/10 text-destructive">{currentLanguage === 'en' ? 'Rejected' : 'अस्वीकृत'}</Badge>;
    }
  };

  const maskAccount = (num: string) => {
    const digits = num.replace(/\D/g, '');
    if (digits.length >= 4) return `****${digits.slice(-4)}`;
    return num || '—';
  };

  const content = {
    en: {
      title: 'Earnings & Wallet',
      subtitle: 'Manage your earnings and withdrawals',
      totalEarnings: 'Total Earnings',
      availableBalance: 'Available Balance',
      pendingPayments: 'Pending Payments',
      withdrawn: 'Withdrawn',
      thisMonth: 'This Month',
      growth: 'Growth',
      growthVsPrev: 'vs last month',
      overview: 'Overview',
      transactions: 'Transactions',
      withdrawals: 'Withdrawals',
      earningsChart: 'Earnings Trend',
      monthlyBreakdown: 'Monthly Breakdown',
      requestWithdrawal: 'Request Withdrawal',
      withdrawalAmount: 'Withdrawal Amount',
      minWithdrawal: 'Minimum withdrawal: ₹1,000',
      withdraw: 'Withdraw',
      cancel: 'Cancel',
      date: 'Date',
      description: 'Description',
      amount: 'Amount',
      status: 'Status',
      noTransactions: 'No transactions found',
      noWithdrawals: 'No withdrawals found',
      bankAccount: 'Bank Account',
      requestedOn: 'Requested On',
      processedOn: 'Processed On',
      filterBy: 'Filter By',
      week: 'Last Week',
      month: 'Last Month',
      year: 'Last Year',
      all: 'All Time',
      dataNote:
        'Totals are calculated from orders marked paid and withdrawal requests in this app. Bank payouts are not automated here.',
      bankDetails: 'Payout bank details',
      bankName: 'Bank name',
      accountNumber: 'Account number',
      ifsc: 'IFSC',
      accountHolder: 'Account holder name',
      loading: 'Loading…',
      refresh: 'Refresh',
      exportPayoutsCsv: 'Export payouts (CSV)',
    },
    hi: {
      title: 'कमाई और वॉलेट',
      subtitle: 'अपनी कमाई और निकासी प्रबंधित करें',
      totalEarnings: 'कुल कमाई',
      availableBalance: 'उपलब्ध शेष',
      pendingPayments: 'लंबित भुगतान',
      withdrawn: 'निकाला गया',
      thisMonth: 'इस महीने',
      growth: 'वृद्धि',
      growthVsPrev: 'पिछले माह की तुलना में',
      overview: 'अवलोकन',
      transactions: 'लेनदेन',
      withdrawals: 'निकासी',
      earningsChart: 'कमाई रुझान',
      monthlyBreakdown: 'मासिक विवरण',
      requestWithdrawal: 'निकासी अनुरोध',
      withdrawalAmount: 'निकासी राशि',
      minWithdrawal: 'न्यूनतम निकासी: ₹1,000',
      withdraw: 'निकालें',
      cancel: 'रद्द करें',
      date: 'तारीख',
      description: 'विवरण',
      amount: 'राशि',
      status: 'स्थिति',
      noTransactions: 'कोई लेनदेन नहीं मिला',
      noWithdrawals: 'कोई निकासी नहीं मिली',
      bankAccount: 'बैंक खाता',
      requestedOn: 'अनुरोध की तारीख',
      processedOn: 'प्रसंस्करण की तारीख',
      filterBy: 'फ़िल्टर करें',
      week: 'पिछला सप्ताह',
      month: 'पिछला महीना',
      year: 'पिछला साल',
      all: 'सभी समय',
      dataNote:
        'योग इस ऐप में भुगतान किए ऑर्डर और निकासी अनुरोधों से निकाले गए हैं। बैंक ट्रांसफ़र यहाँ स्वचालित नहीं हैं।',
      bankDetails: 'भुगतान बैंक विवरण',
      bankName: 'बैंक का नाम',
      accountNumber: 'खाता संख्या',
      ifsc: 'IFSC',
      accountHolder: 'खाताधारक का नाम',
      loading: 'लोड हो रहा है…',
      refresh: 'रिफ्रेश',
      exportPayoutsCsv: 'निकासी CSV निर्यात',
    },
  };

  const t = content[currentLanguage];

  const handleExportPayoutsCsv = async () => {
    try {
      setExportingPayoutsCsv(true);
      await saveCsvFromApi(() => apiService.earnings.exportWithdrawalsCsv(), 'payouts.csv');
      toast({
        title: currentLanguage === 'en' ? 'Export started' : 'निर्यात शुरू',
        description:
          currentLanguage === 'en'
            ? 'Your payouts CSV is downloading.'
            : 'आपका भुगतान CSV डाउनलोड हो रहा है।',
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '';
      toast({
        title: currentLanguage === 'en' ? 'Export failed' : 'निर्यात विफल',
        description:
          msg ||
          (currentLanguage === 'en' ? 'Could not download CSV.' : 'CSV डाउनलोड नहीं हो सका।'),
        variant: 'destructive',
      });
    } finally {
      setExportingPayoutsCsv(false);
    }
  };

  const growthPositive = summary.growth >= 0;
  const showGrowth =
    summary.thisMonth > 0 || summary.lastMonth > 0 || summary.totalEarnings > 0;

  return (
    <Layout>
      <div
        className={`container mx-auto min-w-0 px-3 py-5 transition-opacity sm:px-4 sm:py-6 ${isLoading ? 'opacity-70' : ''}`}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button type="button" onClick={() => navigate(-1)} className="p-2 hover:bg-muted rounded-lg">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className={`text-2xl font-bold ${currentLanguage === 'hi' ? 'font-hindi' : ''}`}>
                {t.title}
              </h1>
              <p className={`text-muted-foreground ${currentLanguage === 'hi' ? 'font-hindi' : ''}`}>
                {t.subtitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => void loadEarnings()}
              disabled={isLoading}
              title={t.refresh}
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
            <Dialog open={isWithdrawalDialogOpen} onOpenChange={setIsWithdrawalDialogOpen}>
            <DialogTrigger asChild>
              <Button className="btn-primary-gradient" disabled={isLoading}>
                <ArrowDownToLine className="w-4 h-4 mr-2" />
                {t.requestWithdrawal}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t.requestWithdrawal}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">{t.availableBalance}</p>
                  <p className="text-2xl font-bold">{formatPrice(summary.availableBalance)}</p>
                </div>

                <div>
                  <Label htmlFor="amount">{t.withdrawalAmount}</Label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="1000"
                    value={withdrawalAmount}
                    onChange={(e) => setWithdrawalAmount(e.target.value)}
                    className="mt-1.5"
                  />
                  <p className="text-xs text-muted-foreground mt-1">{t.minWithdrawal}</p>
                </div>

                <div className="space-y-3">
                  <p className="text-sm font-medium">{t.bankDetails}</p>
                  <div>
                    <Label htmlFor="bn">{t.bankName}</Label>
                    <Input
                      id="bn"
                      value={bankForm.bankName}
                      onChange={(e) => setBankForm((f) => ({ ...f, bankName: e.target.value }))}
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label htmlFor="ac">{t.accountNumber}</Label>
                    <Input
                      id="ac"
                      value={bankForm.accountNumber}
                      onChange={(e) => setBankForm((f) => ({ ...f, accountNumber: e.target.value }))}
                      className="mt-1.5"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="ifsc">{t.ifsc}</Label>
                      <Input
                        id="ifsc"
                        value={bankForm.ifscCode}
                        onChange={(e) => setBankForm((f) => ({ ...f, ifscCode: e.target.value }))}
                        className="mt-1.5"
                      />
                    </div>
                    <div>
                      <Label htmlFor="holder">{t.accountHolder}</Label>
                      <Input
                        id="holder"
                        value={bankForm.accountHolderName}
                        onChange={(e) => setBankForm((f) => ({ ...f, accountHolderName: e.target.value }))}
                        className="mt-1.5"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsWithdrawalDialogOpen(false)}
                    className="flex-1"
                  >
                    {t.cancel}
                  </Button>
                  <Button
                    type="button"
                    onClick={() => void handleWithdrawal()}
                    className="flex-1 btn-primary-gradient"
                    disabled={
                      !withdrawalAmount ||
                      parseFloat(withdrawalAmount) <= 0 ||
                      isSubmittingWithdrawal
                    }
                  >
                    {isSubmittingWithdrawal ? t.loading : t.withdraw}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          </div>
        </div>

        <Alert className="mb-6 border-primary/30 bg-primary/5">
          <Info className="h-4 w-4" />
          <AlertDescription className={currentLanguage === 'hi' ? 'font-hindi' : ''}>{t.dataNote}</AlertDescription>
        </Alert>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>{t.totalEarnings}</CardDescription>
              <CardTitle className="text-2xl">{formatPrice(summary.totalEarnings)}</CardTitle>
            </CardHeader>
            <CardContent>
              {showGrowth ? (
                <div
                  className={`flex items-center gap-1 text-sm ${growthPositive ? 'text-success' : 'text-destructive'}`}
                >
                  {growthPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  <span>
                    {growthPositive ? '+' : ''}
                    {summary.growth.toFixed(1)}%{' '}
                    <span className="text-muted-foreground font-normal">{t.growthVsPrev}</span>
                  </span>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">—</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>{t.availableBalance}</CardDescription>
              <CardTitle className="text-2xl">{formatPrice(summary.availableBalance)}</CardTitle>
            </CardHeader>
            <CardContent>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsWithdrawalDialogOpen(true)}
                className="h-7"
              >
                <ArrowDownToLine className="w-3 h-3 mr-1" />
                {currentLanguage === 'en' ? 'Withdraw' : 'निकालें'}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>{t.pendingPayments}</CardDescription>
              <CardTitle className="text-2xl">{formatPrice(summary.pendingPayments)}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-1 text-warning text-sm">
                <Clock className="w-4 h-4" />
                <span>{currentLanguage === 'en' ? 'Awaiting payment' : 'भुगतान लंबित'}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>{t.withdrawn}</CardDescription>
              <CardTitle className="text-2xl">{formatPrice(summary.withdrawnAmount)}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-1 text-muted-foreground text-sm">
                <Wallet className="w-4 h-4" />
                <span>{currentLanguage === 'en' ? 'Completed payouts' : 'पूर्ण भुगतान'}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle>{t.earningsChart}</CardTitle>
              <CardDescription>
                {t.thisMonth}: {formatPrice(summary.thisMonth)}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartByMonth.length > 0 ? chartByMonth : [{ month: '—', earnings: 0 }]}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="month" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip formatter={(value) => formatPrice(Number(value))} />
                    <Area
                      type="monotone"
                      dataKey="earnings"
                      stroke="hsl(var(--primary))"
                      fill="hsl(var(--primary) / 0.2)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t.monthlyBreakdown}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {monthlyBreakdown.length > 0 ? (
                  monthlyBreakdown.map((row) => (
                    <div key={row.month} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div>
                        <p className="font-medium text-sm">{row.month}</p>
                        <p className="text-xs text-muted-foreground">
                          {row.orders} {currentLanguage === 'en' ? 'paid orders' : 'भुगतान किए ऑर्डर'}
                        </p>
                      </div>
                      <p className="font-bold">{formatPrice(row.amount)}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    {currentLanguage === 'en' ? 'No paid orders yet' : 'अभी कोई भुगतान किया ऑर्डर नहीं'}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="transactions" className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <TabsList>
              <TabsTrigger value="transactions">{t.transactions}</TabsTrigger>
              <TabsTrigger value="withdrawals">{t.withdrawals}</TabsTrigger>
            </TabsList>

            <Select value={filterPeriod} onValueChange={(v: 'week' | 'month' | 'year' | 'all') => setFilterPeriod(v)}>
              <SelectTrigger className="w-40">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">{t.week}</SelectItem>
                <SelectItem value="month">{t.month}</SelectItem>
                <SelectItem value="year">{t.year}</SelectItem>
                <SelectItem value="all">{t.all}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <TabsContent value="transactions" className="space-y-4">
            {filteredTransactions.length > 0 ? (
              <Card>
                <CardContent className="p-0">
                  <div className="divide-y divide-border">
                    {filteredTransactions.map((transaction) => (
                      <div key={transaction.id} className="p-4 hover:bg-muted/50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                              {getTransactionIcon(transaction.type)}
                            </div>
                            <div>
                              <p className="font-medium text-sm">{transaction.description}</p>
                              <p className="text-xs text-muted-foreground">
                                {formatRelativeTime(transaction.createdAt)}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p
                              className={`font-bold ${transaction.amount > 0 ? 'text-success' : 'text-destructive'}`}
                            >
                              {transaction.amount > 0 ? '+' : ''}
                              {formatPrice(Math.abs(transaction.amount))}
                            </p>
                            {getTransactionBadge(transaction.status)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <Wallet className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className={`text-muted-foreground ${currentLanguage === 'hi' ? 'font-hindi' : ''}`}>
                    {t.noTransactions}
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="withdrawals" className="space-y-4">
            <div className="flex justify-end">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={exportingPayoutsCsv}
                onClick={() => void handleExportPayoutsCsv()}
              >
                {exportingPayoutsCsv ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Download className="w-4 h-4 mr-2" />
                )}
                {t.exportPayoutsCsv}
              </Button>
            </div>
            {filteredWithdrawals.length > 0 ? (
              <Card>
                <CardContent className="p-0">
                  <div className="divide-y divide-border">
                    {filteredWithdrawals.map((withdrawal) => (
                      <div key={withdrawal.id} className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <p className="font-bold text-lg">{formatPrice(withdrawal.amount)}</p>
                            {getWithdrawalBadge(withdrawal.status)}
                          </div>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between gap-2">
                            <span className="text-muted-foreground shrink-0">{t.bankAccount}:</span>
                            <span className="text-right">
                              {withdrawal.bankAccount.bankName} — {maskAccount(withdrawal.bankAccount.accountNumber)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">{t.requestedOn}:</span>
                            <span>{formatDate(withdrawal.requestedAt)}</span>
                          </div>
                          {withdrawal.processedAt && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">{t.processedOn}:</span>
                              <span>{formatDate(withdrawal.processedAt)}</span>
                            </div>
                          )}
                          {withdrawal.rejectionReason && (
                            <div className="mt-2 p-2 bg-destructive/10 rounded text-destructive text-xs">
                              {withdrawal.rejectionReason}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <ArrowDownToLine className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className={`text-muted-foreground ${currentLanguage === 'hi' ? 'font-hindi' : ''}`}>
                    {t.noWithdrawals}
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Earnings;
