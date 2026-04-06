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

export const CART_STORAGE_KEY = 'farm_cart_v1';

const calculateTotal = (items: CartItem[]): number => {
  return items.reduce((total, item) => {
    const price = item.negotiatedPrice || item.product.price;
    return total + price * item.quantity;
  }, 0);
};

function clampQuantity(product: Product, qty: number): number {
  const min = product.minOrderQuantity && product.minOrderQuantity > 0 ? product.minOrderQuantity : 1;
  const rawMax = product.availableQuantity;
  const max = rawMax != null && rawMax >= 0 ? rawMax : 1_000_000;
  if (max < min) return 0;
  return Math.min(max, Math.max(min, Math.floor(qty)));
}

function loadCartFromStorage(): CartState {
  if (typeof window === 'undefined') {
    return { items: [], totalAmount: 0 };
  }
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return { items: [], totalAmount: 0 };
    const parsed = JSON.parse(raw) as { items?: CartItem[] };
    if (!parsed?.items || !Array.isArray(parsed.items)) {
      return { items: [], totalAmount: 0 };
    }
    const items = parsed.items
      .map((row) => ({
        ...row,
        quantity: row.product ? clampQuantity(row.product as Product, row.quantity) : row.quantity,
      }))
      .filter((row) => row.quantity > 0);
    return { items, totalAmount: calculateTotal(items) };
  } catch {
    return { items: [], totalAmount: 0 };
  }
}

const initialState: CartState = loadCartFromStorage();

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addToCart: (state, action: PayloadAction<{ product: Product; quantity: number; negotiatedPrice?: number }>) => {
      const { product, quantity, negotiatedPrice } = action.payload;
      const existingItem = state.items.find((item) => item.product.id === product.id);
      const addQty = clampQuantity(product, quantity);

      if (existingItem) {
        const merged = clampQuantity(product, existingItem.quantity + addQty);
        if (merged <= 0) {
          state.items = state.items.filter((i) => i.product.id !== product.id);
        } else {
          existingItem.quantity = merged;
          if (negotiatedPrice !== undefined) {
            existingItem.negotiatedPrice = negotiatedPrice;
          }
        }
      } else if (addQty > 0) {
        state.items.push({ product, quantity: addQty, negotiatedPrice });
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
        const q = clampQuantity(item.product, action.payload.quantity);
        if (q <= 0) {
          state.items = state.items.filter((i) => i.product.id !== action.payload.productId);
        } else {
          item.quantity = q;
        }
        state.totalAmount = calculateTotal(state.items);
      }
    },
    setNegotiatedPrice: (
      state,
      action: PayloadAction<{ productId: string; negotiatedPrice?: number }>
    ) => {
      const { productId, negotiatedPrice } = action.payload;
      const item = state.items.find((i) => i.product.id === productId);
      if (!item) return;

      if (negotiatedPrice == null) {
        delete item.negotiatedPrice;
      } else {
        const p = Number(negotiatedPrice);
        item.negotiatedPrice = Number.isFinite(p) && p > 0 ? p : undefined;
      }
      state.totalAmount = calculateTotal(state.items);
    },
    clearCart: (state) => {
      state.items = [];
      state.totalAmount = 0;
    },
  },
});

export const { addToCart, removeFromCart, updateQuantity, setNegotiatedPrice, clearCart } =
  cartSlice.actions;
export default cartSlice.reducer;
