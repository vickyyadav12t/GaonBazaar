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
      <div className="min-h-screen min-w-0 overflow-x-hidden bg-[#f6f1e7] bg-[linear-gradient(rgba(138,79,42,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(138,79,42,0.05)_1px,transparent_1px)] bg-[size:24px_24px]">
        <div className="container mx-auto min-w-0 px-3 py-10 sm:px-4 sm:py-12">
          {/* Header Section */}
          <AnimateOnScroll animation="fade-in">
            <div className="text-center mb-12">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#d7c7a8] bg-[#fffaf0] px-4 py-2">
                <Shield className="w-5 h-5 text-[#315f3b]" />
                <span className="text-sm font-semibold text-[#315f3b]">
                  {currentLanguage === 'en' ? 'Submit tickets anytime' : 'कभी भी टिकट भेजें'}
                </span>
              </div>
              <h1 className={`mb-4 text-4xl font-extrabold text-[#2f3a2f] md:text-5xl lg:text-6xl ${currentLanguage === 'hi' ? 'font-hindi' : ''}`}>
                {currentLanguage === 'en' ? 'Help & Support' : 'मदद और सहायता'}
              </h1>
              <p className={`mx-auto max-w-2xl text-xl text-[#6f6552] ${currentLanguage === 'hi' ? 'font-hindi' : ''}`}>
                {currentLanguage === 'en' ? 'Find answers to your questions or get in touch with our support team' : 'अपने प्रश्नों के उत्तर खोजें या हमारी सहायता टीम से संपर्क करें'}
              </p>
            </div>
          </AnimateOnScroll>

          {/* Quick facts — policy + real data (no vanity metrics) */}
          <AnimateOnScroll animation="slide-up" delay={0.1}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              <Card className="border-[#d7c7a8] bg-[#fffaf0] shadow-[0_16px_40px_rgba(95,70,40,0.08)]">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div
                      className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-[#f3ebdd]"
                      aria-hidden
                    >
                      <Clock className="w-8 h-8 text-[#315f3b]" />
                    </div>
                    <div className="min-w-0">
                      <p className="mb-1 text-sm text-[#6f6552]">
                        {currentLanguage === 'en' ? 'First response goal' : 'पहली प्रतिक्रिया लक्ष्य'}
                      </p>
                      <p className="text-2xl font-bold text-[#2f3a2f]">
                        {currentLanguage === 'en' ? 'Within 24 hours' : '24 घंटों के भीतर'}
                      </p>
                      <p className={`mt-1 text-xs text-[#6f6552] ${currentLanguage === 'hi' ? 'font-hindi' : ''}`}>
                        {currentLanguage === 'en'
                          ? 'Business days; complex cases may take longer.'
                          : 'कार्य दिवस; जटिल मामले में अधिक समय लग सकता है।'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-[#d7c7a8] bg-[#fffaf0] shadow-[0_16px_40px_rgba(95,70,40,0.08)]">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div
                      className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-[#eaf5ec]"
                      aria-hidden
                    >
                      <CheckCircle className="w-8 h-8 text-[#315f3b]" />
                    </div>
                    <div className="min-w-0">
                      <p className="mb-1 text-sm text-[#6f6552]">
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
                          <p className="text-2xl font-bold tabular-nums text-[#2f3a2f]">
                            {myTicketsLoading
                              ? '—'
                              : `${ticketOpenCount} ${currentLanguage === 'en' ? 'open' : 'खुले'} · ${ticketResolvedCount} ${currentLanguage === 'en' ? 'closed' : 'बंद'}`}
                          </p>
                          <p className={`mt-1 text-xs text-[#6f6552] ${currentLanguage === 'hi' ? 'font-hindi' : ''}`}>
                            {currentLanguage === 'en'
                              ? 'Counts are from tickets on this account.'
                              : 'गिनती इस खाते के टिकटों से है।'}
                          </p>
                        </>
                      ) : (
                        <>
                          <p className={`text-2xl font-bold text-[#2f3a2f] ${currentLanguage === 'hi' ? 'font-hindi' : ''}`}>
                            {currentLanguage === 'en' ? 'Sign in' : 'साइन इन करें'}
                          </p>
                          <p className={`mt-1 text-xs text-[#6f6552] ${currentLanguage === 'hi' ? 'font-hindi' : ''}`}>
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
              <Card className="border-[#d7c7a8] bg-[#fffaf0] shadow-[0_16px_40px_rgba(95,70,40,0.08)]">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div
                      className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-[#fff4dd]"
                      aria-hidden
                    >
                      <MessageCircle className="w-8 h-8 text-[#d89b2b]" />
                    </div>
                    <div className="min-w-0">
                      <p className="mb-1 text-sm text-[#6f6552]">
                        {currentLanguage === 'en' ? 'Self-service articles' : 'स्व-सेवा लेख'}
                      </p>
                      <p className="text-2xl font-bold tabular-nums text-[#2f3a2f]">{faqArticleCount}</p>
                      <p className={`mt-1 text-xs text-[#6f6552] ${currentLanguage === 'hi' ? 'font-hindi' : ''}`}>
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
                <Search className="absolute left-4 top-1/2 z-10 h-5 w-5 -translate-y-1/2 text-[#8b816f]" />
                <Input 
                  placeholder={currentLanguage === 'en' ? 'Search for help...' : 'मदद खोजें...'} 
                  className="border-[#d7c7a8] bg-[#fffaf0] py-6 pl-12 text-lg text-[#2f3a2f] placeholder:text-[#8b816f] focus-visible:ring-[#315f3b]"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              {searchQuery && (
                <p className="mt-2 text-center text-sm text-[#6f6552]">
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
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#f3ebdd]">
                      <HelpCircle className="w-6 h-6 text-[#315f3b]" />
                    </div>
                    <span className={currentLanguage === 'hi' ? 'font-hindi' : ''}>
                      {currentLanguage === 'en' ? 'Frequently Asked Questions' : 'अक्सर पूछे जाने वाले प्रश्न'}
                    </span>
                  </h2>
                  <Badge className="bg-[#f3ebdd] text-[#6c5a3d] hover:bg-[#f3ebdd] text-sm">
                    {filteredFAQs.length} {currentLanguage === 'en' ? 'Questions' : 'प्रश्न'}
                  </Badge>
                </div>
                <div className="space-y-4">
                  {filteredFAQs.length > 0 ? (
                    <StaggerContainer staggerDelay={0.05} animation="slide-up">
                      {filteredFAQs.map((faq, index) => (
                        <Card 
                          key={index} 
                          className="overflow-hidden border-[#d7c7a8] bg-[#fffaf0] transition-all duration-300 hover:border-[#c8b38b] hover:shadow-[0_16px_40px_rgba(95,70,40,0.12)]"
                        >
                          <button
                            onClick={() => setOpenFaq(openFaq === index ? null : index)}
                            className="flex w-full items-center justify-between p-5 text-left transition-colors hover:bg-[#f6eddc]"
                          >
                            <span className={`font-semibold text-base flex-1 pr-4 ${currentLanguage === 'hi' ? 'font-hindi' : ''}`}>
                              {currentLanguage === 'hi' ? faq.questionHindi : faq.question}
                            </span>
                            <ChevronDown 
                              className={`h-5 w-5 shrink-0 text-[#8b816f] transition-transform duration-300 ${
                                openFaq === index ? 'rotate-180' : ''
                              }`} 
                            />
                          </button>
                          {openFaq === index && (
                            <div className="animate-fade-in border-t border-[#e2d4b7] px-5 pb-5 pt-4 text-[#6f6552]">
                              <p className={`leading-relaxed ${currentLanguage === 'hi' ? 'font-hindi' : ''}`}>
                                {faq.answer}
                              </p>
                            </div>
                          )}
                        </Card>
                      ))}
                    </StaggerContainer>
                  ) : (
                    <Card className="border-dashed border-[#d7c7a8] bg-[#fffaf0]">
                      <CardContent className="p-12 text-center">
                        <AlertCircle className="mx-auto mb-4 h-12 w-12 text-[#8b816f]" />
                        <p className={`text-[#6f6552] ${currentLanguage === 'hi' ? 'font-hindi' : ''}`}>
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
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#f3ebdd]">
                      <MessageCircle className="w-6 h-6 text-[#315f3b]" />
                    </div>
                    <span className={currentLanguage === 'hi' ? 'font-hindi' : ''}>
                      {currentLanguage === 'en' ? 'Submit a Ticket' : 'टिकट जमा करें'}
                    </span>
                  </h2>
                  <Card className="border-[#d7c7a8] bg-[#fffaf0] shadow-[0_16px_40px_rgba(95,70,40,0.08)]">
                    <CardHeader className="border-b border-[#e2d4b7] bg-[#f6eddc]">
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
                              className="border-[#d7c7a8] bg-[#fffdf7] py-6 text-[#2f3a2f] placeholder:text-[#8b816f] focus-visible:ring-[#315f3b]"
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
                            className="border-[#d7c7a8] bg-[#fffdf7] py-6 text-[#2f3a2f] placeholder:text-[#8b816f] focus-visible:ring-[#315f3b]"
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
                            className="min-h-[180px] resize-none border-[#d7c7a8] bg-[#fffdf7] text-[#2f3a2f] placeholder:text-[#8b816f] focus-visible:ring-[#315f3b]"
                          />
                        </div>
                        <Button 
                          className="w-full border border-[#b68222] bg-[#d89b2b] py-6 text-lg text-[#2f2416] transition-transform hover:scale-105 hover:bg-[#c88d22]"
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
                    <Card className="border-[#d7c7a8] bg-[#fffaf0] shadow-[0_16px_40px_rgba(95,70,40,0.08)]">
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
                          <div className="flex items-center gap-2 py-4 text-sm text-[#6f6552]">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            {currentLanguage === 'en' ? 'Loading…' : 'लोड हो रहा है…'}
                          </div>
                        ) : myTickets.length === 0 ? (
                          <p className="py-2 text-sm text-[#6f6552]">
                            {currentLanguage === 'en' ? 'No tickets yet.' : 'अभी कोई टिकट नहीं।'}
                          </p>
                        ) : (
                          <ul className="space-y-2">
                            {myTickets.map((t) => (
                              <li
                                key={t.id}
                                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[#e2d4b7] bg-[#fffdf7] p-3 text-sm"
                              >
                                <div className="min-w-0 flex-1">
                                  <p className="truncate font-medium text-[#2f3a2f]">{t.subject}</p>
                                  <p className="text-xs text-[#6f6552]">
                                    {t.createdAt
                                      ? new Date(t.createdAt).toLocaleDateString('en-IN', {
                                          dateStyle: 'medium',
                                        })
                                      : ''}{' '}
                                    · {t.replyCount}{' '}
                                    {currentLanguage === 'en' ? 'replies' : 'जवाब'}
                                  </p>
                                </div>
                                <Badge variant="outline" className="shrink-0 border-[#d7c7a8] bg-[#fffaf0] capitalize text-[#6c5a3d]">
                                  {t.status.replace('_', ' ')}
                                </Badge>
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  className="shrink-0 bg-[#f3ebdd] text-[#315f3b] hover:bg-[#eadfc9]"
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
                <Card className="border-[#d7c7a8] bg-[#fffaf0] shadow-[0_16px_40px_rgba(95,70,40,0.08)]">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-[#d89b2b]" />
                      {currentLanguage === 'en' ? 'Need Immediate Help?' : 'तुरंत मदद चाहिए?'}
                    </CardTitle>
                    <CardDescription>
                      {currentLanguage === 'en' 
                        ? 'Contact us directly via phone or email'
                        : 'फोन या ईमेल के माध्यम से सीधे हमसे संपर्क करें'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-4 rounded-xl border border-[#e2d4b7] bg-[#fffdf7] p-4 transition-colors hover:border-[#c8b38b]">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#f3ebdd]">
                        <Phone className="w-6 h-6 text-[#315f3b]" />
                      </div>
                      <div>
                        <p className="mb-1 text-sm text-[#6f6552]">
                          {currentLanguage === 'en' ? 'Toll Free' : 'टोल फ्री'}
                        </p>
                        <p className="font-bold text-lg">+91 6203135782</p>
                        <p className="mt-1 text-xs text-[#6f6552]">
                          {currentLanguage === 'en' ? 'Mon-Sat, 9 AM - 9 PM' : 'सोम-शनि, सुबह 9 - रात 9'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 rounded-xl border border-[#e2d4b7] bg-[#fffdf7] p-4 transition-colors hover:border-[#c8b38b]">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#f6e5dc]">
                        <Mail className="w-6 h-6 text-[#8a4f2a]" />
                      </div>
                      <div>
                        <p className="mb-1 text-sm text-[#6f6552]">
                          {currentLanguage === 'en' ? 'Email Support' : 'ईमेल सहायता'}
                        </p>
                        <p className="font-bold text-lg">praj01012003@gmail.com</p>
                        <p className="mt-1 text-xs text-[#6f6552]">
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
        <DialogContent className="max-h-[90vh] overflow-y-auto border-[#d7c7a8] bg-[#fffaf0] sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="pr-8 leading-tight">
              {ticketDialogDetail?.subject || (currentLanguage === 'en' ? 'Ticket' : 'टिकट')}
            </DialogTitle>
          </DialogHeader>
          {ticketDialogLoading && (
            <div className="flex items-center gap-2 py-6 text-sm text-[#6f6552]">
              <Loader2 className="h-4 w-4 animate-spin" />
              {currentLanguage === 'en' ? 'Loading…' : 'लोड हो रहा है…'}
            </div>
          )}
          {!ticketDialogLoading && ticketDialogDetail && (
            <div className="space-y-4 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-[#6f6552]">
                  {currentLanguage === 'en' ? 'Status' : 'स्थिति'}:
                </span>
                <Badge variant="outline" className="border-[#d7c7a8] bg-[#fffdf7] capitalize text-[#6c5a3d]">
                  {ticketDialogDetail.status.replace('_', ' ')}
                </Badge>
              </div>
              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-[#6f6552]">
                  {currentLanguage === 'en' ? 'Your message' : 'आपका संदेश'}
                </p>
                <p className="whitespace-pre-wrap">{ticketDialogDetail.message}</p>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#6f6552]">
                  {currentLanguage === 'en' ? 'Thread' : 'बातचीत'}
                </p>
                {ticketDialogDetail.replies.length === 0 ? (
                  <p className="text-[#6f6552]">
                    {currentLanguage === 'en' ? 'No replies yet.' : 'अभी कोई जवाब नहीं।'}
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {ticketDialogDetail.replies.map((r) => (
                      <li
                        key={r.id}
                        className={`rounded-md border p-3 ${
                          r.fromRole === 'admin' ? 'bg-[#f7f2e8]' : 'bg-[#fffdf7]'
                        }`}
                      >
                        <p className="mb-1 text-xs text-[#6f6552]">
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
                    className="resize-none border-[#d7c7a8] bg-[#fffdf7] text-[#2f3a2f] placeholder:text-[#8b816f] focus-visible:ring-[#315f3b]"
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
                className="border border-[#b68222] bg-[#d89b2b] text-[#2f2416] hover:bg-[#c88d22]"
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
