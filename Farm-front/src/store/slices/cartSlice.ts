import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Product } from '@/types';

interface CartItem {
  product: Product;
  quantity: number;
  negotiatedPrice?: number;
}

interface CartState {
  items: CartItem[];
  totalAmount: number;
}

const initialState: CartState = {
  items: [],
  totalAmount: 0,
};

const calculateTotal = (items: CartItem[]): number => {
  return items.reduce((total, item) => {
    const price = item.negotiatedPrice || item.product.price;
    return total + price * item.quantity;
  }, 0);
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addToCart: (state, action: PayloadAction<{ product: Product; quantity: number; negotiatedPrice?: number }>) => {
      const { product, quantity, negotiatedPrice } = action.payload;
      const existingItem = state.items.find((item) => item.product.id === product.id);
      
      if (existingItem) {
        existingItem.quantity += quantity;
        if (negotiatedPrice) {
          existingItem.negotiatedPrice = negotiatedPrice;
        }
      } else {
        state.items.push({ product, quantity, negotiatedPrice });
      }
      
      state.totalAmount = calculateTotal(state.items);
    },
    removeFromCart: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter((item) => item.product.id !== action.payload);
      state.totalAmount = calculateTotal(state.items);
    },
    updateQuantity: (state, action: PayloadAction<{ productId: string; quantity: number }>) => {
      const item = state.items.find((item) => item.product.id === action.payload.productId);
      if (item) {
        item.quantity = action.payload.quantity;
        state.totalAmount = calculateTotal(state.items);
      }
    },
    clearCart: (state) => {
      state.items = [];
      state.totalAmount = 0;
    },
  },
});

export const { addToCart, removeFromCart, updateQuantity, clearCart } = cartSlice.actions;
export default cartSlice.reducer;
