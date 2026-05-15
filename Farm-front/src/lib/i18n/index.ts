import type { Language } from '@/types';

export const LANGUAGE_STORAGE_KEY = 'farm-bazaar-language';

/** UI languages (BCP-47 style codes). */
export const LANGUAGES: readonly {
  code: Language;
  /** English label */
  label: string;
  /** Autonym / native name */
  native: string;
}[] = [
  { code: 'en', label: 'English', native: 'English' },
  { code: 'hi', label: 'Hindi', native: 'हिंदी' },
] as const;

export function isLanguage(s: string | undefined | null): s is Language {
  return s === 'en' || s === 'hi';
}

/**
 * Legacy two-string UI copy (English + Hindi).
 */
export function enHi(lang: Language, en: string, hi: string): string {
  if (lang === 'hi') return hi;
  return en;
}

/** Prefer explicit regional string, then English. */
export function pick(lang: Language, table: Partial<Record<Language, string>> & { en: string }): string {
  const v = table[lang];
  if (v !== undefined && v !== '') return v;
  return table.en;
}

/** RSS / Groq farmer news API only supports en | hi on the server. */
export function toNewsApiLang(lang: Language): 'en' | 'hi' {
  return lang;
}

/** Optional: help chat / copilot still en|hi on API — map same as news. */
export function toAiApiLang(lang: Language): 'en' | 'hi' {
  return toNewsApiLang(lang);
}

/**
 * Font class for body text by script (Tailwind font-* utilities in tailwind.config / index.css).
 */
export function scriptFontClass(lang: Language): string {
  return lang === 'hi' ? 'font-hindi' : '';
}

/** html[lang] attribute */
export function htmlLangAttribute(lang: Language): string {
  const map: Record<Language, string> = {
    en: 'en',
    hi: 'hi',
  };
  return map[lang];
}

export function languageMenuShortLabel(lang: Language): string {
  const m: Record<Language, string> = {
    en: 'EN',
    hi: 'हि',
  };
  return m[lang];
}
