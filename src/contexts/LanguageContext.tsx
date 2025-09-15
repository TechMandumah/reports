'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Language, getTranslation, Translations, isRTL } from '@/utils/localization';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: Translations;
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('en');

  // Load saved language from localStorage on mount
  useEffect(() => {
    const savedLanguage = localStorage.getItem('selectedLanguage') as Language;
    if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'ar')) {
      setLanguageState(savedLanguage);
    }
  }, []);

  // Update document direction and save to localStorage when language changes
  useEffect(() => {
    const direction = isRTL(language) ? 'rtl' : 'ltr';
    document.documentElement.setAttribute('dir', direction);
    document.documentElement.setAttribute('lang', language);
    localStorage.setItem('selectedLanguage', language);
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const toggleLanguage = () => {
    setLanguageState(language === 'en' ? 'ar' : 'en');
  };

  const t = getTranslation(language);
  const rtl = isRTL(language);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t, isRTL: rtl }}>
      {children}
    </LanguageContext.Provider>
  );
};
