'use client';

import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { getTranslation } from '@/utils/localization';

interface CustomCitationReportFormProps {
  onGenerate: (formData: any) => void;
  isGenerating: boolean;
  recordCount?: number;
  showSuccessMessage?: boolean;
}

// Citation-specific MARC fields based on the koha_citation database
const citationMarcFields = [
  { tag: "000", tag_name: "Leader", tag_name_arabic: "قائد" },
  { tag: "001", tag_name: "Control Number", tag_name_arabic: "رقم التحكم" },
  { tag: "041", tag_name: "Language Code", tag_name_arabic: "رمز اللغة" },
  { tag: "073", tag_name: "Publisher Code", tag_name_arabic: "رمز الناشر" },
  { tag: "100", tag_name: "Main Author", tag_name_arabic: "المؤلف الرئيسي" },
  { tag: "242", tag_name: "Translation of Title", tag_name_arabic: "ترجمة العنوان" },
  { tag: "245", tag_name: "Title Statement", tag_name_arabic: "العنوان الرئيسي" },
  { tag: "246", tag_name: "Varying Form of Title", tag_name_arabic: "شكل متغير من العنوان" },
  { tag: "260", tag_name: "Publication Date", tag_name_arabic: "تاريخ النشر" },
  { tag: "300", tag_name: "Physical Description", tag_name_arabic: "الوصف المادي" },
  { tag: "336", tag_name: "Content Type", tag_name_arabic: "نوع المحتوى" },
  { tag: "700", tag_name: "Additional Authors", tag_name_arabic: "مؤلفون إضافيون" },
  { tag: "773", tag_name: "Host Item Entry (Journal)", tag_name_arabic: "إدخال عنصر مضيف (المجلة)" },
  { tag: "995", tag_name: "Local Field (Citation)", tag_name_arabic: "حقل محلي (الاستشهاد)" },
  { tag: "999", tag_name: "Local Control Number", tag_name_arabic: "رقم التحكم المحلي" }
];

