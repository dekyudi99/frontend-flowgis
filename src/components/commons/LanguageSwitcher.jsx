import React from 'react';
import { useTranslation } from 'react-i18next';

// Definisikan bahasa yang didukung
const supportedLanguages = [
  { code: 'en', name: 'English' },
  { code: 'id', name: 'Indonesia' },
  { code: 'th', name: 'ภาษาไทย' }, // Thailand
];

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const handleLanguageChange = (e) => {
    const langCode = e.target.value;
    i18n.changeLanguage(langCode);
  };

  return (
    <div className="language-switcher">
      <select 
        onChange={handleLanguageChange} 
        value={i18n.language.split('-')[0]} // 'en-US' will be'en'
        className="p-2 rounded bg-white border border-gray-300 text-sm"
      >
        {supportedLanguages.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.name}
          </option>
        ))}
      </select>
    </div>
  );
}