'use client';

import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { getTranslation } from '@/utils/localization';

interface CitationAuthorData {
  biblionumber: number;
  originalAuthor: string;
  additionalAuthors?: string[];
  title: string;
  year: string;
  journal: string;
  url: string;
  authorId?: string;
  additionalAuthorIds?: string[];
}

export default function CitationAuthorTranslations() {
  const { language, isRTL } = useLanguage();
  const t = getTranslation(language);
  const [isGenerating, setIsGenerating] = useState(false);
  const [recordCount, setRecordCount] = useState(0);
  const [inputMethod, setInputMethod] = useState<'manual' | 'file'>('manual');
  const [magazineNumbers, setMagazineNumbers] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [validationError, setValidationError] = useState('');
  const [uploadStatus, setUploadStatus] = useState('');
  const [startYear, setStartYear] = useState('');
  const [endYear, setEndYear] = useState('');

  // File validation functions
  const validateFileType = (file: File): boolean => {
    return file.type === 'text/plain' || file.name.endsWith('.txt');
  };

  const validateFileContent = async (file: File): Promise<{ isValid: boolean; error?: string }> => {
    try {
      const content = await file.text();
      const lines = content.split('\n').filter(line => line.trim());
      
      if (lines.length === 0) {
        return { isValid: false, error: 'File is empty or contains no valid data' };
      }

      // Check if all lines contain valid magazine numbers (digits only)
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed && !/^\d+$/.test(trimmed)) {
          return { isValid: false, error: `Invalid magazine number: "${trimmed}"` };
        }
      }

      return { isValid: true };
    } catch (error) {
      return { isValid: false, error: 'Error reading file' };
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setValidationError('');
    setUploadStatus('');

    if (!file) {
      setUploadedFile(null);
      return;
    }

    // Validate file type
    if (!validateFileType(file)) {
      setValidationError('Please upload a .txt file');
      return;
    }

    // Validate file size (max 1MB)
    if (file.size > 1024 * 1024) {
      setValidationError('File size must be less than 1MB');
      return;
    }

    // Validate file content
    const validation = await validateFileContent(file);
    if (!validation.isValid) {
      setValidationError(validation.error || 'Invalid file');
      return;
    }

    setUploadedFile(file);
    setUploadStatus('File uploaded successfully');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    setValidationError('');

    let magazineNumbersToSend = '';

    if (inputMethod === 'file' && uploadedFile) {
      try {
        const content = await uploadedFile.text();
        magazineNumbersToSend = content.trim();
      } catch (error) {
        setValidationError('Error reading file');
        setIsGenerating(false);
        return;
      }
    } else if (inputMethod === 'manual') {
      magazineNumbersToSend = magazineNumbers;
    }

    try {
      const response = await fetch('/api/citation-reports/author-translations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          magazineNumbers: magazineNumbersToSend || null,
          startYear: startYear || null,
          endYear: endYear || null,
        }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `citation-author-translations-${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        // Get record count from response headers
        const count = response.headers.get('X-Record-Count');
        setRecordCount(count ? parseInt(count) : 0);
      } else {
        console.error('Failed to generate report');
      }
    } catch (error) {
      console.error('Error generating report:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className={`w-full ${isRTL ? 'font-arabic' : ''}`} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="bg-gradient-to-r from-red-600 to-red-700 text-white p-6 rounded-t-xl">
        <h2 className="text-2xl font-bold mb-2">{t.reportContent.titles.translationsCitationAuthor}</h2>
        <p className="text-red-100">{t.reportContent.descriptions.translationsCitationAuthor}</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-b-xl shadow-lg space-y-6">
        {/* Magazine Numbers */}
        <div>
          <label className="block text-sm font-bold text-gray-900 mb-3 flex items-center">
            <svg className="w-5 h-5 mr-2 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>{t.forms.magazineNumbers}</span>
          </label>

          {/* Input Method Selection */}
          <div className="flex space-x-4 mb-4">
            <button
              type="button"
              onClick={() => setInputMethod('manual')}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                inputMethod === 'manual'
                  ? 'bg-red-600 text-white shadow-md'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {t.steps.manualEntry}
            </button>
            <button
              type="button"
              onClick={() => setInputMethod('file')}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                inputMethod === 'file'
                  ? 'bg-red-600 text-white shadow-md'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {t.steps.uploadFile}
            </button>
          </div>

          {inputMethod === 'manual' ? (
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <input
                type="text"
                value={magazineNumbers}
                onChange={(e) => setMagazineNumbers(e.target.value)}
                className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 bg-gray-50 focus:bg-white text-gray-900 placeholder-gray-500"
                placeholder={t.steps.magazineNumbersPlaceholder}
              />
            </div>
          ) : (
            <div>
              <input
                type="file"
                accept=".txt"
                onChange={handleFileUpload}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-3 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100 file:cursor-pointer cursor-pointer border-2 border-dashed border-gray-300 rounded-xl p-4 hover:border-red-400 transition-all duration-200"
              />
              {uploadedFile && (
                <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-700">
                    📁 {uploadedFile.name} ({(uploadedFile.size / 1024).toFixed(1)} KB)
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Validation Error */}
          {validationError && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">❌ {validationError}</p>
            </div>
          )}

          {/* Upload Status */}
          {uploadStatus && (
            <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-700">✅ {uploadStatus}</p>
            </div>
          )}

          <p className="mt-2 text-sm text-gray-600 bg-blue-50 rounded-lg p-3 border border-blue-200">
            💡 <strong>{t.steps.magazineNumbersHelper}</strong>
          </p>
        </div>

        {/* Year Range Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Start Year */}
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-3 flex items-center">
              <svg className="w-5 h-5 mr-2 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>{t.forms.startYear}</span>
            </label>
            <input
              type="number"
              min="1990"
              max="2030"
              value={startYear}
              onChange={(e) => setStartYear(e.target.value)}
              className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 bg-gray-50 focus:bg-white text-gray-900"
              placeholder={t.steps.startYearPlaceholder}
            />
          </div>

          {/* End Year */}
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-3 flex items-center">
              <svg className="w-5 h-5 mr-2 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>{t.forms.endYear}</span>
            </label>
            <input
              type="number"
              min="1990"
              max="2030"
              value={endYear}
              onChange={(e) => setEndYear(e.target.value)}
              className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 bg-gray-50 focus:bg-white text-gray-900"
              placeholder={t.steps.endYearPlaceholder}
            />
          </div>
        </div>

        {/* Information Note */}
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-700">
                <strong>{isRTL ? 'ملاحظة:' : 'Note:'}</strong> {isRTL 
                  ? 'هذا التقرير يستخرج أسماء المؤلفين الرئيسيين والإضافيين من قاعدة بيانات الاستشهاد المختلفة. المؤلفون يتم استخراجهم من حقول مارك 100 و700.'
                  : 'This report extracts main and additional author names from the different citation database. Authors are extracted from MARC fields 100 and 700.'}
              </p>
            </div>
          </div>
        </div>

        {/* Generate Button */}
        <div className="flex flex-col items-center pt-4 space-y-4">
          <button
            type="submit"
            disabled={isGenerating}
            style={{ backgroundColor: '#C02025' }}
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

          {/* Record Count Display */}
          {recordCount > 0 && (
            <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4 max-w-md">
              <div className="flex items-center justify-center">
                <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center mr-3">
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-green-900">
                    {recordCount} {recordCount === 1 ? t.forms.recordExportedSingle : t.forms.recordExportedPlural}
                  </p>
                  <p className="text-xs text-green-700 mt-1">
                    {t.forms.checkDownloadsFolder}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </form>
    </div>
  );
}