export default function CustomCitationReportForm({ 
  onGenerate, 
  isGenerating,
  recordCount = 0,
  showSuccessMessage = false 
}: CustomCitationReportFormProps) {
  console.log('🔍 CustomCitationReportForm component mounted - this should appear in console!');
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
      // For biblio method, check if biblio numbers are uploaded
      if (biblioNumbers.length === 0) {
        setValidationErrors(['Please upload a biblio numbers file.']);
        return;
      }
      validation = { isValid: true, errors: [] };
    } else {
      validation = { isValid: false, errors: ['Invalid input method'] };
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
    setSelectedFields(citationMarcFields.map(f => f.tag));
  };

  const handleSelectNone = () => {
    setSelectedFields([]);
  };

  // Load preview data for step 3
  const loadPreviewData = async () => {
    console.log('🔍 CustomCitationReportForm: Starting loadPreviewData...');
    setIsLoadingPreview(true);
    try {
      // Validate and prepare data based on input method
      let validation;
      let numbersToUse: string[] = [];
      let biblioToUse: string[] = [];

      if (inputMethod === 'file' && fileNumbers.length > 0) {
        validation = validateMagazineNumbers(fileNumbers.join(', '));
        numbersToUse = fileNumbers;
      } else if (inputMethod === 'manual' && magazineNumbers.trim()) {
        validation = validateMagazineNumbers(magazineNumbers);
        numbersToUse = magazineNumbers.split(',').map(n => n.trim()).filter(n => n !== '');
      } else if (inputMethod === 'biblio') {
        if (biblioNumbers.length === 0) {
          setValidationErrors(['Please upload a biblio numbers file.']);
          setCurrentStep(1);
          return;
        }
        validation = { isValid: true, errors: [] };
        biblioToUse = biblioNumbers;
        numbersToUse = []; // No magazine numbers when using biblio filtering
      } else {
        validation = { isValid: true, errors: [] };
        numbersToUse = [];
      }

      if (!validation.isValid) {
        console.log('🔍 CustomCitationReportForm: Validation failed:', validation.errors);
        setValidationErrors(validation.errors);
        setCurrentStep(1); // Go back to step 1 to fix errors
        return;
      }

      setValidationErrors([]);

      const formData = {
        magazineNumbers: numbersToUse,
        startYear: startYear || undefined,
        endYear: endYear || undefined,
        selectedFields,
        biblioNumbers: biblioToUse.length > 0 ? biblioToUse : undefined,
        isPreview: true
      };

      console.log('🔍 CustomCitationReportForm: About to call API with formData:', formData);
      console.log('🔍 CustomCitationReportForm: API URL: /api/citation-reports/custom');

      const response = await fetch('/api/citation-reports/custom', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      console.log('🔍 CustomCitationReportForm: API response status:', response.status);
      console.log('🔍 CustomCitationReportForm: API response ok:', response.ok);

      if (!response.ok) {
        const errorData = await response.json();
        console.log('🔍 CustomCitationReportForm: API error response:', errorData);
        throw new Error(errorData.error || t.errors.failedLoadPreview);
      }

      const result = await response.json();
      console.log('🔍 CustomCitationReportForm: API success response:', result);
      setPreviewData(result.data || []);
      setCurrentStep(3);
    } catch (error) {
      console.error('🔍 CustomCitationReportForm: Error in loadPreviewData:', error);
      alert(`${t.errors.errorLoadingPreview}: ${error instanceof Error ? error.message : t.errors.unexpectedError}`);
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const handleExport = (exportType: 'sample' | 'full') => {
    // Validate and prepare data based on input method
    let validation;
    let numbersToUse: string[] = [];
    let biblioToUse: string[] = [];
    
    if (inputMethod === 'manual') {
      validation = validateMagazineNumbers(magazineNumbers);
      numbersToUse = magazineNumbers.split(',').map((m: string) => m.trim()).filter((m: string) => m !== '');
    } else if (inputMethod === 'file') {
      validation = validateFileNumbers(fileNumbers);
      numbersToUse = fileNumbers;
    } else if (inputMethod === 'biblio') {
      if (biblioNumbers.length === 0) {
        setValidationErrors(['Please upload a biblio numbers file.']);
        setCurrentStep(1);
        return;
      }
      validation = { isValid: true, errors: [] };
      biblioToUse = biblioNumbers;
      numbersToUse = []; // No magazine numbers when using biblio filtering
    } else {
      validation = { isValid: false, errors: ['Invalid input method'] };
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
      magazineNumbers: numbersToUse,
      startYear: startYear ? parseInt(startYear) : undefined,
      endYear: endYear ? parseInt(endYear) : undefined,
      selectedFields,
      biblioNumbers: biblioToUse.length > 0 ? biblioToUse : undefined,
      exportType
    };
    
    onGenerate(formData);
    
    // Clear form inputs after successful generation
    clearFormInputs();
  };

  return (
    <div className={`w-full ${isRTL ? 'font-arabic' : ''}`} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="bg-gradient-to-r from-red-600 to-red-700 text-white p-6 rounded-t-xl">
        <h2 className="text-2xl font-bold mb-2">
          {isRTL ? 'تقرير استشهاد مخصص' : 'Custom Citation Report'}
        </h2>
        <p className="text-red-100">
          {isRTL ? 'إنشاء تقرير مخصص من قاعدة بيانات الاستشهاد مع حقول قابلة للاختيار' : 'Generate custom reports from citation database with selectable fields'}
        </p>
      </div>

      <div className="bg-white p-6 rounded-b-xl shadow-lg">
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
              <h3 className={`text-lg font-semibold text-gray-900 `}>
                {isRTL ? 'الخطوة 1: المعايير الأساسية' : 'Step 1: Basic Criteria'}
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className={`block text-sm font-medium text-gray-700 mb-3 `}>
                    {isRTL ? 'طريقة إدخال أرقام المجلات' : 'Magazine Numbers Input Method'}
                  </label>
                  
                  {/* Input Method Selection */}
                  <div className={`flex space-x-4 mb-4`}>
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
                      {isRTL ? 'الإدخال اليدوي' : 'Manual Entry'}
                    </button>
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
                      {isRTL ? 'رفع ملف' : 'Upload File'}
                    </button>
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
                      {isRTL ? 'رفع أرقام الببليو' : 'Upload Biblio Numbers'}
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
                        placeholder={isRTL ? 'أدخل أرقام المجلات مفصولة بفواصل (مثال: 1001, 1002, 1003)' : 'Enter magazine numbers (e.g., 1001, 1002, 1003)'}
                      />
                      <p className="mt-1 text-sm text-gray-500">
                        {isRTL ? 'أدخل أرقام المجلات مفصولة بفواصل أو اتركها فارغة لجميع المجلات' : 'Enter magazine numbers separated by commas, or leave empty for all magazines'}
                      </p>
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
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-black"                    
                      />
                      <p className="mt-1 text-sm text-gray-500">
                        {isRTL ? 'ارفع ملف نصي (.txt) يحتوي على أرقام المجلات' : 'Upload a text file (.txt) containing magazine numbers'}
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
                              {isRTL ? 'الملف المرفوع:' : 'Uploaded file:'} {uploadedFile.name} 
                              {validationErrors.length === 0 && (
                                <span> ({fileNumbers.length} {isRTL ? 'أرقام صحيحة' : 'valid numbers'})</span>
                              )}
                              {validationErrors.length > 0 && (
                                <span> ({fileNumbers.length} {isRTL ? 'أرقام صحيحة،' : 'valid numbers,'} {validationErrors.length} {isRTL ? 'أخطاء' : 'errors'})</span>
                              )}
                            </span>
                          </div>
                          {fileNumbers.length > 0 && validationErrors.length === 0 && (
                            <div className="mt-2 text-sm text-green-700">
                              <strong>{isRTL ? 'الأرقام الصحيحة:' : 'Valid numbers:'}</strong> {fileNumbers.slice(0, 10).join(', ')}
                              {fileNumbers.length > 10 && ` ${isRTL ? `... و ${fileNumbers.length - 10} رقم آخر` : `... and ${fileNumbers.length - 10} more`}`}
                            </div>
                          )}
                          {validationErrors.length > 0 && fileNumbers.length > 0 && (
                            <div className="mt-2 text-sm text-yellow-700">
                              <strong>{isRTL ? 'الأرقام الصحيحة:' : 'Valid numbers:'}</strong> {fileNumbers.slice(0, 5).join(', ')}
                              {fileNumbers.length > 5 && ` ${isRTL ? `... و ${fileNumbers.length - 5} رقم آخر` : `... and ${fileNumbers.length - 5} more`}`}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Biblio Numbers Upload */}
                  {inputMethod === 'biblio' && (
                    <div>
                      <input
                        id="biblioFileUpload"
                        type="file"
                        accept=".txt,text/plain"
                        onChange={handleBiblioFileUpload}
                        className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-black `}
                      />
                      <p className="mt-2 text-sm text-gray-600">
                        {isRTL ? 'قم برفع ملف .txt يحتوي على أرقام الببليو (رقم واحد في كل سطر أو مفصولة بفواصل). سيتم تصفية النتائج لتشمل هذه السجلات المحددة فقط.' : 'Upload a .txt file with biblio numbers (one per line or comma-separated). This will filter results to only include these specific records.'}
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
                              {isRTL ? 'ملف الببليو المرفوع:' : 'Biblio file uploaded:'} {biblioUploadedFile.name} 
                              {validationErrors.length === 0 && (
                                <span> ({biblioNumbers.length} {isRTL ? 'أرقام ببليو' : 'biblio numbers'})</span>
                              )}
                              {validationErrors.length > 0 && (
                                <span> ({biblioNumbers.length} {isRTL ? 'صحيحة،' : 'valid,'} {validationErrors.length} {isRTL ? 'أخطاء' : 'errors'})</span>
                              )}
                            </span>
                          </div>
                          {biblioNumbers.length > 0 && validationErrors.length === 0 && (
                            <div className="mt-2 text-sm text-green-700">
                              <strong>{isRTL ? 'أرقام الببليو:' : 'Biblio Numbers:'}</strong> {biblioNumbers.slice(0, 10).join(', ')}
                              {biblioNumbers.length > 10 && ` ${isRTL ? `... و ${biblioNumbers.length - 10} رقم آخر` : `... and ${biblioNumbers.length - 10} more`}`}
                            </div>
                          )}
                          {validationErrors.length > 0 && biblioNumbers.length > 0 && (
                            <div className="mt-2 text-sm text-yellow-700">
                              <strong>{isRTL ? 'أرقام الببليو الصحيحة:' : 'Valid Biblio Numbers:'}</strong> {biblioNumbers.slice(0, 5).join(', ')}
                              {biblioNumbers.length > 5 && ` ${isRTL ? `... و ${biblioNumbers.length - 5} رقم آخر` : `... and ${biblioNumbers.length - 5} more`}`}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Validation Errors */}
                  {validationErrors.length > 0 && (
                    <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
                      <div className="text-sm text-red-700">
                        <strong>{isRTL ? 'خطأ في التحقق:' : 'Validation Error:'}</strong>
                        <ul className="mt-1 list-disc list-inside">
                          {validationErrors.map((error, index) => (
                            <li key={index}>{error}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label htmlFor="startYear" className={`block text-sm font-medium text-gray-700 mb-2 `}>
                    {t.forms.startYear}
                  </label>
                  <input
                    id="startYear"
                    type="number"
                    value={startYear}
                    onChange={(e) => setStartYear(e.target.value)}
                    min="1900"
                    max="2030"
                    className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-black `}
                    placeholder={isRTL ? 'مثال: 2000' : 'e.g., 2000'}
                  />
                </div>

                <div>
                  <label htmlFor="endYear" className={`block text-sm font-medium text-gray-700 mb-2 `}>
                    {t.forms.endYear}
                  </label>
                  <input
                    id="endYear"
                    type="number"
                    value={endYear}
                    onChange={(e) => setEndYear(e.target.value)}
                    min="1900"
                    max="2030"
                    className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-black `}
                    placeholder={isRTL ? 'مثال: 2023' : 'e.g., 2023'}
                  />
                </div>
              </div>

              <div className={`flex ${isRTL ? 'justify-start' : 'justify-end'}`}>
                <button
                  onClick={handleStep1Next}
                  className="bg-red-600 text-white px-6 py-2 rounded-md hover:bg-red-700 transition-colors"
                >
                  {isRTL ? 'التالي: اختيار الحقول' : 'Next: Select Fields'}
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Field Selection */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className={`flex justify-between items-center`}>
                <h3 className={`text-lg font-semibold text-gray-900 `}>
                  {isRTL ? 'الخطوة 2: اختيار حقول' : 'Step 2: Select MARC Fields'}
                </h3>
                <div className={`flex space-x-2`}>
                  <button
                    onClick={handleSelectAll}
                    className="text-sm bg-gray-100 text-gray-700 px-3 py-1 rounded hover:bg-gray-200 transition-colors"
                  >
                    {isRTL ? 'اختيار الكل' : 'Select All'}
                  </button>
                  
                  <button
                    onClick={handleSelectNone}
                    className="text-sm bg-gray-100 text-gray-700 px-3 py-1 rounded hover:bg-gray-200 transition-colors"
                  >
                    {isRTL ? 'إلغاء الكل' : 'Select None'}
                  </button>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-md">
                <p className={`text-sm text-gray-600 mb-2 `}>
                  {isRTL ? 'الحقول المحددة:' : 'Selected Fields:'} {selectedFields.length} {isRTL ? 'من' : 'of'} {citationMarcFields.length} {isRTL ? 'حقول' : 'fields'}
                </p>
                <div className="h-2 bg-gray-200 rounded-full">
                  <div 
                    className="h-2 bg-red-600 rounded-full transition-all duration-300"
                    style={{ width: `${(selectedFields.length / citationMarcFields.length) * 100}%` }}
                  ></div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-120 overflow-y-auto border border-gray-200 rounded-md p-4">
                {citationMarcFields.map((field) => (
                  <label key={field.tag} className={`flex items-start space-x-3 cursor-pointer`}>
                    <input
                      type="checkbox"
                      checked={selectedFields.includes(field.tag)}
                      onChange={() => handleFieldToggle(field.tag)}
                      className="mt-1 h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                    />
                    <div className="flex-1 min-w-0">
                      <div className={`text-sm font-medium text-gray-900 `}>
                        {field.tag} - {isRTL ? field.tag_name_arabic : field.tag_name}
                      </div>
                      <div className={`text-xs text-gray-500 `}>
                        {isRTL ? field.tag_name : field.tag_name_arabic}
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
                  {isRTL ? 'السابق' : 'Back'}
                </button>
                <button
                  onClick={handleStep2Next}
                  disabled={selectedFields.length === 0 || isLoadingPreview}
                  className="bg-red-600 text-white px-6 py-2 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoadingPreview ? (isRTL ? 'جارٍ التحميل...' : 'Loading Preview...') : (isRTL ? 'التالي: معاينة البيانات' : 'Next: Preview Data')}
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Preview Data */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <h3 className={`text-lg font-semibold text-gray-900 `}>
                {isRTL ? 'الخطوة 3: معاينة البيانات' : 'Step 3: Data Preview'}
              </h3>
              
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <h4 className={`text-sm font-medium text-blue-900 mb-2 `}>
                  {isRTL ? 'معاينة البيانات' : 'Data Preview'}
                </h4>
                <p className={`text-sm text-blue-800 `}>
                  {isRTL ? 'راجع البيانات قبل تصدير التقرير الكامل. يظهر أول 5 سجلات.' : 'Review the data before exporting the full report. Showing first 5 records.'}
                </p>
              </div>

              {previewData.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 border border-gray-300">
                    <thead className="bg-gray-50">
                      <tr>
                        {/* Always show Biblio and URL columns first */}
                        <th className={`px-6 py-3 ${isRTL ? 'text-right' : 'text-left'} text-xs font-medium text-gray-500 uppercase tracking-wider`}>
                          {isRTL ? 'رقم الببليو' : 'Biblio'}
                        </th>
                        <th className={`px-6 py-3 ${isRTL ? 'text-right' : 'text-left'} text-xs font-medium text-gray-500 uppercase tracking-wider`}>
                          {isRTL ? 'رابط ملف PDF' : 'PDF URL'}
                        </th>
                        {selectedFields.map((fieldTag) => {
                          const field = citationMarcFields.find(f => f.tag === fieldTag);
                          return (
                            <th key={fieldTag} className={`px-6 py-3 ${isRTL ? 'text-right' : 'text-left'} text-xs font-medium text-gray-500 uppercase tracking-wider`}>
                              {field?.tag} - {isRTL ? field?.tag_name_arabic : field?.tag_name}
                            </th>
                          );
                        })}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {previewData.slice(0, 5).map((row, index) => (
                        <tr key={index}>
                          {/* Always show Biblio and URL data first */}
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <a 
                              href={`https://cataloging.mandumah.com/cgi-bin/koha/catalogue/detail.pl?biblionumber=${row['Biblio Number'] || row.biblionumber || ''}`} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 underline"
                            >
                              {row['Biblio Number'] || row.biblionumber || '-'}
                            </a>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {row['PDF Filename V2'] || row.url || '-'}
                          </td>
                          {selectedFields.map((fieldTag) => {
                            // Map MARC tag to formatted field label
                            const getFieldLabel = (tag: string) => {
                              const fieldMap: { [key: string]: string } = {
                                '001': 'Control Number (001)',
                                '041': 'Language Code (041)',
                                '073': 'Publisher Code (073)',
                                '100': 'Main Author (100)',
                                '242': 'Translated Title (242)',
                                '245': 'Title (245)',
                                '246': 'Alternative Title (246)',
                                '260': 'Publication Year (260)',
                                '300': 'Pages (300)',
                                '336': 'Content Type (336)',
                                '700': 'Additional Authors (700)',
                                '773': 'Journal (773)',
                                '995': 'Citation (995)',
                                '999': 'Biblio Number'
                              };
                              return fieldMap[tag] || tag;
                            };
                            
                            const fieldLabel = getFieldLabel(fieldTag);
                            let value = row[fieldLabel] || '-';
                            
                            // Handle multiple values for some fields
                            if (fieldTag === '100' && row['Main Author ID (100)']) {
                              value = (
                                <a 
                                  href={`https://cataloging.mandumah.com/cgi-bin/koha/authorities/authorities.pl?authid=${row['Main Author ID (100)']}`}
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-800 underline"
                                >
                                  {row[fieldLabel] || '-'}
                                </a>
                              );
                            } else if (fieldTag === '700' && row['Additional Author IDs (700)']) {
                              const authorIds = row['Additional Author IDs (700)'].split('; ');
                              const authors = (row[fieldLabel] || '').split('; ');
                              value = (
                                <div>
                                  {authors.map((author: string, idx: number) => (
                                    <div key={idx}>
                                      {authorIds[idx] ? (
                                        <a 
                                          href={`https://cataloging.mandumah.com/cgi-bin/koha/authorities/authorities.pl?authid=${authorIds[idx]}`}
                                          target="_blank" 
                                          rel="noopener noreferrer"
                                          className="text-blue-600 hover:text-blue-800 underline"
                                        >
                                          {author || '-'}
                                        </a>
                                      ) : (
                                        author || '-'
                                      )}
                                    </div>
                                  ))}
                                </div>
                              );
                            }
                            
                            return (
                              <td key={fieldTag} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {value}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                  <p className={`text-sm text-yellow-800 `}>
                    {isRTL ? 'لم يتم العثور على بيانات. يرجى تعديل المرشحات.' : 'No data found. Please adjust your filters.'}
                  </p>
                </div>
              )}

              <div className={`flex justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                <button
                  onClick={() => setCurrentStep(2)}
                  className="bg-gray-300 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-400 transition-colors"
                >
                  {isRTL ? 'العودة للاختيار' : 'Back to Selection'}
                </button>
                
                {previewData.length > 0 && (
                  <button
                    onClick={() => setCurrentStep(4)}
                    className="bg-red-600 text-white px-6 py-2 rounded-md hover:bg-red-700 transition-colors"
                  >
                    {isRTL ? 'التالي: التصدير' : 'Next: Export'}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Step 4: Export Options */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <h3 className={`text-lg font-semibold text-gray-900 `}>
                {isRTL ? 'الخطوة 4: خيارات التصدير' : 'Step 4: Export Options'}
              </h3>
              
              <div className="bg-green-50 border border-green-200 rounded-md p-4">
                <h4 className={`text-sm font-medium text-green-900 mb-2 `}>
                  {isRTL ? 'ملخص التقرير:' : 'Report Summary:'}
                </h4>
                <ul className={`text-sm text-green-800 space-y-1 `}>
                  <li>• {isRTL ? 'أرقام المجلات:' : 'Magazine Numbers:'} {
                    (inputMethod === 'manual' ? magazineNumbers : fileNumbers.join(', ')) || (isRTL ? 'جميع المجلات' : 'All magazines')
                  }</li>
                  <li>• {isRTL ? 'نطاق السنوات:' : 'Year Range:'} {
                    startYear && endYear ? `${startYear} - ${endYear}` : (isRTL ? 'جميع السنوات' : 'All years')
                  }</li>
                  <li>• {isRTL ? 'الحقول المحددة:' : 'Selected Fields:'} {selectedFields.length} {isRTL ? 'حقول' : 'fields'}</li>
                </ul>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <button
                  onClick={() => handleExport('full')}
                  disabled={isGenerating}
                  className="flex flex-col items-center justify-center p-6 border-2 border-red-300 rounded-lg hover:border-red-400 hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="text-red-600 mb-2">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="text-center">
                    <div className="font-medium text-gray-900">
                      {isRTL ? 'تصدير التقرير الكامل' : 'Export Full Report'}
                    </div>
                    <div className="text-sm text-gray-500">
                      {isRTL ? 'تصدير جميع السجلات المطابقة' : 'Export all matching records'}
                    </div>
                  </div>
                </button>
              </div>

              <div className={`flex ${isRTL ? 'justify-end' : 'justify-start'}`}>
                <button
                  onClick={() => setCurrentStep(3)}
                  className="bg-gray-300 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-400 transition-colors"
                >
                  {isRTL ? 'العودة للمعاينة' : 'Back to Preview'}
                </button>
              </div>

              {isGenerating && (
                <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                  <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <div className={`animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 ${isRTL ? 'ml-3' : 'mr-3'}`}></div>
                    <span className="text-blue-800">
                      {isRTL ? 'جارٍ إنشاء تقريرك المخصص...' : 'Generating your custom citation report...'}
                    </span>
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
                      <strong>{isRTL ? 'تم بنجاح!' : 'Success!'}</strong> {recordCount} {isRTL ? 'سجل تم تصديره.' : 'records exported.'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
