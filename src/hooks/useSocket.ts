import { useEffect, useRef } from 'react';
import socketService from '@/services/socket';
import { ChatMessage } from '@/types';
import { useAppSelector } from './useRedux';

interface UseSocketOptions {
  chatId?: string;
  onMessage?: (message: ChatMessage) => void;
  onOffer?: (data: { chatId: string; offer: number; from: string }) => void;
  onDealStatus?: (data: { chatId: string; status: string; offer?: number }) => void;
  autoConnect?: boolean;
}

/**
 * React hook for Socket.io integration
 * Provides easy access to socket service with automatic cleanup
 */
export const useSocket = (options: UseSocketOptions = {}) => {
  const { chatId, onMessage, onOffer, onDealStatus, autoConnect = true } = options;
  const { user } = useAppSelector((state) => state.auth);
  const isConnectedRef = useRef(false);

  useEffect(() => {
    if (!autoConnect || !user?.id) {
      return;
    }

    // Connect if not already connected
    if (!socketService.getIsConnected()) {
      socketService.connect(user.id);
      isConnectedRef.current = true;
    }

    // Join chat room if provided
    if (chatId && socketService.getIsConnected()) {
      socketService.joinChat(chatId);
    }

    // Set up message listeners
    if (onMessage) {
      socketService.onMessage(onMessage);
    }

    if (onOffer) {
      socketService.onOffer(onOffer);
    }

    if (onDealStatus) {
      socketService.onDealStatus(onDealStatus);
    }

    // Cleanup on unmount
    return () => {
      if (chatId) {
        socketService.leaveChat(chatId);
      }
      socketService.off('new_message');
      socketService.off('offer_update');
      socketService.off('deal_status');
    };
  }, [chatId, user?.id, autoConnect, onMessage, onOffer, onDealStatus]);

  return {
    socket: socketService.getSocket(),
    isConnected: socketService.getIsConnected(),
    sendMessage: (message: Omit<ChatMessage, 'id' | 'timestamp' | 'isRead'>) => {
      if (chatId) {
        socketService.sendMessage(chatId, message);
      }
    },
    sendOffer: (price: number, productId: string) => {
      if (chatId) {
        socketService.sendOffer(chatId, { price, productId });
      }
    },
    acceptDeal: () => {
      if (chatId) {
        socketService.acceptDeal(chatId);
      }
    },
    rejectDeal: () => {
      if (chatId) {
        socketService.rejectDeal(chatId);
      }
    },
  };
};

export default useSocket;







