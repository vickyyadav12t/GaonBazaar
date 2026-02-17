import { useState } from 'react';
import { Search, ChevronDown, HelpCircle, MessageCircle, Send, Phone, Mail, Clock, Shield, Sparkles, CheckCircle, AlertCircle } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { mockFAQs } from '@/data/mockData';
import { useAppSelector } from '@/hooks/useRedux';
import { AnimateOnScroll, StaggerContainer } from '@/components/animations';
import { useToast } from '@/hooks/use-toast';

const Support = () => {
  const { currentLanguage } = useAppSelector((state) => state.language);
  const { toast } = useToast();
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketMessage, setTicketMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredFAQs = mockFAQs.filter(faq => {
    const question = currentLanguage === 'hi' ? faq.questionHindi : faq.question;
    const answer = faq.answer;
    const searchLower = searchQuery.toLowerCase();
    return question.toLowerCase().includes(searchLower) || answer.toLowerCase().includes(searchLower);
  });

  const handleSubmitTicket = () => {
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

    setIsSubmitting(true);
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      toast({
        title: currentLanguage === 'en' ? 'Ticket Submitted!' : 'टिकट जमा हो गया!',
        description: currentLanguage === 'en' 
          ? 'We\'ll get back to you within 24 hours.' 
          : 'हम 24 घंटों के भीतर आपसे संपर्क करेंगे।',
      });
      setTicketSubject('');
      setTicketMessage('');
    }, 1500);
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
        <div className="container mx-auto px-4 py-12">
          {/* Header Section */}
          <AnimateOnScroll animation="fade-in">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full mb-6">
                <Shield className="w-5 h-5 text-primary" />
                <span className="text-sm font-semibold text-primary">
                  {currentLanguage === 'en' ? '24/7 Support Available' : '24/7 सहायता उपलब्ध'}
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

          {/* Quick Stats */}
          <AnimateOnScroll animation="slide-up" delay={0.1}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-primary/20 rounded-xl flex items-center justify-center">
                      <Clock className="w-8 h-8 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">
                        {currentLanguage === 'en' ? 'Response Time' : 'प्रतिक्रिया समय'}
                      </p>
                      <p className="text-2xl font-bold">24 Hours</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-success/10 to-success/5 border-success/20">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-success/20 rounded-xl flex items-center justify-center">
                      <CheckCircle className="w-8 h-8 text-success" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">
                        {currentLanguage === 'en' ? 'Resolved Issues' : 'हल किए गए मुद्दे'}
                      </p>
                      <p className="text-2xl font-bold">98%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-secondary/10 to-secondary/5 border-secondary/20">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-secondary/20 rounded-xl flex items-center justify-center">
                      <MessageCircle className="w-8 h-8 text-secondary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">
                        {currentLanguage === 'en' ? 'Happy Customers' : 'खुश ग्राहक'}
                      </p>
                      <p className="text-2xl font-bold">10K+</p>
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
                      <CardDescription>
                        {currentLanguage === 'en' 
                          ? 'Fill out the form below and we\'ll get back to you within 24 hours'
                          : 'नीचे दिया गया फॉर्म भरें और हम 24 घंटों के भीतर आपसे संपर्क करेंगे'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="space-y-5">
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
                        <p className="font-bold text-lg">1800-XXX-XXXX</p>
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
                        <p className="font-bold text-lg">support@directaccess.in</p>
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
    </Layout>
  );
};

export default Support;
