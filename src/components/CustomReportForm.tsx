'use client';

import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { getTranslation } from '@/utils/localization';

interface CustomReportFormProps {
  onGenerate: (formData: any) => void;
  isGenerating: boolean;
  recordCount?: number;
  showSuccessMessage?: boolean;
}

const marcFields = [
  { tag: "000", tag_name: "Leader", tag_name_arabic: "قائد" },
  { tag: "001", tag_name: "Control Number", tag_name_arabic: "رقم التحكم" },
  { tag: "024", tag_name: "Other Standard Identifier", tag_name_arabic: "معرف قياسي آخر" },
  { tag: "041", tag_name: "Language Code", tag_name_arabic: "رمز اللغة" },
  { tag: "044", tag_name: "Country of Publishing/Producing Entity Code", tag_name_arabic: "رمز بلد النشر/الكيان المنتج" },
  { tag: "100", tag_name: "Main Author", tag_name_arabic: "المؤلف الرئيسي" },
  { tag: "110", tag_name: "Main Corporate Name", tag_name_arabic: "اسم مؤسسي رئيسي" },
  { tag: "242", tag_name: "Translation of Title by Cataloging Agency", tag_name_arabic: "ترجمة العنوان بواسطة وكالة الفهرسة" },
  { tag: "245", tag_name: "Title Statement", tag_name_arabic: "العنوان الرئيسي" },
  { tag: "246", tag_name: "Varying Form of Title", tag_name_arabic: "شكل متغير من العنوان" },
  { tag: "260", tag_name: "Publication, Distribution, etc. (Imprint)", tag_name_arabic: "النشر، التوزيع، إلخ. (الطباعة)" },
  { tag: "300", tag_name: "Physical Description", tag_name_arabic: "الوصف المادي" },
  { tag: "336", tag_name: "Content Type", tag_name_arabic: "نوع المحتوى" },
  { tag: "500", tag_name: "General Note", tag_name_arabic: "ملاحظات" },
  { tag: "520", tag_name: "Summary", tag_name_arabic: "ملخص" },
  { tag: "653", tag_name: "Index Term - Uncontrolled", tag_name_arabic: "مصطلح الفهرسة - غير منضبط" },
  { tag: "692", tag_name: "Keywords From Author", tag_name_arabic: "الكلمات المفتاحية من المؤلف" },
  { tag: "700", tag_name: "Additional Authors", tag_name_arabic: "مؤلفون إضافيون" },
  { tag: "773", tag_name: "Host Item Entry", tag_name_arabic: "إدخال عنصر مضيف" },
  { tag: "856", tag_name: "Electronic Location and Access", tag_name_arabic: "الموقع الإلكتروني والوصول" },
  { tag: "930", tag_name: "Equivalence or Cross-Reference - Uniform Title Heading", tag_name_arabic: "المعادل أو المرجع المتقاطع - عنوان موحد" },
  { tag: "995", tag_name: "Recommendation", tag_name_arabic: "توصية" }
];

