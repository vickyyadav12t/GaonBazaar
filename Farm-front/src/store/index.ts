import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import cartReducer, { CART_STORAGE_KEY } from './slices/cartSlice';
import languageReducer from './slices/languageSlice';
import wishlistReducer, { WISHLIST_STORAGE_KEY } from './slices/wishlistSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    cart: cartReducer,
    language: languageReducer,
    wishlist: wishlistReducer,
  },
});

if (typeof window !== 'undefined') {
  store.subscribe(() => {
    try {
      const cart = store.getState().cart;
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify({ items: cart.items }));
      const wishlist = store.getState().wishlist;
      localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify({ items: wishlist.items }));
    } catch {
      /* ignore quota / private mode */
    }
  });
}

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
