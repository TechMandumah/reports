'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import { getTranslation } from '@/utils/localization';
import Sidebar from '@/components/Sidebar';

export default function ConferencesPage() {
  const { language, isRTL, toggleLanguage } = useLanguage();
  const t = getTranslation(language);
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recordCount, setRecordCount] = useState(0);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [activeReport, setActiveReport] = useState('all_conferences');

  useEffect(() => {
    const authStatus = localStorage.getItem('isAuthenticated');
    const email = localStorage.getItem('userEmail');
    
    if (authStatus === 'true' && email) {
      setIsAuthenticated(true);
      setUserEmail(email);
    } else {
      router.push('/auth');
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('loginTime');
    router.push('/auth');
  };

  const handleGenerate = async () => {
    try {
      setIsGenerating(true);
      setError(null);
      setRecordCount(0);
      setShowSuccessMessage(false);

      // Call API to generate the report
      const response = await fetch('/api/conferences', {
        method: 'GET',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate report');
      }

      // Download the Excel file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `All_Conferences_Data_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      // Show success message
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 5000);

    } catch (err) {
      console.error('Error generating conferences report:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsGenerating(false);
    }
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
          <div className="max-w-6xl mx-auto">
            {/* Success Message */}
            {showSuccessMessage && (
              <div className="mb-6 bg-green-50 border-2 border-green-200 rounded-xl p-4">
                <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-6 h-6 bg-green-600 rounded-full flex items-center justify-center ${isRTL ? 'ml-3' : 'mr-3'}`}>
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <h4 className={`text-sm font-semibold text-green-900 ${isRTL ? 'text-right' : 'text-left'}`}>
                      {language === 'ar' ? 'تم تصدير إكسل بنجاح!' : 'Excel Export Successful!'}
                    </h4>
                    <p className={`text-sm text-green-700 ${isRTL ? 'text-right' : 'text-left'}`}>
                      {language === 'ar' ? 'تم تصدير تقريرك وتحميله تلقائياً.' : 'Your report has been exported and downloaded automatically.'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Report Form Card */}
            <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-100 p-8">
              <div className={`flex items-center ${isRTL ? 'space-x-reverse space-x-3' : 'space-x-3'} mb-6`}>
                <h3 className={`text-xl font-bold text-gray-900 ${isRTL ? 'text-right' : 'text-left'}`}>
                  {language === 'ar' ? 'بيانات جميع المؤتمرات' : 'All Conferences Data'}
                </h3>
              </div>

              <div className="space-y-8">
                {/* Description */}
                <div className="text-center py-8">
                  <svg 
                    className="w-24 h-24 mx-auto text-red-600 mb-4" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" 
                    />
                  </svg>
                  <p className="text-gray-600 mb-6 text-lg">
                    {language === 'ar' 
                      ? 'تصدير جميع بيانات المؤتمرات (الأرقام من 6000 إلى 9999)'
                      : 'Export all conferences data (Numbers 6000 to 9999)'
                    }
                  </p>
                  <p className="text-sm text-gray-500 bg-blue-50 rounded-lg p-3 border border-blue-200 max-w-2xl mx-auto">
                    {language === 'ar' 
                      ? 'يتضمن التقرير جميع البيانات من جدول  للمؤتمرات ذات الأرقام من 6000 إلى 9999.'
                      : 'The report includes all data from tables for conferences with numbers 6000 to 9999.'
                    }
                  </p>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="p-4 bg-red-50 border-2 border-red-200 rounded-xl">
                    <div className="flex items-start">
                      <svg className="w-5 h-5 text-red-500 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div>
                        <h4 className="text-sm font-medium text-red-800 mb-1">
                          {language === 'ar' ? 'خطأ' : 'Error'}
                        </h4>
                        <p className="text-sm text-red-700">{error}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Generate Button */}
                <div className="flex flex-col items-center pt-4">
                  <button
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    style={{ backgroundColor: isGenerating ? '#9CA3AF' : '#C02025' }}
                    className="px-8 py-4 text-white rounded-xl hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-bold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 min-w-[200px]"
                  >
                    {isGenerating ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                        <span>{t.forms.generating}</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center">
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        <span>{t.forms.generateReport}</span>
                      </div>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
