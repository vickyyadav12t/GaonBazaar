import { useState, useRef, useEffect } from 'react';
import { X, Send, MessageCircle, Bot, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAppSelector } from '@/hooks/useRedux';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

const ChatBot = () => {
  const { currentLanguage } = useAppSelector((state) => state.language);
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: currentLanguage === 'en' 
        ? 'Hello! I\'m your farming assistant. How can I help you today?' 
        : 'नमस्ते! मैं आपका कृषि सहायक हूं। आज मैं आपकी कैसे मदद कर सकता हूं?',
      sender: 'bot',
      timestamp: new Date(),
    }
  ]);
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const quickReplies = currentLanguage === 'en' 
    ? ['How to sell?', 'Payment help', 'Track order', 'Contact support']
    : ['कैसे बेचें?', 'भुगतान सहायता', 'ऑर्डर ट्रैक करें', 'सहायता संपर्क'];

  const botResponses: Record<string, { en: string; hi: string }> = {
    'How to sell?': {
      en: 'To sell your produce:\n1. Register as a farmer\n2. Complete KYC verification\n3. Add your crop listing with photos\n4. Wait for buyer inquiries\n5. Negotiate and confirm deals!',
      hi: 'अपनी उपज बेचने के लिए:\n1. किसान के रूप में पंजीकरण करें\n2. केवाईसी सत्यापन पूरा करें\n3. फोटो के साथ अपनी फसल लिस्टिंग जोड़ें\n4. खरीदार पूछताछ का इंतजार करें\n5. बातचीत करें और सौदे की पुष्टि करें!',
    },
    'कैसे बेचें?': {
      en: 'To sell your produce:\n1. Register as a farmer\n2. Complete KYC verification\n3. Add your crop listing with photos\n4. Wait for buyer inquiries\n5. Negotiate and confirm deals!',
      hi: 'अपनी उपज बेचने के लिए:\n1. किसान के रूप में पंजीकरण करें\n2. केवाईसी सत्यापन पूरा करें\n3. फोटो के साथ अपनी फसल लिस्टिंग जोड़ें\n4. खरीदार पूछताछ का इंतजार करें\n5. बातचीत करें और सौदे की पुष्टि करें!',
    },
    'Payment help': {
      en: 'We support multiple payment methods:\n• Razorpay (UPI, Cards, Net Banking)\n• Cash on Delivery\n• Direct Bank Transfer\n\nAll payments are secured with encryption. For any issues, contact our support team.',
      hi: 'हम कई भुगतान विधियों का समर्थन करते हैं:\n• रेज़रपे (यूपीआई, कार्ड, नेट बैंकिंग)\n• कैश ऑन डिलीवरी\n• सीधा बैंक ट्रांसफर\n\nसभी भुगतान एन्क्रिप्शन से सुरक्षित हैं।',
    },
    'भुगतान सहायता': {
      en: 'We support multiple payment methods:\n• Razorpay (UPI, Cards, Net Banking)\n• Cash on Delivery\n• Direct Bank Transfer',
      hi: 'हम कई भुगतान विधियों का समर्थन करते हैं:\n• रेज़रपे (यूपीआई, कार्ड, नेट बैंकिंग)\n• कैश ऑन डिलीवरी\n• सीधा बैंक ट्रांसफर\n\nसभी भुगतान एन्क्रिप्शन से सुरक्षित हैं।',
    },
    'Track order': {
      en: 'To track your order:\n1. Go to "My Orders" in your dashboard\n2. Click on the order you want to track\n3. View real-time status updates\n\nYou\'ll also receive notifications when status changes.',
      hi: 'अपने ऑर्डर को ट्रैक करने के लिए:\n1. अपने डैशबोर्ड में "मेरे ऑर्डर" पर जाएं\n2. जिस ऑर्डर को ट्रैक करना है उस पर क्लिक करें\n3. रीयल-टाइम स्टेटस अपडेट देखें',
    },
    'ऑर्डर ट्रैक करें': {
      en: 'To track your order:\n1. Go to "My Orders" in your dashboard\n2. Click on the order you want to track',
      hi: 'अपने ऑर्डर को ट्रैक करने के लिए:\n1. अपने डैशबोर्ड में "मेरे ऑर्डर" पर जाएं\n2. जिस ऑर्डर को ट्रैक करना है उस पर क्लिक करें\n3. रीयल-टाइम स्टेटस अपडेट देखें',
    },
    'Contact support': {
      en: 'You can reach our support team:\n📞 Phone: 1800-XXX-XXXX (Toll Free)\n📧 Email: support@directfarmers.in\n⏰ Hours: 9 AM - 9 PM (Mon-Sat)\n\nOr submit a support ticket through the Support page.',
      hi: 'आप हमारी सहायता टीम से संपर्क कर सकते हैं:\n📞 फोन: 1800-XXX-XXXX (टोल फ्री)\n📧 ईमेल: support@directfarmers.in\n⏰ समय: सुबह 9 - रात 9 (सोम-शनि)',
    },
    'सहायता संपर्क': {
      en: 'You can reach our support team:\n📞 Phone: 1800-XXX-XXXX (Toll Free)\n📧 Email: support@directfarmers.in',
      hi: 'आप हमारी सहायता टीम से संपर्क कर सकते हैं:\n📞 फोन: 1800-XXX-XXXX (टोल फ्री)\n📧 ईमेल: support@directfarmers.in\n⏰ समय: सुबह 9 - रात 9 (सोम-शनि)',
    },
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = (text?: string) => {
    const messageText = text || inputText.trim();
    if (!messageText) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: messageText,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');

    // Simulate bot response
    setTimeout(() => {
      const response = botResponses[messageText];
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response 
          ? response[currentLanguage] 
          : (currentLanguage === 'en' 
              ? 'I\'m still learning! For complex queries, please contact our support team or visit the Help section.' 
              : 'मैं अभी भी सीख रहा हूं! जटिल प्रश्नों के लिए, कृपया हमारी सहायता टीम से संपर्क करें।'),
        sender: 'bot',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, botMessage]);
    }, 1000);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 md:bottom-6 right-6 w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition-transform z-50"
        aria-label={currentLanguage === 'en' ? 'Open chat assistant' : 'चैट सहायक खोलें'}
      >
        <MessageCircle className="w-6 h-6" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-24 md:bottom-6 right-4 md:right-6 w-[calc(100vw-2rem)] sm:w-80 md:w-96 h-[500px] max-h-[calc(100vh-8rem)] bg-card border border-border rounded-2xl shadow-2xl flex flex-col z-50 overflow-hidden animate-scale-in">
      {/* Header */}
      <div className="bg-primary text-primary-foreground p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <p className="font-semibold">{currentLanguage === 'en' ? 'Farm Assistant' : 'कृषि सहायक'}</p>
            <p className="text-xs opacity-80">{currentLanguage === 'en' ? 'Online' : 'ऑनलाइन'}</p>
          </div>
        </div>
        <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-white/20 rounded-full">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex items-start gap-2 max-w-[85%] ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.sender === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>
              <div className={`rounded-2xl px-4 py-2 ${msg.sender === 'user' ? 'bg-primary text-primary-foreground rounded-br-md' : 'bg-muted rounded-bl-md'}`}>
                <p className="text-sm whitespace-pre-line">{msg.text}</p>
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Replies */}
      <div className="px-4 pb-2 flex flex-wrap gap-2">
        {quickReplies.map((reply) => (
          <button
            key={reply}
            onClick={() => handleSend(reply)}
            className="text-xs px-3 py-1.5 bg-primary/10 text-primary rounded-full hover:bg-primary/20 transition-colors"
          >
            {reply}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="p-4 border-t border-border">
        <div className="flex gap-2">
          <Input
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={currentLanguage === 'en' ? 'Type a message...' : 'संदेश लिखें...'}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            className="flex-1"
          />
          <Button onClick={() => handleSend()} size="icon" className="shrink-0">
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatBot;
