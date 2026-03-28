import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { useStore } from '../../store/useStore';

export default function LanguageSelector() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { setLanguage } = useStore();

  const handleSelect = (lang) => {
    i18n.changeLanguage(lang);
    setLanguage(lang);
    navigate('/driver/login');
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      padding: 'var(--spacing-lg)',
      background: 'linear-gradient(135deg, var(--color-background) 0%, #111827 100%)'
    }}>
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="card-glass"
        style={{ width: '100%', maxWidth: '400px', textAlign: 'center', padding: '40px' }}
      >
        <h1 style={{ fontSize: '32px', fontWeight: '900', marginBottom: '8px', color: 'white' }}>{t('lang.choose')}</h1>
        <h2 style={{ fontSize: '18px', color: 'var(--color-primary)', marginBottom: '32px', fontWeight: '500' }}>{t('lang.sub')}</h2>
        
        <div className="flex-col gap-md" style={{ display: 'flex' }}>
          <button 
            className="btn btn-primary btn-block" 
            onClick={() => handleSelect('hi')}
          >
            हिन्दी (Hindi)
          </button>
          
          <button 
            className="btn btn-block" 
            style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)' }}
            onClick={() => handleSelect('ta')}
          >
            தமிழ் (Tamil)
          </button>
          
          <button 
            className="btn btn-block" 
            style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)' }}
            onClick={() => handleSelect('en')}
          >
            English
          </button>
        </div>
      </motion.div>
    </div>
  );
}
