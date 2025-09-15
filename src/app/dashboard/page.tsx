'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import ReportContent from '@/components/ReportContent';
import { useLanguage } from '@/contexts/LanguageContext';
import { getTranslation } from '@/utils/localization';

export default function Dashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeReport, setActiveReport] = useState('export_research_titles');
  const [userEmail, setUserEmail] = useState('');
  const router = useRouter();
  const { language, toggleLanguage, isRTL } = useLanguage();

  // Get translations for current language
  const t = getTranslation(language);

  useEffect(() => {
    const authStatus = localStorage.getItem('isAuthenticated');
    const email = localStorage.getItem('userEmail');
    const loginTime = localStorage.getItem('loginTime');
    
    if (authStatus === 'true' && email) {
      // Check if session has expired (8 hours = 8 * 60 * 60 * 1000 ms)
      const sessionTimeout = 8 * 60 * 60 * 1000;
      const currentTime = Date.now();
      const loginTimestamp = parseInt(loginTime || '0');
      
      if (currentTime - loginTimestamp > sessionTimeout) {
        // Session expired
        localStorage.removeItem('isAuthenticated');
        localStorage.removeItem('userEmail');
        localStorage.removeItem('loginTime');
        alert(getTranslation('en').auth.sessionExpired);
        router.push('/auth');
        return;
      }
      
      setIsAuthenticated(true);
      setUserEmail(email);
      
      // Set up automatic session check every 5 minutes
      const sessionCheckInterval = setInterval(() => {
        const currentTimeCheck = Date.now();
        if (currentTimeCheck - loginTimestamp > sessionTimeout) {
          localStorage.removeItem('isAuthenticated');
          localStorage.removeItem('userEmail');
          localStorage.removeItem('loginTime');
          alert(getTranslation('en').auth.sessionExpired);
          router.push('/auth');
          clearInterval(sessionCheckInterval);
        }
      }, 5 * 60 * 1000); // Check every 5 minutes
      
      // Cleanup interval on component unmount
      return () => clearInterval(sessionCheckInterval);
    } else {
      router.push('/auth');
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('loginTime');
    localStorage.removeItem('loginAttempts');
    localStorage.removeItem('lastAttemptTime');
    router.push('/auth');
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-red-600 to-red-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">{t.common.loading}</h2>
          <p className="text-gray-600">{t.dashboard.verifyingCredentials}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex h-screen bg-gray-100 ${isRTL ? 'rtl' : 'ltr'}`}>
      <Sidebar 
        activeReport={activeReport} 
        setActiveReport={setActiveReport}
      />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-lg border-b-2 px-6 py-4">
          <div className="flex items-center justify-between">
        <div className={`${isRTL ? 'text-right' : 'text-left'}`}>
          <p className="text-sm font-medium text-gray-700">{t.dashboard.welcome}</p>
          <p className="text-sm text-gray-600">{userEmail}</p>
        </div>

        <div className={`flex items-center space-x-4`}>
          {/* Language Toggle Button */}
          <button
            onClick={toggleLanguage}
            className="flex items-center px-3 py-2 rounded-xl bg-blue-500 hover:bg-blue-600 transition-all duration-200 text-sm font-medium border border-gray-300"
            title={t.dashboard.changeLanguage}
          >
            <svg className={`w-4 h-4 ${isRTL ? 'ml-2' : 'mr-2'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
            </svg>
            <span>{language === 'en' ? 'عربي' : 'English'}</span>
          </button>
          
          <button
            onClick={handleLogout}
            style={{ backgroundColor: '#C02025' }}
            className="text-white px-4 py-2 rounded-xl hover:bg-red-700 transition-all duration-200 text-sm font-medium shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
          >
            <div className={`flex items-center ${isRTL ? 'space-x-reverse space-x-2' : 'space-x-2'}`}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span>{t.dashboard.logout}</span>
            </div>
          </button>
        </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-auto p-6">
          <ReportContent activeReport={activeReport} />
        </main>
      </div>
    </div>
  );
}
