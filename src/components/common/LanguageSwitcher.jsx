import React from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';
import { useStore } from '../../store/useStore';

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const { setLanguage } = useStore();

  const toggleLanguage = () => {
    const langs = ['en', 'hi', 'ta'];
    const currentIndex = langs.indexOf(i18n.language);
    const nextIndex = (currentIndex + 1) % langs.length;
    const nextLang = langs[nextIndex];
    
    i18n.changeLanguage(nextLang);
    setLanguage(nextLang);
  };

  return (
    <button 
      onClick={toggleLanguage}
      className="ui-chip-button"
    >
      <Globe size={14} />
      {i18n.language}
    </button>
  );
}
