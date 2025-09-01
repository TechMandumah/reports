'use client';

import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { getTranslation } from '@/utils/localization';

interface CitationField {
  key: string;
  label: string;
  description: string;
}

interface CustomCitationData {
  biblionumber: number;
  url?: string;
  [key: string]: any;
}

export default function CustomCitationReport() {
  const { language, isRTL } = useLanguage();
  const t = getTranslation(language);
  const [isGenerating, setIsGenerating] = useState(false);
  const [recordCount, setRecordCount] = useState(0);
  const [magazineNumbers, setMagazineNumbers] = useState('');
  const [startYear, setStartYear] = useState('');
  const [endYear, setEndYear] = useState('');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [inputMethod, setInputMethod] = useState<'manual' | 'file'>('manual');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [fileNumbers, setFileNumbers] = useState<string[]>([]);
  const [selectedFields, setSelectedFields] = useState<string[]>(['biblionumber', 'author', 'title']);

  // Available fields from koha_citation database
  const availableFields: CitationField[] = [
    { key: 'biblionumber', label: isRTL ? 'رقم الببليو' : 'Biblio Number', description: isRTL ? 'رقم السجل في قاعدة البيانات' : 'Record number in database' },
    { key: 'url', label: isRTL ? 'رابط الببليو' : 'Biblio URL', description: isRTL ? 'رابط للسجل في نظام الفهرسة' : 'Link to record in cataloging system' },
    { key: 'frameworkcode', label: isRTL ? 'رمز الإطار' : 'Framework Code', description: isRTL ? 'رمز إطار الفهرسة' : 'Cataloging framework code' },
    { key: 'author', label: isRTL ? 'المؤلف' : 'Author', description: isRTL ? 'المؤلف الرئيسي من حقل 100' : 'Main author from field 100' },
    { key: 'authorId', label: isRTL ? 'معرف المؤلف' : 'Author ID', description: isRTL ? 'معرف المؤلف في نظام الضبط الاستنادي' : 'Author ID in authority system' },
    { key: 'title', label: isRTL ? 'العنوان' : 'Title', description: isRTL ? 'عنوان المقال من حقل 245' : 'Article title from field 245' },
    { key: 'translatedTitle', label: isRTL ? 'العنوان المترجم' : 'Translated Title', description: isRTL ? 'العنوان المترجم من حقل 242' : 'Translated title from field 242' },
    { key: 'alternativeTitle', label: isRTL ? 'العنوان البديل' : 'Alternative Title', description: isRTL ? 'العنوان البديل من حقل 246' : 'Alternative title from field 246' },
    { key: 'year', label: isRTL ? 'سنة النشر' : 'Publication Year', description: isRTL ? 'سنة النشر من حقل 260' : 'Publication year from field 260' },
    { key: 'journal', label: isRTL ? 'المجلة' : 'Journal', description: isRTL ? 'اسم المجلة من حقل 773' : 'Journal name from field 773' },
    { key: 'volume', label: isRTL ? 'المجلد' : 'Volume', description: isRTL ? 'رقم المجلد من حقل 773' : 'Volume number from field 773' },
    { key: 'issue', label: isRTL ? 'العدد' : 'Issue', description: isRTL ? 'رقم العدد من حقل 773' : 'Issue number from field 773' },
    { key: 'pages', label: isRTL ? 'الصفحات' : 'Pages', description: isRTL ? 'أرقام الصفحات من حقل 300' : 'Page numbers from field 300' },
    { key: 'additionalAuthors', label: isRTL ? 'المؤلفون الإضافيون' : 'Additional Authors', description: isRTL ? 'المؤلفون الإضافيون من حقل 700' : 'Additional authors from field 700' },
    { key: 'additionalAuthorIds', label: isRTL ? 'معرفات المؤلفين الإضافيين' : 'Additional Author IDs', description: isRTL ? 'معرفات المؤلفين الإضافيين في نظام الضبط' : 'Additional author IDs in authority system' },
    { key: 'publishercode', label: isRTL ? 'رمز الناشر' : 'Publisher Code', description: isRTL ? 'رمز الناشر من جدول biblioitems' : 'Publisher code from biblioitems table' },
    { key: 'notes', label: isRTL ? 'الملاحظات' : 'Notes', description: isRTL ? 'ملاحظات إضافية' : 'Additional notes' },
    { key: 'abstract', label: isRTL ? 'الملخص' : 'Abstract', description: isRTL ? 'ملخص المقال' : 'Article abstract' },
    { key: 'serial', label: isRTL ? 'المسلسل' : 'Serial', description: isRTL ? 'رقم المسلسل' : 'Serial number' },
    { key: 'seriestitle', label: isRTL ? 'عنوان السلسلة' : 'Series Title', description: isRTL ? 'عنوان السلسلة' : 'Series title' },
    { key: 'datecreated', label: isRTL ? 'تاريخ الإنشاء' : 'Date Created', description: isRTL ? 'تاريخ إنشاء السجل' : 'Record creation date' },
    { key: 'timestamp', label: isRTL ? 'طابع الوقت' : 'Timestamp', description: isRTL ? 'آخر تحديث للسجل' : 'Last record update' }
  ];

  const validateMagazineNumbers = (input: string): { isValid: boolean; errors: string[] } => {
    if (!input.trim()) {
      return { isValid: true, errors: [] }; // Empty is allowed
    }

    const numbers = input.split(',').map(n => n.trim()).filter(n => n !== '');
    const errors: string[] = [];

    numbers.forEach((num, index) => {
      // Check if it's a valid number
      if (!/^\d+$/.test(num)) {
        errors.push(`Issue #${index + 1}: "${num}" ${t.forms.issueNotValidNumber}`);
        return;
      }

      // Check if it's exactly 4 digits
      if (num.length !== 4) {
        errors.push(`Issue #${index + 1}: "${num}" ${t.forms.issueMustBe4Digits}`);
      }
    });

    return { isValid: errors.length === 0, errors };
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.includes('text') && !file.name.endsWith('.txt')) {
      setValidationErrors([t.errors.uploadTextFile]);
      return;
    }

    setUploadedFile(file);
    
    try {
      const text = await file.text();
      const { numbers, errors } = parseAndValidateFileContent(text);
      setFileNumbers(numbers);
      
      if (errors.length > 0) {
        setValidationErrors(errors);
      } else {
        setValidationErrors([]);
      }
    } catch (error) {
      setValidationErrors([t.errors.errorReadingFile]);
    }
  };

  const parseAndValidateFileContent = (text: string): { numbers: string[]; errors: string[] } => {
    const lines = text.split(/\r?\n/);
    const numbers: string[] = [];
    const errors: string[] = [];
    
    lines.forEach((line, lineIndex) => {
      const lineNumber = lineIndex + 1;
      const trimmedLine = line.trim();
      
      // Skip empty lines
      if (trimmedLine === '') {
        return;
      }
      
      // Check if line contains comma-separated values
      if (trimmedLine.includes(',')) {
        const values = trimmedLine.split(',');
        values.forEach((value, valueIndex) => {
          const trimmedValue = value.trim();
          if (trimmedValue === '') return;
          
          const validation = validateSingleNumber(trimmedValue, lineNumber, valueIndex + 1, true);
          if (validation.isValid) {
            numbers.push(trimmedValue);
          } else {
            errors.push(...validation.errors);
          }
        });
      } else {
        // Single value per line
        const validation = validateSingleNumber(trimmedLine, lineNumber, 1, false);
        if (validation.isValid) {
          numbers.push(trimmedLine);
        } else {
          errors.push(...validation.errors);
        }
      }
    });
    
    return { numbers, errors };
  };

  const validateSingleNumber = (value: string, lineNumber: number, position: number, isCommaSeparated: boolean): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];
    const positionText = isCommaSeparated ? `, position ${position}` : '';
    
    // Check for non-numeric characters
    if (!/^\d+$/.test(value)) {
      const invalidChars = value.match(/[^\d]/g)?.join('') || '';
      errors.push(`Line ${lineNumber}${positionText}: "${value}" contains invalid characters (${invalidChars}). Only digits 0-9 are allowed.`);
      return { isValid: false, errors };
    }
    
    // Check if it's exactly 4 digits
    if (value.length !== 4) {
      if (value.length < 4) {
        errors.push(`Line ${lineNumber}${positionText}: "${value}" has only ${value.length} digit(s). Must be exactly 4 digits (pad with leading zeros: ${value.padStart(4, '0')}).`);
      } else {
        errors.push(`Line ${lineNumber}${positionText}: "${value}" has ${value.length} digits. Must be exactly 4 digits. Consider breaking it into separate 4-digit numbers.`);
      }
      return { isValid: false, errors };
    }
    
    return { isValid: true, errors: [] };
  };

  const validateFileNumbers = (numbers: string[]): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    if (numbers.length === 0) {
      errors.push(t.errors.noValidNumbers);
      return { isValid: false, errors };
    }
    
    return { isValid: errors.length === 0, errors };
  };

  const clearFormInputs = () => {
    setMagazineNumbers('');
    setStartYear('');
    setEndYear('');
    setValidationErrors([]);
    setInputMethod('manual');
    setUploadedFile(null);
    setFileNumbers([]);
  };

  const handleFieldToggle = (fieldKey: string) => {
    setSelectedFields(prev => {
      if (prev.includes(fieldKey)) {
        // Don't allow removing biblionumber as it's required
        if (fieldKey === 'biblionumber') return prev;
        return prev.filter(f => f !== fieldKey);
      } else {
        return [...prev, fieldKey];
      }
    });
  };

  const handleSelectAll = () => {
    setSelectedFields(availableFields.map(field => field.key));
  };

  const handleSelectNone = () => {
    setSelectedFields(['biblionumber']); // Keep biblionumber as required
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);

    // Validate magazine numbers based on input method
    let validation;
    let numbersToUse: string[] = [];
    
    if (inputMethod === 'manual') {
      validation = validateMagazineNumbers(magazineNumbers);
      numbersToUse = magazineNumbers.split(',').map((m: string) => m.trim()).filter((m: string) => m !== '');
    } else {
      validation = validateFileNumbers(fileNumbers);
      numbersToUse = fileNumbers;
    }
    
    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      setIsGenerating(false);
      return;
    }

    // Validate field selection
    if (selectedFields.length === 0) {
      setValidationErrors([isRTL ? 'يجب اختيار حقل واحد على الأقل' : 'Please select at least one field']);
      setIsGenerating(false);
      return;
    }

    // Clear validation errors if valid
    setValidationErrors([]);

    try {
      const response = await fetch('/api/citation-reports/custom', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          magazineNumbers: numbersToUse.length > 0 ? numbersToUse.join(',') : null,
          startYear: startYear || null,
          endYear: endYear || null,
          selectedFields,
        }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `custom-citation-report-${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        // Get record count from response headers
        const count = response.headers.get('X-Record-Count');
        setRecordCount(count ? parseInt(count) : 0);
        
        // Clear form inputs after successful generation
        clearFormInputs();
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
        <h2 className="text-2xl font-bold mb-2">{isRTL ? 'تقرير الاستشهاد المخصص' : 'Custom Citation Report'}</h2>
        <p className="text-red-100">{isRTL ? 'إنشاء تقرير مخصص بالحقول التي تختارها من قاعدة بيانات الاستشهاد' : 'Generate a custom report with selected fields from the citation database'}</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-b-xl shadow-lg space-y-8">
        {/* Field Selection */}
        <div>
          <label className="block text-sm font-bold text-gray-800 mb-4">
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
              <span>{isRTL ? 'اختيار الحقول' : 'Select Fields'}</span>
              <span className="text-sm font-normal text-gray-600">({selectedFields.length} {isRTL ? 'محدد' : 'selected'})</span>
            </div>
          </label>

          {/* Selection Controls */}
          <div className="flex space-x-4 mb-4">
            <button
              type="button"
              onClick={handleSelectAll}
              className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
            >
              {isRTL ? 'تحديد الكل' : 'Select All'}
            </button>
            <button
              type="button"
              onClick={handleSelectNone}
              className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
            >
              {isRTL ? 'إلغاء التحديد' : 'Select None'}
            </button>
          </div>

          {/* Field Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-80 overflow-y-auto border border-gray-200 rounded-lg p-4">
            {availableFields.map((field) => (
              <div key={field.key} className="relative">
                <label className="flex items-start space-x-3 p-3 rounded-lg border border-gray-200 hover:border-red-300 hover:bg-red-50 transition-all cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedFields.includes(field.key)}
                    onChange={() => handleFieldToggle(field.key)}
                    disabled={field.key === 'biblionumber'} // Biblionumber is required
                    className="mt-1 h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900">
                      {field.label}
                      {field.key === 'biblionumber' && (
                        <span className="ml-1 text-xs text-red-600">*</span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">{field.description}</div>
                  </div>
                </label>
              </div>
            ))}
          </div>
          
          <p className="mt-2 text-xs text-gray-600">
            <span className="text-red-600">*</span> {isRTL ? 'الحقول المطلوبة' : 'Required fields'}
          </p>
        </div>

        {/* Magazine Numbers Input */}
        <div>
          <label className="block text-sm font-bold text-gray-800 mb-3">
            <div className="flex items-center space-x-2">
              <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
              </svg>
              <span>{t.steps.magazineNumbersInputMethod}</span>
            </div>
          </label>
          
          {/* Input Method Selection */}
          <div className="flex space-x-4 mb-4">
            <button
              type="button"
              onClick={() => {
                setInputMethod('manual');
                setValidationErrors([]);
                setUploadedFile(null);
                setFileNumbers([]);
              }}
              className={`px-4 py-2 text-sm font-medium rounded-md ${
                inputMethod === 'manual'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {t.steps.manualEntry}
            </button>
            <button
              type="button"
              onClick={() => {
                setInputMethod('file');
                setValidationErrors([]);
                setMagazineNumbers('');
              }}
              className={`px-4 py-2 text-sm font-medium rounded-md ${
                inputMethod === 'file'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {t.steps.uploadFile}
            </button>
          </div>

          {/* Manual Entry */}
          {inputMethod === 'manual' && (
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <input
                type="text"
                value={magazineNumbers}
                onChange={(e) => {
                  setMagazineNumbers(e.target.value);
                  if (validationErrors.length > 0) {
                    setValidationErrors([]);
                  }
                }}
                className={`w-full pl-12 pr-4 py-4 border-2 rounded-xl shadow-sm focus:outline-none focus:ring-2 transition-all duration-200 bg-gray-50 focus:bg-white text-gray-900 placeholder-gray-500 ${
                  validationErrors.length > 0 
                    ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                    : 'border-gray-200 focus:ring-red-500 focus:border-red-500'
                }`}
                placeholder={t.steps.magazineNumbersPlaceholder}
              />
            </div>
          )}

          {/* File Upload */}
          {inputMethod === 'file' && (
            <div>
              <input
                id="fileUpload"
                type="file"
                accept=".txt"
                onChange={handleFileUpload}
                className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 bg-gray-50 focus:bg-white text-gray-900"
              />
              <p className="mt-2 text-sm text-gray-600">
                {t.steps.uploadFileHelper}
              </p>
              
              {uploadedFile && (
                <div className={`mt-3 p-3 border rounded-md ${
                  validationErrors.length > 0 
                    ? 'bg-yellow-50 border-yellow-200' 
                    : 'bg-green-50 border-green-200'
                }`}>
                  <div className="flex items-center">
                    <svg className={`w-4 h-4 mr-2 ${
                      validationErrors.length > 0 ? 'text-yellow-500' : 'text-green-500'
                    }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d={validationErrors.length > 0 
                          ? "M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
                          : "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        } />
                    </svg>
                    <span className={`text-sm ${
                      validationErrors.length > 0 ? 'text-yellow-800' : 'text-green-800'
                    }`}>
                      {t.forms.fileUploaded} {uploadedFile.name} 
                      {validationErrors.length === 0 && (
                        <span> ({fileNumbers.length} {t.forms.validNumbersFound})</span>
                      )}
                      {validationErrors.length > 0 && (
                        <span> ({fileNumbers.length} {t.forms.validNumbersFound}, {validationErrors.length} {t.forms.errors})</span>
                      )}
                    </span>
                  </div>
                  {fileNumbers.length > 0 && validationErrors.length === 0 && (
                    <div className="mt-2 text-sm text-green-700">
                      <strong>{t.forms.validNumbersFoundLabel}</strong> {fileNumbers.slice(0, 10).join(', ')}
                      {fileNumbers.length > 10 && ` ... and ${fileNumbers.length - 10} more`}
                    </div>
                  )}
                  {validationErrors.length > 0 && fileNumbers.length > 0 && (
                    <div className="mt-2 text-sm text-green-700">
                      <strong>{t.forms.validNumbersFoundLabel}</strong> {fileNumbers.slice(0, 5).join(', ')}
                      {fileNumbers.length > 5 && ` ... and ${fileNumbers.length - 5} more`}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          
          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <div className="mt-3 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-red-500 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <h4 className="text-sm font-medium text-red-800 mb-1">{t.forms.magazineNumberValidationErrors}</h4>
                  <ul className="text-sm text-red-700 space-y-1">
                    {validationErrors.map((error, index) => (
                      <li key={index} className="flex items-start">
                        <span className="mr-2">•</span>
                        <span>{error}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          <p className="mt-2 text-sm text-gray-600 bg-blue-50 rounded-lg p-3 border border-blue-200">
            {t.steps.magazineNumbersHelper}
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

        {/* Generate Button */}
        <div className="flex flex-col items-center pt-4 space-y-4">
          <button
            type="submit"
            disabled={isGenerating}
            className="px-8 py-4 bg-red-600 text-white rounded-xl hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-bold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 min-w-[200px]"
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
