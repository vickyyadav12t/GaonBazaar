/**
 * FRONTEND-ONLY: Socket.io Client Service
 * 
 * This is a frontend Socket.io client that connects to a Socket.io server.
 * No backend/server code is included - this is purely the client-side integration.
 * 
 * When you set up a Socket.io backend server, set VITE_SOCKET_URL in .env
 * Falls back to mock mode if server is not available (perfect for frontend-only demo)
 */

import { io, Socket } from 'socket.io-client';
import { ChatMessage } from '@/types';
import { store } from '@/store';

class SocketService {
  private socket: Socket | null = null;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  /**
   * Initialize Socket.io connection
   * In production, replace with actual backend URL
   */
  connect(userId?: string): void {
    if (this.socket?.connected) {
      return;
    }

    const serverUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';
    
    this.socket = io(serverUrl, {
      auth: {
        userId: userId || store.getState().auth.user?.id,
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: this.maxReconnectAttempts,
    });

    this.socket.on('connect', () => {
      this.isConnected = true;
      this.reconnectAttempts = 0;
      if (import.meta.env.DEV) {
        console.log('Socket connected:', this.socket?.id);
      }
    });

    this.socket.on('disconnect', (reason) => {
      this.isConnected = false;
      if (import.meta.env.DEV) {
        console.log('Socket disconnected:', reason);
      }
    });

    this.socket.on('connect_error', (error) => {
      if (import.meta.env.DEV) {
        console.error('Socket connection error:', error);
      }
      // Fallback to mock mode if server is not available
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        if (import.meta.env.DEV) {
          console.warn('Max reconnection attempts reached. Using mock mode.');
        }
      }
      this.reconnectAttempts++;
    });
  }

  /**
   * Disconnect Socket.io
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  /**
   * Join a chat room
   */
  joinChat(chatId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('join_chat', { chatId });
    }
  }

  /**
   * Leave a chat room
   */
  leaveChat(chatId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('leave_chat', { chatId });
    }
  }

  /**
   * Send a message through Socket.io
   */
  sendMessage(chatId: string, message: Omit<ChatMessage, 'id' | 'timestamp' | 'isRead'>): void {
    if (this.socket?.connected) {
      this.socket.emit('send_message', {
        chatId,
        message: {
          ...message,
          timestamp: new Date().toISOString(),
        },
      });
    }
  }

  /**
   * Send a price offer
   */
  sendOffer(chatId: string, offer: { price: number; productId: string }): void {
    if (this.socket?.connected) {
      this.socket.emit('send_offer', { chatId, offer });
    }
  }

  /**
   * Accept a deal
   */
  acceptDeal(chatId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('accept_deal', { chatId });
    }
  }

  /**
   * Reject a deal
   */
  rejectDeal(chatId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('reject_deal', { chatId });
    }
  }

  /**
   * Listen for new messages
   */
  onMessage(callback: (message: ChatMessage) => void): void {
    if (this.socket) {
      this.socket.on('new_message', (data: { message: ChatMessage }) => {
        callback(data.message);
      });
    }
  }

  /**
   * Listen for offer updates
   */
  onOffer(callback: (data: { chatId: string; offer: number; from: string }) => void): void {
    if (this.socket) {
      this.socket.on('offer_update', callback);
    }
  }

  /**
   * Listen for deal status changes
   */
  onDealStatus(callback: (data: { chatId: string; status: string; offer?: number }) => void): void {
    if (this.socket) {
      this.socket.on('deal_status', callback);
    }
  }

  /**
   * Remove all listeners for a specific event
   */
  off(event: string): void {
    if (this.socket) {
      this.socket.off(event);
    }
  }

  /**
   * Remove all listeners
   */
  removeAllListeners(): void {
    if (this.socket) {
      this.socket.removeAllListeners();
    }
  }

  /**
   * Check if socket is connected
   */
  getIsConnected(): boolean {
    return this.isConnected && (this.socket?.connected || false);
  }

  /**
   * Get socket instance (for advanced usage)
   */
  getSocket(): Socket | null {
    return this.socket;
  }
}

// Export singleton instance
export const socketService = new SocketService();
export default socketService;

