import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Wallet, TrendingUp, Clock, Download, ArrowDownToLine, Calendar, Filter, IndianRupee, CheckCircle, XCircle, Loader } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAppSelector } from '@/hooks/useRedux';
import { useToast } from '@/hooks/use-toast';
import { mockTransactions, mockWithdrawals, mockEarningsSummary } from '@/data/mockData';
import { Transaction, Withdrawal } from '@/types';
import { formatPrice, formatDate, formatRelativeTime } from '@/lib/format';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

const Earnings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { currentLanguage } = useAppSelector((state) => state.language);
  
  const [summary] = useState(mockEarningsSummary);
  const [transactions, setTransactions] = useState<Transaction[]>(mockTransactions);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>(mockWithdrawals);
  const [filterPeriod, setFilterPeriod] = useState<'week' | 'month' | 'year' | 'all'>('month');
  const [withdrawalAmount, setWithdrawalAmount] = useState('');
  const [isWithdrawalDialogOpen, setIsWithdrawalDialogOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

  // Mock chart data (in real app, this would come from API)
  const earningsChartData = [
    { month: 'Aug', earnings: 18000 },
    { month: 'Sep', earnings: 22000 },
    { month: 'Oct', earnings: 23000 },
    { month: 'Nov', earnings: 25000 },
    { month: 'Dec', earnings: 29420 },
  ];

  const monthlyBreakdown = [
    { month: 'December 2024', amount: 29420, orders: 3 },
    { month: 'November 2024', amount: 25000, orders: 5 },
    { month: 'October 2024', amount: 23000, orders: 4 },
  ];

  const handleWithdrawal = () => {
    const amount = parseFloat(withdrawalAmount);
    
    if (!amount || amount <= 0) {
      toast({
        title: currentLanguage === 'en' ? 'Invalid Amount' : 'अमान्य राशि',
        description: currentLanguage === 'en' ? 'Please enter a valid amount' : 'कृपया एक वैध राशि दर्ज करें',
        variant: 'destructive',
      });
      return;
    }

    if (amount > summary.availableBalance) {
      toast({
        title: currentLanguage === 'en' ? 'Insufficient Balance' : 'अपर्याप्त शेष',
        description: currentLanguage === 'en' ? 'You don\'t have enough balance' : 'आपके पास पर्याप्त शेष नहीं है',
        variant: 'destructive',
      });
      return;
    }

    if (amount < 1000) {
      toast({
        title: currentLanguage === 'en' ? 'Minimum Amount' : 'न्यूनतम राशि',
        description: currentLanguage === 'en' ? 'Minimum withdrawal amount is ₹1,000' : 'न्यूनतम निकासी राशि ₹1,000 है',
        variant: 'destructive',
      });
      return;
    }

    // Simulate withdrawal request
    const newWithdrawal: Withdrawal = {
      id: `wd-${Date.now()}`,
      amount,
      bankAccount: {
        accountNumber: '1234567890',
        ifscCode: 'HDFC0001234',
        bankName: 'HDFC Bank',
        accountHolderName: 'Rajesh Kumar',
      },
      status: 'pending',
      requestedAt: new Date().toISOString(),
    };

    setWithdrawals(prev => [newWithdrawal, ...prev]);
    
    // Add transaction
    const transaction: Transaction = {
      id: `txn-${Date.now()}`,
      type: 'withdrawal',
      amount: -amount,
      status: 'pending',
      description: `Withdrawal request of ${formatPrice(amount)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    setTransactions(prev => [transaction, ...prev]);
    setWithdrawalAmount('');
    setIsWithdrawalDialogOpen(false);
    
    toast({
      title: currentLanguage === 'en' ? 'Withdrawal Requested' : 'निकासी अनुरोध',
      description: currentLanguage === 'en' 
        ? `Withdrawal of ${formatPrice(amount)} has been requested. It will be processed within 1-2 business days.`
        : `${formatPrice(amount)} की निकासी का अनुरोध किया गया है। इसे 1-2 व्यावसायिक दिनों के भीतर संसाधित किया जाएगा।`,
    });
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
    },
  };

  const t = content[currentLanguage];

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="p-2 hover:bg-muted rounded-lg">
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
          
          <Dialog open={isWithdrawalDialogOpen} onOpenChange={setIsWithdrawalDialogOpen}>
            <DialogTrigger asChild>
              <Button className="btn-primary-gradient">
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
                  <p className="text-sm text-muted-foreground mb-1">
                    {currentLanguage === 'en' ? 'Available Balance' : 'उपलब्ध शेष'}
                  </p>
                  <p className="text-2xl font-bold">{formatPrice(summary.availableBalance)}</p>
                </div>
                
                <div>
                  <Label htmlFor="amount">{t.withdrawalAmount}</Label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="Enter amount"
                    value={withdrawalAmount}
                    onChange={(e) => setWithdrawalAmount(e.target.value)}
                    className="mt-1.5"
                  />
                  <p className="text-xs text-muted-foreground mt-1">{t.minWithdrawal}</p>
                </div>

                <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                  <p className="text-sm font-medium mb-2">{t.bankAccount}</p>
                  <p className="text-sm">HDFC Bank</p>
                  <p className="text-sm text-muted-foreground">A/C: ****7890</p>
                  <p className="text-sm text-muted-foreground">IFSC: HDFC0001234</p>
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setIsWithdrawalDialogOpen(false)}
                    className="flex-1"
                  >
                    {t.cancel}
                  </Button>
                  <Button
                    onClick={handleWithdrawal}
                    className="flex-1 btn-primary-gradient"
                    disabled={!withdrawalAmount || parseFloat(withdrawalAmount) <= 0}
                  >
                    {t.withdraw}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>{t.totalEarnings}</CardDescription>
              <CardTitle className="text-2xl">{formatPrice(summary.totalEarnings)}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-1 text-success text-sm">
                <TrendingUp className="w-4 h-4" />
                <span>+{summary.growth.toFixed(1)}%</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>{t.availableBalance}</CardDescription>
              <CardTitle className="text-2xl">{formatPrice(summary.availableBalance)}</CardTitle>
            </CardHeader>
            <CardContent>
              <Button 
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
                <span>{currentLanguage === 'en' ? 'Processing' : 'प्रसंस्करण'}</span>
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
                <span>{currentLanguage === 'en' ? 'All Time' : 'सभी समय'}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts and Breakdown */}
        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          {/* Earnings Trend Chart */}
          <Card>
            <CardHeader>
              <CardTitle>{t.earningsChart}</CardTitle>
              <CardDescription>{t.thisMonth}: {formatPrice(summary.thisMonth)}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={earningsChartData}>
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

          {/* Monthly Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>{t.monthlyBreakdown}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {monthlyBreakdown.map((month) => (
                  <div key={month.month} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <p className="font-medium text-sm">{month.month}</p>
                      <p className="text-xs text-muted-foreground">
                        {month.orders} {currentLanguage === 'en' ? 'orders' : 'ऑर्डर'}
                      </p>
                    </div>
                    <p className="font-bold">{formatPrice(month.amount)}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="transactions" className="space-y-4">
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="transactions">{t.transactions}</TabsTrigger>
              <TabsTrigger value="withdrawals">{t.withdrawals}</TabsTrigger>
            </TabsList>
            
            <Select value={filterPeriod} onValueChange={(v: any) => setFilterPeriod(v)}>
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

          {/* Transactions Tab */}
          <TabsContent value="transactions" className="space-y-4">
            {transactions.length > 0 ? (
              <Card>
                <CardContent className="p-0">
                  <div className="divide-y divide-border">
                    {transactions.map((transaction) => (
                      <div
                        key={transaction.id}
                        className="p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                        onClick={() => setSelectedTransaction(transaction)}
                      >
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
                            <p className={`font-bold ${transaction.amount > 0 ? 'text-success' : 'text-destructive'}`}>
                              {transaction.amount > 0 ? '+' : ''}{formatPrice(Math.abs(transaction.amount))}
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

          {/* Withdrawals Tab */}
          <TabsContent value="withdrawals" className="space-y-4">
            {withdrawals.length > 0 ? (
              <Card>
                <CardContent className="p-0">
                  <div className="divide-y divide-border">
                    {withdrawals.map((withdrawal) => (
                      <div key={withdrawal.id} className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <p className="font-bold text-lg">
                              {formatPrice(withdrawal.amount)}
                            </p>
                            {getWithdrawalBadge(withdrawal.status)}
                          </div>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">{t.bankAccount}:</span>
                            <span>{withdrawal.bankAccount.bankName} - ****{withdrawal.bankAccount.accountNumber.slice(-4)}</span>
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

