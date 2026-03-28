import React from 'react';
import { motion } from 'framer-motion';
import { Sun, Moon } from 'lucide-react';
import { useStore } from '../../store/useStore';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useStore();

  return (
    <motion.button
      whileTap={{ scale: 0.9 }}
      whileHover={{ scale: 1.1 }}
      onClick={toggleTheme}
      className="theme-toggle"
      aria-label="Toggle Theme"
    >
      {theme === 'dark' ? (
        <motion.div
           initial={{ rotate: -90, opacity: 0 }}
           animate={{ rotate: 0, opacity: 1 }}
           key="moon"
        >
          <Moon size={20} fill="currentColor" />
        </motion.div>
      ) : (
        <motion.div
           initial={{ rotate: 90, opacity: 0 }}
           animate={{ rotate: 0, opacity: 1 }}
           key="sun"
        >
          <Sun size={20} />
        </motion.div>
      )}
    </motion.button>
  );
}
