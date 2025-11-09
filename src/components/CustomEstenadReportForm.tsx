'use client';

import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { getTranslation } from '@/utils/localization';

interface CustomEstenadReportFormProps {
  onGenerate: (formData: any) => void;
  isGenerating: boolean;
  recordCount?: number;
  showSuccessMessage?: boolean;
  exportMethod?: 'instant' | 'background';
  setExportMethod?: (method: 'instant' | 'background') => void;
}

// MARC fields for auth_header table
const authMarcFields = [
  { tag: "000", tag_name: "Leader", tag_name_arabic: "قائد", subfields: [] },
  { tag: "001", tag_name: "Control Number", tag_name_arabic: "رقم التحكم", subfields: [] },
  { tag: "003", tag_name: "Control Number Identifier", tag_name_arabic: "معرف رقم التحكم", subfields: [] },
  { tag: "005", tag_name: "Date and Time of Latest Transaction", tag_name_arabic: "تاريخ ووقت آخر معاملة", subfields: [] },
  { tag: "008", tag_name: "Fixed Length Data Elements", tag_name_arabic: "عناصر بيانات ثابتة الطول", subfields: [] },
  { tag: "040", tag_name: "Cataloging Source", tag_name_arabic: "مصدر الفهرسة", subfields: ["a", "6", "8", "b", "d", "e", "f"] },
  { tag: "100", tag_name: "Heading Personal Name", tag_name_arabic: "اسم شخصي رئيسي", subfields: ["a", "g", "q"] },
  { tag: "370", tag_name: "Associated Place", tag_name_arabic: "المكان المرتبط", subfields: ["c", "e"] },
  { tag: "371", tag_name: "Address", tag_name_arabic: "العنوان", subfields: ["a", "e", "m", "q"] },
  { tag: "373", tag_name: "Associated Group", tag_name_arabic: "المجموعة المرتبطة", subfields: ["a", "q"] },
  { tag: "374", tag_name: "Occupation", tag_name_arabic: "المهنة", subfields: ["9", "a", "b"] },
  { tag: "381", tag_name: "Other Characteristics", tag_name_arabic: "خصائص أخرى", subfields: ["a"] }
];

