// src/i18n.js
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import HttpBackend from 'i18next-http-backend';

i18n
  // HttpBackend untuk memuat file JSON dari folder 'public'
  .use(HttpBackend)
  // Masukkan i18n ke react-i18next
  .use(initReactI18next)
  .init({
    // Bahasa yang didukung
    supportedLngs: ['en', 'id', 'th'],
    
    // Bahasa aktif default
    lng: 'en',

    // Bahasa default jika bahasa browser tidak didukung
    fallbackLng: 'en',
    
    // Namespace default (file 'translation.json')
    ns: ['translation'],
    defaultNS: 'translation',

    // Di mana file terjemahan berada
    // {{lng}} akan menjadi 'en', 'id', 'th'
    // {{ns}} akan menjadi 'translation'
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
      // loadPath: '/map/locales/{{lng}}/{{ns}}.json',
    },

    // React sudah aman dari XSS
    interpolation: {
      escapeValue: false,
    },

    // Opsi debugging (hapus saat produksi)
    debug: true,
  });

export default i18n;