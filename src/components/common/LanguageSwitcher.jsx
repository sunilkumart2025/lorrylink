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
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        backgroundColor: 'rgba(255,255,255,0.2)',
        color: 'white',
        border: '1px solid rgba(255,255,255,0.3)',
        borderRadius: '20px',
        padding: '4px 10px',
        fontSize: '12px',
        fontWeight: 'bold',
        cursor: 'pointer',
        textTransform: 'uppercase'
      }}
    >
      <Globe size={14} />
      {i18n.language}
    </button>
  );
}
