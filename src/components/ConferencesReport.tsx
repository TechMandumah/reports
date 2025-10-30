'use client';

import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { getTranslation } from '@/utils/localization';

export default function ConferencesReport() {
  const { language, isRTL } = useLanguage();
  const t = getTranslation(language);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  const handleGenerate = async () => {
    try {
      setIsGenerating(true);
      setError(null);
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

  return (
    <div className="space-y-8">
      {/* Success Message */}
      {showSuccessMessage && (
        <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4">
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
        <h3 className="text-2xl font-bold text-gray-900 mb-2">
          {language === 'ar' ? 'بيانات جميع المؤتمرات' : 'All Conferences Data'}
        </h3>
        <p className="text-gray-600 mb-6 text-lg">
          {language === 'ar' 
            ? 'تصدير جميع بيانات المؤتمرات (الأرقام من 6000 إلى 9999)'
            : 'Export all conferences data (Numbers 6000 to 9999)'
          }
        </p>
        <p className="text-sm text-gray-500 bg-blue-50 rounded-lg p-3 border border-blue-200 max-w-2xl mx-auto">
          {language === 'ar' 
            ? 'يتضمن التقرير جميع البيانات من جدول للمؤتمرات ذات الأرقام من 6000 إلى 9999.'
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
  );
}
