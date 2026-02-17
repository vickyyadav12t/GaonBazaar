import { useState, useRef, useEffect } from 'react';
import { Send, DollarSign, Check, X } from 'lucide-react';
import { Chat, ChatMessage } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface ChatWindowProps {
  chat: Chat;
  currentUserId: string;
  onSendMessage: (message: string) => void;
  onMakeOffer: (price: number) => void;
  onAcceptOffer?: () => void;
  onRejectOffer?: () => void;
}

const ChatWindow = ({ chat, currentUserId, onSendMessage, onMakeOffer, onAcceptOffer, onRejectOffer }: ChatWindowProps) => {
  const [message, setMessage] = useState('');
  const [offerPrice, setOfferPrice] = useState('');
  const [showOfferInput, setShowOfferInput] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat.messages]);

  const handleSend = () => {
    if (message.trim()) {
      onSendMessage(message);
      setMessage('');
    }
  };

  const handleOffer = () => {
    const price = parseFloat(offerPrice);
    if (!isNaN(price) && price > 0) {
      onMakeOffer(price);
      setOfferPrice('');
      setShowOfferInput(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(price);
  };

  const renderMessage = (msg: ChatMessage) => {
    const isSent = msg.senderId === currentUserId;

    if (msg.type === 'offer' || msg.type === 'counter_offer') {
      return (
        <div key={msg.id} className={`flex ${isSent ? 'justify-end' : 'justify-start'} mb-3`}>
          <div className={`${isSent ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'} rounded-2xl px-4 py-3 max-w-[85%]`}>
            <p className="text-xs opacity-80 mb-1">
              {msg.type === 'offer' ? '💰 Price Offer' : '💬 Counter Offer'}
            </p>
            <p className="text-2xl font-bold">{formatPrice(msg.offerPrice!)}</p>
            <p className="text-sm mt-1">{msg.content}</p>
            {!isSent && chat.negotiationStatus === 'ongoing' && (
              <div className="flex gap-2 mt-3">
                <Button size="sm" onClick={onAcceptOffer} className="bg-success hover:bg-success/90 text-sm">
                  <Check className="w-4 h-4 mr-1" /> Accept
                </Button>
                <Button size="sm" variant="outline" onClick={onRejectOffer} className="bg-background/20 border-current text-sm">
                  <X className="w-4 h-4 mr-1" /> Counter
                </Button>
              </div>
            )}
          </div>
        </div>
      );
    }

    if (msg.type === 'deal_accepted') {
      return (
        <div key={msg.id} className="flex justify-center mb-3">
          <div className="bg-success/10 text-success rounded-full px-4 py-2 text-sm font-medium">
            ✅ Deal Accepted at {formatPrice(msg.offerPrice!)}
          </div>
        </div>
      );
    }

    if (msg.type === 'deal_rejected') {
      return (
        <div key={msg.id} className="flex justify-center mb-3">
          <div className="bg-destructive/10 text-destructive rounded-full px-4 py-2 text-sm font-medium">
            ❌ Deal Rejected
          </div>
        </div>
      );
    }

    return (
      <div key={msg.id} className={`flex ${isSent ? 'justify-end' : 'justify-start'} mb-3`}>
        <div className={isSent ? 'chat-bubble-sent' : 'chat-bubble-received'}>
          <p>{msg.content}</p>
          <p className={`text-xs mt-1 ${isSent ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
            {new Date(msg.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-card rounded-xl border border-border overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-border bg-muted/30">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl overflow-hidden">
            <img src={chat.productImage} alt={chat.productName} className="w-full h-full object-cover" />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-foreground">{chat.productName}</h4>
            <p className="text-sm text-muted-foreground">
              Original Price: {formatPrice(chat.originalPrice)}
              {chat.currentOffer && ` • Current Offer: ${formatPrice(chat.currentOffer)}`}
            </p>
          </div>
          {chat.negotiationStatus === 'completed' && (
            <div className="badge-success">Deal Done</div>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-1">
        {chat.messages.map(renderMessage)}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      {chat.negotiationStatus !== 'completed' && (
        <div className="p-4 border-t border-border">
          {showOfferInput ? (
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="Enter your price..."
                value={offerPrice}
                onChange={(e) => setOfferPrice(e.target.value)}
                className="flex-1"
              />
              <Button onClick={handleOffer} className="bg-secondary hover:bg-secondary/90">
                Send Offer
              </Button>
              <Button variant="ghost" onClick={() => setShowOfferInput(false)}>
                Cancel
              </Button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowOfferInput(true)}
                className="shrink-0"
              >
                <DollarSign className="w-4 h-4 mr-1" />
                Make Offer
              </Button>
              <Input
                placeholder="Type a message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                className="flex-1"
              />
              <Button onClick={handleSend} className="shrink-0">
                <Send className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ChatWindow;
