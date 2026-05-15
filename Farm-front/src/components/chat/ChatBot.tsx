import { useState, useRef, useEffect, useCallback } from 'react';
import { X, Send, MessageCircle, Bot, User, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAppSelector } from '@/hooks/useRedux';
import { apiService } from '@/services/api';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  /** First greeting — not sent to the API */
  isWelcome?: boolean;
}

function toApiMessages(rows: Message[]): { role: 'user' | 'assistant'; content: string }[] {
  return rows
    .filter((m) => !m.isWelcome)
    .map((m) => ({
      role: m.sender === 'user' ? ('user' as const) : ('assistant' as const),
      content: m.text,
    }));
}

const ChatBot = () => {
  const { currentLanguage } = useAppSelector((state) => state.language);
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  const { toast } = useToast();
  const en = currentLanguage === 'en';
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const welcomeMessage = useCallback((): Message => {
    const now = new Date();
    return {
      id: `welcome-${now.getTime()}`,
      text: en
        ? "Hi! I'm GaonBazaar's AI help assistant. Ask how to buy, sell, pay, track orders, or use the app — in English or Hinglish."
        : 'नमस्ते! मैं GaonBazaar का AI सहायक हूँ। खरीद, बिक्री, भुगतान, ऑर्डर ट्रैक या ऐप इस्तेमाल — हिंदी या हिंग्लिश में पूछ सकते हैं।',
      sender: 'bot',
      timestamp: now,
      isWelcome: true,
    };
  }, [en]);

  useEffect(() => {
    setMessages([welcomeMessage()]);
  }, [welcomeMessage]);

  const quickReplies = en
    ? ['How do I sell as a farmer?', 'How to pay?', 'Track my order', 'Open support']
    : ['किसान के रूप में कैसे बेचूँ?', 'भुगतान कैसे करूँ?', 'ऑर्डर ट्रैक', 'सपोर्ट'];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  if (isAuthenticated && user && (user.role === 'farmer' || user.role === 'buyer')) {
    return null;
  }

  const handleSend = async (text?: string) => {
    const messageText = (text ?? inputText).trim();
    if (!messageText || loading) return;

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
      const { data } = await apiService.ai.helpChat({
        messages: apiPayload,
        lang: en ? 'en' : 'hi',
      });
      const reply = (data?.reply || '').trim();
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
        },
      ]);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string }; status?: number } };
      const status = err?.response?.status;
      const msg =
        err?.response?.data?.message ||
        (e instanceof Error ? e.message : '') ||
        (en ? 'Could not reach the help assistant.' : 'सहायक से जुड़ नहीं सका।');

      if (status === 503) {
        toast({
          title: en ? 'Help chat not configured' : 'सहायता चैट सेट नहीं है',
          description: en
            ? 'The server needs GROQ_API_KEY. Try again later or use Support.'
            : 'सर्वर पर GROQ_API_KEY चाहिए। बाद में कोशिश करें या सपोर्ट खोलें।',
          variant: 'destructive',
        });
      } else if (status === 429) {
        toast({
          title: en ? 'Too many messages' : 'बहुत सारे संदेश',
          description: en ? 'Please try again in a little while.' : 'थोड़ी देर बाद कोशिश करें।',
          variant: 'destructive',
        });
      } else {
        toast({
          title: en ? 'Help assistant error' : 'त्रुटि',
          description: msg,
          variant: 'destructive',
        });
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `b-err-${Date.now()}`,
          text: en
            ? "I couldn't get an answer right now. Please use the Support page or try again in a moment."
            : 'अभी जवाब नहीं मिला। सपोर्ट पेज खोलें या थोड़ी देर बाद कोशिश करें।',
          sender: 'bot',
          timestamp: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full border border-[#c89b3a] bg-[#d89b2b] text-[#2f2513] shadow-[0_12px_24px_rgba(47,37,19,0.18)] transition-transform hover:scale-110 md:bottom-6"
        aria-label={en ? 'Open help chat' : 'मदद चैट खोलें'}
      >
        <MessageCircle className="w-6 h-6" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-24 right-4 z-50 flex h-[500px] max-h-[calc(100vh-8rem)] w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-[#d7c7a8] bg-[#fffaf0] shadow-2xl animate-scale-in md:bottom-6 md:right-6 md:w-96 sm:w-80">
      <div className="flex items-center justify-between border-b border-[#3d6a47] bg-[#315f3b] p-4 text-[#fff3d7] shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[#d7c7a8]/50 bg-white/10 shrink-0">
            <Bot className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold truncate">{en ? 'GaonBazaar Help' : 'GaonBazaar मदद'}</p>
            <p className="text-xs opacity-80">
              {en ? 'AI · answers from our app guide' : 'AI · ऐप गाइड से जवाब'}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="rounded-full p-1 shrink-0 transition-colors hover:bg-white/15"
          aria-label={en ? 'Close' : 'बंद करें'}
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto bg-[linear-gradient(180deg,#fffaf0_0%,#f7eddc_100%)] p-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`flex items-start gap-2 max-w-[85%] ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border ${
                  msg.sender === 'user'
                    ? 'border-[#2f5a38] bg-[#315f3b] text-[#fff3d7]'
                    : 'border-[#d7c7a8] bg-[#efe2bc] text-[#315f3b]'
                }`}
              >
                {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>
              <div
                className={`rounded-2xl px-4 py-2 ${
                  msg.sender === 'user'
                    ? 'rounded-br-md border border-[#2f5a38] bg-[#315f3b] text-[#fff3d7]'
                    : 'rounded-bl-md border border-[#d7c7a8] bg-[#fff6e6] text-[#314837]'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap break-words">{msg.text}</p>
              </div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="flex items-center gap-2 px-2 text-sm text-[#6c5a3d]">
              <Loader2 className="w-4 h-4 animate-spin" />
              {en ? 'Thinking…' : 'सोच रहा है…'}
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="flex shrink-0 flex-wrap gap-2 border-t border-[#eadfc8] bg-[#f9f0de] px-4 pb-2 pt-3">
        {quickReplies.map((reply) => (
          <button
            key={reply}
            type="button"
            disabled={loading}
            onClick={() => void handleSend(reply)}
            className="rounded-full border border-[#d7c7a8] bg-[#fff8ea] px-3 py-1.5 text-xs text-[#315f3b] transition-colors hover:bg-[#efe2bc] disabled:opacity-50"
          >
            {reply}
          </button>
        ))}
      </div>

      <div className="shrink-0 space-y-2 border-t border-[#d7c7a8] bg-[#fffaf0] p-4">
        <p className="px-0.5 text-[10px] leading-snug text-[#6c5a3d]">
          {en
            ? 'AI may be wrong. For orders & payments, check your dashboard or Support.'
            : 'AI गलत हो सकता है। ऑर्डर और भुगतान के लिए डैशबोर्ड या सपोर्ट देखें।'}
        </p>
        <div className="flex gap-2">
          <Input
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={en ? 'Ask anything about the app…' : 'ऐप के बारे में पूछें…'}
            disabled={loading}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                void handleSend();
              }
            }}
            className="flex-1 border-[#d7c7a8] bg-[#fffef8] text-[#314837] placeholder:text-[#8a7a5b] focus-visible:ring-[#d89b2b]"
          />
          <Button
            type="button"
            onClick={() => void handleSend()}
            size="icon"
            className="shrink-0 border border-[#c89b3a] bg-[#d89b2b] text-[#2f2513] hover:bg-[#c98c1d]"
            disabled={loading || !inputText.trim()}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatBot;
