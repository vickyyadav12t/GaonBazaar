import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Product } from '@/types';

export const WISHLIST_STORAGE_KEY = 'farm_wishlist_v1';

type WishlistState = {
  items: Product[];
};

function loadWishlist(): WishlistState {
  if (typeof window === 'undefined') return { items: [] };
  try {
    const raw = localStorage.getItem(WISHLIST_STORAGE_KEY);
    if (!raw) return { items: [] };
    const parsed = JSON.parse(raw) as { items?: Product[] };
    if (!parsed?.items || !Array.isArray(parsed.items)) return { items: [] };
    return { items: parsed.items };
  } catch {
    return { items: [] };
  }
}

const initialState: WishlistState = loadWishlist();

const wishlistSlice = createSlice({
  name: 'wishlist',
  initialState,
  reducers: {
    addToWishlist: (state, action: PayloadAction<Product>) => {
      const p = action.payload;
      if (!p?.id) return;
      if (state.items.some((x) => x.id === p.id)) return;
      state.items.unshift(p);
    },
    removeFromWishlist: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter((p) => p.id !== action.payload);
    },
    toggleWishlist: (state, action: PayloadAction<Product>) => {
      const p = action.payload;
      if (!p?.id) return;
      const exists = state.items.some((x) => x.id === p.id);
      state.items = exists ? state.items.filter((x) => x.id !== p.id) : [p, ...state.items];
    },
    clearWishlist: (state) => {
      state.items = [];
    },
  },
});

export const { addToWishlist, removeFromWishlist, toggleWishlist, clearWishlist } =
  wishlistSlice.actions;
export default wishlistSlice.reducer;

