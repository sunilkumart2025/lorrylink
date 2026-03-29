import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { useStore } from '../../store/useStore';
import { ArrowRight, Globe2, Languages, Mic } from 'lucide-react';

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
    <div className="language-shell">
      <div className="language-shell-inner container">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="language-showcase"
        >
          <div className="language-kicker">
            <Globe2 size={14} />
            Regional-first onboarding
          </div>
          <h1>{t('lang.choose')}</h1>
          <p>{t('lang.sub')} Pick the language you want before entering the driver portal.</p>
          <div className="showcase-grid">
            <div className="card-glass showcase-card">
              <Languages size={18} color="var(--color-primary)" />
              <strong>Local-first interface</strong>
              <span>Designed for fast comprehension on the road with familiar labels and clearer hierarchy.</span>
            </div>
            <div className="card-glass showcase-card">
              <Mic size={18} color="var(--color-accent)" />
              <strong>Voice-ready journey</strong>
              <span>Language choice carries into the assistant and driver-facing screens for smoother navigation.</span>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="card-glass language-card"
        >
          <h1 style={{ fontSize: '32px', fontWeight: '900', marginBottom: '8px', color: 'var(--color-text-primary)', textAlign: 'center' }}>
            {t('lang.choose')}
          </h1>
          <h2 style={{ fontSize: '18px', color: 'var(--color-primary)', marginBottom: '10px', fontWeight: '600', textAlign: 'center' }}>
            {t('lang.sub')}
          </h2>

          <div className="language-options">
            <button className="language-option primary" onClick={() => handleSelect('hi')}>
              <div>
                <strong>हिन्दी</strong>
                <span>Hindi</span>
              </div>
              <ArrowRight size={18} />
            </button>

            <button className="language-option" onClick={() => handleSelect('ta')}>
              <div>
                <strong>தமிழ்</strong>
                <span>Tamil</span>
              </div>
              <ArrowRight size={18} />
            </button>

            <button className="language-option" onClick={() => handleSelect('en')}>
              <div>
                <strong>English</strong>
                <span>International</span>
              </div>
              <ArrowRight size={18} />
            </button>
          </div>

          <p className="language-meta">You can switch languages later from inside the driver portal as well.</p>
        </motion.div>
      </div>
    </div>
  );
}
