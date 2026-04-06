import { useCallback, useEffect, useRef, useState } from 'react';
import { X, Send, Sparkles, Bot, User, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAppSelector } from '@/hooks/useRedux';
import { apiService } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { useCopilot } from '@/context/CopilotContext';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  isWelcome?: boolean;
  intent?: string;
}

function toApiMessages(rows: Message[]): { role: 'user' | 'assistant'; content: string }[] {
  return rows
    .filter((m) => !m.isWelcome)
    .map((m) => ({
      role: m.sender === 'user' ? ('user' as const) : ('assistant' as const),
      content: m.text,
    }));
}

const INTENT_LABEL: Record<string, { en: string; hi: string }> = {
  listing_improvement: { en: 'Listing', hi: 'लिस्टिंग' },
  harvest_postharvest: { en: 'Harvest', hi: 'फसल' },
  deal_summary: { en: 'Deal', hi: 'सौदा' },
  product_buyer_qa: { en: 'Product', hi: 'उत्पाद' },
  order_explain: { en: 'Order', hi: 'ऑर्डर' },
  general_help: { en: 'Help', hi: 'मदद' },
};

const CopilotPanel = () => {
  const { user, isAuthenticated } = useAppSelector((s) => s.auth);
  const { currentLanguage } = useAppSelector((s) => s.language);
  const { copilotContext } = useCopilot();
  const { toast } = useToast();
  const en = currentLanguage === 'en';

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const showCopilot =
    isAuthenticated && user && (user.role === 'farmer' || user.role === 'buyer');

  const welcomeMessage = useCallback((): Message => {
    const now = new Date();
    return {
      id: `welcome-${now.getTime()}`,
      text: en
        ? "I'm your GaonBazaar Copilot. Ask about listings, harvest & storage, this chat deal, the product you're viewing, or your order — I'll pick the right kind of answer automatically."
        : 'मैं GaonBazaar Copilot हूँ। लिस्टिंग, फसल/भंडारण, इस चैट का सौदा, दिख रहा उत्पाद, या ऑर्डर — पूछें; मैं अपने आप सही तरह का जवाब दूँगा।',
      sender: 'bot',
      timestamp: now,
      isWelcome: true,
    };
  }, [en]);

  useEffect(() => {
    setMessages([welcomeMessage()]);
  }, [welcomeMessage]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const quickReplies = en
    ? [
        'Improve my listing text',
        'Harvest and storage tips',
        'Summarize this chat deal',
        'What should I ask about this product?',
        'Explain my order status',
      ]
    : [
        'लिस्टिंग बेहतर करें',
        'फसल और भंडारण टिप्स',
        'इस चैट का सारांश',
        'इस उत्पाद के बारे में क्या पूछूँ?',
        'मेरा ऑर्डर स्टेटस समझाएँ',
      ];

  const handleSend = async (text?: string) => {
    const messageText = (text ?? inputText).trim();
    if (!messageText || loading || !showCopilot) return;

    const userMessage: Message = {
      id: `u-${Date.now()}`,
      text: messageText,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setLoading(true);

    const apiPayload = toApiMessages([...messages, userMessage]);

    try {
      const { data } = await apiService.ai.copilot({
        messages: apiPayload,
        lang: en ? 'en' : 'hi',
        context: copilotContext ?? undefined,
      });
      const reply = (data?.reply || '').trim();
      const intent = typeof data?.intent === 'string' ? data.intent : 'general_help';
      if (!reply) {
        throw new Error('Empty reply');
      }
      setMessages((prev) => [
        ...prev,
        {
          id: `b-${Date.now()}`,
          text: reply,
          sender: 'bot',
          timestamp: new Date(),
          intent,
        },
      ]);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string }; status?: number } };
      const status = err?.response?.status;
      const msg =
        err?.response?.data?.message ||
        (e instanceof Error ? e.message : '') ||
        (en ? 'Copilot could not respond.' : 'Copilot जवाब नहीं दे सका।');

      if (status === 503) {
        toast({
          title: en ? 'Copilot not configured' : 'Copilot सेट नहीं',
          description: en
            ? 'Server needs GROQ_API_KEY. Try later or use Support.'
            : 'सर्वर पर GROQ_API_KEY चाहिए।',
          variant: 'destructive',
        });
      } else if (status === 429) {
        toast({
          title: en ? 'Too many messages' : 'बहुत सारे संदेश',
          description: en ? 'Try again in a little while.' : 'थोड़ी देर बाद कोशिश करें।',
          variant: 'destructive',
        });
      } else {
        toast({
          title: en ? 'Copilot error' : 'त्रुटि',
          description: msg,
          variant: 'destructive',
        });
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `b-err-${Date.now()}`,
          text: en
            ? "I couldn't answer right now. Check Support or try again shortly."
            : 'अभी जवाब नहीं मिला। सपोर्ट देखें या बाद में कोशिश करें।',
          sender: 'bot',
          timestamp: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (!showCopilot) {
    return null;
  }

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 md:bottom-6 right-6 w-14 h-14 rounded-full bg-emerald-600 text-white shadow-lg flex items-center justify-center hover:scale-110 transition-transform z-50 dark:bg-emerald-700"
        aria-label={en ? 'Open AI Copilot' : 'AI Copilot खोलें'}
      >
        <Sparkles className="w-6 h-6" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-24 md:bottom-6 right-4 md:right-6 w-[calc(100vw-2rem)] sm:w-80 md:w-96 h-[500px] max-h-[calc(100vh-8rem)] bg-card border border-border rounded-2xl shadow-2xl flex flex-col z-50 overflow-hidden animate-scale-in">
      <div className="bg-emerald-600 text-white p-4 flex items-center justify-between shrink-0 dark:bg-emerald-700">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold truncate">{en ? 'GaonBazaar Copilot' : 'GaonBazaar Copilot'}</p>
            <p className="text-xs opacity-90">
              {en ? 'One assistant · many tasks' : 'एक सहायक · कई काम'}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="p-1 hover:bg-white/20 rounded-full shrink-0"
          aria-label={en ? 'Close' : 'बंद करें'}
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`flex items-start gap-2 max-w-[85%] ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                  msg.sender === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'
                }`}
              >
                {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>
              <div className="space-y-1 min-w-0">
                {msg.sender === 'bot' && msg.intent && INTENT_LABEL[msg.intent] ? (
                  <Badge variant="secondary" className="text-[10px] font-normal">
                    {en ? INTENT_LABEL[msg.intent].en : INTENT_LABEL[msg.intent].hi}
                  </Badge>
                ) : null}
                <div
                  className={`rounded-2xl px-4 py-2 ${
                    msg.sender === 'user'
                      ? 'bg-primary text-primary-foreground rounded-br-md'
                      : 'bg-muted rounded-bl-md'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap break-words">{msg.text}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="flex items-center gap-2 text-muted-foreground text-sm px-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              {en ? 'Thinking…' : 'सोच रहा है…'}
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="px-4 pb-2 flex flex-wrap gap-2 shrink-0">
        {quickReplies.map((reply) => (
          <button
            key={reply}
            type="button"
            disabled={loading}
            onClick={() => void handleSend(reply)}
            className="text-xs px-3 py-1.5 bg-emerald-600/10 text-emerald-800 dark:text-emerald-200 rounded-full hover:bg-emerald-600/20 transition-colors disabled:opacity-50"
          >
            {reply}
          </button>
        ))}
      </div>

      <div className="p-4 border-t border-border shrink-0 space-y-2">
        <p className="text-[10px] text-muted-foreground leading-snug px-0.5">
          {en
            ? 'AI can be wrong. Use Support and your order screens for official status and payments.'
            : 'AI गलत हो सकता है। आधिकारिक स्टेटस और भुगतान के लिए सपोर्ट और ऑर्डर स्क्रीन देखें।'}
        </p>
        <div className="flex gap-2">
          <Input
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={en ? 'Ask anything…' : 'कुछ भी पूछें…'}
            disabled={loading}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                void handleSend();
              }
            }}
            className="flex-1"
          />
          <Button
            type="button"
            onClick={() => void handleSend()}
            size="icon"
            className="shrink-0 bg-emerald-600 hover:bg-emerald-700"
            disabled={loading || !inputText.trim()}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CopilotPanel;