export default function CustomEstenadReportForm({ 
  onGenerate, 
  isGenerating,
  recordCount = 0,
  showSuccessMessage = false,
  exportMethod = 'instant',
  setExportMethod
}: CustomEstenadReportFormProps) {
  const { language, isRTL } = useLanguage();
  const t = getTranslation(language);
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [authorIds, setAuthorIds] = useState<string[]>([]);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [inputMethod, setInputMethod] = useState<'author' | 'biblio'>('author');
  const [biblioUploadedFile, setBiblioUploadedFile] = useState<File | null>(null);
  const [biblioNumbers, setBiblioNumbers] = useState<string[]>([]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.includes('text') && !file.name.endsWith('.txt')) {
      setValidationErrors([String(t.estenad.pleaseUploadTxtFile)]);
      return;
    }

    setUploadedFile(file);
    
    try {
      const text = await file.text();
      const { numbers, errors } = parseAndValidateAuthorIds(text);
      setAuthorIds(numbers);
      
      if (errors.length > 0) {
        setValidationErrors(errors);
      } else {
        setValidationErrors([]);
      }
    } catch (error) {
      setValidationErrors(['Error reading file']);
    }
  };

  const parseAndValidateAuthorIds = (text: string): { numbers: string[]; errors: string[] } => {
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
          
          const validation = validateSingleAuthorId(trimmedValue, lineNumber, valueIndex + 1, true);
          if (validation.isValid) {
            numbers.push(trimmedValue);
          } else {
            errors.push(...validation.errors);
          }
        });
      } else {
        // Single value per line
        const validation = validateSingleAuthorId(trimmedLine, lineNumber, 1, false);
        if (validation.isValid) {
          numbers.push(trimmedLine);
        } else {
          errors.push(...validation.errors);
        }
      }
    });
    
    return { numbers, errors };
  };

  const validateSingleAuthorId = (value: string, lineNumber: number, position: number, isCommaSeparated: boolean): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];
    const positionText = isCommaSeparated ? `, position ${position}` : '';
    
    // Check for non-numeric characters
    if (!/^\d+$/.test(value)) {
      const invalidChars = value.match(/[^\d]/g)?.join('') || '';
      errors.push(`Line ${lineNumber}${positionText}: "${value}" contains invalid characters (${invalidChars}). Only digits 0-9 are allowed for author IDs.`);
      return { isValid: false, errors };
    }
    
    // Author IDs can be any length
    if (value.length === 0) {
      errors.push(`Line ${lineNumber}${positionText}: Empty author ID found.`);
      return { isValid: false, errors };
    }
    
    return { isValid: true, errors: [] };
  };

  // Biblio file upload handler
  const handleBiblioFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.includes('text') && !file.name.endsWith('.txt')) {
      setValidationErrors([String(t.estenad.pleaseUploadTxtFile)]);
      return;
    }

    setBiblioUploadedFile(file);
    
    try {
      const text = await file.text();
      const { numbers, errors } = parseAndValidateBiblioNumbers(text);
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

  const parseAndValidateBiblioNumbers = (text: string): { numbers: string[]; errors: string[] } => {
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
    
    // Biblio numbers can be any length
    if (value.length === 0) {
      errors.push(`Line ${lineNumber}${positionText}: Empty biblio number found.`);
      return { isValid: false, errors };
    }
    
    return { isValid: true, errors: [] };
  };

  const clearFormInputs = () => {
    setSelectedFields([]);
    setValidationErrors([]);
    setUploadedFile(null);
    setAuthorIds([]);
    setPreviewData([]);
    setCurrentStep(1);
    setInputMethod('author');
    setBiblioUploadedFile(null);
    setBiblioNumbers([]);
  };

  const handleStep1Next = () => {
    if (inputMethod === 'author' && authorIds.length === 0) {
      setValidationErrors([String(t.estenad.pleaseUploadAuthorIdsFile)]);
      return;
    }
    
    if (inputMethod === 'biblio' && biblioNumbers.length === 0) {
      setValidationErrors([String(t.estenad.pleaseUploadBiblioNumbersFile)]);
      return;
    }
    
    // Clear validation errors if valid
    setValidationErrors([]);
    setCurrentStep(2);
  };

  const handleStep2Next = () => {
    if (selectedFields.length === 0) {
      alert(String(t.estenad.pleaseSelectMarcField));
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
    setSelectedFields(authMarcFields.map(f => f.tag));
  };

  const handleSelectNone = () => {
    setSelectedFields([]);
  };

  // Load preview data for step 3
  const loadPreviewData = async () => {
    setIsLoadingPreview(true);
    try {
      const requestBody: any = {
        reportType: 'custom_estenad_report',
        selectedFields,
        isPreview: true
      };

      if (inputMethod === 'author') {
        requestBody.authorIds = authorIds.slice(0, 5); // Preview first 5
      } else if (inputMethod === 'biblio') {
        requestBody.biblioNumbers = biblioNumbers;
      }

      const response = await fetch('/api/estenad-reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error('Failed to load preview data');
      }

      const result = await response.json();
      setPreviewData(result.data || []);
      setCurrentStep(3);
    } catch (error) {
      console.error('Error loading preview:', error);
      alert(String(t.estenad.failedLoadPreview));
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const handleExport = (exportType: 'sample' | 'full') => {
    if (inputMethod === 'author' && authorIds.length === 0) {
      setValidationErrors([String(t.estenad.pleaseUploadAuthorIdsFile)]);
      return;
    }

    if (inputMethod === 'biblio' && biblioNumbers.length === 0) {
      setValidationErrors([String(t.estenad.pleaseUploadBiblioNumbersFile)]);
      return;
    }

    // Clear validation errors if valid
    setValidationErrors([]);
    
    const formData = {
      reportType: 'custom_estenad_report',
      inputMethod,
      authorIds: inputMethod === 'author' ? (exportType === 'sample' ? authorIds.slice(0, 10) : authorIds) : undefined,
      biblioNumbers: inputMethod === 'biblio' ? biblioNumbers : undefined,
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

      {/* Step 1: Upload Author IDs or Biblio Numbers */}
      {currentStep === 1 && (
        <div className="space-y-6">
          <h3 className={`text-lg font-semibold text-gray-900`}>
            {String(t.steps.step1)}: {String(t.estenad.uploadAuthorIds)}
          </h3>

          {/* Input Method Selection */}
          <div className={`flex gap-4 mb-4`}>
            <button
              type="button"
              onClick={() => {
                setInputMethod('author');
                setBiblioUploadedFile(null);
                setBiblioNumbers([]);
                setValidationErrors([]);
              }}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                inputMethod === 'author'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {String(t.estenad.uploadAuthorIds)}
            </button>
            <button
              type="button"
              onClick={() => {
                setInputMethod('biblio');
                setUploadedFile(null);
                setAuthorIds([]);
                setValidationErrors([]);
              }}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                inputMethod === 'biblio'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {String(t.estenad.uploadBiblioNumbers)}
            </button>
          </div>
          
          <div className="grid grid-cols-1 gap-6">
            {/* Author IDs Upload */}
            {inputMethod === 'author' && (
              <div>
                <label htmlFor="authorIdsUpload" className={`block text-sm font-medium text-gray-700 mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>
                  {String(t.estenad.authorIdsFileRequired)}
                </label>
              
              <input
                id="authorIdsUpload"
                type="file"
                accept=".txt,text/plain"
                onChange={handleFileUpload}
                className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-black ${isRTL ? 'text-right' : 'text-left'}`}
              />
              <p className={`mt-2 text-xs text-gray-500 ${isRTL ? 'text-right' : 'text-left'}`}>
                {String(t.estenad.uploadAuthorIdsHelper)}
              </p>
              
              {uploadedFile && (
                <div className={`mt-3 p-3 border rounded-md ${
                  validationErrors.length > 0 
                    ? 'bg-yellow-50 border-yellow-200' 
                    : 'bg-green-50 border-green-200'
                }`}>
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm font-medium text-gray-700">
                      {uploadedFile.name}
                    </span>
                  </div>
                  {authorIds.length > 0 && validationErrors.length === 0 && (
                    <div className="mt-2 text-sm text-green-700">
                      ✓ {String(t.estenad.foundValidAuthorIds).replace('{count}', authorIds.length.toString())}: {authorIds.slice(0, 10).join(', ')}
                      {authorIds.length > 10 && ` ... ${String(t.estenad.andMore).replace('{count}', (authorIds.length - 10).toString())}`}
                    </div>
                  )}
                  {validationErrors.length > 0 && authorIds.length > 0 && (
                    <div className="mt-2 text-sm text-green-700">
                      ✓ {String(t.estenad.foundValidAuthorIds).replace('{count}', authorIds.length.toString())}: {authorIds.slice(0, 5).join(', ')}
                      {authorIds.length > 5 && ` ... ${String(t.estenad.andMore).replace('{count}', (authorIds.length - 5).toString())}`}
                    </div>
                  )}
                </div>
              )}
              </div>
            )}

            {/* Biblio Numbers Upload */}
            {inputMethod === 'biblio' && (
              <div>
                <label htmlFor="biblioUpload" className={`block text-sm font-medium text-gray-700 mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>
                  {String(t.estenad.biblioNumbersFileRequired)}
                </label>
                
                <input
                  id="biblioUpload"
                  type="file"
                  accept=".txt,text/plain"
                  onChange={handleBiblioFileUpload}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-black ${isRTL ? 'text-right' : 'text-left'}`}
                />
                <p className={`mt-2 text-xs text-gray-500 ${isRTL ? 'text-right' : 'text-left'}`}>
                  {String(t.estenad.uploadBiblioNumbersHelper)}
                </p>
                
                {biblioUploadedFile && (
                  <div className={`mt-3 p-3 border rounded-md ${
                    validationErrors.length > 0 
                      ? 'bg-yellow-50 border-yellow-200' 
                      : 'bg-green-50 border-green-200'
                  }`}>
                    <div className="flex items-center">
                      <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-sm font-medium text-gray-700">
                        {biblioUploadedFile.name}
                      </span>
                    </div>
                    {biblioNumbers.length > 0 && validationErrors.length === 0 && (
                      <div className="mt-2 text-sm text-green-700">
                        ✓ {String(t.estenad.foundValidBiblioNumbers.replace('{count}', biblioNumbers.length.toString()))}: {biblioNumbers.slice(0, 10).join(', ')}
                        {biblioNumbers.length > 10 && ` ${String(t.estenad.andMore.replace('{count}', (biblioNumbers.length - 10).toString()))}`}
                      </div>
                    )}
                    {validationErrors.length > 0 && biblioNumbers.length > 0 && (
                      <div className="mt-2 text-sm text-green-700">
                        ✓ {String(t.estenad.foundValidBiblioNumbers.replace('{count}', biblioNumbers.length.toString()))}: {biblioNumbers.slice(0, 5).join(', ')}
                        {biblioNumbers.length > 5 && ` ${String(t.estenad.andMore.replace('{count}', (biblioNumbers.length - 5).toString()))}`}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
            
            {/* Validation Errors */}
            {validationErrors.length > 0 && (
              <div className="bg-red-50 border-l-4 border-red-400 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">
                      {String(t.estenad.validationErrors)}:
                    </h3>
                    <div className="mt-2 text-sm text-red-700">
                      <ul className="list-disc list-inside space-y-1">
                        {validationErrors.map((error, index) => (
                          <li key={index}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className={`flex ${isRTL ? 'justify-start' : 'justify-end'}`}>
            <button
              onClick={handleStep1Next}
              disabled={(inputMethod === 'author' && authorIds.length === 0) || (inputMethod === 'biblio' && biblioNumbers.length === 0)}
              className="bg-red-600 text-white px-6 py-2 rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {String(t.steps.nextSelectFields)}
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Select MARC Fields */}
       {currentStep === 2 && (
        <div className="space-y-6">
          <div className={`flex justify-between items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
            <h3 className={`text-lg font-semibold text-gray-900 ${isRTL ? 'text-right' : 'text-left'}`}>
              {String(t.steps.step2)}: {String(t.steps.selectMarcFields)}
            </h3>
            <div className={`${isRTL ? 'space-x-reverse space-x-2' : 'space-x-2'}`}>
              <button
                onClick={handleSelectAll}
                className="text-sm bg-gray-100 text-gray-700 px-3 py-1 rounded hover:bg-gray-200 transition-colors text-black"
              >
                {String(t.steps.selectAll)}
              </button>
              <span className="text-sm text-gray-600"></span>
              <button
                onClick={handleSelectNone}
                className="text-sm bg-gray-100 text-gray-700 px-3 py-1 rounded hover:bg-gray-200 transition-colors text-black"
              >
                {String(t.steps.selectNone)}
              </button>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-md">
            <p className={`text-sm text-gray-600 mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>
              {String(t.steps.selectedFields)}: {selectedFields.length} {String(t.steps.of)} {authMarcFields.length} {String(t.steps.fields)}
            </p>
            <div className="h-2 bg-gray-200 rounded-full">
              <div 
                className="h-2 bg-red-600 rounded-full transition-all duration-300"
                style={{ width: `${(selectedFields.length / authMarcFields.length) * 100}%` }}
              ></div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-120 overflow-y-auto border border-gray-200 rounded-md p-4">
            {authMarcFields.map((field) => (
              <label key={field.tag} className="flex items-start space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedFields.includes(field.tag)}
                  onChange={() => handleFieldToggle(field.tag)}
                  className="mt-1 h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900">
                    <span className="text-red-600 font-bold">{field.tag}</span> - {language === 'ar' ? field.tag_name_arabic : field.tag_name}
                  </div>
                  {field.subfields && field.subfields.length > 0 && (
                    <div className="text-xs text-gray-500 mt-0.5">
                      {String(t.estenad.subfields)}: {field.subfields.join(', ')}
                    </div>
                  )}
                </div>
              </label>
            ))}
          </div>
          
          <div className={`flex justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
            <button
              onClick={handleStep2Back}
              className="bg-gray-300 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-400 transition-colors"
            >
              {String(t.common.back)}
            </button>
            <button
              onClick={handleStep2Next}
              disabled={selectedFields.length === 0 || isLoadingPreview}
              className="bg-red-600 text-white px-6 py-2 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoadingPreview ? String(t.steps.loadingPreview) : String(t.steps.nextPreviewData)}
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Preview Data */}
      {currentStep === 3 && (
        <div className="space-y-6">
          <h3 className={`text-lg font-semibold text-gray-900 ${isRTL ? 'text-right' : 'text-left'}`}>
            {String(t.steps.step3)}: {String(t.steps.dataPreview)}
          </h3>
          
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <h4 className={`text-sm font-medium text-blue-900 mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>
              {String(t.forms.dataPreview)}
            </h4>
            <p className={`text-sm text-blue-800 ${isRTL ? 'text-right' : 'text-left'}`}>
              {String(t.estenad.showingFirstRecords)
                .replace('{count}', Math.min(5, authorIds.length).toString())
                .replace('{total}', authorIds.length.toString())}
            </p>
          </div>

          {previewData.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 border border-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    {Object.keys(previewData[0]).map((key) => (
                      <th key={key} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-300">
                        {key}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {previewData.map((row, index) => (
                    <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      {Object.values(row).map((value: any, i) => (
                        <td key={i} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {value != null && typeof value === 'object' ? JSON.stringify(value) : (value || '-')}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
              <p className={`text-sm text-yellow-800 ${isRTL ? 'text-right' : 'text-left'}`}>
                {String(t.forms.noDataFound)} {String(t.forms.adjustFilters)}
              </p>
            </div>
          )}

          <div className={`flex justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
            <button
              onClick={() => setCurrentStep(2)}
              className="bg-gray-300 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-400 transition-colors"
            >
              {String(t.steps.backToSelection)}
            </button>
            
            {previewData.length > 0 && (
              <button
                onClick={() => setCurrentStep(4)}
                className="bg-red-600 text-white px-6 py-2 rounded-md hover:bg-red-700 transition-colors"
              >
                {String(t.steps.nextExport)}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Step 4: Export Options */}
      {currentStep === 4 && (
        <div className="space-y-6">
          <h3 className={`text-lg font-semibold text-gray-900 ${isRTL ? 'text-right' : 'text-left'}`}>
            {String(t.steps.step4)}: {String(t.steps.exportOptions)}
          </h3>
          
          <div className="bg-green-50 border border-green-200 rounded-md p-4">
            <h4 className={`text-sm font-medium text-green-900 mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>
              {String(t.steps.reportSummary)}:
            </h4>
            <ul className={`text-sm text-green-800 space-y-1 ${isRTL ? 'text-right' : 'text-left'}`}>
              {inputMethod === 'author' && (
                <li>• {String(t.estenad.authorIdsRecords).replace('{count}', authorIds.length.toString())}</li>
              )}
              {inputMethod === 'biblio' && (
                <>
                  <li>• {String(t.estenad.biblioNumbersRecords.replace('{count}', biblioNumbers.length.toString()))}</li>
                  <li>• (Author IDs will be extracted from these biblio records)</li>
                </>
              )}
              <li>• {String(t.steps.selectedFields)}: {selectedFields.length} {String(t.steps.fields)}</li>
            </ul>
          </div>

          {/* Export Method Selection */}
          {setExportMethod && (
            <div className="bg-gray-50 border-2 border-gray-200 rounded-xl p-6 mb-6">
              <label className="block text-sm font-bold text-gray-900 mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                <span>{language === 'ar' ? 'طريقة التصدير' : 'Export Method'}</span>
              </label>
              <div className="flex gap-4">
                <label className="flex items-center space-x-2 cursor-pointer bg-white p-4 rounded-lg border-2 border-gray-200 hover:border-red-500 transition-all duration-200 flex-1">
                  <input
                    type="radio"
                    name="exportMethod"
                    value="instant"
                    checked={exportMethod === 'instant'}
                    onChange={(e) => setExportMethod(e.target.value as 'instant' | 'background')}
                    className="w-4 h-4 text-red-600"
                  />
                  <span className="text-gray-900 font-medium">{language === 'ar' ? 'تصدير فوري' : 'Instant Export'}</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer bg-white p-4 rounded-lg border-2 border-gray-200 hover:border-red-500 transition-all duration-200 flex-1">
                  <input
                    type="radio"
                    name="exportMethod"
                    value="background"
                    checked={exportMethod === 'background'}
                    onChange={(e) => setExportMethod(e.target.value as 'instant' | 'background')}
                    className="w-4 h-4 text-red-600"
                  />
                  <span className="text-gray-900 font-medium">{language === 'ar' ? 'تصدير في الخلفية (إرسال بالبريد)' : 'Background Export (Email)'}</span>
                </label>
              </div>
              <p className="mt-3 text-sm text-gray-600">
                {exportMethod === 'instant' 
                  ? (language === 'ar' ? 'سيتم تنزيل التقرير مباشرة بعد الإنشاء' : 'Report will be downloaded immediately after generation')
                  : (language === 'ar' ? 'سيتم إرسال التقرير إلى بريدك الإلكتروني عند الانتهاء' : 'Report will be emailed to you when ready')}
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
            <button
              onClick={() => handleExport('full')}
              disabled={isGenerating}
              className="flex flex-col items-center justify-center p-6 border-2 border-blue-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="text-blue-600 mb-2">
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="text-center">
                <h4 className="font-semibold text-gray-900 mb-1">{String(t.steps.fullExport)}</h4>
                <p className="text-sm text-gray-600">{String(t.steps.exportFull)} ({authorIds.length} {String(t.estenad.authorRecords)})</p>
              </div>
            </button>
          </div>

          <div className={`flex ${isRTL ? 'justify-end' : 'justify-start'}`}>
            <button
              onClick={() => setCurrentStep(3)}
              className="bg-gray-300 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-400 transition-colors"
            >
              {String(t.steps.backToPreview)}
            </button>
          </div>

          {isGenerating && (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className={`animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 ${isRTL ? 'ml-3' : 'mr-3'}`}></div>
                <span className="text-blue-800">{String(t.forms.generating)}</span>
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
                  {String(t.estenad.successfullyExported).replace('{count}', String(recordCount))}
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
