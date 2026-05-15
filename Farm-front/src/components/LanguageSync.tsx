import { useEffect } from 'react';
import { useAppSelector } from '@/hooks/useRedux';
import { htmlLangAttribute } from '@/lib/i18n';

/** Keeps document.documentElement.lang in sync with app language (a11y + font hints). */
const LanguageSync = () => {
  const lang = useAppSelector((s) => s.language.currentLanguage);
  useEffect(() => {
    document.documentElement.lang = htmlLangAttribute(lang);
  }, [lang]);
  return null;
};

export default LanguageSync;
