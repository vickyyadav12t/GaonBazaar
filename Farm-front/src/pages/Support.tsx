import { useCallback, useEffect, useState } from 'react';
import { Search, ChevronDown, HelpCircle, MessageCircle, Send, Phone, Mail, Clock, Shield, Sparkles, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { mockFAQs } from '@/data/mockData';
import { useAppSelector } from '@/hooks/useRedux';
import { AnimateOnScroll, StaggerContainer } from '@/components/animations';
import { useToast } from '@/hooks/use-toast';
import { apiService } from '@/services/api';

type MyTicketRow = {
  id: string;
  subject: string;
  status: string;
  createdAt: string;
  replyCount: number;
};

const Support = () => {
  const { currentLanguage } = useAppSelector((state) => state.language);
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const { toast } = useToast();
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketMessage, setTicketMessage] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [myTickets, setMyTickets] = useState<MyTicketRow[]>([]);
  const [myTicketsLoading, setMyTicketsLoading] = useState(false);
  const [ticketDialogOpen, setTicketDialogOpen] = useState(false);
  const [ticketDialogLoading, setTicketDialogLoading] = useState(false);
  const [ticketDialogDetail, setTicketDialogDetail] = useState<{
    id: string;
    subject: string;
    message: string;
    status: string;
    replies: { id: string; fromRole: string; body: string; authorName: string; createdAt: string }[];
  } | null>(null);
  const [userReplyText, setUserReplyText] = useState('');
  const [userReplyBusy, setUserReplyBusy] = useState(false);

  const loadMyTickets = useCallback(async () => {
    if (!isAuthenticated) return;
    setMyTicketsLoading(true);
    try {
      const res = await apiService.support.listMyTickets();
      setMyTickets((res.data?.tickets || []) as MyTicketRow[]);
    } catch {
      setMyTickets([]);
    } finally {
      setMyTicketsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    void loadMyTickets();
  }, [loadMyTickets]);

  const openMyTicket = async (id: string) => {
    setTicketDialogOpen(true);
    setTicketDialogLoading(true);
    setTicketDialogDetail(null);
    setUserReplyText('');
    try {
      const res = await apiService.support.getMyTicket(id);
      const t = res.data?.ticket as {
        id: string;
        subject: string;
        message: string;
        status: string;
        replies: { id: string; fromRole: string; body: string; authorName: string; createdAt: string }[];
      } | undefined;
      if (t) {
        setTicketDialogDetail({
          id: t.id,
          subject: t.subject,
          message: t.message,
          status: t.status,
          replies: t.replies || [],
        });
      }
    } catch {
      toast({
        title: currentLanguage === 'en' ? 'Could not load ticket' : 'टिकट नहीं खुल सका',
        variant: 'destructive',
      });
      setTicketDialogOpen(false);
    } finally {
      setTicketDialogLoading(false);
    }
  };

  const handleUserReply = async () => {
    if (!ticketDialogDetail || !userReplyText.trim()) return;
    setUserReplyBusy(true);
    try {
      const res = await apiService.support.replyToTicket(ticketDialogDetail.id, {
        message: userReplyText.trim(),
      });
      const t = res.data?.ticket as {
        id: string;
        subject: string;
        message: string;
        status: string;
        replies: { id: string; fromRole: string; body: string; authorName: string; createdAt: string }[];
      } | undefined;
      if (t) {
        setTicketDialogDetail({
          id: t.id,
          subject: t.subject,
          message: t.message,
          status: t.status,
          replies: t.replies || [],
        });
      }
      setUserReplyText('');
      void loadMyTickets();
      toast({ title: currentLanguage === 'en' ? 'Reply sent' : 'जवाब भेजा गया' });
    } catch (e: unknown) {
      const message =
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (e instanceof Error ? e.message : '');
      toast({
        title: currentLanguage === 'en' ? 'Failed' : 'विफल',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setUserReplyBusy(false);
    }
  };

  const filteredFAQs = mockFAQs.filter(faq => {
    const question = currentLanguage === 'hi' ? faq.questionHindi : faq.question;
    const answer = faq.answer;
    const searchLower = searchQuery.toLowerCase();
    return question.toLowerCase().includes(searchLower) || answer.toLowerCase().includes(searchLower);
  });

  const ticketOpenCount = myTickets.filter(
    (t) => t.status === 'open' || t.status === 'in_progress'
  ).length;
  const ticketResolvedCount = myTickets.filter(
    (t) => t.status === 'resolved' || t.status === 'closed'
  ).length;
  const faqArticleCount = mockFAQs.length;

  const handleSubmitTicket = async () => {
    if (!ticketSubject.trim() || !ticketMessage.trim()) {
      toast({
        title: currentLanguage === 'en' ? 'Please fill all fields' : 'कृपया सभी फ़ील्ड भरें',
        description: currentLanguage === 'en' 
          ? 'Subject and message are required.' 
          : 'विषय और संदेश आवश्यक हैं।',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSubmitting(true);
      const payload: { subject: string; message: string; guestEmail?: string } = {
        subject: ticketSubject.trim(),
        message: ticketMessage.trim(),
      };
      if (!isAuthenticated && guestEmail.trim()) {
        payload.guestEmail = guestEmail.trim();
      }
      const res = await apiService.support.submitTicket(payload);
      const emailOk = (res.data as { emailNotificationSent?: boolean } | undefined)?.emailNotificationSent;
      toast({
        title: currentLanguage === 'en' ? 'Ticket submitted' : 'टिकट जमा हो गया',
        description:
          currentLanguage === 'en'
            ? emailOk === false
              ? 'Your ticket is saved. Email to our team was not sent (mail not configured).'
              : 'We received your request. Our support team will follow up.'
            : emailOk === false
              ? 'आपका टिकट सहेजा गया। ईमेल नहीं भेजा गया (मेल कॉन्फ़िगर नहीं है)।'
              : 'हमने आपका अनुरोध प्राप्त कर लिया है। हमारी टीम जल्द ही संपर्क करेगी।',
      });
      setTicketSubject('');
      setTicketMessage('');
      if (!isAuthenticated) setGuestEmail('');
      void loadMyTickets();
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        (currentLanguage === 'en' ? 'Failed to submit ticket' : 'टिकट जमा नहीं हो सका');
      toast({
        title: currentLanguage === 'en' ? 'Submission failed' : 'जमा विफल',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="min-h-screen min-w-0 overflow-x-hidden bg-gradient-to-b from-background to-muted/20">
        <div className="container mx-auto min-w-0 px-3 py-10 sm:px-4 sm:py-12">
          {/* Header Section */}
          <AnimateOnScroll animation="fade-in">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full mb-6">
                <Shield className="w-5 h-5 text-primary" />
                <span className="text-sm font-semibold text-primary">
                  {currentLanguage === 'en' ? 'Submit tickets anytime' : 'कभी भी टिकट भेजें'}
                </span>
              </div>
              <h1 className={`text-4xl md:text-5xl lg:text-6xl font-extrabold mb-4 ${currentLanguage === 'hi' ? 'font-hindi' : ''}`}>
                {currentLanguage === 'en' ? 'Help & Support' : 'मदद और सहायता'}
              </h1>
              <p className={`text-xl text-muted-foreground max-w-2xl mx-auto ${currentLanguage === 'hi' ? 'font-hindi' : ''}`}>
                {currentLanguage === 'en' ? 'Find answers to your questions or get in touch with our support team' : 'अपने प्रश्नों के उत्तर खोजें या हमारी सहायता टीम से संपर्क करें'}
              </p>
            </div>
          </AnimateOnScroll>

          {/* Quick facts — policy + real data (no vanity metrics) */}
          <AnimateOnScroll animation="slide-up" delay={0.1}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div
                      className="w-16 h-16 bg-primary/20 rounded-xl flex items-center justify-center shrink-0"
                      aria-hidden
                    >
                      <Clock className="w-8 h-8 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm text-muted-foreground mb-1">
                        {currentLanguage === 'en' ? 'First response goal' : 'पहली प्रतिक्रिया लक्ष्य'}
                      </p>
                      <p className="text-2xl font-bold text-foreground">
                        {currentLanguage === 'en' ? 'Within 24 hours' : '24 घंटों के भीतर'}
                      </p>
                      <p className={`text-xs text-muted-foreground mt-1 ${currentLanguage === 'hi' ? 'font-hindi' : ''}`}>
                        {currentLanguage === 'en'
                          ? 'Business days; complex cases may take longer.'
                          : 'कार्य दिवस; जटिल मामले में अधिक समय लग सकता है।'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-success/10 to-success/5 border-success/20">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div
                      className="w-16 h-16 bg-success/20 rounded-xl flex items-center justify-center shrink-0"
                      aria-hidden
                    >
                      <CheckCircle className="w-8 h-8 text-success" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm text-muted-foreground mb-1">
                        {isAuthenticated
                          ? currentLanguage === 'en'
                            ? 'Your tickets'
                            : 'आपके टिकट'
                          : currentLanguage === 'en'
                            ? 'Track your requests'
                            : 'अपने अनुरोध ट्रैक करें'}
                      </p>
                      {isAuthenticated ? (
                        <>
                          <p className="text-2xl font-bold text-foreground tabular-nums">
                            {myTicketsLoading
                              ? '—'
                              : `${ticketOpenCount} ${currentLanguage === 'en' ? 'open' : 'खुले'} · ${ticketResolvedCount} ${currentLanguage === 'en' ? 'closed' : 'बंद'}`}
                          </p>
                          <p className={`text-xs text-muted-foreground mt-1 ${currentLanguage === 'hi' ? 'font-hindi' : ''}`}>
                            {currentLanguage === 'en'
                              ? 'Counts are from tickets on this account.'
                              : 'गिनती इस खाते के टिकटों से है।'}
                          </p>
                        </>
                      ) : (
                        <>
                          <p className={`text-2xl font-bold text-foreground ${currentLanguage === 'hi' ? 'font-hindi' : ''}`}>
                            {currentLanguage === 'en' ? 'Sign in' : 'साइन इन करें'}
                          </p>
                          <p className={`text-xs text-muted-foreground mt-1 ${currentLanguage === 'hi' ? 'font-hindi' : ''}`}>
                            {currentLanguage === 'en'
                              ? 'Sign in to see your ticket history and replies on this page.'
                              : 'इस पृष्ठ पर अपना टिकट इतिहास और जवाब देखने के लिए साइन इन करें।'}
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-secondary/10 to-secondary/5 border-secondary/20">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div
                      className="w-16 h-16 bg-secondary/20 rounded-xl flex items-center justify-center shrink-0"
                      aria-hidden
                    >
                      <MessageCircle className="w-8 h-8 text-secondary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm text-muted-foreground mb-1">
                        {currentLanguage === 'en' ? 'Self-service articles' : 'स्व-सेवा लेख'}
                      </p>
                      <p className="text-2xl font-bold text-foreground tabular-nums">{faqArticleCount}</p>
                      <p className={`text-xs text-muted-foreground mt-1 ${currentLanguage === 'hi' ? 'font-hindi' : ''}`}>
                        {currentLanguage === 'en'
                          ? 'FAQs below — try search before opening a ticket.'
                          : 'नीचे अक्सर पूछे जाने वाले प्रश्न — टिकट से पहले खोज आज़माएँ।'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </AnimateOnScroll>

          {/* Search */}
          <AnimateOnScroll animation="slide-up" delay={0.2}>
            <div className="max-w-2xl mx-auto mb-12">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground z-10" />
                <Input 
                  placeholder={currentLanguage === 'en' ? 'Search for help...' : 'मदद खोजें...'} 
                  className="pl-12 py-6 text-lg border-2 focus:border-primary"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              {searchQuery && (
                <p className="text-sm text-muted-foreground mt-2 text-center">
                  {currentLanguage === 'en' 
                    ? `Found ${filteredFAQs.length} result${filteredFAQs.length !== 1 ? 's' : ''}`
                    : `${filteredFAQs.length} परिणाम मिले`}
                </p>
              )}
            </div>
          </AnimateOnScroll>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* FAQs */}
            <AnimateOnScroll animation="slide-up" delay={0.3}>
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold flex items-center gap-3">
                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                      <HelpCircle className="w-6 h-6 text-primary" />
                    </div>
                    <span className={currentLanguage === 'hi' ? 'font-hindi' : ''}>
                      {currentLanguage === 'en' ? 'Frequently Asked Questions' : 'अक्सर पूछे जाने वाले प्रश्न'}
                    </span>
                  </h2>
                  <Badge variant="secondary" className="text-sm">
                    {filteredFAQs.length} {currentLanguage === 'en' ? 'Questions' : 'प्रश्न'}
                  </Badge>
                </div>
                <div className="space-y-4">
                  {filteredFAQs.length > 0 ? (
                    <StaggerContainer staggerDelay={0.05} animation="slide-up">
                      {filteredFAQs.map((faq, index) => (
                        <Card 
                          key={index} 
                          className="border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-lg overflow-hidden"
                        >
                          <button
                            onClick={() => setOpenFaq(openFaq === index ? null : index)}
                            className="w-full p-5 flex items-center justify-between text-left hover:bg-muted/50 transition-colors"
                          >
                            <span className={`font-semibold text-base flex-1 pr-4 ${currentLanguage === 'hi' ? 'font-hindi' : ''}`}>
                              {currentLanguage === 'hi' ? faq.questionHindi : faq.question}
                            </span>
                            <ChevronDown 
                              className={`w-5 h-5 text-muted-foreground transition-transform duration-300 shrink-0 ${
                                openFaq === index ? 'rotate-180' : ''
                              }`} 
                            />
                          </button>
                          {openFaq === index && (
                            <div className="px-5 pb-5 text-muted-foreground animate-fade-in border-t border-border pt-4">
                              <p className={`leading-relaxed ${currentLanguage === 'hi' ? 'font-hindi' : ''}`}>
                                {faq.answer}
                              </p>
                            </div>
                          )}
                        </Card>
                      ))}
                    </StaggerContainer>
                  ) : (
                    <Card className="border-2 border-dashed">
                      <CardContent className="p-12 text-center">
                        <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <p className={`text-muted-foreground ${currentLanguage === 'hi' ? 'font-hindi' : ''}`}>
                          {currentLanguage === 'en' 
                            ? 'No FAQs found. Try a different search term.' 
                            : 'कोई प्रश्न नहीं मिला। एक अलग खोज शब्द आज़माएं।'}
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </AnimateOnScroll>

            {/* Contact Form */}
            <AnimateOnScroll animation="slide-up" delay={0.4}>
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                      <MessageCircle className="w-6 h-6 text-primary" />
                    </div>
                    <span className={currentLanguage === 'hi' ? 'font-hindi' : ''}>
                      {currentLanguage === 'en' ? 'Submit a Ticket' : 'टिकट जमा करें'}
                    </span>
                  </h2>
                  <Card className="border-2 shadow-lg">
                    <CardHeader className="bg-gradient-to-r from-primary/10 to-secondary/10 border-b">
                      <CardDescription className="space-y-2">
                        <span className="block">
                          {currentLanguage === 'en'
                            ? 'Tickets are saved on our servers. Sign in to track replies here; guests can optionally leave an email.'
                            : 'टिकट हमारे सर्वर पर सहेजे जाते हैं। जवाब यहाँ देखने के लिए साइन इन करें; मेहमान ईमेल छोड़ सकते हैं।'}
                        </span>
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="space-y-5">
                        {!isAuthenticated && (
                          <div>
                            <label className={`text-sm font-semibold mb-2 block ${currentLanguage === 'hi' ? 'font-hindi' : ''}`}>
                              {currentLanguage === 'en' ? 'Your email (optional)' : 'आपका ईमेल (वैकल्पिक)'}
                            </label>
                            <Input
                              type="email"
                              value={guestEmail}
                              onChange={(e) => setGuestEmail(e.target.value)}
                              placeholder={currentLanguage === 'en' ? 'So we can reach you' : 'ताकि हम आपसे संपर्क कर सकें'}
                              className="border-2 focus:border-primary py-6"
                            />
                          </div>
                        )}
                        <div>
                          <label className={`text-sm font-semibold mb-2 block ${currentLanguage === 'hi' ? 'font-hindi' : ''}`}>
                            {currentLanguage === 'en' ? 'Subject' : 'विषय'}
                          </label>
                          <Input 
                            value={ticketSubject} 
                            onChange={(e) => setTicketSubject(e.target.value)} 
                            placeholder={currentLanguage === 'en' ? 'What do you need help with?' : 'आपको किस मदद की ज़रूरत है?'}
                            className="border-2 focus:border-primary py-6"
                          />
                        </div>
                        <div>
                          <label className={`text-sm font-semibold mb-2 block ${currentLanguage === 'hi' ? 'font-hindi' : ''}`}>
                            {currentLanguage === 'en' ? 'Message' : 'संदेश'}
                          </label>
                          <Textarea
                            value={ticketMessage}
                            onChange={(e) => setTicketMessage(e.target.value)}
                            placeholder={currentLanguage === 'en' ? 'Describe your issue in detail...' : 'अपनी समस्या का विस्तार से वर्णन करें...'}
                            className="min-h-[180px] border-2 focus:border-primary resize-none"
                          />
                        </div>
                        <Button 
                          className="w-full btn-primary-gradient py-6 text-lg hover:scale-105 transition-transform"
                          onClick={handleSubmitTicket}
                          disabled={isSubmitting}
                        >
                          {isSubmitting ? (
                            <>
                              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                              {currentLanguage === 'en' ? 'Submitting...' : 'जमा हो रहा है...'}
                            </>
                          ) : (
                            <>
                              <Send className="w-5 h-5 mr-2" />
                              {currentLanguage === 'en' ? 'Submit Ticket' : 'टिकट जमा करें'}
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {isAuthenticated && (
                    <Card className="border-2 shadow-md">
                      <CardHeader>
                        <CardTitle className="text-lg">
                          {currentLanguage === 'en' ? 'Your tickets' : 'आपके टिकट'}
                        </CardTitle>
                        <CardDescription>
                          {currentLanguage === 'en'
                            ? 'Open a ticket to read the thread and send follow-ups.'
                            : 'थ्रेड पढ़ने और फॉलो-अप भेजने के लिए टिकट खोलें।'}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {myTicketsLoading ? (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            {currentLanguage === 'en' ? 'Loading…' : 'लोड हो रहा है…'}
                          </div>
                        ) : myTickets.length === 0 ? (
                          <p className="text-sm text-muted-foreground py-2">
                            {currentLanguage === 'en' ? 'No tickets yet.' : 'अभी कोई टिकट नहीं।'}
                          </p>
                        ) : (
                          <ul className="space-y-2">
                            {myTickets.map((t) => (
                              <li
                                key={t.id}
                                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3 text-sm"
                              >
                                <div className="min-w-0 flex-1">
                                  <p className="font-medium truncate">{t.subject}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {t.createdAt
                                      ? new Date(t.createdAt).toLocaleDateString('en-IN', {
                                          dateStyle: 'medium',
                                        })
                                      : ''}{' '}
                                    · {t.replyCount}{' '}
                                    {currentLanguage === 'en' ? 'replies' : 'जवाब'}
                                  </p>
                                </div>
                                <Badge variant="outline" className="capitalize shrink-0">
                                  {t.status.replace('_', ' ')}
                                </Badge>
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  className="shrink-0"
                                  onClick={() => void openMyTicket(t.id)}
                                >
                                  {currentLanguage === 'en' ? 'Open' : 'खोलें'}
                                </Button>
                              </li>
                            ))}
                          </ul>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* Contact Info */}
                <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/10 to-primary/5">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-primary" />
                      {currentLanguage === 'en' ? 'Need Immediate Help?' : 'तुरंत मदद चाहिए?'}
                    </CardTitle>
                    <CardDescription>
                      {currentLanguage === 'en' 
                        ? 'Contact us directly via phone or email'
                        : 'फोन या ईमेल के माध्यम से सीधे हमसे संपर्क करें'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-4 p-4 bg-card rounded-xl border border-border hover:border-primary/50 transition-colors">
                      <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                        <Phone className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">
                          {currentLanguage === 'en' ? 'Toll Free' : 'टोल फ्री'}
                        </p>
                        <p className="font-bold text-lg">+91 6203135782</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {currentLanguage === 'en' ? 'Mon-Sat, 9 AM - 9 PM' : 'सोम-शनि, सुबह 9 - रात 9'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 p-4 bg-card rounded-xl border border-border hover:border-primary/50 transition-colors">
                      <div className="w-12 h-12 bg-secondary/10 rounded-xl flex items-center justify-center">
                        <Mail className="w-6 h-6 text-secondary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">
                          {currentLanguage === 'en' ? 'Email Support' : 'ईमेल सहायता'}
                        </p>
                        <p className="font-bold text-lg">praj01012003@gmail.com</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {currentLanguage === 'en' ? 'We respond within 24 hours' : 'हम 24 घंटों के भीतर जवाब देते हैं'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </AnimateOnScroll>
          </div>
        </div>
      </div>

      <Dialog
        open={ticketDialogOpen}
        onOpenChange={(open) => {
          setTicketDialogOpen(open);
          if (!open) {
            setTicketDialogDetail(null);
            setUserReplyText('');
          }
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="pr-8 leading-tight">
              {ticketDialogDetail?.subject || (currentLanguage === 'en' ? 'Ticket' : 'टिकट')}
            </DialogTitle>
          </DialogHeader>
          {ticketDialogLoading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-6">
              <Loader2 className="h-4 w-4 animate-spin" />
              {currentLanguage === 'en' ? 'Loading…' : 'लोड हो रहा है…'}
            </div>
          )}
          {!ticketDialogLoading && ticketDialogDetail && (
            <div className="space-y-4 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">
                  {currentLanguage === 'en' ? 'Status' : 'स्थिति'}:
                </span>
                <Badge variant="outline" className="capitalize">
                  {ticketDialogDetail.status.replace('_', ' ')}
                </Badge>
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                  {currentLanguage === 'en' ? 'Your message' : 'आपका संदेश'}
                </p>
                <p className="whitespace-pre-wrap">{ticketDialogDetail.message}</p>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  {currentLanguage === 'en' ? 'Thread' : 'बातचीत'}
                </p>
                {ticketDialogDetail.replies.length === 0 ? (
                  <p className="text-muted-foreground">
                    {currentLanguage === 'en' ? 'No replies yet.' : 'अभी कोई जवाब नहीं।'}
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {ticketDialogDetail.replies.map((r) => (
                      <li
                        key={r.id}
                        className={`rounded-md border p-3 ${
                          r.fromRole === 'admin' ? 'bg-primary/5' : ''
                        }`}
                      >
                        <p className="text-xs text-muted-foreground mb-1">
                          {r.authorName || r.fromRole} ·{' '}
                          {r.createdAt
                            ? new Date(r.createdAt).toLocaleString('en-IN', {
                                dateStyle: 'short',
                                timeStyle: 'short',
                              })
                            : ''}
                        </p>
                        <p className="whitespace-pre-wrap">{r.body}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              {ticketDialogDetail.status !== 'closed' && (
                <>
                  <Label htmlFor="user-ticket-reply">
                    {currentLanguage === 'en' ? 'Your reply' : 'आपका जवाब'}
                  </Label>
                  <Textarea
                    id="user-ticket-reply"
                    value={userReplyText}
                    onChange={(e) => setUserReplyText(e.target.value)}
                    rows={3}
                    className="resize-none"
                    placeholder={
                      currentLanguage === 'en' ? 'Add a follow-up message…' : 'फॉलो-अप संदेश…'
                    }
                  />
                </>
              )}
            </div>
          )}
          {!ticketDialogLoading && ticketDialogDetail && ticketDialogDetail.status !== 'closed' && (
            <DialogFooter>
              <Button
                onClick={() => void handleUserReply()}
                disabled={userReplyBusy || !userReplyText.trim()}
              >
                {userReplyBusy ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {currentLanguage === 'en' ? 'Sending…' : 'भेज रहे हैं…'}
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    {currentLanguage === 'en' ? 'Send reply' : 'जवाब भेजें'}
                  </>
                )}
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default Support;
