import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import uz from './uz.json';
import en from './en.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      uz: { translation: uz },
      en: { translation: en },
    },
    fallbackLng: 'uz',
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
    interpolation: {
      escapeValue: false,
    },
  });

/*
 * IP-based auto-detection (async, runs after init).
 * If no language is cached, detect from IP and switch.
 */
if (!localStorage.getItem('i18nextLng')) {
  fetch('https://ipapi.co/json/')
    .then((res) => res.json())
    .then((data) => {
      const lang = data.country_code === 'UZ' ? 'uz' : 'en';
      i18n.changeLanguage(lang);
    })
    .catch(() => {
      /* Default to Uzbek on error */
      i18n.changeLanguage('uz');
    });
}

export default i18n;