export default function CustomReportForm({ 
  onGenerate, 
  isGenerating,
  recordCount = 0,
  showSuccessMessage = false 
}: CustomReportFormProps) {
  console.log('⚠️ WRONG CustomReportForm component mounted - this should NOT appear for citation reports!');
  const { language, isRTL } = useLanguage();
  const t = getTranslation(language);
  const [currentStep, setCurrentStep] = useState(1);
  const [magazineNumbers, setMagazineNumbers] = useState('');
  const [startYear, setStartYear] = useState('');
  const [endYear, setEndYear] = useState('');
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [inputMethod, setInputMethod] = useState<'manual' | 'file' | 'biblio'>('manual');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [fileNumbers, setFileNumbers] = useState<string[]>([]);
  const [biblioUploadedFile, setBiblioUploadedFile] = useState<File | null>(null);
  const [biblioNumbers, setBiblioNumbers] = useState<string[]>([]);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

  const validateMagazineNumbers = (input: string): { isValid: boolean; errors: string[] } => {
    if (!input.trim()) {
      return { isValid: true, errors: [] }; // Empty is allowed
    }

    const numbers = input.split(',').map(n => n.trim()).filter(n => n !== '');
    const errors: string[] = [];

    numbers.forEach((num, index) => {
      // Check if it's a valid number
      if (!/^\d+$/.test(num)) {
        errors.push(`Issue #${index + 1}: "${num}" is not a valid number`);
        return;
      }

      // Check if it's exactly 4 digits
      if (num.length !== 4) {
        errors.push(`Issue #${index + 1}: "${num}" must be exactly 4 digits (e.g., 0001, 0123, 4567)`);
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

  const parseNumbersFromText = (text: string): string[] => {
    // This is now handled by parseAndValidateFileContent
    const { numbers } = parseAndValidateFileContent(text);
    return numbers;
  };

  const validateFileNumbers = (numbers: string[]): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    if (numbers.length === 0) {
      errors.push(t.errors.noValidNumbers);
      return { isValid: false, errors };
    }
    
    // Additional validation can be added here if needed
    // The main validation is now handled in parseAndValidateFileContent
    
    return { isValid: errors.length === 0, errors };
  };

  const handleBiblioFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.includes('text') && !file.name.endsWith('.txt')) {
      setValidationErrors(['Please upload a .txt file']);
      return;
    }

    setBiblioUploadedFile(file);
    
    try {
      const text = await file.text();
      const { numbers, errors } = parseAndValidateBiblioFileContent(text);
      setBiblioNumbers(numbers);
      
      if (errors.length > 0) {
        setValidationErrors(errors);
      } else {
        setValidationErrors([]);
      }
    } catch (error) {
      setValidationErrors(['Error reading file']);
    }
  };

  const parseAndValidateBiblioFileContent = (text: string): { numbers: string[]; errors: string[] } => {
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
          
          const validation = validateSingleBiblioNumber(trimmedValue, lineNumber, valueIndex + 1, true);
          if (validation.isValid) {
            numbers.push(trimmedValue);
          } else {
            errors.push(...validation.errors);
          }
        });
      } else {
        // Single value per line
        const validation = validateSingleBiblioNumber(trimmedLine, lineNumber, 1, false);
        if (validation.isValid) {
          numbers.push(trimmedLine);
        } else {
          errors.push(...validation.errors);
        }
      }
    });
    
    return { numbers, errors };
  };

  const validateSingleBiblioNumber = (value: string, lineNumber: number, position: number, isCommaSeparated: boolean): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];
    const positionText = isCommaSeparated ? `, position ${position}` : '';
    
    // Check for non-numeric characters
    if (!/^\d+$/.test(value)) {
      const invalidChars = value.match(/[^\d]/g)?.join('') || '';
      errors.push(`Line ${lineNumber}${positionText}: "${value}" contains invalid characters (${invalidChars}). Only digits 0-9 are allowed for biblio numbers.`);
      return { isValid: false, errors };
    }
    
    // Biblio numbers can be any length (unlike magazine numbers which must be 4 digits)
    if (value.length === 0) {
      errors.push(`Line ${lineNumber}${positionText}: Empty biblio number found.`);
      return { isValid: false, errors };
    }
    
    return { isValid: true, errors: [] };
  };

  const clearFormInputs = () => {
    setMagazineNumbers('');
    setStartYear('');
    setEndYear('');
    setSelectedFields([]);
    setValidationErrors([]);
    setInputMethod('manual');
    setUploadedFile(null);
    setFileNumbers([]);
    setBiblioUploadedFile(null);
    setBiblioNumbers([]);
    setPreviewData([]);
    setCurrentStep(1);
  };

  const handleStep1Next = () => {
    let validation;
    
    if (inputMethod === 'manual') {
      validation = validateMagazineNumbers(magazineNumbers);
    } else if (inputMethod === 'file') {
      validation = validateFileNumbers(fileNumbers);
    } else if (inputMethod === 'biblio') {
      // Biblio numbers are already validated when uploaded
      validation = { isValid: biblioNumbers.length > 0, errors: biblioNumbers.length === 0 ? ['Please upload a biblio numbers file'] : [] };
    } else {
      validation = { isValid: true, errors: [] };
    }
    
    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      return;
    }
    
    // Clear validation errors if valid
    setValidationErrors([]);
    setCurrentStep(2);
  };

  const handleStep2Next = () => {
    if (selectedFields.length === 0) {
      alert(t.errors.selectMarcField);
      return;
    }
    loadPreviewData();
  };

  const handleStep2Back = () => {
    setCurrentStep(1);
  };

  const handleFieldToggle = (fieldTag: string) => {
    setSelectedFields(prev => 
      prev.includes(fieldTag)
        ? prev.filter(f => f !== fieldTag)
        : [...prev, fieldTag]
    );
  };

  const handleSelectAll = () => {
    setSelectedFields(marcFields.map(f => f.tag));
  };

  const handleSelectNone = () => {
    setSelectedFields([]);
  };

  // Load preview data for step 3
  const loadPreviewData = async () => {
    setIsLoadingPreview(true);
    try {
      // Validate magazine numbers before loading preview
      let validation;
      let numbersToUse: string[] = [];
      let biblioNumbersToUse: string[] = [];

      if (inputMethod === 'file' && fileNumbers.length > 0) {
        validation = validateMagazineNumbers(fileNumbers.join(', '));
        numbersToUse = fileNumbers;
      } else if (inputMethod === 'manual' && magazineNumbers.trim()) {
        validation = validateMagazineNumbers(magazineNumbers);
        numbersToUse = magazineNumbers.split(',').map(n => n.trim()).filter(n => n !== '');
      } else if (inputMethod === 'biblio' && biblioNumbers.length > 0) {
        validation = { isValid: true, errors: [] };
        biblioNumbersToUse = biblioNumbers;
      } else {
        validation = { isValid: true, errors: [] };
        numbersToUse = [];
      }

      if (!validation.isValid) {
        setValidationErrors(validation.errors);
        setCurrentStep(1); // Go back to step 1 to fix errors
        return;
      }

      setValidationErrors([]);

      const formData = {
        magazineNumbers: numbersToUse,
        biblioNumbers: biblioNumbersToUse,
        startYear: startYear || undefined,
        endYear: endYear || undefined,
        selectedFields,
        isPreview: true
      };

      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reportType: 'custom_report',
          filters: formData
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || t.errors.failedLoadPreview);
      }

      const result = await response.json();
      setPreviewData(result.data || []);
      setCurrentStep(3);
    } catch (error) {
      console.error('Error loading preview:', error);
      alert(`${t.errors.errorLoadingPreview}: ${error instanceof Error ? error.message : t.errors.unexpectedError}`);
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const handleExport = (exportType: 'sample' | 'full') => {
    // Validate magazine numbers before exporting
    let validation;
    let numbersToUse: string[] = [];
    let biblioNumbersToUse: string[] = [];
    
    if (inputMethod === 'manual') {
      validation = validateMagazineNumbers(magazineNumbers);
      numbersToUse = magazineNumbers.split(',').map((m: string) => m.trim()).filter((m: string) => m !== '');
    } else if (inputMethod === 'file') {
      validation = validateFileNumbers(fileNumbers);
      numbersToUse = fileNumbers;
    } else if (inputMethod === 'biblio') {
      validation = { isValid: true, errors: [] };
      biblioNumbersToUse = biblioNumbers;
    } else {
      validation = { isValid: true, errors: [] };
    }
    
    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      // Scroll back to step 1 to show the error
      setCurrentStep(1);
      return;
    }

    // Clear validation errors if valid
    setValidationErrors([]);
    
    const formData = {
      reportType: 'custom_report',
      magazineNumbers: numbersToUse,
      biblioNumbers: biblioNumbersToUse,
      startYear: startYear ? parseInt(startYear) : undefined,
      endYear: endYear ? parseInt(endYear) : undefined,
      selectedFields,
      exportType
    };
    
    onGenerate(formData);
    
    // Clear form inputs after successful generation
    clearFormInputs();
  };

  return (
    <div className="space-y-6">
      {/* Progress Indicator */}
      <div className={`flex items-center justify-between mb-8 ${isRTL ? 'flex-row-reverse' : ''}`}>
        <div className={`flex items-center ${isRTL ? 'space-x-reverse space-x-4' : 'space-x-4'}`}>
          <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
            currentStep >= 1 ? 'bg-red-600 text-white' : 'bg-gray-300 text-gray-600'
          }`}>
            1
          </div>
          <div className={`h-1 w-12 ${currentStep >= 2 ? 'bg-red-600' : 'bg-gray-300'}`}></div>
          <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
            currentStep >= 2 ? 'bg-red-600 text-white' : 'bg-gray-300 text-gray-600'
          }`}>
            2
          </div>
          <div className={`h-1 w-12 ${currentStep >= 3 ? 'bg-red-600' : 'bg-gray-300'}`}></div>
          <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
            currentStep >= 3 ? 'bg-red-600 text-white' : 'bg-gray-300 text-gray-600'
          }`}>
            3
          </div>
          <div className={`h-1 w-12 ${currentStep >= 4 ? 'bg-red-600' : 'bg-gray-300'}`}></div>
          <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
            currentStep >= 4 ? 'bg-red-600 text-white' : 'bg-gray-300 text-gray-600'
          }`}>
            4
          </div>
        </div>
      </div>

      {/* Step 1: Basic Criteria */}
      {currentStep === 1 && (
        <div className="space-y-6">
          <h3 className={`text-lg font-semibold text-gray-900 ${isRTL ? 'text-right' : 'text-left'}`}>
            {t.steps.step1}: {t.steps.basicCriteria}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className={`block text-sm font-medium text-gray-700 mb-3 ${isRTL ? 'text-right' : 'text-left'}`}>
                {t.steps.magazineNumbersInputMethod}
              </label>
              
              {/* Input Method Selection */}
              <div className={`flex ${isRTL ? 'space-x-reverse space-x-4' : 'space-x-4'} mb-4`}>
                <button
                  type="button"
                  onClick={() => {
                    setInputMethod('manual');
                    setValidationErrors([]);
                    setUploadedFile(null);
                    setFileNumbers([]);
                    setBiblioUploadedFile(null);
                    setBiblioNumbers([]);
                  }}
                  className={`px-4 py-2 text-sm font-medium rounded-md ${
                    inputMethod === 'manual'
                      ? 'bg-red-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {t.steps.manualEntry}
                </button>
                <div className="px-0"></div>
                <button
                  type="button"
                  onClick={() => {
                    setInputMethod('file');
                    setValidationErrors([]);
                    setMagazineNumbers('');
                    setBiblioUploadedFile(null);
                    setBiblioNumbers([]);
                  }}
                  className={`px-4 py-2 text-sm font-medium rounded-md ${
                    inputMethod === 'file'
                      ? 'bg-red-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {t.steps.uploadFile}
                </button>
                <div className="px-0"></div>
                <button
                  type="button"
                  onClick={() => {
                    setInputMethod('biblio');
                    setValidationErrors([]);
                    setMagazineNumbers('');
                    setUploadedFile(null);
                    setFileNumbers([]);
                  }}
                  className={`px-4 py-2 text-sm font-medium rounded-md ${
                    inputMethod === 'biblio'
                      ? 'bg-red-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {t.inputOptions.biblio}
                </button>
              </div>

              {/* Manual Entry */}
              {inputMethod === 'manual' && (
                <div>
                  <input
                    id="magazineNumbers"
                    type="text"
                    value={magazineNumbers}
                    onChange={(e) => {
                      setMagazineNumbers(e.target.value);
                      if (validationErrors.length > 0) {
                        setValidationErrors([]);
                      }
                    }}
                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 text-black ${
                      validationErrors.length > 0 
                        ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                        : 'border-gray-300 focus:ring-red-500 focus:border-red-500'
                    }`}
                    placeholder={t.steps.magazineNumbersPlaceholder}
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    {t.steps.magazineNumbersHelper}
                  </p>
                </div>
              )}

              {/* File Upload */}
              {inputMethod === 'file' && (
                <div>
                  <label htmlFor="fileUpload" className="block text-sm font-medium text-gray-700 mb-2">
                    {/* Upload Text File with Magazine Numbers */}
                    {t.forms.uploadTextFileWithMagazineNumbers}
                  </label>
                  <input
                    id="fileUpload"
                    type="file"
                    accept=".txt"
                    onChange={handleFileUpload}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-black"                    
                  />
                  <p className="mt-1 text-sm text-gray-500">
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
                          {t.steps.uploadFile}: {uploadedFile.name} 
                          {validationErrors.length === 0 && (
                            <span> ({fileNumbers.length} {t.forms.validNumbersFoundLabel})</span>
                          )}
                          {validationErrors.length > 0 && (
                            <span> ({fileNumbers.length} {t.forms.validNumbersFoundLabel}, {validationErrors.length} {t.forms.errors})</span>
                          )}
                        </span>
                      </div>
                      {fileNumbers.length > 0 && validationErrors.length === 0 && (
                        <div className="mt-2 text-sm text-green-700">
                          <strong>{t.forms.validNumbersFoundLabel}:</strong> {fileNumbers.slice(0, 10).join(', ')}
                          {fileNumbers.length > 10 && ` ... and ${fileNumbers.length - 10} more`}
                        </div>
                      )}
                      {validationErrors.length > 0 && fileNumbers.length > 0 && (
                        <div className="mt-2 text-sm text-green-700">
                          <strong>{t.forms.validNumbersFoundLabel}:</strong> {fileNumbers.slice(0, 5).join(', ')}
                          {fileNumbers.length > 5 && ` ... and ${fileNumbers.length - 5} more`}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Biblio Upload */}
              {inputMethod === 'biblio' && (
                <div>
                  <label htmlFor="biblioFileUpload" className="block text-sm font-medium text-gray-700 mb-2">
                    {t.inputOptions.uploadTextFileWithBiblioNumbers}
                  </label>
                  <input
                    id="biblioFileUpload"
                    type="file"
                    accept=".txt,text/plain"
                    onChange={handleBiblioFileUpload}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-black"
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    {t.inputOptions.uploadBiblioHelper}
                  </p>
                  
                  {biblioUploadedFile && (
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
                          {t.inputOptions.uploadedFile}: {biblioUploadedFile.name}
                          {validationErrors.length === 0 && (
                            <span> ({biblioNumbers.length} {t.inputOptions.validNumbersFound})</span>
                          )}
                          {validationErrors.length > 0 && (
                            <span> ({biblioNumbers.length} {t.inputOptions.validNumbers}, {validationErrors.length} {t.inputOptions.errors})</span>
                          )}
                        </span>
                      </div>
                      {biblioNumbers.length > 0 && validationErrors.length === 0 && (
                        <div className="mt-2 text-sm text-green-700">
                          <strong>{t.inputOptions.validNumbersFoundLabel}:</strong> {biblioNumbers.slice(0, 10).join(', ')}
                          {biblioNumbers.length > 10 && ` ${t.inputOptions.andMore} ${biblioNumbers.length - 10} ${t.inputOptions.more}`}
                        </div>
                      )}
                      {validationErrors.length > 0 && biblioNumbers.length > 0 && (
                        <div className="mt-2 text-sm text-green-700">
                          <strong>{t.inputOptions.validNumbersFoundLabel}:</strong> {biblioNumbers.slice(0, 5).join(', ')}
                          {biblioNumbers.length > 5 && ` ${t.inputOptions.andMore} ${biblioNumbers.length - 5} ${t.inputOptions.more}`}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Validation Errors */}
              {validationErrors.length > 0 && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
                  <div className="flex items-start">
                    <svg className="w-4 h-4 text-red-500 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <h4 className="text-sm font-medium text-red-800 mb-1">{t.forms.magazineNumberValidationErrors}:</h4>
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
            </div>

            <div>
              <label htmlFor="startYear" className={`block text-sm font-medium text-gray-700 mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>
                {t.forms.startYear}
              </label>
              <input
                id="startYear"
                type="number"
                value={startYear}
                onChange={(e) => setStartYear(e.target.value)}
                min="1900"
                max="2030"
                className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-black ${isRTL ? 'text-right' : 'text-left'}`}
                placeholder={t.steps.startYearPlaceholder}
              />
            </div>

            <div>
              <label htmlFor="endYear" className={`block text-sm font-medium text-gray-700 mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>
                {t.forms.endYear}
              </label>
              <input
                id="endYear"
                type="number"
                value={endYear}
                onChange={(e) => setEndYear(e.target.value)}
                min="1900"
                max="2030"
                className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-black ${isRTL ? 'text-right' : 'text-left'}`}
                placeholder={t.steps.endYearPlaceholder}
              />
            </div>
          </div>

          <div className={`flex ${isRTL ? 'justify-start' : 'justify-end'}`}>
            <button
              onClick={handleStep1Next}
              className="bg-red-600 text-white px-6 py-2 rounded-md hover:bg-red-700 transition-colors"
            >
              {t.steps.nextSelectFields}
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Field Selection */}
      {currentStep === 2 && (
        <div className="space-y-6">
          <div className={`flex justify-between items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
            <h3 className={`text-lg font-semibold text-gray-900 ${isRTL ? 'text-right' : 'text-left'}`}>
              {t.steps.step2}: {t.steps.selectMarcFields}
            </h3>
            <div className={`${isRTL ? 'space-x-reverse space-x-2' : 'space-x-2'}`}>
              <button
                onClick={handleSelectAll}
                className="text-sm bg-gray-100 text-gray-700 px-3 py-1 rounded hover:bg-gray-200 transition-colors text-black"
              >
                {t.steps.selectAll}
              </button>
              <button
                onClick={handleSelectNone}
                className="text-sm bg-gray-100 text-gray-700 px-3 py-1 rounded hover:bg-gray-200 transition-colors text-black"
              >
                {t.steps.selectNone}
              </button>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-md">
            <p className={`text-sm text-gray-600 mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>
              {t.steps.selectedFields}: {selectedFields.length} {t.steps.of} {marcFields.length} {t.steps.fields}
            </p>
            <div className="h-2 bg-gray-200 rounded-full">
              <div 
                className="h-2 bg-red-600 rounded-full transition-all duration-300"
                style={{ width: `${(selectedFields.length / marcFields.length) * 100}%` }}
              ></div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-120 overflow-y-auto border border-gray-200 rounded-md p-4">
            {marcFields.map((field) => (
              <label key={field.tag} className="flex items-start space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedFields.includes(field.tag)}
                  onChange={() => handleFieldToggle(field.tag)}
                  className="mt-1 h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900">
                    {field.tag}
                  </div>
                  <div className="text-xs text-gray-500 truncate">
                    {language === 'ar' ? field.tag_name_arabic : field.tag_name}
                  </div>
                </div>
              </label>
            ))}
          </div>
          <div className={`flex justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
            <button
              onClick={handleStep2Back}
              className="bg-gray-300 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-400 transition-colors"
            >
              {t.common.back}
            </button>
            <button
              onClick={handleStep2Next}
              disabled={selectedFields.length === 0 || isLoadingPreview}
              className="bg-red-600 text-white px-6 py-2 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoadingPreview ? t.steps.loadingPreview : t.steps.nextPreviewData}
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Preview Data */}
      {currentStep === 3 && (
        <div className="space-y-6">
          <h3 className={`text-lg font-semibold text-gray-900 ${isRTL ? 'text-right' : 'text-left'}`}>
            {t.steps.step3}: {t.steps.dataPreview}
          </h3>
          
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <h4 className={`text-sm font-medium text-blue-900 mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>
              {t.forms.dataPreview}
            </h4>
            <p className={`text-sm text-blue-800 ${isRTL ? 'text-right' : 'text-left'}`}>
              {t.forms.reviewData}
            </p>
          </div>

          {previewData.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 border border-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-300">
                      URL
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-300">
                      Biblio
                    </th>
                    {selectedFields.map(fieldTag => {
                      const field = marcFields.find(f => f.tag === fieldTag);
                      
                      if (fieldTag === '520') {
                        // Special handling for tag 520 - find all subfields in the preview data
                        const subfieldCodes = new Set<string>();
                        previewData.forEach(row => {
                          Object.keys(row).forEach(key => {
                            if (key.startsWith('marc_520_')) {
                              const code = key.replace('marc_520_', '');
                              subfieldCodes.add(code);
                            }
                          });
                        });
                        
                        return Array.from(subfieldCodes).sort().map(code => (
                          <th key={`520_${code}`} className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-300">
                            520{code} - Abstract {code.toUpperCase()}
                          </th>
                        ));
                      } else if (fieldTag === '100') {
                        // Special handling for field 100 - main author with ID
                        return [
                          <th key="100_author" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-300">
                            100 - Main Author
                          </th>,
                          <th key="100_id" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-300">
                            100 - Main Author ID
                          </th>
                        ];
                      } else if (fieldTag === '700') {
                        // Special handling for field 700 - only show ID columns
                        const authorIdColumns = new Set<string>();
                        previewData.forEach(row => {
                          Object.keys(row).forEach(key => {
                            if ((key === 'marc_700_id' || key.match(/^marc_700_id_\d+$/)) && row[key] && row[key].toString().trim() !== '') {
                              authorIdColumns.add(key);
                            }
                          });
                        });
                        
                        return Array.from(authorIdColumns).sort((a, b) => {
                          const aMatch = a.match(/_(\d+)$/);
                          const bMatch = b.match(/_(\d+)$/);
                          const aNum = aMatch ? parseInt(aMatch[1]) : 1;
                          const bNum = bMatch ? parseInt(bMatch[1]) : 1;
                          return aNum - bNum;
                        }).map(columnKey => {
                          const instanceNumber = columnKey.includes('_id_') ? columnKey.split('_').pop() : '';
                          const header = columnKey === 'marc_700_id' 
                            ? '700 - Additional Author ID'
                            : `700 - Additional Author ID (${instanceNumber})`;
                          
                          return (
                            <th key={columnKey} className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-300">
                              {header}
                            </th>
                          );
                        });
                      } else {
                        return (
                          <th key={fieldTag} className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-300">
                            {fieldTag} - {field?.tag_name}
                          </th>
                        );
                      }
                    })}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {previewData.slice(0, 5).map((row, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-3 py-2 text-sm text-gray-900 border-r border-gray-300 max-w-xs truncate">
                        {row.url || '-'}
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-900 border-r border-gray-300">
                        {row.biblio || '-'}
                      </td>
                      {selectedFields.map(fieldTag => {
                        if (fieldTag === '520') {
                          // Special handling for tag 520 - show all subfields
                          const subfieldCodes = new Set<string>();
                          previewData.forEach(previewRow => {
                            Object.keys(previewRow).forEach(key => {
                              if (key.startsWith('marc_520_')) {
                                const code = key.replace('marc_520_', '');
                                subfieldCodes.add(code);
                              }
                            });
                          });
                          
                          return Array.from(subfieldCodes).sort().map(code => (
                            <td key={`520_${code}_${index}`} className="px-3 py-2 text-sm text-gray-900 border-r border-gray-300 max-w-xs truncate">
                              {row[`marc_520_${code}`] || '-'}
                            </td>
                          ));
                        } else if (fieldTag === '100') {
                          // Special handling for field 100 - main author with ID
                          return [
                            <td key={`100_author_${index}`} className="px-3 py-2 text-sm text-gray-900 border-r border-gray-300 max-w-xs truncate">
                              {row.marc_100 || '-'}
                            </td>,
                            <td key={`100_id_${index}`} className="px-3 py-2 text-sm text-gray-900 border-r border-gray-300 max-w-xs truncate">
                              {row.marc_100_id ? (
                                <a href={`https://cataloging.mandumah.com/cgi-bin/koha/authorities/authorities.pl?authid=${row.marc_100_id}`} 
                                   target="_blank" 
                                   rel="noopener noreferrer"
                                   className="text-blue-600 hover:text-blue-800 underline">
                                  {row.marc_100_id}
                                </a>
                              ) : '-'}
                            </td>
                          ];
                        } else if (fieldTag === '700') {
                          // Special handling for field 700 - only show ID columns
                          const authorIdColumns = new Set<string>();
                          previewData.forEach(previewRow => {
                            Object.keys(previewRow).forEach(key => {
                              if ((key === 'marc_700_id' || key.match(/^marc_700_id_\d+$/)) && previewRow[key] && previewRow[key].toString().trim() !== '') {
                                authorIdColumns.add(key);
                              }
                            });
                          });
                          
                          return Array.from(authorIdColumns).sort((a, b) => {
                            const aMatch = a.match(/_(\d+)$/);
                            const bMatch = b.match(/_(\d+)$/);
                            const aNum = aMatch ? parseInt(aMatch[1]) : 1;
                            const bNum = bMatch ? parseInt(bMatch[1]) : 1;
                            return aNum - bNum;
                          }).map(columnKey => (
                            <td key={`${columnKey}_${index}`} className="px-3 py-2 text-sm text-gray-900 border-r border-gray-300 max-w-xs truncate">
                              {row[columnKey] ? (
                                <a href={`https://cataloging.mandumah.com/cgi-bin/koha/authorities/authorities.pl?authid=${row[columnKey]}`} 
                                   target="_blank" 
                                   rel="noopener noreferrer"
                                   className="text-blue-600 hover:text-blue-800 underline">
                                  {row[columnKey]}
                                </a>
                              ) : '-'}
                            </td>
                          ));
                        } else {
                          return (
                            <td key={fieldTag} className="px-3 py-2 text-sm text-gray-900 border-r border-gray-300 max-w-xs truncate">
                              {row[`marc_${fieldTag}`] || '-'}
                            </td>
                          );
                        }
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
              <p className={`text-sm text-yellow-800 ${isRTL ? 'text-right' : 'text-left'}`}>
                {t.forms.noDataFound} {t.forms.adjustFilters}
              </p>
            </div>
          )}

          <div className={`flex justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
            <button
              onClick={() => setCurrentStep(2)}
              className="bg-gray-300 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-400 transition-colors"
            >
              {t.steps.backToSelection}
            </button>
            
            {previewData.length > 0 && (
              <button
                onClick={() => setCurrentStep(4)}
                className="bg-red-600 text-white px-6 py-2 rounded-md hover:bg-red-700 transition-colors"
              >
                {t.steps.nextExport}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Step 4: Export Options */}
      {currentStep === 4 && (
        <div className="space-y-6">
          <h3 className={`text-lg font-semibold text-gray-900 ${isRTL ? 'text-right' : 'text-left'}`}>
            {t.steps.step4}: {t.steps.exportOptions}
          </h3>
          
          <div className="bg-green-50 border border-green-200 rounded-md p-4">
            <h4 className={`text-sm font-medium text-green-900 mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>
              {t.steps.reportSummary}:
            </h4>
            <ul className={`text-sm text-green-800 space-y-1 ${isRTL ? 'text-right' : 'text-left'}`}>
              {inputMethod === 'biblio' ? (
                <li>• {isRTL ? 'أرقام الببليوجرافيا' : 'Biblio Numbers'}: {biblioNumbers.length} {isRTL ? 'رقم' : 'numbers'}</li>
              ) : (
                <li>• {t.forms.magazineNumbers}: {magazineNumbers || fileNumbers.join(', ') || (isRTL ? 'جميع المجلات' : 'All magazines')}</li>
              )}
              <li>• {t.forms.yearRange}: {startYear && endYear ? `${startYear} - ${endYear}` : (isRTL ? 'جميع السنوات' : 'All years')}</li>
              <li>• {t.steps.selectedFields}: {selectedFields.length} {t.steps.fields}</li>
            </ul>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
            <button
              onClick={() => handleExport('full')}
              disabled={isGenerating}
              className="flex flex-col items-center justify-center p-6 border-2 border-blue-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="text-blue-600 mb-2">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="text-center">
                <div className="font-medium text-gray-900">{t.steps.exportFull}</div>
              </div>
            </button>
          </div>

          <div className={`flex ${isRTL ? 'justify-end' : 'justify-start'}`}>
            <button
              onClick={() => setCurrentStep(3)}
              className="bg-gray-300 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-400 transition-colors"
            >
              {t.steps.backToPreview}
            </button>
          </div>

          {isGenerating && (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className={`animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 ${isRTL ? 'ml-3' : 'mr-3'}`}></div>
                <span className="text-blue-800">{isRTL ? 'جارٍ إنشاء تقريرك المخصص...' : 'Generating your custom report...'}</span>
              </div>
            </div>
          )}

          {showSuccessMessage && recordCount > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-md p-4">
              <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className={`w-5 h-5 bg-green-600 rounded-full flex items-center justify-center ${isRTL ? 'ml-3' : 'mr-3'}`}>
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-green-800">
                  <strong>{recordCount} {t.forms.recordsExported}</strong>
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
