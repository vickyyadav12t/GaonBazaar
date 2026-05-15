import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { Language } from '@/types';
import { isLanguage, LANGUAGE_STORAGE_KEY } from '@/lib/i18n';

function readStoredLanguage(): Language {
  if (typeof window === 'undefined') return 'en';
  try {
    const raw = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (raw && isLanguage(raw)) return raw;
  } catch {
    /* ignore */
  }
  return 'en';
}

interface LanguageState {
  currentLanguage: Language;
}

const initialState: LanguageState = {
  currentLanguage: readStoredLanguage(),
};

const languageSlice = createSlice({
  name: 'language',
  initialState,
  reducers: {
    setLanguage: (state, action: PayloadAction<Language>) => {
      state.currentLanguage = action.payload;
    },
  },
});

export const { setLanguage } = languageSlice.actions;
export default languageSlice.reducer;
